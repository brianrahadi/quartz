// tiny endless-runner banner for the home page
// press space / arrow up / tap to jump over bugs

const PX = 3
const HEIGHT = 96
const GROUND = 80
const HERO_X = 28
const GRAVITY = 2400
const JUMP = 560
const START_SPEED = 280
const MAX_SPEED = 640
const HI_KEY = "runner-hi"

const HERO_TOP = [
  "..hhhhh.",
  ".hhhhhhh",
  ".hhsssss",
  ".hssesse",
  "..sssss.",
  ".cccccc.",
  "cccccccc",
  "s.cccc.s",
  "..pppp..",
]
const HERO_RUN_A = [...HERO_TOP, ".p....p.", "kk....kk"]
const HERO_RUN_B = [...HERO_TOP, "..p..p..", "..kk.kk."]
const HERO_STAND = [...HERO_TOP, "..p..p..", "..k..k.."]
const HERO_JUMP = [
  "..hhhhh.",
  ".hhhhhhh",
  ".hhsssss",
  ".hssesse",
  "s.sssss.",
  "cccccccs",
  ".cccccc.",
  "..cccc..",
  "..pppp..",
  ".pp..p..",
  ".k...kk.",
]
const BUG = [
  "a......",
  ".a.bbb.",
  "..bbdbb",
  "hebbbbb",
  "hhbdbbb",
  ".l.l.l.",
]
const CLOUD = ["..xxx...", ".xxxxxx.", "xxxxxxxx"]

const HERO_W = 8 * PX
const HERO_H = HERO_TOP.length * PX + 2 * PX
const BUG_W = 7 * PX
const BUG_H = BUG.length * PX

type Palette = Record<string, string>
type Obstacle = { x: number; n: number; w: number }
type Cloud = { x: number; y: number }

