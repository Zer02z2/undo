import { io } from "socket.io-client"
import { Peer } from "peerjs"
import { v4 as uuidv4 } from "uuid"
import { UserData } from "../background"

export const stream = () => {
  interface PeerUser {
    id: string
    canvas: HTMLCanvasElement
    video?: HTMLVideoElement
    mouseX: number | null
    mouseY: number | null
    videoW: number
    videoH: number
    name: string
  }

  let currentPeers: PeerUser[] = []

  const roomId = 1
  const dev = false
  const socketUrl = `${
    dev
      ? "http://localhost:3001/screenShare"
      : "https://io.zongzechen.com/screenShare"
  }`

  const myData = {
    mouseX: 0,
    mouseY: 0,
    videoW: window.innerWidth,
    videoH: window.innerHeight,
    name: "",
  }
  document.addEventListener("mousemove", (event) => {
    myData.mouseX = event.clientX
    myData.mouseY = event.clientY
    myData.videoW = window.innerWidth
    myData.videoH = window.innerHeight
  })

  const createCanvas = () => {
    const canvas = document.createElement("canvas")
    canvas.style.position = "fixed"
    canvas.style.width = "100vw"
    canvas.style.height = "100vh"
    canvas.style.zIndex = "999"
    canvas.style.left = "0"
    canvas.style.top = "0"
    canvas.style.pointerEvents = "none"
    canvas.className = "ignore-effects"
    document.body.appendChild(canvas)
    return canvas
  }

  const createVideo = (stream: MediaStream) => {
    const video = document.createElement("video")
    video.srcObject = stream
    video.addEventListener("loadedmetadata", () => {
      video.play()
    })
    return video
  }

  const myCanvas = createCanvas()
  myCanvas.width = window.innerWidth
  myCanvas.height = window.innerHeight

  const init = async () => {
    // @ts-ignore
    const userData: UserData = await chrome.storage.local.get("data")
    if (!userData.id) {
      userData.id = uuidv4()
      // @ts-ignore
      chrome.storage.local.set({ data: userData })
    }
    if (!userData.userName) {
      userData.userName = userData.id
      // @ts-ignore
      chrome.storage.local.set({ data: userData })
    }
    myData.name = userData.userName

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: { ideal: 1920, max: 1920 },
        height: { ideal: 1080, max: 1080 },
      },
      audio: false,
      // @ts-ignore
      preferCurrentTab: true,
    })

    const socket = io(socketUrl)

    const myPeer = new Peer(uuidv4(), {
      host: "io.zongzechen.com",
      path: "/peerjs",
      secure: true,
    })
    myPeer.on("open", (id) => {
      socket.emit("join-room", roomId, id)
    })

    myPeer.on("call", (call) => {
      console.log("receive call")
      call.answer(stream)

      call.on("stream", (userVideoStream) => {
        if (!currentPeers.find((peer) => peer.id === call.peer)) {
          createPeer(call.peer)
        }
        const peerUser = currentPeers.find((peer) => peer.id === call.peer)
        if (!peerUser) return
        peerUser.video = createVideo(userVideoStream)
      })
    })
    myPeer.on("connection", (conn) => {
      conn.on("open", () => {
        conn.on("data", (data) => {
          if (!currentPeers.find((peer) => peer.id === conn.peer)) {
            createPeer(conn.peer)
          }
          const peerUser = currentPeers.find((peer) => peer.id === conn.peer)
          if (!peerUser) return
          updatePeerData(peerUser, data)
        })
        window.addEventListener("mousemove", () => {
          conn.send(myData)
        })
        conn.send(myData)
      })
    })

    socket.on("user-connected", (userId) => {
      const call = myPeer.call(userId, stream)
      const conn = myPeer.connect(userId)
      const peerUser = createPeer(userId)
      call.on("stream", (userVideoStream) => {
        peerUser.video = createVideo(userVideoStream)
      })
      call.on("close", () => {})
      conn.on("open", () => {
        console.log("data open")
        conn.on("data", (data) => {
          updatePeerData(peerUser, data)
        })
        document.addEventListener("mousemove", () => {
          conn.send(myData)
        })
        conn.send(myData)
      })
    })
    socket.on("close-call", (userId) => {
      console.log("close id: ", userId)
      const index = currentPeers.findIndex((peer) => peer.id === userId)
      const peer = currentPeers[index]
      peer.canvas.remove()
      currentPeers.splice(index, 1)
    })
  }
  const animate = () => {
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
    myCanvas.width = window.innerWidth * dpr
    myCanvas.height = window.innerHeight * dpr
    const myMouseX = myData.mouseX * dpr
    const myMouseY = myData.mouseY * dpr
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
        myData.name,
        "rgb(255, 208, 66)",
        myMouseX - myOuterRange,
        myMouseY - myOuterRange,
        myOuterRange * 2,
        myOuterRange * 2
      )
    }
    requestAnimationFrame(animate)
  }

  const createPeer = (id: string) => {
    const peerUser: PeerUser = {
      id: id,
      canvas: createCanvas(),
      mouseX: null,
      mouseY: null,
      videoW: 0,
      videoH: 0,
      name: "",
    }
    if (!currentPeers.find((peer) => peer.id === id)) {
      currentPeers.push(peerUser)
    }
    return peerUser
  }

  const updatePeerData = (peerUser: PeerUser, data: unknown) => {
    const peerData = data as {
      mouseX: number
      mouseY: number
      videoW: number
      videoH: number
      name: string
    }
    peerUser.mouseX = peerData.mouseX
    peerUser.mouseY = peerData.mouseY
    peerUser.videoW = peerData.videoW
    peerUser.videoH = peerData.videoH
    peerUser.name = peerData.name
  }

  init()
  animate()
}
