export interface UserData {
  id: string | undefined
  userName: string | undefined
}

const init = () => {
  // @ts-ignore
  chrome.runtime.onInstalled.addListener(() => {
    // @ts-ignore
    chrome.storage.local.set({
      data: {
        id: undefined,
        userName: undefined,
      },
    })
  })
}

init()
