export const initStatus = (eventBus: EventTarget) => {
  // @ts-ignore
  const imgPath = chrome.runtime.getURL("/images/model.svg")
  const statusDiv = document.createElement("div")
  statusDiv.style.position = "fixed"
  statusDiv.style.bottom = "2rem"
  statusDiv.style.right = "2rem"
  statusDiv.style.fontFamily = "Helvetica"
  statusDiv.style.fontSize = "0.8rem"

  const innerWrap = document.createElement("div")
  innerWrap.style.position = "relative"

  const img = document.createElement("img")
  img.src = imgPath
  img.style.width = "10rem"
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
  infoDiv.style.gap = "0.5rem"
  innerWrap.appendChild(infoDiv)

  //   const statusDot = document.createElement("div")
  //   statusDot.style.padding = "0.2rem"
  //   statusDot.style.borderRadius = "50%"
  //   statusDot.style.backgroundColor = "red"

  const statusSpan = document.createElement("span")
  statusSpan.innerHTML = "DISC"
  statusSpan.style.padding = "0.2rem 1rem"
  statusSpan.style.borderRadius = "99px"
  statusSpan.style.backgroundColor = "rgb(235, 52, 52)"
  statusSpan.style.color = "white"
  //infoDiv.appendChild(statusDot)
  infoDiv.appendChild(statusSpan)
  statusDiv.appendChild(innerWrap)
  document.body.appendChild(statusDiv)

  eventBus.addEventListener("alive", (event) => {
    // @ts-ignore
    const alive = event.detail as boolean
    if (alive) {
      statusSpan.style.backgroundColor = "rgb(0, 236, 95)"
      statusSpan.style.color = "black"
      statusSpan.innerHTML = "CONN"
    } else if (!alive) {
      statusSpan.style.backgroundColor = "rgb(235, 52, 52)"
      statusSpan.style.color = "white"
      statusSpan.innerHTML = "DISC"
    }
  })
}
