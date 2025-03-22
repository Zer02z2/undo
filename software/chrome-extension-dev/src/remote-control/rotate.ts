interface HTMLElementData {
  target: HTMLElement
  isEndChild: boolean
  distanceToRoot: number
  currentDegree: number
  targetDegree: number
}

const elementData = (
  element: HTMLElement,
  distanceToRoot: number
): HTMLElementData => {
  return {
    target: element,
    isEndChild: Array.from(element.querySelectorAll(":scope > *")).length === 0,
    distanceToRoot: distanceToRoot + 1,
    currentDegree: 0,
    targetDegree: 0,
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

export const initRotate = async (eventBus: EventTarget) => {
  let started = false
  const elementData = findDataOfChildren(document.body, 0)

  const maxDistance = elementData.reduce(
    (prev, next) => Math.max(prev, next.distanceToRoot),
    -Infinity
  )

  const start = () => {
    animate()
  }

  eventBus.addEventListener("rotate", (event) => {
    // @ts-ignore
    const degree = event.detail
    elementData.forEach((data) => {
      const { distanceToRoot } = data
      const factor = map(distanceToRoot, 0, maxDistance, 0, 1)
      const perDegree = degree * factor
      data.targetDegree += perDegree
    })
    if (started === false) {
      start()
      started = true
    }
  })

  const animate = () => {
    requestAnimationFrame(animate)

    elementData.forEach((data) => {
      const { target, currentDegree, targetDegree, isEndChild } = data
      if (!isEndChild) return
      data.currentDegree += (targetDegree - currentDegree) * 0.1
      target.style.transform = `rotate(${data.currentDegree}deg)`
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
