import { deleteAll } from "./delete"

interface ElementData {
  target: HTMLElement
  translateData: {
    scale: number
    newScale: number
    translateX: number
    translateY: number
  }
  danceData: {
    scale: number
    progress: number
  }
  isEndChild: boolean
  distortData: {
    xNow: number
    xTarget: number
    yNow: number
    yTarget: number
  }
}

export const remoteControl = () => {
  const globalVariables = {
    shiftPercentage: { current: 0, target: 0 },
    distort: {
      xCurrent: 1,
      xTarget: 1,
      yCurrent: 1,
      yTarget: 1,
    },
    deleteActivated: false,
  }

  const random = (low: number, high: number) => {
    return low + Math.random() * (high - low)
  }

  const elementsNodes = document.body.querySelectorAll("*")
  const elements = Array.from(elementsNodes) as HTMLElement[]

  const elementData: ElementData[] = elements.map((element) => {
    const scale = element.style.scale ? parseInt(element.style.scale) : 1
    const factor = random(0.9, 1.1)
    const newScale = scale * factor

    const range = 50
    const translateX = Math.floor(random(-range, range))
    const translateY = Math.floor(random(-range, range))
    const danceScale = element === document.body ? 0 : random(0.001, 0.05)
    const danceProgress = random(0, 2 * Math.PI)

    const children = element.querySelectorAll(":scope > *")
    const isEndChild = Array.from(children).length === 0 ? true : false
    return {
      target: element,
      translateData: {
        scale: scale,
        newScale: newScale,
        translateX: translateX,
        translateY: translateY,
      },
      danceData: {
        scale: danceScale,
        progress: danceProgress,
      },
      isEndChild: isEndChild,
      distortData: {
        xNow: 1,
        xTarget: 1,
        yNow: 1,
        yTarget: 1,
      },
    }
  })

  const socket = new WebSocket("wss://io.zongzechen.com/undo/controller")

  socket.addEventListener("open", () => {
    console.log("socket connected!")
  })
  socket.addEventListener("message", (event) => {
    //console.log(event.data)
    const [name, data] = event.data.split(":")
    if (name === "potentiometer") {
      globalVariables.shiftPercentage.target = data < 10 ? 0 : data / 1024
    }
    // else if (name == "encoderY") {
    //   if (data === 0) {
    //     globalVariables.distort.yTarget -= 0.1
    //   } else if (data == 1) {
    //     globalVariables.distort.yTarget += 0.1
    //   }
    // }
    else if (name === "button") {
      if (globalVariables.deleteActivated == true) return
      globalVariables.deleteActivated = true
      deleteAll()
    }
  })

  const animate = () => {
    window.requestAnimationFrame(animate)
    const { shiftPercentage } = globalVariables
    shiftPercentage.current +=
      (shiftPercentage.target - shiftPercentage.current) * 0.2
    const { current } = shiftPercentage

    elementData.forEach((data) => {
      const { target, translateData } = data
      const { scale, newScale, translateX, translateY } = translateData
      //const danceScale = dance(data)
      const scaleNow = scale + (newScale - scale) * current
      const xNow = `${translateX * current}px`
      const yNow = `${translateY * current}px`

      target.style.scale = scaleNow.toString()
      target.style.transform = `translateX(${xNow}) translateY(${yNow})`
    })
  }

  // const dance = (data: ElementData) => {
  //   const danceData = data.danceData
  //   danceData.progress += 0.01
  //   const percentage = Math.sin(danceData.progress)
  //   const danceScale = danceData.scale * percentage
  //   return danceScale
  // }

  animate()
}
