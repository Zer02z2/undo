const script = document.createElement("script")
script.src = chrome.runtime.getURL("inject.js")
document.body.appendChild(script)
