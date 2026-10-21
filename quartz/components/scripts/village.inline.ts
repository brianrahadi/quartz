// 1-bit pixel-art village for the home page.
// light theme = day with a sun, dark theme = night with a moon (lit windows, stars, fireflies).
// mount it anywhere in markdown with: <div class="pixel-village"></div>

const S = 2 // css px per art pixel
const ROWS = 70 // rows of landscape
const PAD = 35 // extra rows of open sky above it
const TOTAL = ROWS + PAD
const HEIGHT = TOTAL * S
const FPS = 30
const FADE_SECONDS = 1.4

// pixel "materials"; each resolves to dark or light depending on day (n=0) / night (n=1)
const NONE = 255
const SKY = 0
const INK = 1 // outlines: dark by day, light by night
const FILL = 2 // surfaces: light by day, dark by night
const SHADE = 3 // 50% dither by day, mostly dark at night
const LSHADE = 4 // light dither by day, mostly dark at night
const SOLID = 5 // always dark (sun, birds, door): disappears at night
const BRIGHT = 6 // always light (moon, stars, fireflies): disappears by day
const WATER = 7 // like FILL, but marks the pond for ripples
const SEA = 8 // like FILL, marks the sea for waves and reflections
const WIN = 16 // WIN + i: window i, dark by day, lit at night
const WIN_ON = [0.5, 0.62, 0.7, 0.56, 0.4, 0.78]
const TYPES = 32
const LEVELS = 32
const SWEEP = 0.45 // width of the dusk band as a fraction of the scene

// darkness probability per material at each night level (0 = day, LEVELS = night)
const P_TABLE: Float32Array[] = []
const SKY_TABLE: Float32Array[] = []

const BAYER = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28,
  52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7,
  39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
].map((v) => (v + 0.5) / 64)

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

class Grid {
  d: Uint8Array
  constructor(
    public w: number,
    public h: number,
    public oy = 0, // scene y = 0 lands on grid row oy
  ) {
    this.d = new Uint8Array(w * h).fill(NONE)
  }
  set(x: number, y: number, t: number) {
    x = Math.round(x)
    y = Math.round(y) + this.oy
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return
    this.d[y * this.w + x] = t
  }
  get(x: number, y: number) {
    y += this.oy
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return NONE
    return this.d[y * this.w + x]
  }
  rect(x: number, y: number, w: number, h: number, t: number) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, t)
  }
  line(x0: number, y0: number, x1: number, y1: number, t: number) {
    x0 = Math.round(x0)
    y0 = Math.round(y0)
    x1 = Math.round(x1)
    y1 = Math.round(y1)
    const dx = Math.abs(x1 - x0)
    const dy = -Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx + dy
    for (;;) {
      this.set(x0, y0, t)
      if (x0 === x1 && y0 === y1) break
      const e2 = 2 * err
      if (e2 >= dy) {
        err += dy
        x0 += sx
      }
      if (e2 <= dx) {
        err += dx
        y0 += sy
      }
    }
  }
  // fill a region and outline its edge
  shape(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    inside: (x: number, y: number) => boolean,
    fill: (x: number, y: number) => number,
    outline = INK,
    topOnly = false,
  ) {
    x0 = Math.max(0, Math.floor(x0))
    y0 = Math.max(-this.oy, Math.floor(y0))
    x1 = Math.min(this.w - 1, Math.ceil(x1))
    y1 = Math.min(this.h - 1 - this.oy, Math.ceil(y1))
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (!inside(x, y)) continue
        const edge = topOnly
          ? !inside(x, y - 1)
          : !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)
        this.set(x, y, edge ? outline : fill(x, y))
      }
    }
  }
  box(x0: number, y0: number, x1: number, y1: number, fill: number, outline = INK) {
    this.shape(
      x0,
      y0,
      x1,
      y1,
      (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1,
      () => fill,
      outline,
    )
  }
}

// farm animals: I = outline, F = fill, S = solid, L = light dither
const CHICKEN_UP = ["....S..", "...IFII", "I..IFI.", "IIIFFI.", "IFFFFI.", ".IIII..", "..I.I.."]
const CHICKEN_PECK = [".......", ".......", "I......", "IIIII..", "IFFFIS.", ".IIIIFI", "..I.I.."]
const CHICKEN_STEP = ["....S..", "...IFII", "I..IFI.", "IIIFFI.", "IFFFFI.", ".IIII..", ".I...I."]
const SPRITE_TYPES: Record<string, number> = { I: INK, F: FILL, S: SOLID, L: LSHADE }
type Kind = "cow" | "pig" | "chicken"
const ANIMAL_W: Record<Kind, number> = { cow: 18, pig: 15, chicken: 7 }
type Animal = {
  kind: Kind
  x: number
  y: number
  dir: number
  lo: number
  hi: number
  speed: number
  walking: boolean
  timer: number
  step: number
  busy: boolean // grazing / sniffing / pecking
}

type Scene = {
  yard: { x0: number; x1: number }
  grid: Grid
  sky: { x: number; y: number }
  chimney: { x: number; y: number }
  flag: { x: number; y: number }
  pond: { x: number; y: number; rx: number }
  sea: { H: number; x0: number; k: number }
  stars: { x: number; y: number; sp: number; ph: number; big: boolean }[]
  flies: { x: number; y: number; ph: number }[]
  clouds: { x: number; y: number; v: number; puffs: [number, number, number][] }[]
}