document.addEventListener("nav", () => {
  const canvas = document.querySelector<HTMLCanvasElement>(".runner-canvas")
  if (!canvas) return
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const coarse = window.matchMedia("(pointer: coarse)").matches

  let W = canvas.clientWidth || 600
  let dpr = window.devicePixelRatio || 1
  let colors: Palette = {}
  let heroPalette: Palette = {}
  let bugPalette: Palette = {}

  let state: "idle" | "run" | "over" = "idle"
  let y = 0
  let vy = 0
  let speed = START_SPEED
  let dist = 0
  let obstacles: Obstacle[] = []
  let nextGap = 0
  let clock = 0
  let overAt = 0
  let clouds: Cloud[] = []
  let raf = 0
  let last = 0
  let visible = true

  let hi = 0
  try {
    hi = parseInt(localStorage.getItem(HI_KEY) ?? "0", 10) || 0
  } catch {}

  function readColors() {
    const cs = getComputedStyle(document.documentElement)
    const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback
    colors = {
      light: v("--light", "#1e1e21"),
      lightgray: v("--lightgray", "#393639"),
      gray: v("--gray", "#646464"),
      darkgray: v("--darkgray", "#d4d4d4"),
      secondary: v("--secondary", "#41644A"),
      tertiary: v("--tertiary", "#7AA874"),
    }
    heroPalette = {
      h: "#6b4a3a",
      s: "#f1c49b",
      e: "#1e1e21",
      c: colors.tertiary,
      p: colors.secondary,
      k: colors.darkgray,
    }
    bugPalette = { a: colors.darkgray, h: colors.darkgray, l: colors.darkgray, b: "#c0584b", d: "#7a2e26", e: colors.light }
  }

  function resetClouds() {
    clouds = [0.15, 0.5, 0.82].map((f, i) => ({ x: f * W, y: 12 + ((i * 11) % 22) }))
  }

  function resize() {
    W = canvas!.clientWidth || W
    dpr = window.devicePixelRatio || 1
    canvas!.width = Math.round(W * dpr)
    canvas!.height = Math.round(HEIGHT * dpr)
    if (clouds.length === 0) resetClouds()
    draw()
  }

  function airTime() {
    return (2 * JUMP) / GRAVITY
  }

  function randomGap() {
    return speed * airTime() * (1.2 + Math.random() * 1.6) + 50
  }

  function spawn() {
    const r = Math.random()
    const n = r < 0.6 ? 1 : r < 0.9 || speed < 380 ? 2 : 3
    obstacles.push({ x: W + 10, n, w: n * BUG_W + (n - 1) * PX })
    nextGap = randomGap()
  }

  function start() {
    state = "run"
    y = 0
    vy = 0
    speed = START_SPEED
    dist = 0
    obstacles = []
    nextGap = W * 0.5
  }

  function press() {
    if (state === "idle") {
      start()
      vy = JUMP
    } else if (state === "run") {
      if (y === 0) vy = JUMP
    } else if (clock - overAt > 0.4) {
      start()
    }
    kick()
  }

  function release() {
    // let go early for a shorter hop
    if (state === "run" && vy > JUMP * 0.45) vy = JUMP * 0.45
  }

  function update(dt: number) {
    clock += dt
    if (state === "run") {
      speed = Math.min(MAX_SPEED, speed + 10 * dt)
      dist += speed * dt

      vy -= GRAVITY * dt
      y += vy * dt
      if (y <= 0) {
        y = 0
        vy = 0
      }

      for (const o of obstacles) o.x -= speed * dt
      obstacles = obstacles.filter((o) => o.x + o.w > -10)
      const lastO = obstacles[obstacles.length - 1]
      if (!lastO || W - (lastO.x + lastO.w) > nextGap) spawn()

      // collision, with a little forgiveness
      const hx = HERO_X + 4
      const hw = HERO_W - 8
      const hBottom = GROUND - y - 2
      for (const o of obstacles) {
        const ox = o.x + 3
        const ow = o.w - 6
        const oTop = GROUND - BUG_H + 6
        if (hx < ox + ow && hx + hw > ox && hBottom > oTop) {
          state = "over"
          overAt = clock
          const score = Math.floor(dist / 10)
          if (score > hi) {
            hi = score
            try {
              localStorage.setItem(HI_KEY, String(hi))
            } catch {}
          }
          break
        }
      }
    }

    const cloudSpeed = state === "run" ? speed * 0.12 : 10
    for (const c of clouds) {
      c.x -= cloudSpeed * dt
      if (c.x < -30) {
        c.x = W + Math.random() * 120
        c.y = 10 + Math.random() * 26
      }
    }
  }

  function drawSprite(sprite: string[], x: number, top: number, palette: Palette, scale = PX) {
    const ox = Math.round(x)
    const oy = Math.round(top)
    for (let r = 0; r < sprite.length; r++) {
      const row = sprite[r]
      for (let c = 0; c < row.length; c++) {
        const ch = row[c]
        if (ch === ".") continue
        ctx!.fillStyle = palette[ch] ?? colors.gray
        ctx!.fillRect(ox + c * scale, oy + r * scale, scale, scale)
      }
    }
  }

  function heroSprite() {
    if (state === "run") {
      if (y > 0) return HERO_JUMP
      return Math.floor(dist / 24) % 2 === 0 ? HERO_RUN_A : HERO_RUN_B
    }
    return HERO_STAND
  }

  function pad(n: number) {
    return String(n).padStart(5, "0")
  }

  function draw() {
    const c = ctx!
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    c.clearRect(0, 0, W, HEIGHT)

    // clouds
    const cloudPalette = { x: colors.lightgray }
    for (const cl of clouds) drawSprite(CLOUD, cl.x, cl.y, cloudPalette, 2)

    // ground + pebbles
    c.fillStyle = colors.lightgray
    c.fillRect(0, GROUND, W, 1)
    c.fillStyle = colors.gray
    const step = 14
    for (let k = Math.floor(dist / step); k * step - dist < W; k++) {
      if ((k * 7919) % 5 < 2) {
        c.fillRect(Math.round(k * step - dist), GROUND + 4 + (k % 3) * 3, 2, 1)
      }
    }

    // bugs
    for (const o of obstacles) {
      for (let i = 0; i < o.n; i++) {
        drawSprite(BUG, o.x + i * (BUG_W + PX), GROUND - BUG_H, bugPalette)
      }
    }

    // hero (blinks now and then while idle)
    const blink = state === "idle" && clock % 3.2 < 0.14
    const palette = blink ? { ...heroPalette, e: heroPalette.s } : heroPalette
    drawSprite(heroSprite(), HERO_X, GROUND - HERO_H - y, palette)

    // score
    c.font = '11px "IBM Plex Mono", ui-monospace, monospace'
    c.textBaseline = "top"
    c.textAlign = "right"
    c.fillStyle = colors.gray
    const score = Math.floor(dist / 10)
    c.fillText(`HI ${pad(hi)}  ${pad(score)}`, W - 10, 8)

    // messages
    c.textAlign = "center"
    c.textBaseline = "middle"
    c.font = '12px "IBM Plex Mono", ui-monospace, monospace'
    c.fillStyle = colors.darkgray
    const action = coarse ? "tap" : "press space"
    if (state === "idle") {
      c.fillText(`${action} to squash some bugs`, W / 2 + 20, 44)
    } else if (state === "over") {
      c.fillText(`a bug got you! ${action} to retry`, W / 2 + 20, 44)
    }
  }

  function shouldAnimate() {
    if (!visible || document.hidden) return false
    return state === "run" || (state === "idle" && !reducedMotion)
  }

  function frame(t: number) {
    raf = 0
    const dt = Math.min(0.033, Math.max(0, (t - last) / 1000))
    last = t
    update(dt)
    draw()
    if (shouldAnimate()) raf = requestAnimationFrame(frame)
  }

  function kick() {
    if (raf) return
    if (shouldAnimate()) {
      last = performance.now()
      raf = requestAnimationFrame(frame)
    } else {
      draw()
    }
  }

  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault()
    canvas.focus({ preventScroll: true })
    press()
  }
  const onPointerUp = () => release()
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
      e.preventDefault()
      if (!e.repeat) press()
    }
  }
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") release()
  }
  const onTheme = () => {
    readColors()
    draw()
  }
  const onVisibility = () => kick()

  canvas.addEventListener("pointerdown", onPointerDown)
  canvas.addEventListener("pointerup", onPointerUp)
  canvas.addEventListener("pointercancel", onPointerUp)
  canvas.addEventListener("keydown", onKeyDown)
  canvas.addEventListener("keyup", onKeyUp)
  document.addEventListener("themechange", onTheme)
  document.addEventListener("visibilitychange", onVisibility)

  const ro = new ResizeObserver(() => resize())
  ro.observe(canvas)
  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting)
    kick()
  })
  io.observe(canvas)

  readColors()
  resize()
  kick()

  window.addCleanup(() => {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    ro.disconnect()
    io.disconnect()
    canvas.removeEventListener("pointerdown", onPointerDown)
    canvas.removeEventListener("pointerup", onPointerUp)
    canvas.removeEventListener("pointercancel", onPointerUp)
    canvas.removeEventListener("keydown", onKeyDown)
    canvas.removeEventListener("keyup", onKeyUp)
    document.removeEventListener("themechange", onTheme)
    document.removeEventListener("visibilitychange", onVisibility)
  })
})
