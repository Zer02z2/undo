export const initStatus = (eventBus: EventTarget) => {
  // @ts-ignore
  const imgPath = chrome.runtime.getURL("/images/model2.svg")
  const statusDiv = document.createElement("div")
  statusDiv.style.position = "fixed"
  statusDiv.style.bottom = "2rem"
  statusDiv.style.right = "2rem"
  statusDiv.style.fontFamily = "Helvetica"
  statusDiv.style.fontSize = "0.8rem"
  statusDiv.style.zIndex = "9999"

  const innerWrap = document.createElement("div")
  innerWrap.style.position = "relative"
  statusDiv.appendChild(innerWrap)

  const img = document.createElement("img")
  img.src = imgPath
  img.style.width = "10rem"
  img.style.filter = "drop-shadow(0px 0px 4px rgba(40, 40, 40, 0.6))"
  innerWrap.appendChild(img)

  const infoDiv = document.createElement("div")
  infoDiv.style.display = "flex"
  infoDiv.style.alignItems = "center"
  infoDiv.style.justifyContent = "center"
  infoDiv.style.position = "absolute"
  infoDiv.style.top = "0"
  infoDiv.style.left = "0"
  infoDiv.style.width = "100%"
  infoDiv.style.height = "100%"
  infoDiv.style.paddingTop = "1rem"
  infoDiv.style.paddingLeft = "0.1rem"
  innerWrap.appendChild(infoDiv)

  const box = document.createElement("div")
  box.style.display = "flex"
  box.style.alignItems = "center"
  box.style.justifyContent = "center"
  box.style.gap = "0.5rem"
  box.style.padding = "0.2rem 1rem 0.2rem 0.4rem"
  box.style.borderRadius = "99px"
  box.style.backgroundColor = "rgb(192, 192, 192)"
  infoDiv.appendChild(box)

  const statusDot = document.createElement("div")
  statusDot.style.borderRadius = "50%"
  statusDot.style.padding = "0.3rem"
  statusDot.style.backgroundColor = "rgb(235, 52, 52)"
  box.appendChild(statusDot)

  const statusSpan = document.createElement("span")
  statusSpan.innerHTML = "DISC"
  box.appendChild(statusSpan)

  document.body.appendChild(statusDiv)

  eventBus.addEventListener("alive", (event) => {
    // @ts-ignore
    const alive = event.detail as boolean
    if (alive) {
      statusDot.style.backgroundColor = "rgb(0, 236, 95)"
      statusSpan.innerHTML = "CONN"
    } else if (!alive) {
      statusDot.style.backgroundColor = "rgb(235, 52, 52)"
      statusSpan.innerHTML = "DISC"
    }
  })
}