function buildScene(cols: number): Scene {
  const g = new Grid(cols, ROWS)
  const r = rng(1337)
  // responsive layout, left to right: [forest] [house] [meadow] [pond] [forest] [beach].
  // the house, meadow and beach always fit; the rest only appear when there's room,
  // so narrow screens get a simpler scene instead of a squashed one
  const beachW = Math.max(52, Math.min(84, Math.round(cols * 0.22)))
  const bx = cols - beachW // where the beach starts
  const extra = Math.max(0, cols - 108 - beachW)
  const left = Math.round(Math.min(90, extra * 0.3))
  const hx = 32 + left
  const bY = 60
  const houseL = hx - 32
  const yardX0 = hx + 32
  const yardX1 = yardX0 + 44 + Math.round(Math.min(30, (extra - left) * 0.25))
  const room = bx - 6 - yardX1
  const hasPond = room >= 46
  const prx = Math.max(8, Math.min(16, Math.round(room * 0.12)))
  const pc = hasPond ? yardX1 + prx + 10 : -999
  const pondEnd = hasPond ? pc + prx + 10 : yardX1
  const H = 49 // horizon
  const shoreK = 0.9
  const shore = (y: number) => bx + 13 + (y - H) * shoreK
  const dip = (x: number, start: number, k: number) => Math.max(0, x - start) * k
  const pcy = 64

  const farHill = (x: number) =>
    45 + 3 * Math.sin(x * 0.035 + 1) + 2 * Math.sin(x * 0.09 + 0.5) + dip(x, bx - 14, 0.35)
  const nearHill = (x: number) =>
    54 + 2 * Math.sin(x * 0.05 + 3) + 1.2 * Math.sin(x * 0.13) + dip(x, bx - 4, 0.12)

  // mountains
  const peaks = [
    [hx - 40, 26, 0.9],
    [yardX0 + 12, 29, 1.1],
    [yardX1 + 14, 22, 0.85],
  ]
    .filter(([x]) => x >= 8 && x < bx - 24)
    .map(([x, y, s]) => ({ x, y, s }))
  const nearestPeak = (x: number) => {
    let best = peaks[0]
    let by = Infinity
    for (const p of peaks) {
      const v = p.y + Math.abs(x - p.x) * p.s
      if (v < by) {
        by = v
        best = p
      }
    }
    return { p: best, ridge: by }
  }
  if (peaks.length)
    g.shape(
      0,
      0,
      cols - 1,
      ROWS - 1,
      (x, y) => x >= 0 && x < bx - 12 && y >= nearestPeak(x).ridge && y < 58,
      (x, y) => {
        const { p } = nearestPeak(x)
        const snow = p.y + 5 + ((x * 7) % 3)
        if (y < snow) return FILL
        if (y === snow) return x > p.x ? INK : FILL
        return x > p.x ? LSHADE : FILL
      },
      INK,
      true,
    )

  // far hills with tiny pines
  g.shape(
    0,
    0,
    cols - 1,
    ROWS - 1,
    (x, y) => x >= 0 && x < cols && y >= farHill(x),
    () => FILL,
    INK,
    true,
  )
  for (let x = 2; x < cols - 2; x += 3 + Math.floor(r() * 6)) {
    if (r() < 0.6 || x > bx - 14) continue
    const y = Math.round(farHill(x))
    g.set(x, y - 4, INK)
    g.set(x, y - 3, INK)
    g.rect(x - 1, y - 2, 3, 2, INK)
    g.set(x, y, INK)
  }

  // near hills
  g.shape(
    0,
    0,
    cols - 1,
    ROWS - 1,
    (x, y) => x >= 0 && x < cols && y >= nearHill(x),
    () => FILL,
    INK,
    true,
  )
  for (let i = 0; i < cols / 14; i++) {
    const x = Math.floor(r() * (bx - 6))
    const y = Math.round(nearHill(x) + 3 + r() * (ROWS - nearHill(x) - 4))
    g.set(x, y, INK)
    g.set(x + 1, y - 1, INK)
    g.set(x + 2, y, INK)
  }

  const pine = (x: number, base: number, h: number) => {
    g.rect(x, base - 2, 1, 3, SOLID)
    for (let i = 0; i < 3; i++) {
      const top = base - h + Math.round(i * h * 0.27)
      const th = Math.round(h * 0.42)
      const half = 2 + th * 0.55 + i * 0.6
      g.shape(
        x - half - 1,
        top,
        x + half + 1,
        top + th,
        (px, py) =>
          py >= top && py <= top + th && Math.abs(px - x) <= ((py - top + 1) * half) / (th + 1),
        () => SHADE,
      )
    }
  }
  const tree = (x: number, base: number, rad: number) => {
    g.rect(x - 1, base - rad - 1, 2, rad + 2, SOLID)
    const cy = base - rad - 3
    const puffs: [number, number, number][] = [
      [0, 0, rad],
      [-rad * 0.6, rad * 0.35, rad * 0.7],
      [rad * 0.6, rad * 0.35, rad * 0.7],
    ]
    const inside = (px: number, py: number) =>
      puffs.some(([dx, dy, pr]) => (px - x - dx) ** 2 + (py - cy - dy) ** 2 <= pr * pr)
    g.shape(x - rad * 1.4, cy - rad, x + rad * 1.4, cy + rad, inside, (px, py) =>
      px - x + (py - cy) > rad * 0.45 ? LSHADE : FILL,
    )
  }

  // dense pine forests where mountains used to be
  const forests: [number, number][] = []
  const forest = (from: number, to: number) => {
    forests.push([from - 3, to + 3])
    for (let x = from; x < to; x += 4 + Math.floor(r() * 3)) {
      pine(x, Math.round(farHill(x)) + 6, 12 + Math.floor(r() * 8))
    }
  }
  if (hx - 36 >= 12) forest(0, Math.min(hx - 36, 44))
  if (bx - 4 - pondEnd >= 16) forest(pondEnd + 2, bx - 4)

  // trees on the hills, kept clear of the house and pond
  // keep the house, the animals' meadow, the pond and the forests clear
  const blocked = (x: number) =>
    (x > houseL - 4 && x < yardX1 + 4) ||
    (hasPond && Math.abs(x - pc) < prx + 8) ||
    x > bx - 8 ||
    forests.some(([a, b]) => x > a && x < b)
  for (let x = 6, i = 0; x < bx - 8; x += 16 + Math.floor(r() * 10)) {
    if (blocked(x)) continue
    const base = Math.round(nearHill(x)) + 2 + Math.floor(r() * 3)
    if (i++ % 2 === 1) tree(x, base, 4 + Math.floor(r() * 3))
    else pine(x, base, 18 + Math.floor(r() * 9))
  }
  // trees behind the house
  pine(hx + 44, 57, 26)
  tree(hx - 17, 57, 6)

  // ---- the house ----
  // chimney (drawn first so the roof overlaps its base)
  g.box(hx + 20, bY - 34, hx + 23, bY - 20, FILL)
  for (let y = bY - 32; y < bY - 26; y += 2) g.set(hx + 21 + ((y >> 1) & 1), y, INK)
  g.rect(hx + 19, bY - 35, 6, 1, INK)

  // timber-framed body
  g.box(hx, bY - 15, hx + 27, bY - 1, FILL)
  g.rect(hx + 1, bY - 2, 26, 1, SHADE)
  g.rect(hx + 1, bY - 8, 26, 1, INK)
  g.line(hx + 9, bY - 15, hx + 9, bY - 2, INK)
  g.line(hx + 18, bY - 15, hx + 18, bY - 2, INK)
  g.line(hx + 1, bY - 3, hx + 8, bY - 7, INK)
  g.line(hx + 19, bY - 7, hx + 26, bY - 3, INK)
  // windows with flower boxes
  g.box(hx + 2, bY - 14, hx + 7, bY - 10, WIN + 0)
  g.rect(hx + 2, bY - 9, 6, 1, SHADE)
  g.box(hx + 20, bY - 14, hx + 25, bY - 10, WIN + 1)
  g.rect(hx + 20, bY - 9, 6, 1, SHADE)
  // arched door
  g.shape(
    hx + 11,
    bY - 11,
    hx + 16,
    bY - 1,
    (x, y) =>
      x >= hx + 11 &&
      x <= hx + 16 &&
      y >= bY - 11 &&
      y <= bY - 1 &&
      !(y === bY - 11 && (x === hx + 11 || x === hx + 16)),
    () => SOLID,
  )
  g.set(hx + 15, bY - 5, BRIGHT)

  // steep roof
  {
    const top = bY - 34
    const base = bY - 16
    const cx = hx + 13.5
    const half = 17
    const h = base - top
    g.shape(
      hx - 4,
      top,
      hx + 31,
      base,
      (x, y) =>
        y >= top && y <= base && Math.abs(x - cx) <= half * ((y - top + 1) / (h + 1)) ** 1.1,
      (x, y) => ((y - top) % 4 === 3 && (x + y) % 2 === 0 ? INK : SHADE),
    )
    // dormer
    const dt = bY - 28
    g.shape(
      hx + 8,
      dt,
      hx + 14,
      bY - 25,
      (x, y) => y >= dt && y <= bY - 25 && Math.abs(x - (hx + 11)) <= (y - dt) * 1.2 + 0.5,
      () => SHADE,
    )
    g.box(hx + 9, bY - 24, hx + 13, bY - 20, FILL)
    g.rect(hx + 10, bY - 23, 3, 3, WIN + 2)
  }

  // round tower with a witch-hat roof
  const tx0 = hx - 12
  const tx1 = hx - 3
  g.box(tx0, bY - 30, tx1, bY - 1, FILL)
  for (let y = bY - 28; y < bY - 2; y += 3) {
    const sx = tx0 + 2 + ((y * 5) % 5)
    g.rect(sx, y, 2, 1, LSHADE)
  }
  g.shape(
    tx0 + 2,
    bY - 26,
    tx0 + 5,
    bY - 19,
    (x, y) =>
      x >= tx0 + 2 &&
      x <= tx0 + 5 &&
      y >= bY - 26 &&
      y <= bY - 19 &&
      !(y === bY - 26 && (x === tx0 + 2 || x === tx0 + 5)),
    () => WIN + 3,
  )
  g.box(tx0 + 3, bY - 13, tx0 + 6, bY - 8, WIN + 5)
  const ctop = bY - 48
  const cbase = bY - 31
  const ccx = tx0 + 4.5
  g.shape(
    tx0 - 3,
    ctop,
    tx1 + 3,
    cbase,
    (x, y) =>
      y >= ctop &&
      y <= cbase &&
      Math.abs(x - ccx) <= 7.5 * ((y - ctop + 1) / (cbase - ctop + 1)) ** 1.5,
    (x, y) => ((y - ctop) % 4 === 3 && (x + y) % 2 === 0 ? INK : SHADE),
  )
  const poleX = Math.round(ccx)
  g.line(poleX, ctop - 1, poleX, ctop - 6, INK)

  // lantern and fence
  g.line(hx + 32, bY - 9, hx + 32, bY - 1, INK)
  g.box(hx + 31, bY - 13, hx + 33, bY - 10, WIN + 4)
  g.set(hx + 32, bY - 14, INK)
  for (let x = hx + 36; x <= hx + 52; x++) {
    if ((x - hx) % 4 === 0) g.line(x, bY - 5, x, bY - 1, INK)
    g.set(x, bY - 4, INK)
    g.set(x, bY - 2, INK)
  }

  // winding path from the door
  for (let y = bY; y < ROWS; y++) {
    const k = y - bY
    const cx = hx + 13.5 + k * k * 0.12
    const half = 2 + k * 0.45
    for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) g.set(x, y, FILL)
    g.set(cx - half, y, INK)
    g.set(cx + half, y, INK)
  }

  // foreground bush
  tree(hx - 26, ROWS + 1, 4)

  // pond with reeds
  if (hasPond) {
    g.shape(
      pc - prx - 1,
      pcy - 4,
      pc + prx + 1,
      pcy + 4,
      (x, y) => ((x - pc) / prx) ** 2 + ((y - pcy) / 3.6) ** 2 <= 1,
      () => WATER,
    )
    for (const [dx, h] of [
      [-prx + 1, 5],
      [-prx + 3, 7],
      [prx - 2, 6],
    ]) {
      const x = pc + dx
      g.line(x, pcy - 1, x, pcy - h + 2, INK)
      g.rect(x, pcy - h, 1, 2, SOLID)
    }
  }

  // beach: pebbles and a couple of rocks on the sand, then the sea
  for (let i = 0; i < (cols - bx) * 0.8; i++) {
    const x = bx - 2 + Math.floor(r() * (cols - bx + 2))
    const y = Math.floor(nearHill(x) + 2 + r() * (ROWS - nearHill(x)))
    if (x < shore(y) - 3 && g.get(x, y) === FILL) g.set(x, y, INK)
  }
  const rock = (x: number, y: number, w: number) => {
    g.shape(
      x - w,
      y - w,
      x + w,
      y,
      (px, py) => py <= y && ((px - x) / w) ** 2 + ((py - y) / (w * 0.75)) ** 2 <= 1,
      (px) => (px > x ? SHADE : FILL),
    )
  }
  rock(Math.round(shore(ROWS - 4) - 7), ROWS - 4, 3)
  rock(Math.round(shore(60) - 4), 60, 2)
  g.shape(
    bx,
    H,
    cols + 1,
    ROWS - 1,
    (x, y) => y >= H && x >= shore(y),
    () => SEA,
  )

  const stars = Array.from({ length: Math.round(cols / 8) }, () => ({
    x: Math.floor(r() * cols),
    y: -PAD + 2 + Math.floor(r() * (PAD + 32)),
    sp: 0.25 + r() * 0.6,
    ph: r() * 6.28,
    big: r() < 0.18,
  }))
  const flies = Array.from({ length: Math.max(6, Math.round(cols / 30)) }, () => ({
    x: r() * (bx - 10),
    y: 48 + r() * 18,
    ph: r() * 6.28,
  }))
  const clouds = Array.from({ length: Math.max(2, Math.round(cols / 170)) }, (_, i) => {
    const s = 2.5 + r() * 1.5
    return {
      x: (i + r() * 0.6) * (cols / Math.max(2, Math.round(cols / 170))),
      y: -PAD + 6 + Math.floor(r() * (PAD + 8)),
      v: 0.25 + r() * 0.25,
      puffs: [
        [0, 0, s],
        [s * 1.3, -s * 0.5, s * 1.25],
        [s * 2.7, 0, s * 1.05],
        [s * 1.4, s * 0.5, s],
      ] as [number, number, number][],
    }
  })

  return {
    grid: g,
    sky: { x: Math.min(cols - 10, Math.round(bx + beachW * 0.6)), y: -10 },
    chimney: { x: hx + 21.5, y: bY - 37 },
    flag: { x: poleX, y: ctop - 6 },
    pond: { x: pc, y: pcy, rx: prx },
    yard: { x0: yardX0, x1: yardX1 },
    sea: { H, x0: bx + 13, k: shoreK },
    stars,
    flies,
    clouds,
  }
}

