import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection"
import "@tensorflow/tfjs-core"
import "@tensorflow/tfjs-backend-webgl"
import "@mediapipe/face_mesh"
import { faceOvalIndexes } from "./faceOvalIndexes"

interface FaceDetector {
  detector: faceLandmarksDetection.FaceLandmarksDetector
  canvas: HTMLCanvasElement
  video: HTMLVideoElement
}

const mousePositions = {
  x: 0,
  y: 0,
}

const createFaceDetect = async () => {
  const canvas = createCanvas()
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  ctx.translate(canvas.width, 0)
  ctx.scale(-1, 1)
  document.body.appendChild(canvas)
  const video = await initWebcam()
  document.addEventListener("mousemove", (event) => {
    mousePositions.x = event.clientX
    mousePositions.y = event.clientY
  })
  return new Promise<FaceDetector>((resolve) => {
    video.addEventListener(
      "loadeddata",
      async () => {
        const faceDetector = await initFaceDetect()
        resolve({
          detector: faceDetector,
          canvas: canvas,
          video: video,
        })
      },
      { once: true }
    )
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
  console.log("1")
  const detector = await faceLandmarksDetection.createDetector(
    model,
    detectorConfig
  )
  console.log("2")
  return detector
}

const analyzeFace = async (faceDetector: FaceDetector) => {
  const { detector, canvas, video } = faceDetector
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

  const { x, y } = mousePositions
  canvas.style.transform = `translateX(${x - canvas.width / 2}px) translateY(${
    y - canvas.height / 2
  }px)`
}

export const faceDetect = {
  create: createFaceDetect,
  analyze: analyzeFace,
}
