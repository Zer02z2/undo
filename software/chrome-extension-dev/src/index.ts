import { UserData } from "./background"

const deviceIdInput = document.getElementById("device-id") as HTMLInputElement
const nameInput = document.getElementById("name") as HTMLInputElement
const colorInput = document.getElementById("color") as HTMLInputElement
const textColorInput = document.getElementById("text-color") as HTMLInputElement

const init = async () => {
  if (!(deviceIdInput && nameInput && colorInput && textColorInput)) return
  //@ts-ignore
  const bulb = await chrome.storage.local.get("data")
  const data: UserData = bulb.data
  deviceIdInput.value = data.deviceId || ""
  nameInput.value = data.userName || ""
  colorInput.value = data.color || ""
  textColorInput.value = data.textColor || ""

  const updateMessage = () => {
    //@ts-ignore
    chrome.storage.local.set({
      data: data,
    })
    //@ts-ignore
    chrome.tabs.query({}, (tabs) => {
      if (tabs.length === 0) return
      //@ts-ignore
      tabs.forEach((tab) => {
        //@ts-ignore
        chrome.tabs.sendMessage(tab.id, { action: "dataChanged" })
      })
    })
  }

  deviceIdInput.addEventListener("keyup", () => {
    data.deviceId = deviceIdInput.value
    updateMessage()
  })
  nameInput.addEventListener("keyup", () => {
    data.userName = nameInput.value
    updateMessage()
  })
  colorInput.addEventListener("keyup", () => {
    data.color = colorInput.value
    //@ts-ignore
    updateMessage()
  })
  textColorInput.addEventListener("keyup", () => {
    data.textColor = textColorInput.value
    updateMessage()
  })
}

init()
