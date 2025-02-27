import { PeerUser, SelfUser } from "./stream"

export const displayVideo = (self: SelfUser, currentPeers: PeerUser[]) => {
  const drawBoarder = (
    ctx: CanvasRenderingContext2D,
    //@ts-ignore
    name: string,
    color: string,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    ctx.strokeStyle = color
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.stroke()
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(x, y, w * 0.6, h * 0.1, [0, 0, 5, 0])
    ctx.fill()
  }

  const size = 0.1
  const dpr = window.devicePixelRatio || 1
  const myCanvas = self.local.canvas
  myCanvas.width = window.innerWidth * dpr
  myCanvas.height = window.innerHeight * dpr
  const myMouseX = self.shared.mouseX * dpr
  const myMouseY = self.shared.mouseY * dpr
  const myOuterRange = myCanvas.width * size * 1.25

  currentPeers.forEach((peer) => {
    const canvas = peer.canvas
    const video = peer.video
    const ctx = canvas.getContext("2d")
    if (!(ctx && video && peer.mouseX && peer.mouseY)) return
    canvas.width = video.videoWidth * dpr
    canvas.height = video.videoHeight * dpr
    if (canvas.width <= 0 || canvas.height <= 0) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const mouseX = (canvas.width * peer.mouseX) / peer.videoW
    const mouseY = (canvas.height * peer.mouseY) / peer.videoH
    const innerRange = canvas.width * size
    const outerRange = innerRange * 1.25

    const imageData = ctx.getImageData(
      mouseX - outerRange,
      mouseY - outerRange,
      outerRange * 2,
      outerRange * 2
    )

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.putImageData(imageData, mouseX - outerRange, mouseY - outerRange)
    drawBoarder(
      ctx,
      peer.name,
      "rgb(255, 208, 66)",
      mouseX - outerRange,
      mouseY - outerRange,
      outerRange * 2,
      outerRange * 2
    )
    ctx.clearRect(
      (myMouseX / myCanvas.width) * canvas.width -
        (myOuterRange / myCanvas.width) * canvas.width,
      (myMouseY / myCanvas.height) * canvas.height -
        (myOuterRange / myCanvas.height) * canvas.height,
      (myOuterRange / myCanvas.width) * canvas.width * 2,
      (myOuterRange / myCanvas.height) * canvas.height * 2
    )
  })

  const myCtx = myCanvas.getContext("2d")
  if (myCtx) {
    myCtx.clearRect(0, 0, myCanvas.width, myCanvas.height)
    drawBoarder(
      myCtx,
      self.shared.name,
      "rgb(255, 208, 66)",
      myMouseX - myOuterRange,
      myMouseY - myOuterRange,
      myOuterRange * 2,
      myOuterRange * 2
    )
  }
}
