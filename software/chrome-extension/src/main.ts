import "@mediapipe/face_mesh"
import "@tensorflow/tfjs-core"
import "@tensorflow/tfjs-backend-webgl"
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection"
import { faceOvalIndexes } from "./faceOvalIndexes"

const init = async () => {
  const canvas = createCanvas()
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  ctx.translate(canvas.width, 0)
  ctx.scale(-1, 1)
  document.body.appendChild(canvas)
  const video = await initWebcam()
  video.addEventListener("loadeddata", async () => {
    const faceDetector = await initFaceDetect()
    analyzeFace(faceDetector, video, canvas)
  })
}

const createCanvas = () => {
  const canvas = document.createElement("canvas")
  canvas.className = "ignore-effects"
  canvas.style.position = "fixed"
  canvas.style.top = "0px"
  canvas.style.left = "0px"
  canvas.style.zIndex = "999"
  canvas.width = 640
  canvas.height = 480
  canvas.style.pointerEvents = "none"
  return canvas
}

const initWebcam = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true })
  const video = document.createElement("video")
  video.srcObject = stream
  video.play()
  video.width = 640
  video.height = 480
  return video
}

const initFaceDetect = async () => {
  const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh
  const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig =
    {
      runtime: "mediapipe",
      solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh",
      refineLandmarks: false,
    }
  const detector = await faceLandmarksDetection.createDetector(
    model,
    detectorConfig
  )
  return detector
}

const analyzeFace = async (
  detector: faceLandmarksDetection.FaceLandmarksDetector,
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
) => {
  requestAnimationFrame(async () => {
    await analyzeFace(detector, video, canvas)
  })

  const estimationConfig = { flipHorizontal: true }
  const faces = await detector.estimateFaces(video, estimationConfig)
  if (!faces[0]) return
  const faceOvals = faceOvalIndexes.map((index) => faces[0].keypoints[index])

  const ctx = canvas.getContext("2d")
  const mask = createCanvas()
  const maskCtx = mask.getContext("2d")
  if (!(ctx && maskCtx)) return

  maskCtx.fillStyle = "rgba(0, 0, 0, 0)"
  maskCtx.fillRect(0, 0, mask.width, mask.height)

  maskCtx.beginPath()
  maskCtx.moveTo(faceOvals[0].x, faceOvals[0].y)
  const length = faceOvals.length
  for (let i = 1; i < length - 2; i++) {
    const x2 = (faceOvals[i].x + faceOvals[i + 1].x) / 2
    const y2 = (faceOvals[i].y + faceOvals[i + 1].y) / 2
    maskCtx.quadraticCurveTo(faceOvals[i].x, faceOvals[i].y, x2, y2)
  }
  maskCtx.quadraticCurveTo(
    faceOvals[length - 2].x,
    faceOvals[length - 2].y,
    faceOvals[length - 1].x,
    faceOvals[length - 1].y
  )
  maskCtx.closePath()
  maskCtx.fillStyle = "rgba(0, 0, 0, 255)"
  maskCtx.fill()

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  const canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const maskData = maskCtx.getImageData(0, 0, mask.width, mask.height)
  for (let i = 0; i < canvasData.data.length; i += 4) {
    canvasData.data[i + 3] = maskData.data[i + 3]
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.putImageData(canvasData, 0, 0)
}

init()
