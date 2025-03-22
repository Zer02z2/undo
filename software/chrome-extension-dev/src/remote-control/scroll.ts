export const scrollMax = (direction: 1 | -1) => {
  window.scrollBy({ top: 500 * direction, behavior: "smooth" })
}

export const scrollMedium = (direction: 1 | -1) => {
  window.scrollBy({ top: 150 * direction, behavior: "smooth" })
}

export const scrollMin = (direction: 1 | -1) => {
  window.scrollBy({ top: 50 * direction, behavior: "smooth" })
}
