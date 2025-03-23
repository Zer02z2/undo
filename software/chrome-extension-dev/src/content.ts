import { UserData } from "./background"
import { deleteAll } from "./remote-control/delete"
import { initStatus } from "./remote-control/status"
import { initTransform, map } from "./remote-control/transform"
import { stream } from "./screen-share/stream"

const init = async () => {
  const eventBus = new EventTarget()
  let streamStarted = false
  let scrollAmount = 0
  let alive = false
  let started = false
  let lastAlive = new Date().getTime()
  let clearing = false
  const aliveThreshold = 500
  let deviceId: UserData["deviceId"] = undefined

  const updateDeviceId = async () => {
    // @ts-ignore
    const bulb = await chrome.storage.local.get("data")
    const userData: UserData = bulb.data
    deviceId = userData.deviceId
  }
  await updateDeviceId()

  //@ts-ignore
  chrome.runtime.onMessage.addListener((message) => {
    console.log(message)
    if (message.action === "dataChanged") {
      updateDeviceId()
    }
  })

  const socket = new WebSocket("wss://io.zongzechen.com/undo/controller")

  socket.addEventListener("open", () => {
    console.log("socket connected!")
  })
  socket.addEventListener("message", (event) => {
    const { id, name, data } = JSON.parse(event.data)
    if (id !== deviceId) return
    started = true
    lastAlive = new Date().getTime()
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
    } else if (name === "rotate") {
      const degree = 40
      const value = data === "1" ? degree : -degree
      eventBus.dispatchEvent(new CustomEvent("rotate", { detail: value }))
    } else if (name === "clear") {
      if (!clearing) {
        eventBus.dispatchEvent(new CustomEvent("clear"))
        deleteAll()
        clearing = true
      } else {
        window.location.reload()
      }
    }
  })

  initTransform(eventBus)
  initStatus(eventBus)

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

  const checkAlive = () => {
    requestAnimationFrame(checkAlive)
    if (!started) return
    const timeNow = new Date().getTime()
    if (alive && timeNow - lastAlive > aliveThreshold) {
      eventBus.dispatchEvent(new CustomEvent("alive", { detail: false }))
      alive = false
    } else if (!alive && timeNow - lastAlive < aliveThreshold) {
      eventBus.dispatchEvent(new CustomEvent("alive", { detail: true }))
      alive = true
    }
  }
  checkAlive()

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
}

init()
