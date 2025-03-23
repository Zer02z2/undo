interface HTMLElementData {
  target: HTMLElement
  isEndChild: boolean
  distanceToRoot: number
  currentDegree: number
  targetDegree: number
}

export const initTransform = async (eventBus: EventTarget) => {
  let globalFactor = 0
  let targetGlobalFactor = 0
  let started = false
  let clearing = false

  const getElementData = (
    element: HTMLElement,
    distanceToRoot: number
  ): HTMLElementData => {
    return {
      target: element,
      isEndChild:
        Array.from(element.querySelectorAll(":scope > *")).length === 0,
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
      const data = getElementData(child, distanceToRoot + 1)
      result.push(data)
      const childrenData = findDataOfChildren(child, distanceToRoot + 1)
      result.push(...childrenData)
    })
    return result
  }

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
      //target.style.backgroundColor = "rgb(220,220,220)"
    })
    animate()
  }

  const updateShadow = (elementData: HTMLElementData[], factor: number) => {
    elementData.forEach((data) => {
      // @ts-ignore
      const { target, distanceToRoot } = data
      let shadowOpacity = map(factor, 0, 1, 0, 1)
      const shadowFactor = map(distanceToRoot, 0, maxDistance, 1, 0.2)
      shadowOpacity *= shadowFactor
      target.style.boxShadow = `0px 0px 0px 1px rgba(50, 50, 50, ${shadowOpacity})`
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

  eventBus.addEventListener("clear", () => {
    clearing = true
  })

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
    if (clearing) return
    requestAnimationFrame(animate)
    globalFactor += (targetGlobalFactor - globalFactor) * 0.1

    elementData.forEach((data) => {
      const {
        target,
        targetDegree,
        currentDegree,
        distanceToRoot,
        isEndChild,
      } = data
      const { top, bottom, left, right } = target.getBoundingClientRect()
      if (bottom >= 0 && top <= window.innerHeight) {
        const midY = (bottom + top) / 2
        const maxScale = 0.2 * globalFactor
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
          data.currentDegree += (targetDegree - currentDegree) * 0.1
          target.style.transform = `translateY(${displaceY}px) translateX(${
            baseDisplayX * displaceXFactor * displaceXDirecton
          }px) scale(${1 + scale}) rotate(${data.currentDegree}deg)`
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
