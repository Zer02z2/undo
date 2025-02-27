const init = async () => {
  //@ts-ignore
  const data = await chrome.storage.local.get("data")
  console.log(data)
}

init()
