interface HTMLElementData {
  target: HTMLElement
  isEndChild: boolean
  distanceToRoot: number
}

const elementData = (
  element: HTMLElement,
  distanceToRoot: number
): HTMLElementData => {
  return {
    target: element,
    isEndChild: Array.from(element.querySelectorAll(":scope > *")).length === 0,
    distanceToRoot: distanceToRoot + 1,
  }
}

const findDataOfChildren = (element: HTMLElement, distanceToRoot: number) => {
  const children = element.querySelectorAll(
    ":scope > *"
  ) as NodeListOf<HTMLElement>
  let result: HTMLElementData[] = []
  if (!children) return result
  const childrenArray = Array.from(children)
  childrenArray.forEach((child) => {
    const data = elementData(child, distanceToRoot + 1)
    result.push(data)
    const childrenData = findDataOfChildren(child, distanceToRoot + 1)
    result.push(...childrenData)
  })
  return result
}

export const init3D = async (eventBus: EventTarget) => {
  let globalFactor = 0
  let targetGlobalFactor = 0
  let started = false

  const elementData = findDataOfChildren(document.body, 0)
  console.log(elementData)

  const maxDistance = elementData.reduce(
    (prev, next) => Math.max(prev, next.distanceToRoot),
    -Infinity
  )

  const start = () => {
    elementData.forEach((data) => {
      const { target, distanceToRoot } = data
      target.style.overflow = "visible"
      target.style.zIndex = `${distanceToRoot}`
    })
    animate()
  }

  const updateShadow = (elementData: HTMLElementData[], factor: number) => {
    elementData.forEach((data) => {
      const { target } = data
      const shadowOpacity = map(factor, 0, 1, 0, 1)
      //const brightness = map(data.distanceToRoot, 0, maxDistance, 0.5, 1)
      target.style.boxShadow = `0px 0px 1px 1px rgba(50, 50, 50, ${shadowOpacity})`
      //target.style.border = `solid 2px rgba(20, 20, 20, ${shadowOpacity})`
    })
  }

  eventBus.addEventListener("3d", (event) => {
    // @ts-ignore
    targetGlobalFactor = event.detail
    updateShadow(elementData, targetGlobalFactor)
    if (started === false) {
      start()
      started = true
    }
  })

  const animate = () => {
    requestAnimationFrame(animate)
    globalFactor += (targetGlobalFactor - globalFactor) * 0.1

    elementData.forEach((data) => {
      const { target, distanceToRoot, isEndChild } = data
      const { top, bottom, left, right } = target.getBoundingClientRect()
      if (bottom >= 0 && top <= window.innerHeight) {
        const midY = (bottom + top) / 2
        const maxScale = 0.08 * globalFactor
        const baseDisplayY = window.innerHeight * 0.04 * globalFactor
        const baseDisplayX = window.innerWidth * 0.008 * globalFactor

        const scale = map(distanceToRoot, 0, maxDistance, 0, maxScale)

        const displaceY = map(
          midY,
          0,
          window.innerHeight,
          -baseDisplayY,
          baseDisplayY
        )
        const displaceXFactor = map(
          Math.abs((left + right) / 2 - window.innerWidth / 2),
          0,
          window.innerWidth / 2,
          0,
          1
        )
        const displaceXDirecton =
          (left + right) / 2 < window.innerWidth / 2 ? -1 : 1

        target.style.transform = `translateY(${displaceY}px) translateX(${
          baseDisplayX * displaceXFactor * displaceXDirecton
        }px) scale(${1 + scale})`

        if (isEndChild) {
          // const opacity = map(distanceToRoot, 0, maxDistance, 0, 1)
          //target.style.opacity = `${opacity + (1 - globalFactor)}`
          //target.style.backgroundColor = "white"
        }
      }
    })
  }
}

export const map = (
  value: number,
  min1: number,
  max1: number,
  min2: number,
  max2: number
) => {
  const ratio = (value - min1) / max1
  return min2 + (max2 - min2) * ratio
}
