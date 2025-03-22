import { init3D, map } from "./remote-control/depth"
import { stream } from "./screen-share/stream"

const eventBus = new EventTarget()
let streamStarted = false
let scrollAmount = 0
const socket = new WebSocket("wss://io.zongzechen.com/undo/controller")

socket.addEventListener("open", () => {
  console.log("socket connected!")
})
socket.addEventListener("message", (event) => {
  const [name, data] = event.data.split(":")
  if (name === "call") {
    if (data === "1" && !streamStarted) {
      startStream()
      streamStarted = true
    } else if (data === "0" && streamStarted) window.location.reload()
  } else if (name === "lever") {
    const number = parseInt(data)
    const value = map(number, 0, 1024, 0, 1)
    eventBus.dispatchEvent(new CustomEvent("3d", { detail: value }))
  } else if (name === "scroll1") {
    scrollAmount += 500 * (data === "1" ? 1 : -1)
  } else if (name === "scroll2") {
    scrollAmount += 150 * (data === "1" ? 1 : -1)
  } else if (name === "scroll3") {
    scrollAmount += 50 * (data === "1" ? 1 : -1)
  }
})

init3D(eventBus)

const scroll = () => {
  requestAnimationFrame(scroll)
  if (scrollAmount != 0) {
    const distance = scrollAmount * 0.1
    window.scrollBy({
      top: distance,
      behavior: "instant",
    })
    scrollAmount -= distance
  }
}
scroll()

const startStream = () => {
  // @ts-ignore
  const pathToModelScript = chrome.runtime.getURL(
    "/models/@mediapipe/tasks-vision/wasm"
  )
  // @ts-ignore
  const pathToModel = chrome.runtime.getURL("/models/face_landmarker.task")

  localStorage.setItem("pathToModelScript", pathToModelScript)
  localStorage.setItem("pathToModel", pathToModel)

  const script = document.createElement("script")
  // @ts-ignore
  script.src = chrome.runtime.getURL("inject.js")
  document.body.appendChild(script)

  stream()
}
