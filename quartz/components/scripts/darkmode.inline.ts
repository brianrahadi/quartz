const userPref = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
const currentTheme = localStorage.getItem("theme") ?? userPref
document.documentElement.setAttribute("saved-theme", currentTheme)

const emitThemeChangeEvent = (theme: "light" | "dark") => {
  const event: CustomEventMap["themechange"] = new CustomEvent("themechange", {
    detail: { theme },
  })
  document.dispatchEvent(event)
}

document.addEventListener("nav", () => {
  const switchTheme = () => {
    const root = document.documentElement
    const newTheme = root.getAttribute("saved-theme") === "dark" ? "light" : "dark"
    const apply = () => {
      root.setAttribute("saved-theme", newTheme)
      localStorage.setItem("theme", newTheme)
      emitThemeChangeEvent(newTheme)
    }
    // sweep the new theme across the whole page (styles in custom.scss); the pixel village
    // sees data-theme-sweep and switches instantly so it moves with the page
    const startViewTransition = (document as any).startViewTransition?.bind(document)
    if (!startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply()
      return
    }
    root.dataset.themeSweep = newTheme === "dark" ? "to-dark" : "to-light"
    const transition = startViewTransition(apply)
    transition.finished.finally(() => delete root.dataset.themeSweep)
  }

  const themeChange = (e: MediaQueryListEvent) => {
    const newTheme = e.matches ? "dark" : "light"
    document.documentElement.setAttribute("saved-theme", newTheme)
    localStorage.setItem("theme", newTheme)
    emitThemeChangeEvent(newTheme)
  }

  for (const darkmodeButton of document.getElementsByClassName("darkmode")) {
    darkmodeButton.addEventListener("click", switchTheme)
    window.addCleanup(() => darkmodeButton.removeEventListener("click", switchTheme))
  }

  // Listen for changes in prefers-color-scheme
  const colorSchemeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
  colorSchemeMediaQuery.addEventListener("change", themeChange)
  window.addCleanup(() => colorSchemeMediaQuery.removeEventListener("change", themeChange))
})