function buildTables() {
  if (P_TABLE.length) return
  for (let l = 0; l <= LEVELS; l++) {
    const n = l / LEVELS
    const p = new Float32Array(TYPES)
    p[INK] = 1 - smooth(0.4, 0.75, n)
    p[FILL] = smooth(0.2, 0.65, n)
    p[WATER] = p[FILL]
    p[SEA] = p[FILL]
    p[SHADE] = 0.5 + 0.38 * n
    p[LSHADE] = 0.2 + 0.68 * n
    p[SOLID] = 1.01
    p[BRIGHT] = 0
    for (let i = 0; i < 6; i++) p[WIN + i] = n >= WIN_ON[i] ? 0 : 1.01
    P_TABLE.push(p)
    const sky = new Float32Array(TOTAL)
    for (let y = 0; y < TOTAL; y++) sky[y] = n // flat sky: no dithered horizon glow
    SKY_TABLE.push(sky)
  }
}

function parseColor(s: string): [number, number, number] | null {
  s = s.trim()
  let m = s.match(/^#([0-9a-f]{3})$/i)
  if (m) return [...m[1]].map((c) => parseInt(c + c, 16)) as [number, number, number]
  m = s.match(/^#([0-9a-f]{6})/i)
  if (m)
    return [0, 2, 4].map((i) => parseInt(m![1].slice(i, i + 2), 16)) as [number, number, number]
  m = s.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i)
  if (m) return [+m[1], +m[2], +m[3]]
  return null
}

const lum = ([r, g, b]: [number, number, number]) => 0.2126 * r + 0.7152 * g + 0.0722 * b
const abgr = ([r, g, b]: [number, number, number]) => ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0

function mount(host: HTMLElement): () => void {
  host.innerHTML = ""
  host.setAttribute("role", "img")
  host.setAttribute(
    "aria-label",
    "Animated pixel-art village: a timber house with a little tower among hills, trees and a pond",
  )
  const canvas = document.createElement("canvas")
  host.appendChild(canvas)
  const ctx = canvas.getContext("2d")!
  const off = document.createElement("canvas")
  const octx = off.getContext("2d")!

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const isNight = () => document.documentElement.getAttribute("saved-theme") === "dark"

  let W = 0
  let dpr = 1
  let cols = 0
  let scene: Scene | null = null
  let frame: Grid | null = null
  let img: ImageData | null = null
  let view = new Uint32Array(0)
  let darkC = abgr([20, 16, 33])
  let lightC = abgr([251, 248, 239])
  let n = isNight() ? 1 : 0
  let target = n
  let t = 0
  let raf = 0
  let lastTs = 0
  let acc = 0
  let visible = true
  let smoke: { x: number; y: number; age: number }[] = []
  let smokeTimer = 0
  let animals: Animal[] = []

  function makeAnimals(sc: Scene): Animal[] {
    const { x0, x1 } = sc.yard
    const w = x1 - x0
    const mk = (kind: Kind, f0: number, f1: number, y: number, speed: number): Animal => ({
      kind,
      x: x0 + (w * (f0 + f1)) / 2 - ANIMAL_W[kind] / 2,
      y,
      dir: Math.random() < 0.5 ? -1 : 1,
      lo: x0 + w * f0,
      hi: x0 + w * f1,
      speed,
      walking: false,
      timer: Math.random() * 3,
      step: 0,
      busy: false,
    })
    return [mk("cow", 0.3, 1.0, 66, 3), mk("chicken", 0.0, 0.6, 68, 7)]
  }
  let colLevel = new Uint8Array(0)
  buildTables()

  function readColors() {
    const cs = getComputedStyle(document.documentElement)
    const a = parseColor(cs.getPropertyValue("--light")) ?? [251, 248, 239]
    const b = parseColor(cs.getPropertyValue("--dark")) ?? [20, 16, 33]
    const [lo, hi] = lum(a) < lum(b) ? [a, b] : [b, a]
    darkC = abgr(lo)
    lightC = abgr(hi)
  }

  function resize() {
    W = canvas.clientWidth || W || 600
    dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(HEIGHT * dpr)
    const c = Math.max(60, Math.floor(W / S))
    if (c !== cols) {
      cols = c
      scene = buildScene(cols)
      frame = new Grid(cols, TOTAL, PAD)
      off.width = cols
      off.height = TOTAL
      img = octx.createImageData(cols, TOTAL)
      view = new Uint32Array(img.data.buffer)
      smoke = []
      animals = makeAnimals(scene)
    }
    render()
  }

  function update(dt: number) {
    t += dt
    if (n !== target) {
      const step = dt / FADE_SECONDS
      n = n < target ? Math.min(target, n + step) : Math.max(target, n - step)
    }
    if (!scene) return
    smokeTimer -= dt
    if (smokeTimer <= 0) {
      smokeTimer = 1.3
      smoke.push({ x: scene.chimney.x, y: scene.chimney.y, age: 0 })
    }
    for (const s of smoke) {
      s.age += dt
      s.y -= 4 * dt
      s.x += (2.2 + Math.sin(s.age * 1.5) * 1.2) * dt
    }
    smoke = smoke.filter((s) => s.age < 9 && s.y > -PAD - 4)

    for (const a of animals) {
      a.timer -= dt
      if (a.timer <= 0) {
        const chick = a.kind === "chicken"
        a.walking = Math.random() < (chick ? 0.55 : 0.4)
        if (a.walking && Math.random() < 0.5) a.dir = -a.dir
        a.timer = chick ? 0.5 + Math.random() * 1.5 : 1.5 + Math.random() * 3.5
      }
      if (a.walking) {
        a.x += a.dir * a.speed * dt
        a.step += a.speed * dt
        const max = Math.max(a.lo, a.hi - ANIMAL_W[a.kind])
        if (a.x < a.lo) {
          a.x = a.lo
          a.dir = 1
        } else if (a.x > max) {
          a.x = max
          a.dir = -1
        }
        a.busy = false
      } else {
        a.busy =
          a.kind === "chicken" ? Math.sin(t * 9 + a.lo) > 0.1 : Math.sin(t * 0.6 + a.lo) > 0.2
      }
    }
  }

  function compose() {
    const sc = scene!
    const f = frame!
    f.d.fill(SKY)

    // stars (behind everything; invisible by day)
    if (n > 0.3) {
      for (const s of sc.stars) {
        const tw = Math.sin(t * s.sp + s.ph)
        if (tw < -0.35) continue
        f.set(s.x, s.y, BRIGHT)
        if (s.big && tw > 0.55) {
          f.set(s.x - 1, s.y, BRIGHT)
          f.set(s.x + 1, s.y, BRIGHT)
          f.set(s.x, s.y - 1, BRIGHT)
          f.set(s.x, s.y + 1, BRIGHT)
        }
      }
    }

    const { x: mx, y: my } = sc.sky
    // sun: solid ring + turning rays (vanishes at night)
    if (n < 1) {
      for (let y = my - 10; y <= my + 10; y++) {
        for (let x = mx - 10; x <= mx + 10; x++) {
          const d = Math.hypot(x - mx, y - my)
          if (Math.abs(d - 5) < 0.6) f.set(x, y, SOLID)
        }
      }
      for (let k = 0; k < 8; k++) {
        const a = t * 0.1 + (k * Math.PI) / 4
        for (const rr of [7.5, 8.6]) f.set(mx + Math.cos(a) * rr, my + Math.sin(a) * rr, SOLID)
      }
    }
    // moon: bright crescent (vanishes by day)
    if (n > 0) {
      for (let y = my - 7; y <= my + 7; y++) {
        for (let x = mx - 7; x <= mx + 7; x++) {
          const inA = Math.hypot(x - mx, y - my) <= 5.6
          const inB = Math.hypot(x - mx - 2.6, y - my + 1.6) <= 4.9
          if (inA && !inB) f.set(x, y, BRIGHT)
        }
      }
    }

    // clouds
    const span = cols + 40
    for (const c of sc.clouds) {
      const cx = ((((c.x + t * c.v) % span) + span) % span) - 20
      const cy = c.y
      const inside = (x: number, y: number) =>
        y <= cy + c.puffs[0][2] * 0.6 &&
        c.puffs.some(([dx, dy, pr]) => (x - cx - dx) ** 2 + (y - cy - dy) ** 2 <= pr * pr)
      f.shape(cx - 5, cy - 6, cx + 16, cy + 5, inside, () => FILL)
    }

    // birds crossing now and then (solid, so only visible by day)
    if (n < 0.6) {
      const cycle = t % 45
      if (cycle < 32) {
        const bx = (cycle / 32) * (cols + 20) - 10
        for (let i = 0; i < 3; i++) {
          const x = bx - i * 5
          const y = 4 + i * 2 + Math.sin(t * 0.8 + i) * 1.2
          const up = Math.floor(t * 3 + i) % 2 === 0
          f.set(x, y, SOLID)
          f.set(x - 1, y - (up ? 1 : 0), SOLID)
          f.set(x + 1, y - (up ? 1 : 0), SOLID)
        }
      }
    }

    // static scenery on top
    const st = sc.grid.d
    const fd = f.d
    const base = PAD * cols
    for (let i = 0; i < st.length; i++) if (st[i] !== NONE) fd[base + i] = st[i]

    // farm animals, back to front
    for (const a of animals) {
      const ox = Math.round(a.x)
      const oy = a.y
      const w = ANIMAL_W[a.kind]
      // local coords face right; mirror when walking left
      // collect pixels first so we can clear a 1px halo around the silhouette
      const px: [number, number, number][] = []
      const put = (lx: number, ly: number, ty: number) =>
        px.push([a.dir > 0 ? ox + lx : ox + (w - 2) - lx, oy + ly, ty])
      const box = (x0: number, y0: number, x1: number, y1: number, fill: number) => {
        for (let ly = y0; ly <= y1; ly++)
          for (let lx = x0; lx <= x1; lx++)
            put(lx, ly, lx === x0 || lx === x1 || ly === y0 || ly === y1 ? INK : fill)
      }
      const stride = a.walking && Math.floor(a.step / 1.5) % 2 === 1 ? 1 : 0

      // filled, outlined blob in local coords
      const blob = (
        x0: number,
        y0: number,
        x1: number,
        y1: number,
        inside: (x: number, y: number) => boolean,
        fill: (x: number, y: number) => number,
      ) => {
        for (let ly = y0; ly <= y1; ly++)
          for (let lx = x0; lx <= x1; lx++) {
            if (!inside(lx, ly)) continue
            const edge =
              !inside(lx - 1, ly) ||
              !inside(lx + 1, ly) ||
              !inside(lx, ly - 1) ||
              !inside(lx, ly + 1)
            put(lx, ly, edge ? INK : fill(lx, ly))
          }
      }
      const roundRect =
        (x0: number, y0: number, x1: number, y1: number) => (x: number, y: number) =>
          x >= x0 &&
          x <= x1 &&
          y >= y0 &&
          y <= y1 &&
          !((x === x0 || x === x1) && (y === y0 || y === y1))

      if (a.kind === "cow") {
        for (const lx of [2, 4, 10, 12]) {
          const sx = lx === 2 || lx === 10 ? stride : -stride
          for (let ly = -3; ly <= -1; ly++) put(lx + sx, ly, INK)
          put(lx + sx, 0, SOLID)
        }
        // body with big holstein patches
        blob(0, -10, 13, -4, roundRect(0, -10, 13, -4), (x, y) =>
          (x - 3) ** 2 / 4 + (y + 8) ** 2 / 2 <= 1.6 || (x - 9) ** 2 / 3 + (y + 6) ** 2 / 2 <= 1.4
            ? SOLID
            : FILL,
        )
        put(6, -3, SOLID) // udder
        put(7, -3, SOLID)
        for (let ly = -9; ly <= -6; ly++) put(-1, ly, INK) // tail
        put(-1, -5, SOLID)
        put(-2, -5, SOLID)
        // head, lowered to the grass while grazing
        const hy = a.busy ? 5 : 0
        blob(12, -13 + hy, 17, -6 + hy, roundRect(12, -13 + hy, 17, -6 + hy), (x, y) =>
          y >= -8 + hy ? LSHADE : FILL,
        )
        put(15, -11 + hy, SOLID) // eye
        put(16, -8 + hy, SOLID) // nostril
        put(11, -12 + hy, SOLID) // ear
        put(13, -14 + hy, INK) // horns
        put(16, -14 + hy, INK)
      } else if (a.kind === "pig") {
        for (const lx of [2, 4, 7, 9]) {
          const sx = lx < 6 ? stride : -stride
          put(lx + sx, -1, INK)
          put(lx + sx, 0, SOLID)
        }
        blob(
          -1,
          -9,
          12,
          -1,
          (x, y) => ((x - 5.5) / 5.8) ** 2 + ((y + 4.6) / 3.5) ** 2 <= 1,
          () => FILL,
        )
        const hy = a.busy ? 2 : 0 // nose down, sniffing
        blob(
          7,
          -9 + hy,
          14,
          -2 + hy,
          (x, y) => (x - 10.5) ** 2 + (y + 5.5 - hy) ** 2 <= 8,
          () => FILL,
        )
        blob(
          12,
          -7 + hy,
          14,
          -4 + hy,
          (x, y) => x >= 12 && x <= 14 && y >= -7 + hy && y <= -4 + hy,
          () => FILL,
        )
        put(13, -6 + hy, SOLID) // nostrils
        put(13, -5 + hy, SOLID)
        put(11, -7 + hy, SOLID) // eye
        put(9, -9 + hy, SOLID) // floppy ear
        put(10, -9 + hy, SOLID)
        put(10, -8 + hy, SOLID)
        put(-1, -6, INK) // curly tail
        put(-2, -7, INK)
        put(-1, -8, INK)
        put(-2, -9, INK)
      } else {
        const sprite = a.walking
          ? stride
            ? CHICKEN_STEP
            : CHICKEN_UP
          : a.busy
            ? CHICKEN_PECK
            : CHICKEN_UP
        const top = -sprite.length + 1
        sprite.forEach((row, ly) => {
          for (let lx = 0; lx < row.length; lx++) {
            const ch = row[lx]
            if (ch !== ".") put(lx, top + ly, SPRITE_TYPES[ch])
          }
        })
      }
      for (const [x, y] of px)
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ])
          f.set(x + dx, y + dy, FILL)
      for (const [x, y, ty] of px) f.set(x, y, ty)
    }

    // chimney smoke
    for (const s of smoke) {
      const rad = 1.3 + s.age * 0.6
      // older puffs dissolve with an ordered dither
      const fade = Math.max(0, (s.age / 5 - 0.5) * 2)
      const inside = (x: number, y: number) => (x - s.x) ** 2 + (y - s.y) ** 2 <= rad * rad
      for (let y = Math.floor(s.y - rad - 1); y <= s.y + rad + 1; y++) {
        for (let x = Math.floor(s.x - rad - 1); x <= s.x + rad + 1; x++) {
          if (!inside(x, y) || x < 0 || y < -PAD || x >= cols || y >= ROWS) continue
          if (BAYER[(y & 7) * 8 + (x & 7)] < fade) continue
          const edge =
            !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)
          fd[(y + PAD) * cols + x] = edge ? INK : FILL
        }
      }
    }

    // waving flag
    const { x: fx, y: fy } = sc.flag
    const wave = Math.floor(t * 3) % 2
    const rowsA = wave ? [5, 4, 2] : [4, 5, 3]
    rowsA.forEach((len, j) => {
      for (let i = 1; i <= len; i++) f.set(fx + i, fy + j, INK)
    })

    // pond ripples and moon reflection
    const { x: px, y: py, rx } = sc.pond
    const isWater = (x: number, y: number) => sc.grid.get(Math.round(x), Math.round(y)) === WATER
    for (let i = 0; i < 4; i++) {
      const y = py - 1 + (i % 3)
      const x = px + Math.sin(t * 0.5 + i * 1.9) * rx * 0.6
      for (let k = 0; k < 2 + (i % 2); k++) if (isWater(x + k, y)) f.set(x + k, y, INK)
    }

    // the sea: rolling wave dashes, foam washing up the sand, a little sailboat
    const { H, x0, k: sk } = sc.sea
    const isSea = (x: number, y: number) => sc.grid.get(Math.round(x), Math.round(y)) === SEA
    for (let j = 0; j < 5; j++) {
      const y = H + 3 + Math.round(j * j * 0.9 + j * 2)
      if (y >= ROWS) break
      const len = 2 + j
      const gap = 9 + j * 3
      const off = (t * (0.5 + j * 0.25)) % gap
      for (let x = Math.floor(x0 - gap + off + j * 5); x < cols; x += gap)
        for (let i = 0; i < len; i++) if (isSea(x + i, y)) f.set(x + i, y, INK)
    }
    for (let y = H + 2; y < ROWS; y++) {
      const wash = 1.5 + 1.5 * Math.sin(t * 0.4 - y * 0.25)
      f.set(x0 + (y - H) * sk - wash - 1.5, y, INK)
    }
    if (cols - x0 > 24) {
      const bxb = Math.round(x0 + (cols - x0) * 0.4 + Math.sin(t * 0.05) * 5)
      const byb = H + 6 + (Math.floor(t * 0.6) % 2)
      for (let i = -4; i <= 4; i++) f.set(bxb + i, byb, INK)
      for (let i = -3; i <= 3; i++) f.set(bxb + i, byb + 1, SOLID)
      for (let j = 1; j <= 9; j++) f.set(bxb, byb - j, INK)
      f.shape(
        bxb + 1,
        byb - 9,
        bxb + 7,
        byb - 1,
        (x, y) => x > bxb && y >= byb - 9 && y <= byb - 1 && x - bxb <= (y - (byb - 10)) * 0.65,
        () => FILL,
      )
    }
    // moon path on the water at night, sun glints by day
    for (let j = 2; j <= 16; j += 2) {
      if (n > 0.3) {
        const len = Math.max(0, 3 - j / 6) + ((Math.floor(t * 0.9) + j) % 2)
        for (let k = -len; k <= len; k++) if (isSea(mx + k, H + j)) f.set(mx + k, H + j, BRIGHT)
      }
      if (n < 0.5 && j % 4 === 2) {
        const gx = mx + Math.round(Math.sin(t * 0.6 + j) * 2)
        if (isSea(gx, H + j)) {
          f.set(gx, H + j, SOLID)
          f.set(gx + 1, H + j, SOLID)
        }
      }
    }

    // fireflies at night
    if (n > 0.4) {
      for (const fl of sc.flies) {
        if (Math.sin(t * 1.8 + fl.ph * 3) < 0.15) continue
        f.set(fl.x + Math.sin(t * 0.6 + fl.ph) * 5, fl.y + Math.cos(t * 0.8 + fl.ph) * 2, BRIGHT)
      }
    }
  }

  function render() {
    if (!scene || !frame || !img) return
    compose()

    // night sweeps in from the moon's side (right) and recedes the same way
    if (colLevel.length !== cols) colLevel = new Uint8Array(cols)
    for (let x = 0; x < cols; x++) {
      const local =
        n <= 0 ? 0 : n >= 1 ? 1 : smooth(0, 1, (n * (1 + SWEEP) - (1 - x / cols)) / SWEEP)
      colLevel[x] = Math.round(local * LEVELS)
    }
    const candle = Math.sin(t * 13) + Math.sin(t * 7.3) > 1.75

    const fd = frame.d
    for (let y = 0; y < TOTAL; y++) {
      const brow = (y & 7) * 8
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x
        const ty = fd[i]
        const lv = colLevel[x]
        let prob = ty === SKY ? SKY_TABLE[lv][y] : P_TABLE[lv][ty]
        if (candle && ty === WIN + 3) prob = 1.01
        view[i] = BAYER[brow + (x & 7)] < prob ? darkC : lightC
      }
    }
    octx.putImageData(img, 0, 0)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, HEIGHT)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(off, 0, 0, cols * S, TOTAL * S)
  }

  function shouldRun() {
    return visible && !document.hidden && (!reduced || n !== target)
  }

  function loop(ts: number) {
    raf = 0
    const dt = Math.min(0.1, Math.max(0, (ts - lastTs) / 1000))
    lastTs = ts
    acc += dt
    if (acc >= 1 / FPS) {
      update(acc)
      acc = 0
      render()
    }
    if (shouldRun()) raf = requestAnimationFrame(loop)
  }

  function kick() {
    if (raf || !shouldRun()) return
    lastTs = performance.now()
    raf = requestAnimationFrame(loop)
  }

  const onTheme = () => {
    readColors()
    target = isNight() ? 1 : 0
    if (reduced) n = target
    render()
    kick()
  }
  const onVisibility = () => kick()

  readColors()
  const ro = new ResizeObserver(() => resize())
  ro.observe(canvas)
  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting)
    kick()
  })
  io.observe(canvas)
  document.addEventListener("themechange", onTheme)
  document.addEventListener("visibilitychange", onVisibility)
  resize()
  kick()

  return () => {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    ro.disconnect()
    io.disconnect()
    document.removeEventListener("themechange", onTheme)
    document.removeEventListener("visibilitychange", onVisibility)
  }
}

document.addEventListener("nav", () => {
  for (const host of document.querySelectorAll<HTMLElement>(".pixel-village")) {
    window.addCleanup(mount(host))
  }
})
