shiftPercentage = 0
targetShiftPercentage = 0
globalTranslate = {
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
}
globalOpacity = {
  now: 1,
  target: 1,
}

const random = (low, high) => {
  return low + Math.random() * (high - low)
}

const elementsNodes = document.body.querySelectorAll("*")
const elements = Array.from(elementsNodes)

const elementData = elements.map((element) => {
  const scale = element.style.scale ? element.style.scale : 1
  const factor = random(0.9, 1.1)
  const newScale = scale * factor

  const range = 50
  const translateX = Math.floor(random(-range, range))
  const translateY = Math.floor(random(-range, range))
  //element.style.transform = `translateX(${translateX}) translateY(${translateY})`
  return {
    target: element,
    scale: scale,
    newScale: newScale,
    translateX: translateX,
    translateY: translateY,
  }
})

const socket = new WebSocket("wss://io.zongzechen.com/undo/controller")

socket.addEventListener("open", () => {
  console.log("socket connected!")
})
socket.addEventListener("message", (event) => {
  //console.log(event.data)
  const [name, data] = event.data.split(":")
  if (name == "potentiometer") {
    if (data < 10) targetShiftPercentage = 0
    else targetShiftPercentage = data / (1024 - 10)
    //console.log(targetShiftPercentage)
  }
  const moveDistance = 500
  if (name == "encoderX") {
    // if (data == 1) globalTranslate.targetX += moveDistance
    // else if (data == 0) globalTranslate.targetX -= moveDistance
    if (data == 1) globalOpacity.target += 0.1
    else if (data == 0) globalOpacity.target -= 0.1
    if (globalOpacity.target <= 0) globalOpacity.target = 0
    else if (globalOpacity.target >= 1) globalOpacity.target = 1
  }
  if (name == "encoderY") {
    if (data == 1) {
      globalTranslate.targetY += moveDistance
    } else if (data == 0) globalTranslate.targetY -= moveDistance
  }
})

const animate = () => {
  window.requestAnimationFrame(animate)
  shiftPercentage += (targetShiftPercentage - shiftPercentage) * 0.1
  globalOpacity.now += (globalOpacity.target - globalOpacity.now) * 0.1
  elementData.forEach((data) => {
    const { target, scale, newScale, translateX, translateY } = data
    const scaleNow =
      (scale + (newScale - scale) * shiftPercentage) * globalOpacity.now
    const xNow = `${translateX * shiftPercentage}px`
    const yNow = `${translateY * shiftPercentage}px`
    target.style.scale = scaleNow
    target.style.transform = `translateX(${xNow}) translateY(${yNow})`
    target.style.opacity = `${globalOpacity.now}`
  })

  globalTranslate.x += (globalTranslate.targetX - globalTranslate.x) * 0.1
  globalTranslate.y += (globalTranslate.targetY - globalTranslate.y) * 0.1
  document.body.style.transform = `translateX(${globalTranslate.x}px) translateY(${globalTranslate.y}px)`
}

animate()
