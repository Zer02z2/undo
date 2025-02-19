import { io } from "socket.io-client"
import { Peer } from "peerjs"
import { v4 as uuidv4 } from "uuid"

export const stream = () => {
  let fullScreen = true

  interface PeerUser {
    id: string
    canvas: HTMLCanvasElement
    video?: HTMLVideoElement
    mouseX: number | null
    mouseY: number | null
    videoW: number
    videoH: number
    fullScreen: boolean
  }

  let currentPeers: PeerUser[] = []

  const roomId = 1
  const dev = false
  const socketUrl = `${
    dev
      ? "http://localhost:3001/screenShare"
      : "https://io.zongzechen.com/screenShare"
  }`

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

  const init = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
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
        window.addEventListener("mousemove", (event) => {
          conn.send({
            mouseX: event.clientX,
            mouseY: event.clientY,
            videoW: window.innerWidth,
            videoH: window.innerHeight,
          })
        })
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
        document.addEventListener("mousemove", (event) => {
          conn.send({
            mouseX: event.clientX,
            mouseY: event.clientY,
            videoW: window.innerWidth,
            videoH: window.innerHeight,
          })
        })
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
    currentPeers.forEach((peer) => {
      const canvas = peer.canvas
      const video = peer.video
      const ctx = canvas.getContext("2d")
      if (!(ctx && video && peer.mouseX && peer.mouseY)) return
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      if (canvas.width <= 0 || canvas.height <= 0) return
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const mouseX = (canvas.width * peer.mouseX) / peer.videoW
      const mouseY = (canvas.height * peer.mouseY) / peer.videoH
      const innerRange = canvas.width / 15
      const outerRange = innerRange * 1.25

      const imageData = ctx.getImageData(
        mouseX - outerRange,
        mouseY - outerRange,
        outerRange * 2,
        outerRange * 2
      )

      // const data = imageData.data
      // for (let x = 0; x < outerRange * 2; x++) {
      //   for (let y = 0; y < outerRange * 2; y++) {
      //     const dist = Math.sqrt((x - outerRange) ** 2 + (y - outerRange) ** 2)
      //     if (dist >= innerRange && dist < outerRange) {
      //       const alpha = Math.floor(
      //         (1 - (dist - innerRange) / (outerRange - innerRange)) * 255
      //       )
      //       const index = (y * outerRange * 2 + x) * 4
      //       data[index + 3] = alpha
      //     } else if (dist >= outerRange) {
      //       const index = (y * outerRange * 2 + x) * 4
      //       data[index + 3] = 0
      //     }
      //   }
      // }
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "rgb(91, 247, 77)"
      const borderWidth = 10
      ctx.fillRect(
        mouseX - outerRange - borderWidth,
        mouseY - outerRange - borderWidth,
        outerRange * 2 + borderWidth * 2,
        outerRange * 2 + borderWidth * 2
      )
      ctx.putImageData(imageData, mouseX - outerRange, mouseY - outerRange)
    })
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
      fullScreen: fullScreen,
    }
    if (!currentPeers.find((peer) => peer.id === id)) {
      currentPeers.push(peerUser)
      fullScreen = true
    }
    return peerUser
  }

  const updatePeerData = (peerUser: PeerUser, data: unknown) => {
    const peerData = data as {
      mouseX: number
      mouseY: number
      videoW: number
      videoH: number
    }
    peerUser.mouseX = peerData.mouseX
    peerUser.mouseY = peerData.mouseY
    peerUser.videoW = peerData.videoW
    peerUser.videoH = peerData.videoH
  }

  init()
  animate()
}

// const random = (low: number, high: number) => {
//   return low + Math.random() * (high - low)
// }
