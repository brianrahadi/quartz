// falling-sand banner: click/drag (or touch) to pour pixel sand that piles up and slides
// no assets, just a grid of pixels

const CELL = 3
const HEIGHT = 96
const STEPS_PER_FRAME = 2

function hslToAbgr(h: number, s: number, l: number): number {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const r = Math.round(f(0) * 255)
  const g = Math.round(f(8) * 255)
  const b = Math.round(f(4) * 255)
  // ImageData is RGBA in memory, so little-endian Uint32 is ABGR
  return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0
}

document.addEventListener("nav", () => {
  const wrap = document.querySelector<HTMLElement>(".sand-banner")
  if (!wrap) return
  const canvas = wrap.querySelector<HTMLCanvasElement>(".sand-canvas")
  const clearBtn = wrap.querySelector<HTMLButtonElement>(".sand-clear")
  if (!canvas) return
  const ctx = canvas.getContext("2d")
  const buf = document.createElement("canvas")
  const bctx = buf.getContext("2d")
  if (!ctx || !bctx) return

  const coarse = window.matchMedia("(pointer: coarse)").matches
  const rows = Math.floor(HEIGHT / CELL)

  let W = 0
  let dpr = 1
  let cols = 0
  let grid = new Uint32Array(0)
  let img: ImageData | null = null
  let view = new Uint32Array(0)

  let hue = 95
  let frame = 0
  let poured = false
  let draining = false
  let down = false
  let px = 0
  let py = 0
  let lx = 0
  let ly = 0
  let raf = 0
  let visible = true
  let idleFrames = 0
  let textColor = "#d4d4d4"

  const isDark = () => document.documentElement.getAttribute("saved-theme") !== "light"

  function readColors() {
    const cs = getComputedStyle(document.documentElement)
    textColor = cs.getPropertyValue("--darkgray").trim() || textColor
  }

  function grainColor(): number {
    hue = (hue + 0.06) % 360
    const l = (isDark() ? 60 : 50) + (Math.random() * 10 - 5)
    const s = 40 + Math.random() * 12
    return hslToAbgr(hue, s, l)
  }

  // a soft striped dune so the banner isn't empty before anyone touches it
  function seed() {
    const base = isDark() ? 58 : 50
    for (let x = 0; x < cols; x++) {
      const h = Math.max(
        1,
        Math.round(3.5 + 2.5 * Math.sin(x * 0.045) + 1.5 * Math.sin(x * 0.11 + 1)),
      )
      for (let k = 0; k < h; k++) {
        const y = rows - 1 - k
        grid[y * cols + x] = hslToAbgr(95 + k * 9, 38, base + (Math.random() * 8 - 4))
      }
    }
    hue = 95 + 9 * 8
  }

  function resize() {
    W = canvas!.clientWidth || W || 600
    dpr = window.devicePixelRatio || 1
    canvas!.width = Math.round(W * dpr)
    canvas!.height = Math.round(HEIGHT * dpr)

    const newCols = Math.max(1, Math.floor(W / CELL))
    if (newCols !== cols) {
      const next = new Uint32Array(newCols * rows)
      const keep = Math.min(cols, newCols)
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < keep; x++) next[y * newCols + x] = grid[y * cols + x]
      }
      const first = cols === 0
      grid = next
      cols = newCols
      buf.width = cols
      buf.height = rows
      img = bctx!.createImageData(cols, rows)
      view = new Uint32Array(img.data.buffer)
      if (first) seed()
    }
    render()
  }

  function step(): boolean {
    let moved = false
    if (draining) {
      // open the floor and let everything fall out
      const bottom = (rows - 1) * cols
      for (let x = 0; x < cols; x++) {
        if (grid[bottom + x]) {
          grid[bottom + x] = 0
          moved = true
        }
      }
    }
    for (let y = rows - 2; y >= 0; y--) {
      const ltr = ((y + frame) & 1) === 0
      const rowStart = y * cols
      for (let i = 0; i < cols; i++) {
        const x = ltr ? i : cols - 1 - i
        const idx = rowStart + x
        const g = grid[idx]
        if (!g) continue
        const below = idx + cols
        if (!grid[below]) {
          grid[below] = g
          grid[idx] = 0
          moved = true
          continue
        }
        const dir = Math.random() < 0.5 ? -1 : 1
        if (x + dir >= 0 && x + dir < cols && !grid[below + dir]) {
          grid[below + dir] = g
          grid[idx] = 0
          moved = true
        } else if (x - dir >= 0 && x - dir < cols && !grid[below - dir]) {
          grid[below - dir] = g
          grid[idx] = 0
          moved = true
        }
      }
    }
    frame++
    if (draining && !moved) draining = false
    return moved
  }

  function pourAt(cx: number, cy: number) {
    for (let n = 0; n < 3; n++) {
      const x = Math.round(cx + (Math.random() * 4 - 2))
      const y = Math.round(cy + (Math.random() * 2 - 1))
      if (x < 0 || x >= cols || y < 0 || y >= rows) continue
      const idx = y * cols + x
      if (!grid[idx]) grid[idx] = grainColor()
    }
  }

  function pour() {
    // fill along the path since last frame so fast drags leave a continuous stream
    const dx = px - lx
    const dy = py - ly
    const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 2))
    for (let i = 1; i <= n; i++) pourAt(lx + (dx * i) / n, ly + (dy * i) / n)
    lx = px
    ly = py
  }

  function render() {
    if (!img) return
    view.set(grid)
    bctx!.putImageData(img, 0, 0)
    const c = ctx!
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    c.clearRect(0, 0, W, HEIGHT)
    c.imageSmoothingEnabled = false
    c.drawImage(buf, 0, 0, cols * CELL, rows * CELL)

    if (!poured) {
      c.font = '12px "IBM Plex Mono", ui-monospace, monospace'
      c.textAlign = "center"
      c.textBaseline = "middle"
      c.fillStyle = textColor
      c.fillText(coarse ? "drag to pour sand" : "click and drag to pour sand", W / 2, 34)
    }
  }

  function loop() {
    raf = 0
    if (down) pour()
    let moved = false
    for (let i = 0; i < STEPS_PER_FRAME; i++) moved = step() || moved
    render()
    idleFrames = moved || down ? 0 : idleFrames + 1
    if (visible && !document.hidden && (down || draining || idleFrames < 2)) {
      raf = requestAnimationFrame(loop)
    }
  }

  function kick() {
    idleFrames = 0
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop)
  }

  function cellFromEvent(e: PointerEvent) {
    const r = canvas!.getBoundingClientRect()
    px = (e.clientX - r.left) / CELL
    py = (e.clientY - r.top) / CELL
  }

  const onDown = (e: PointerEvent) => {
    e.preventDefault()
    try {
      canvas.setPointerCapture(e.pointerId)
    } catch {}
    cellFromEvent(e)
    lx = px
    ly = py
    down = true
    if (!poured) {
      poured = true
      wrap.classList.add("poured")
    }
    kick()
  }
  const onMove = (e: PointerEvent) => {
    if (down) cellFromEvent(e)
  }
  const onUp = () => {
    down = false
  }
  const onClear = () => {
    draining = true
    kick()
  }
  const onTheme = () => {
    readColors()
    render()
  }
  const onVisibility = () => kick()

  canvas.addEventListener("pointerdown", onDown)
  canvas.addEventListener("pointermove", onMove)
  canvas.addEventListener("pointerup", onUp)
  canvas.addEventListener("pointercancel", onUp)
  clearBtn?.addEventListener("click", onClear)
  document.addEventListener("themechange", onTheme)
  document.addEventListener("visibilitychange", onVisibility)

  const ro = new ResizeObserver(() => resize())
  ro.observe(canvas)
  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting)
    if (visible) kick()
  })
  io.observe(canvas)

  readColors()
  resize()

  window.addCleanup(() => {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    ro.disconnect()
    io.disconnect()
    canvas.removeEventListener("pointerdown", onDown)
    canvas.removeEventListener("pointermove", onMove)
    canvas.removeEventListener("pointerup", onUp)
    canvas.removeEventListener("pointercancel", onUp)
    clearBtn?.removeEventListener("click", onClear)
    document.removeEventListener("themechange", onTheme)
    document.removeEventListener("visibilitychange", onVisibility)
  })
})
