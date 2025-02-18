import { faceDetect } from "./faceDetect"

const initModels = async () => {
  const faceDetector = await faceDetect.create()
  if (!faceDetector) return
  const analyzeFace = async () => {
    const { canvas } = faceDetector
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height)
    await faceDetect.analyze(faceDetector)
    requestAnimationFrame(analyzeFace)
  }
  analyzeFace()
}

initModels()
