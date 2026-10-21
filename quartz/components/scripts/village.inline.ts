// 1-bit pixel-art village for the home page.
// light theme = day with a sun, dark theme = night with a moon (lit windows, stars, fireflies).
// mount it anywhere in markdown with: <div class="pixel-village"></div>

const S = 2 // css px per art pixel
const ROWS = 70 // rows of landscape
const PAD = 35 // extra rows of open sky above it
const TOTAL = ROWS + PAD
const HEIGHT = TOTAL * S
const FPS = 30

// what each pixel of the static scene belongs to, so a click knows what it hit
const TAG = {
  ground: 1,
  mountain: 2,
  tree: 3,
  house: 4,
  tower: 5,
  chimney: 6,
  lantern: 7,
  road: 8,
  fields: 9,
  windmill: 10,
  river: 11,
  pond: 12,
  beach: 13,
  lighthouse: 14,
  sea: 15,
}

// 3x5 pixel font for the little speech bubbles
const FONT: Record<string, string[]> = {
  A: ["010", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  D: ["110", "101", "101", "101", "110"],
  G: ["011", "100", "101", "101", "011"],
  H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"],
  K: ["101", "101", "110", "101", "101"],
  M: ["101", "111", "111", "101", "101"],
  N: ["110", "101", "101", "101", "101"],
  O: ["010", "101", "101", "101", "010"],
  W: ["101", "101", "111", "111", "101"],
  Y: ["101", "101", "010", "010", "010"],
  "!": ["010", "010", "010", "000", "010"],
}

// optional extras: flip any of these to true to bring it back
const SHOW = {
  chapel: false, // chapel with bell tower and graveyard
  camp: false, // well, campfire and someone sitting by it (+ castle ruins on the hill behind)
  sheep: false, // sheep in a pasture left of the house
  deer: false, // deer at the edge of the forest
  travelers: false, // knight and covered cart on the road
}
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
const RIVER = 9 // like FILL, marks the river for its current
const WIN = 16 // WIN + i: window i, dark by day, lit at night
// house x3, tower x2, lantern, chapel, lighthouse lamp, windmill
const WIN_ON = [0.5, 0.62, 0.7, 0.56, 0.4, 0.78, 0.6, 0.45, 0.52]
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
  ids: Uint8Array | null = null // per-pixel TAG, only on the static scene
  tag = 0 // TAG stamped by every set() while non-zero
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
    const i = y * this.w + x
    this.d[i] = t
    if (this.ids && this.tag) this.ids[i] = this.tag
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
  hop?: number // time of the last click-hop
}

type Put = (lx: number, ly: number, ty: number) => void
type BlobFn = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  inside: (x: number, y: number) => boolean,
  fill: (x: number, y: number) => number,
) => void
const inRect = (x0: number, y0: number, x1: number, y1: number) => (x: number, y: number) =>
  x >= x0 && x <= x1 && y >= y0 && y <= y1

// a horse facing right, origin at the bottom middle of its body
function drawHorse(put: Put, blob: BlobFn, stride: number) {
  for (const lx of [-4, -2, 3, 5]) {
    const sx = lx === -4 || lx === 3 ? stride : -stride
    for (let ly = -2; ly <= 0; ly++) put(lx + sx, ly, INK)
  }
  blob(-7, -9, 7, -2, (x, y) => (x / 6.4) ** 2 + ((y + 5.5) / 2.8) ** 2 <= 1, () => FILL)
  blob(
    4,
    -13,
    10,
    -5,
    (x, y) => (x >= 4 && x <= 6 && y >= -10 && y <= -5) || (x >= 6 && x <= 9 && y >= -13 && y <= -10),
    () => FILL,
  )
  put(8, -12, SOLID) // eye
  put(4, -11, SOLID) // mane
  put(5, -12, SOLID)
  put(-7, -7, INK) // tail
  put(-8, -6, INK)
  put(-8, -5, INK)
  put(-8, -4, INK)
}

type Extras = {
  mill?: { x: number; y: number }
  river?: { y0: number; c: Float32Array; w: Float32Array }
  fire?: { x: number; y: number }
  lamp?: { x: number; y: number }
  owl: { x: number; y: number }
  door: { x: number; y: number }
  lantern: { x: number; y: number }
  road: { x0: number; x1: number; y: number; travel: boolean }
  sheep: { x: number; y: number; ph: number }[]
  deer: { x: number; y: number }[]
}

type Scene = {
  extras: Extras
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
  g.ids = new Uint8Array(cols * ROWS)
  const r = rng(1337)
  // responsive layout, left to right: [forest] [house] [meadow] [pond] [forest] [beach].
  // the house, meadow and beach always fit; the rest only appear when there's room,
  // so narrow screens get a simpler scene instead of a squashed one
  const beachW = Math.max(52, Math.min(140, Math.round(cols * 0.2)))
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
  // forest by the beach is capped so very wide screens get open hills and mountains instead
  const hasLighthouse = beachW >= 64
  const rfEnd = bx - (hasLighthouse ? 14 : 4)
  const rfStart = Math.max(pondEnd + 2, rfEnd - 70)
  const hasRightForest = rfEnd - rfStart >= 16
  const H = 49 // horizon
  const shoreK = 0.9
  const shore = (y: number) => bx + 13 + (y - H) * shoreK
  const dip = (x: number, start: number, k: number) => Math.max(0, x - start) * k
  const pcy = 63

  // landmark zones across the open middle: picked by priority, then laid out left to right
  const openL = pondEnd + 6
  const openR = (hasRightForest ? rfStart : bx - 4) - 6
  const ZONE_W: Record<string, number> = { river: 36, fields: 60, chapel: 42, camp: 36 }
  const picked: string[] = []
  let usedW = 0
  for (const k of ["river", "fields", "chapel", "camp"]) {
    if ((k === "chapel" && !SHOW.chapel) || (k === "camp" && !SHOW.camp)) continue
    if (usedW + ZONE_W[k] <= openR - openL) {
      picked.push(k)
      usedW += ZONE_W[k]
    }
  }
  const order = ["fields", "river", "chapel", "camp"].filter((k) => picked.includes(k))
  const zgap = (openR - openL - usedW) / (order.length + 1)
  const zones: Record<string, [number, number]> = {}
  {
    let zx = openL + zgap
    for (const k of order) {
      zones[k] = [Math.round(zx), Math.round(zx + ZONE_W[k])]
      zx += ZONE_W[k] + zgap
    }
  }
  const lfEnd = hx - 36 >= 12 ? Math.min(hx - 36, 44) : 0
  const sheepZone: [number, number] | null =
    SHOW.sheep && houseL - 6 - (lfEnd + 4) >= 30 ? [lfEnd + 4, houseL - 6] : null
  const castleX = zones.camp ? Math.round((zones.camp[0] + zones.camp[1]) / 2) : -1
  const deerX = SHOW.deer && hasRightForest ? rfStart - 9 : -1

  const farHill = (x: number) =>
    45 + 3 * Math.sin(x * 0.035 + 1) + 2 * Math.sin(x * 0.09 + 0.5) + dip(x, bx - 14, 0.35)
  const nearHill = (x: number) =>
    54 + 2 * Math.sin(x * 0.05 + 3) + 1.2 * Math.sin(x * 0.13) + dip(x, bx - 4, 0.12)

  // mountains
  g.tag = TAG.mountain
  const peakSpots = [
    [hx - 40, 26, 0.9],
    [yardX0 + 12, 29, 1.1],
    [yardX1 + 14, 22, 0.85],
  ]
  // more mountains across the open ground on wide screens
  for (let x = pondEnd + 34; x < rfStart - 24; x += 95 + Math.floor(r() * 30)) {
    peakSpots.push([x, 21 + Math.floor(r() * 9), 0.85 + r() * 0.3])
  }
  const peaks = peakSpots
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
  g.tag = TAG.ground
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

  // castle ruins on a far hill
  if (castleX > 0) {
    const cb = Math.round(farHill(castleX)) + 3
    const wall = (x0: number, x1: number, h: number) => {
      g.box(x0, cb - h, x1, cb, LSHADE)
      for (let x = x0; x <= x1; x += 2) g.set(x, cb - h - 1, INK)
    }
    wall(castleX - 15, castleX - 7, 5)
    wall(castleX - 1, castleX + 9, 4) // the gap between them is the ruined part
    g.box(castleX - 7, cb - 13, castleX - 2, cb, LSHADE)
    for (let x = castleX - 7; x <= castleX - 2; x += 2) g.set(x, cb - 14, INK)
    g.rect(castleX - 5, cb - 10, 1, 3, SOLID) // arrow slit
    g.set(castleX + 11, cb, INK) // rubble
    g.set(castleX + 12, cb - 1, INK)
    g.set(castleX + 13, cb, INK)
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
  g.tag = TAG.tree
  const forests: [number, number][] = []
  const forest = (from: number, to: number) => {
    forests.push([from - 3, to + 3])
    for (let x = from; x < to; x += 4 + Math.floor(r() * 3)) {
      pine(x, Math.round(farHill(x)) + 6, 12 + Math.floor(r() * 8))
    }
  }
  if (lfEnd) forest(0, lfEnd)
  if (hasRightForest) forest(rfStart, rfEnd)

  // trees on the hills, kept clear of the house and pond
  // keep the house, the animals' meadow, the pond and the forests clear
  const blocked = (x: number) =>
    (x > houseL - 4 && x < yardX1 + 4) ||
    (hasPond && Math.abs(x - pc) < prx + 8) ||
    x > bx - 8 ||
    forests.some(([a, b]) => x > a && x < b) ||
    Object.values(zones).some(([a, b]) => x > a - 6 && x < b + 6) ||
    (sheepZone !== null && x > sheepZone[0] - 4 && x < sheepZone[1] + 4) ||
    (deerX > 0 && Math.abs(x - deerX) < 10)
  for (let x = 6, i = 0; x < bx - 8; x += 34 + Math.floor(r() * 26)) {
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
  g.tag = TAG.chimney
  g.box(hx + 20, bY - 34, hx + 23, bY - 20, FILL)
  for (let y = bY - 32; y < bY - 26; y += 2) g.set(hx + 21 + ((y >> 1) & 1), y, INK)
  g.rect(hx + 19, bY - 35, 6, 1, INK)

  // timber-framed body
  g.tag = TAG.house
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
  g.tag = TAG.tower
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
  g.tag = TAG.lantern
  g.line(hx + 32, bY - 9, hx + 32, bY - 1, INK)
  g.box(hx + 31, bY - 13, hx + 33, bY - 10, WIN + 4)
  g.set(hx + 32, bY - 14, INK)
  g.tag = TAG.ground
  for (let x = hx + 36; x <= hx + 52; x++) {
    if ((x - hx) % 4 === 0) g.line(x, bY - 5, x, bY - 1, INK)
    g.set(x, bY - 4, INK)
    g.set(x, bY - 2, INK)
  }

  // winding path from the door
  g.tag = TAG.road
  for (let y = bY; y < ROWS; y++) {
    const k = y - bY
    const cx = hx + 13.5 + k * k * 0.12
    const half = 2 + k * 0.45
    for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) g.set(x, y, FILL)
    g.set(cx - half, y, INK)
    g.set(cx + half, y, INK)
  }

  // ---- landmarks ----
  let mill: Extras["mill"]
  if (zones.fields) {
    // farm fields: furrowed rows on the left patch, plowed diagonals on the right, hay bales
  g.tag = TAG.fields
    const [f0, f1] = zones.fields
    const top = 58
    const bot = 65
    const mid = Math.round((f0 + f1) / 2)
    // rows of little crops, spaced wider toward the front for a bit of depth
    for (let y = top, k = 0; y <= bot; y += 2 + (k++ > 1 ? 1 : 0)) {
      g.rect(f0 + 2, y + 1, mid - f0 - 3, 1, FILL)
      for (let x = f0 + 2 + (k % 2); x < mid - 1; x += 2) g.set(x, y, INK)
    }
    for (let x = mid + 2; x < f1 - 3; x += 3) g.line(x, bot, x + 3, top, INK)
    const hay = (x: number, y: number) =>
      g.shape(x - 3, y - 3, x + 3, y, (px, py) => py <= y && (px - x) ** 2 + (py - y) ** 2 <= 7, (px) =>
        px > x ? SHADE : FILL,
      )
    hay(f0 - 2, 66)
    hay(f0 + 5, 66)
    // windmill at the back of the fields
  g.tag = TAG.windmill
    const wx = Math.round(f0 + (f1 - f0) * 0.74)
    const wb = top - 1
    const wt = wb - 15
    g.shape(
      wx - 5,
      wt,
      wx + 5,
      wb,
      (x, y) => y >= wt && y <= wb && Math.abs(x - wx) <= 2 + ((y - wt) * 2.2) / 15,
      () => FILL,
    )
    g.rect(wx - 1, wb - 3, 2, 3, SOLID)
    g.rect(wx, wt + 5, 1, 2, WIN + 8)
    g.shape(
      wx - 5,
      wt - 4,
      wx + 5,
      wt,
      (x, y) => y >= wt - 4 && y <= wt && Math.abs(x - wx) <= (y - (wt - 5)) * 0.9,
      () => SHADE,
    )
    mill = { x: wx, y: wt - 1 }
  }

  g.tag = TAG.ground
  if (zones.chapel) {
    // little chapel with a bell tower, and a graveyard
    const [c0] = zones.chapel
    const cb = 62
    const bx0 = c0 + 3
    const bx1 = c0 + 21
    g.box(bx0, cb - 8, bx1, cb, FILL)
    const rcx = (bx0 + bx1) / 2
    g.shape(
      bx0 - 2,
      cb - 17,
      bx1 + 2,
      cb - 8,
      (x, y) => y >= cb - 17 && y <= cb - 8 && Math.abs(x - rcx) <= (y - (cb - 18)) * 1.25,
      (x, y) => ((y - cb) % 3 === 0 && (x + y) % 2 === 0 ? INK : SHADE),
    )
    g.shape(
      c0 + 8,
      cb - 6,
      c0 + 10,
      cb - 3,
      (x, y) => x >= c0 + 8 && x <= c0 + 10 && y >= cb - 6 && y <= cb - 3 && !(y === cb - 6 && x !== c0 + 9),
      () => WIN + 6,
    )
    g.shape(
      c0 + 13,
      cb - 5,
      c0 + 16,
      cb,
      (x, y) => x >= c0 + 13 && x <= c0 + 16 && y >= cb - 5 && !(y === cb - 5 && (x === c0 + 13 || x === c0 + 16)),
      () => SOLID,
    )
    // bell tower with a spire and cross
    const tx = c0 + 23
    g.box(tx - 3, cb - 20, tx + 3, cb, FILL)
    g.box(tx - 1, cb - 18, tx + 1, cb - 15, SOLID)
    g.set(tx, cb - 16, INK) // bell
    g.shape(
      tx - 4,
      cb - 29,
      tx + 4,
      cb - 20,
      (x, y) => y >= cb - 29 && y <= cb - 20 && Math.abs(x - tx) <= (y - (cb - 30)) * 0.4,
      () => SHADE,
    )
    g.line(tx, cb - 30, tx, cb - 33, INK)
    g.line(tx - 1, cb - 32, tx + 1, cb - 32, INK)
    // graveyard
    for (let x = c0 + 27; x <= c0 + 40; x++) {
      if ((x - c0) % 3 === 0) g.line(x, cb - 2, x, cb + 1, INK)
      g.set(x, cb - 1, INK)
    }
    for (const gx of [c0 + 29, c0 + 33, c0 + 37]) {
      g.shape(
        gx - 1,
        cb + 1,
        gx + 1,
        cb + 4,
        (x, y) => Math.abs(x - gx) <= 1 && y >= cb + 1 && y <= cb + 4 && !(y === cb + 1 && x !== gx),
        () => FILL,
      )
    }
  }

  let fire: Extras["fire"]
  if (zones.camp) {
    // stone well and a campfire with someone sitting by it
    const [k0] = zones.camp
    g.box(k0 + 2, 60, k0 + 10, 64, LSHADE)
    for (let x = k0 + 4; x < k0 + 10; x += 3) g.set(x, 62, INK)
    g.line(k0 + 3, 59, k0 + 3, 52, INK)
    g.line(k0 + 9, 59, k0 + 9, 52, INK)
    g.line(k0 + 3, 53, k0 + 9, 53, INK)
    g.shape(
      k0,
      47,
      k0 + 12,
      51,
      (x, y) => y >= 47 && y <= 51 && Math.abs(x - (k0 + 6)) <= (y - 46) * 1.3,
      () => SHADE,
    )
    g.line(k0 + 6, 54, k0 + 6, 56, INK)
    g.rect(k0 + 5, 57, 3, 2, SOLID)
    const fx = k0 + 27
    const fy = 64
    g.line(fx - 3, fy, fx + 3, fy - 2, INK)
    g.line(fx - 3, fy - 2, fx + 3, fy, INK)
    g.set(fx - 5, fy, SOLID)
    g.set(fx + 5, fy, SOLID)
    const sitter = [".III..", "IFFI..", ".II...", "ISSI..", "ISSSI.", "ISSSSI", ".IIII."]
    const types: Record<string, number> = { I: INK, F: FILL, S: SHADE }
    sitter.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) if (row[i] !== ".") g.set(fx - 12 + i, fy - 7 + j, types[row[i]])
    })
    fire = { x: fx, y: fy - 2 }
  }

  let river: Extras["river"]
  if (zones.river) {
    // a river winding down from the far hills
  g.tag = TAG.river
    const rcx = (zones.river[0] + zones.river[1]) / 2
    const y0 = Math.round(farHill(rcx)) + 1
    const c = new Float32Array(ROWS)
    const w = new Float32Array(ROWS)
    for (let y = 0; y < ROWS; y++) {
      const k = Math.max(0, y - y0)
      c[y] = rcx + Math.sin(k * 0.2) * Math.min(6, 1 + k * 0.35) - 2
      w[y] = 1.3 + k * 0.24
    }
    g.shape(
      zones.river[0],
      y0,
      zones.river[1],
      ROWS - 1,
      (x, y) => y >= y0 && y < ROWS && Math.abs(x - c[Math.min(ROWS - 1, Math.max(0, y))]) <= w[Math.min(ROWS - 1, Math.max(0, y))],
      () => RIVER,
    )
    // ripple texture so it reads as water, not a path
    for (let y = y0 + 2; y < ROWS; y += 2) {
      const ci = c[y]
      const wi = w[y]
      for (let x = Math.ceil(ci - wi + 1); x < ci + wi - 1; x++)
        if ((x + y * 3) % 6 < 3 && g.get(x, y) === RIVER) g.set(x, y, INK)
    }
    river = { y0, c, w }
  }

  // a dirt road along the bottom, from the house to the beach, with a bridge over the river
  g.tag = TAG.road
  const roadY = 67
  const roadX0 = hx + 16
  const roadX1 = bx + 6
  const bridge = river ? [Math.floor(river.c[roadY] - river.w[roadY] - 4), Math.ceil(river.c[roadY] + river.w[roadY] + 4)] : null
  for (let x = roadX0; x <= roadX1; x++) {
    const fade = x > bx - 6 && (x + 1) % 3 !== 0
    if (!fade && (x * 7) % 11 !== 0) g.set(x, roadY, INK)
    for (let y = roadY + 1; y < ROWS; y++) g.set(x, y, FILL)
    if ((x * 13) % 17 === 0) g.set(x, ROWS - 1, INK)
  }
  if (bridge) {
    g.tag = TAG.river
    const [b0, b1] = bridge
    for (let x = b0; x <= b1; x++) {
      g.set(x, roadY - 2, INK) // rail
      if ((x - b0) % 4 === 0) g.line(x, roadY - 3, x, roadY - 1, INK)
      g.set(x, roadY, INK)
      for (let y = roadY + 1; y < ROWS; y++) g.set(x, y, (x - b0) % 3 === 0 ? INK : FILL) // planks
    }
    g.rect(b0 - 1, roadY - 4, 2, 4, SOLID)
    g.rect(b1, roadY - 4, 2, 4, SOLID)
  }

  // foreground bush
  g.tag = TAG.tree
  tree(hx - 26, ROWS + 1, 4)

  // pond with reeds
  g.tag = TAG.pond
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
  g.tag = TAG.beach
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

  // rocky cliffs where the hills meet the beach, with a lighthouse on top
  for (const [dx, w] of [
    [-9, 4],
    [-3, 5],
    [3, 3],
  ]) {
    const x = bx + dx
    rock(x, Math.round(nearHill(x)) + 4, w)
  }
  let lamp: Extras["lamp"]
  if (hasLighthouse) {
    g.tag = TAG.lighthouse
    const lx = bx - 4
    const ly = Math.round(nearHill(lx)) + 1
    g.shape(
      lx - 4,
      ly - 20,
      lx + 4,
      ly,
      (x, y) => y >= ly - 20 && y <= ly && Math.abs(x - lx) <= 2 + (y - (ly - 20)) / 14,
      (_x, y) => (Math.floor((ly - y) / 4) % 2 === 1 ? SOLID : FILL),
    )
    g.rect(lx - 4, ly - 21, 9, 1, INK) // gallery
    g.box(lx - 2, ly - 25, lx + 2, ly - 22, WIN + 7) // lamp room
    g.shape(
      lx - 3,
      ly - 29,
      lx + 3,
      ly - 26,
      (x, y) => y >= ly - 29 && y <= ly - 26 && Math.abs(x - lx) <= (y - (ly - 30)) * 0.8,
      () => SHADE,
    )
    g.set(lx, ly - 30, INK)
    lamp = { x: lx, y: ly - 24 }
  }
  g.tag = TAG.sea
  g.shape(
    bx,
    H,
    cols + 1,
    ROWS - 1,
    (x, y) => y >= H && x >= shore(y),
    () => SEA,
  )
  g.tag = 0

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

  const extras: Extras = {
    mill,
    river,
    fire,
    lamp,
    owl: { x: hx - 17, y: 47 },
    door: { x: hx + 13, y: bY - 1 },
    lantern: { x: hx + 32, y: bY - 12 },
    road: { x0: roadX0 + 6, x1: bx - 4, y: ROWS - 1, travel: SHOW.travelers && bx - 4 - roadX0 >= 120 },
    sheep: sheepZone
      ? [0.2, 0.55, 0.85].map((fr, i) => ({
          x: sheepZone[0] + (sheepZone[1] - sheepZone[0] - 10) * fr,
          y: [63, 66, 64][i],
          ph: i * 2.1,
        }))
      : [],
    deer: deerX > 0 ? [{ x: deerX, y: Math.round(nearHill(deerX)) + 6 }] : [],
  }

  return {
    extras,
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
    p[RIVER] = p[FILL]
    p[SHADE] = 0.5 + 0.38 * n
    p[LSHADE] = 0.2 + 0.68 * n
    p[SOLID] = 1.01
    p[BRIGHT] = 0
    for (let i = 0; i < WIN_ON.length; i++) p[WIN + i] = n >= WIN_ON[i] ? 0 : 1.01
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
    "Animated pixel-art village: a timber house with a little tower, a cow and a chicken, fields and a windmill, a river with a bridge, and a lighthouse by the sea",
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
  // click reactions
  type Particle = {
    x: number
    y: number
    vx: number
    vy: number
    g: number
    age: number
    life: number
    ty: number
    sway?: boolean
  }
  type Fx = { kind: string; t0: number; x: number; y: number; dur: number; text?: string; dir?: number; ref?: number }
  type Hit = { id: string; x0: number; y0: number; x1: number; y1: number; animal?: Animal; ref?: number }
  let particles: Particle[] = []
  let fxs: Fx[] = []
  let hits: Hit[] = []
  let millA = 0
  let millBoost = 0
  let sunA = 0
  let sunBoost = 0
  let moonFullUntil = -1
  let flagZip = -99
  let beamUntil = -1
  let dragonAt: { x: number; y: number } | null = null
  let travelers: { kind: "knight" | "cart"; x: number; dir: number; speed: number; step: number }[] = []

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
      const rd = scene.extras.road
      travelers = rd.travel
        ? [
            { kind: "knight", x: rd.x0 + (rd.x1 - rd.x0) * 0.25, dir: 1, speed: 4, step: 0 },
            { kind: "cart", x: rd.x0 + (rd.x1 - rd.x0) * 0.75, dir: -1, speed: 2.5, step: 0 },
          ]
        : []
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

    millA += dt * (0.35 + millBoost)
    millBoost *= Math.exp(-dt * 0.6)
    sunA += dt * (0.1 + sunBoost)
    sunBoost *= Math.exp(-dt * 0.9)
    for (const q of particles) {
      q.age += dt
      if (q.age < 0) continue
      q.vy += q.g * dt
      q.x += q.vx * dt + (q.sway ? Math.sin(q.age * 5) * 0.15 : 0)
      q.y += q.vy * dt
    }
    particles = particles.filter((q) => q.age < q.life)
    fxs = fxs.filter((e) => t - e.t0 < e.dur)

    const rd = scene.extras.road
    for (const tv of travelers) {
      tv.x += tv.dir * tv.speed * dt
      tv.step += tv.speed * dt
      const lo = rd.x0 + 26
      const hi = rd.x1 - 12
      if (tv.x < lo) {
        tv.x = lo
        tv.dir = 1
      } else if (tv.x > hi) {
        tv.x = hi
        tv.dir = -1
      }
    }

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
    hits = []

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
        const a = sunA + (k * Math.PI) / 4
        for (const rr of [7.5 + sunBoost * 0.5, 8.6 + sunBoost * 0.8])
          f.set(mx + Math.cos(a) * rr, my + Math.sin(a) * rr, SOLID)
      }
    }
    // moon: bright crescent (vanishes by day)
    if (n > 0) {
      for (let y = my - 7; y <= my + 7; y++) {
        for (let x = mx - 7; x <= mx + 7; x++) {
          const inA = Math.hypot(x - mx, y - my) <= 5.6
          const inB = Math.hypot(x - mx - 2.6, y - my + 1.6) <= 4.9
          if (inA && (!inB || t < moonFullUntil)) f.set(x, y, BRIGHT)
        }
      }
    }

    hits.push({ id: n < 0.5 ? "sun" : "moon", x0: mx - 9, y0: my - 9, x1: mx + 9, y1: my + 9 })

    // clouds
    const span = cols + 40
    for (const c of sc.clouds) {
      const cx = ((((c.x + t * c.v) % span) + span) % span) - 20
      const cy = c.y
      const inside = (x: number, y: number) =>
        y <= cy + c.puffs[0][2] * 0.6 &&
        c.puffs.some(([dx, dy, pr]) => (x - cx - dx) ** 2 + (y - cy - dy) ** 2 <= pr * pr)
      f.shape(cx - 5, cy - 6, cx + 16, cy + 5, inside, () => FILL)
      hits.push({ id: "cloud", x0: cx - 5, y0: cy - 6, x1: cx + 16, y1: cy + 5, ref: sc.clouds.indexOf(c) })
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

    // a dragon glides across the sky every couple of minutes
    dragonAt = null
    {
      const cyc = (t + 110) % 150
      if (cyc < 26) {
        const p = cyc / 26
        const dx = Math.round(cols + 30 - p * (cols + 70))
        const dy = Math.round(-PAD + 12 + Math.sin(t * 0.6) * 3)
        dragonAt = { x: dx, y: dy }
        hits.push({ id: "dragon", x0: dx - 5, y0: dy - 9, x1: dx + 24, y1: dy + 9 })
        const up = Math.floor(t * 2.2) % 2 === 0
        const set = (lx: number, ly: number) => f.set(dx + lx, dy + ly, INK)
        for (let i = 0; i <= 12; i++) {
          set(i, 0)
          if (i > 1 && i < 9) set(i, 1)
        }
        set(-1, -1)
        set(-2, -1)
        set(-3, 0)
        set(-1, 0)
        set(0, -2)
        for (let i = 0; i < 8; i++) set(13 + i, Math.round(Math.sin(i * 0.6 + t * 2) * 1.2 + i * 0.25))
        set(21, 2)
        set(22, 1)
        set(22, 3)
        for (let i = 0; i < 7; i++) {
          const wy = up ? -(i + 1) : i + 2
          for (let j = 0; j <= 6 - i; j++) set(4 + j + Math.round(i * 0.5), wy)
        }
      }
    }
    // shooting star now and then at night
    if (n > 0.6) {
      const ph = t % 17
      if (ph < 0.9) {
        const k = Math.floor(t / 17)
        const sx0 = ((k * 97) % Math.max(1, cols - 40)) + 10
        const sy0 = -PAD + 3 + ((k * 13) % 14)
        const p = ph / 0.9
        const hx2 = sx0 + p * 34
        const hy2 = sy0 + p * 13
        for (let i = 0; i < 8; i++) if (i % 2 === 0 || i < 3) f.set(hx2 - i * 1.3, hy2 - i * 0.5, BRIGHT)
      }
    }

    // static scenery on top
    const st = sc.grid.d
    const fd = f.d
    const base = PAD * cols
    for (let i = 0; i < st.length; i++) if (st[i] !== NONE) fd[base + i] = st[i]

    // generic figure: collects pixels, clears a 1px halo so it reads against the scenery, then draws.
    // local coords face right; dir < 0 mirrors it
    const fig = (
      ox: number,
      oy: number,
      dir: number,
      draw: (put: Put, blob: BlobFn) => void,
      halo = true,
    ) => {
      const pts: [number, number, number][] = []
      const put: Put = (lx, ly, ty) => pts.push([dir > 0 ? ox + lx : ox - lx, oy + ly, ty])
      const blob: BlobFn = (x0, y0, x1, y1, inside, fill) => {
        for (let ly = y0; ly <= y1; ly++)
          for (let lx = x0; lx <= x1; lx++) {
            if (!inside(lx, ly)) continue
            const edge =
              !inside(lx - 1, ly) || !inside(lx + 1, ly) || !inside(lx, ly - 1) || !inside(lx, ly + 1)
            put(lx, ly, edge ? INK : fill(lx, ly))
          }
      }
      draw(put, blob)
      if (halo)
        for (const [x, y] of pts) {
          f.set(x + 1, y, FILL)
          f.set(x - 1, y, FILL)
          f.set(x, y + 1, FILL)
          f.set(x, y - 1, FILL)
        }
      for (const [x, y, ty] of pts) f.set(x, y, ty)
    }
    const ex = sc.extras

    // river current
    if (ex.river) {
      const { y0, c, w } = ex.river
      const len = ROWS - y0
      for (let k = 0; k < 9; k++) {
        const y = y0 + Math.floor((t * 2.2 + k * 4.7) % len)
        const x = Math.round(c[y] + ((k % 3) - 1) * w[y] * 0.5)
        for (const dy of [0, 1]) if (sc.grid.get(x, y + dy) === RIVER) f.set(x, y + dy, INK)
      }
    }

    // windmill sails
    if (ex.mill) {
      const { x: mx0, y: my0 } = ex.mill
      for (let k = 0; k < 4; k++) {
        const a = millA + (k * Math.PI) / 2
        const ca = Math.cos(a)
        const sa = Math.sin(a)
        for (let d = 1; d <= 11; d++) {
          const x = mx0 + ca * d
          const y = my0 + sa * d
          f.set(x, y, INK)
          if (d >= 4) {
            f.set(x - sa, y + ca, FILL)
            f.set(x - 2 * sa, y + 2 * ca, INK)
          }
        }
      }
      f.set(mx0, my0, SOLID)
    }

    // campfire flames (and sparks at night)
    if (ex.fire) {
      const { x: fx2, y: fy2 } = ex.fire
      const h = 3 + Math.round(Math.sin(t * 7) + Math.sin(t * 11.3) * 0.8)
      for (let i = 0; i < h; i++) f.set(fx2 + Math.round(Math.sin(t * 9 + i * 1.7) * 0.7), fy2 - i, INK)
      const hl = 1 + Math.round(1 + Math.sin(t * 8.3 + 1))
      const hr = 1 + Math.round(1 + Math.sin(t * 6.1 + 2))
      for (let i = 0; i < hl; i++) f.set(fx2 - 1, fy2 - i, INK)
      for (let i = 0; i < hr; i++) f.set(fx2 + 1, fy2 - i, INK)
      if (n > 0.5) f.set(fx2 + Math.sin(t * 2.3) * 2, fy2 - 4 - ((t * 5) % 9), BRIGHT)
    }

    // sheep grazing in the pasture
    for (const sh of ex.sheep) {
      const sx = sh.x + Math.sin(t * 0.06 + sh.ph) * 5
      const dir = Math.cos(t * 0.06 + sh.ph) >= 0 ? 1 : -1
      const graze = Math.sin(t * 0.5 + sh.ph * 3) > 0 ? 2 : 0
      fig(Math.round(sx), sh.y, dir, (put, blob) => {
        for (const lx of [1, 5]) {
          put(lx, -1, SOLID)
          put(lx, 0, SOLID)
        }
        blob(
          -1,
          -8,
          9,
          -1,
          (x, y) =>
            (x - 1.5) ** 2 + (y + 3.5) ** 2 <= 5 ||
            (x - 4) ** 2 + (y + 4.6) ** 2 <= 6.8 ||
            (x - 6.2) ** 2 + (y + 3.5) ** 2 <= 5,
          () => FILL,
        )
        blob(7, -6 + graze, 10, -3 + graze, inRect(7, -6 + graze, 10, -3 + graze), () => SOLID)
      })
    }

    // a deer at the edge of the forest
    for (const d of ex.deer) {
      const graze = Math.sin(t * 0.3 + 1) > 0.3 ? 6 : 0
      fig(d.x, d.y, -1, (put, blob) => {
        for (const lx of [1, 2, 6, 7]) for (let ly = -3; ly <= 0; ly++) put(lx, ly, INK)
        blob(-1, -8, 9, -3, (x, y) => ((x - 4) / 5) ** 2 + ((y + 5.2) / 2.2) ** 2 <= 1, () => LSHADE)
        put(-1, -7, FILL)
        blob(7, -11 + graze, 9, -5, inRect(7, -11 + graze, 9, -5), () => LSHADE)
        blob(8, -13 + graze, 11, -10 + graze, inRect(8, -13 + graze, 11, -10 + graze), () => LSHADE)
        put(10, -12 + graze, SOLID)
        for (const [ax, ay] of [
          [8, -14],
          [8, -15],
          [7, -16],
          [9, -16],
          [10, -15],
          [10, -16],
          [11, -17],
        ])
          put(ax, ay + graze, INK)
      })
    }

    // a knight and a covered cart travelling the road
    for (const tv of travelers) {
      const stride = Math.floor(tv.step / 1.5) % 2
      fig(Math.round(tv.x), ex.road.y, tv.dir, (put, blob) => {
        drawHorse(put, blob, stride)
        if (tv.kind === "knight") {
          blob(-2, -15, 2, -8, inRect(-2, -15, 2, -8), () => SHADE)
          blob(-1, -19, 1, -15, inRect(-1, -19, 1, -15), () => FILL)
          put(0, -20, INK) // plume
          put(-1, -21, INK)
          put(1, -17, SOLID) // visor
          for (let i = 0; i <= 9; i++) put(2 + i, -11 - Math.round(i * 0.8), INK) // lance
          put(10, -20, SOLID) // pennant
          put(9, -20, SOLID)
          put(9, -21, SOLID)
          blob(-4, -14, -2, -9, inRect(-4, -14, -2, -9), () => SOLID) // shield
        } else {
          for (let x = -9; x >= -11; x--) put(x, -6, INK) // harness
          blob(-25, -10, -11, -4, inRect(-25, -10, -11, -4), () => FILL)
          for (let x = -24; x <= -12; x++) put(x, -7, INK)
          blob(
            -24,
            -17,
            -12,
            -10,
            (x, y) => y <= -10 && ((x + 18) / 6.5) ** 2 + ((y + 10) / 7) ** 2 <= 1,
            () => LSHADE,
          )
          for (const wx of [-22, -14]) {
            blob(wx - 3, -6, wx + 3, 0, (x, y) => (x - wx) ** 2 + (y + 3) ** 2 <= 7.5, () => FILL)
            const a = tv.step * 0.4
            put(wx + Math.round(Math.cos(a) * 1.5), -3 + Math.round(Math.sin(a) * 1.5), INK)
            put(wx, -3, SOLID)
          }
          blob(-12, -14, -10, -10, inRect(-12, -14, -10, -10), () => SHADE) // driver
          blob(-12, -17, -10, -15, inRect(-12, -17, -10, -15), () => FILL)
        }
      })
    }

    // an owl in the round tree at night
    if (n > 0.55) {
      const blink = t % 5 < 0.15
      fig(
        ex.owl.x,
        ex.owl.y,
        1,
        (put, blob) => {
          blob(-2, -3, 2, 3, (x, y) => (x / 2.4) ** 2 + (y / 3.2) ** 2 <= 1, () => SHADE)
          put(-2, -4, INK)
          put(2, -4, INK)
          put(-1, -1, blink ? INK : BRIGHT)
          put(1, -1, blink ? INK : BRIGHT)
        },
        false,
      )
      hits.push({ id: "owl", x0: ex.owl.x - 3, y0: ex.owl.y - 5, x1: ex.owl.x + 3, y1: ex.owl.y + 4 })
    }

    // the lighthouse beam sweeps around at night
    if (ex.lamp && n > 0.5) {
      const { x: lx, y: ly } = ex.lamp
      const c = Math.cos(t * 0.45)
      const len = Math.abs(c) * 60
      const side = c >= 0 ? 1 : -1
      for (let d = 4; d < len; d++) {
        const spread = d * 0.07
        if (d % 2 === 0) f.set(lx + side * d, ly - spread, BRIGHT)
        if (d % 2 === 1) f.set(lx + side * d, ly + spread, BRIGHT)
      }
    }

    // clicked lighthouse: the beam spins around, day or night
    if (ex.lamp && t < beamUntil) {
      const { x: lx, y: ly } = ex.lamp
      const a = (beamUntil - t) * 4
      for (const off of [0, Math.PI])
        for (let d = 4; d < 40; d += 2) f.set(lx + Math.cos(a + off) * d, ly + Math.sin(a + off) * d * 0.35, INK)
    }

    // farm animals, back to front
    for (const a of animals) {
      const ox = Math.round(a.x)
      const hopP = a.hop !== undefined ? (t - a.hop) / 0.5 : 1
      const oy = a.y - (hopP >= 0 && hopP < 1 ? Math.round(Math.sin(hopP * Math.PI) * 4) : 0)
      const w = ANIMAL_W[a.kind]
      // local coords face right; mirror when walking left
      // collect pixels first so we can clear a 1px halo around the silhouette
      const px: [number, number, number][] = []
      const put = (lx: number, ly: number, ty: number) =>
        px.push([a.dir > 0 ? ox + lx : ox + (w - 2) - lx, oy + ly, ty])
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
        blob(12, -13 + hy, 17, -6 + hy, roundRect(12, -13 + hy, 17, -6 + hy), (_x, y) =>
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
      let ax0 = Infinity
      let ay0 = Infinity
      let ax1 = -Infinity
      let ay1 = -Infinity
      for (const [x, y] of px) {
        ax0 = Math.min(ax0, x)
        ay0 = Math.min(ay0, y)
        ax1 = Math.max(ax1, x)
        ay1 = Math.max(ay1, y)
      }
      hits.push({ id: a.kind, x0: ax0, y0: ay0, x1: ax1, y1: ay1, animal: a })
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
    const { x: fx, y: fy0 } = sc.flag
    const zipP = (t - flagZip) / 1.6
    const fy = fy0 + (zipP >= 0 && zipP < 1 ? Math.round(Math.sin(zipP * Math.PI) * 12) : 0)
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
      hits.push({ id: "boat", x0: bxb - 5, y0: byb - 10, x1: bxb + 8, y1: byb + 2 })
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
    drawEffects()

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

  // ---- click reactions ----
  const burst = (
    x: number,
    y: number,
    count: number,
    o: { speed: [number, number]; angle?: [number, number]; g: number; life: number; ty?: number; delay?: number; sway?: boolean },
  ) => {
    for (let i = 0; i < count; i++) {
      const [a0, a1] = o.angle ?? [0, Math.PI * 2]
      const a = a0 + Math.random() * (a1 - a0)
      const sp = o.speed[0] + Math.random() * (o.speed[1] - o.speed[0])
      particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        g: o.g,
        age: -(Math.random() * (o.delay ?? 0)),
        life: o.life,
        ty: o.ty ?? INK,
        sway: o.sway,
      })
    }
  }
  const fx = (kind: string, x: number, y: number, dur: number, extra: Partial<Fx> = {}) =>
    fxs.push({ kind, t0: t, x, y, dur, ...extra })
  const say = (text: string, x: number, y: number) => {
    fxs = fxs.filter((e) => !(e.kind === "bubble" && Math.abs(e.x - x) < 12))
    fx("bubble", x, y, 1.8, { text })
  }

  function tagAt(x: number, y: number): number {
    const sc = scene!
    const ids = sc.grid.ids!
    let best = 0
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      const gx = Math.round(x) + dx
      const gy = Math.round(y) + dy
      if (gx < 0 || gy < 0 || gx >= cols || gy >= ROWS) continue
      const id = ids[gy * cols + gx]
      if (!id) continue
      if (dx === 0 && dy === 0 && id !== TAG.ground && id !== TAG.road) return id
      if (!best || ((best === TAG.ground || best === TAG.road) && id !== TAG.ground && id !== TAG.road)) best = id
    }
    return best
  }

  function react(x: number, y: number) {
    const sc = scene!
    const ex = sc.extras
    for (let i = hits.length - 1; i >= 0; i--) {
      const h = hits[i]
      if (x < h.x0 - 1 || x > h.x1 + 1 || y < h.y0 - 1 || y > h.y1 + 1) continue
      switch (h.id) {
        case "cow":
          h.animal!.hop = t
          say("MOO", (h.x0 + h.x1) / 2, h.y0 - 2)
          return
        case "chicken":
          h.animal!.hop = t
          say("BAWK", (h.x0 + h.x1) / 2, h.y0 - 2)
          burst((h.x0 + h.x1) / 2, h.y0 + 2, 6, { speed: [4, 9], angle: [-Math.PI, 0], g: 6, life: 1.6, sway: true })
          return
        case "boat":
          say("AHOY", (h.x0 + h.x1) / 2, h.y0 - 1)
          return
        case "owl":
          say("HOO", (h.x0 + h.x1) / 2, h.y0 - 1)
          return
        case "cloud":
          fx("rain", x, y, 3.5, { ref: h.ref })
          return
        case "sun":
          sunBoost = 7
          return
        case "moon":
          moonFullUntil = t + 4
          return
        case "dragon":
          if (dragonAt)
            burst(dragonAt.x - 3, dragonAt.y, 30, { speed: [18, 32], angle: [Math.PI - 0.3, Math.PI + 0.3], g: 0, life: 0.5, delay: 0.4 })
          return
      }
    }

    switch (tagAt(x, y)) {
      case TAG.house:
        fx("villager", ex.door.x, ex.door.y, 3)
        say("HI!", ex.door.x, ex.door.y - 14)
        break
      case TAG.tower:
        flagZip = t
        say("DING", sc.flag.x, sc.flag.y - 3)
        break
      case TAG.chimney:
        for (let i = 0; i < 4; i++) smoke.push({ x: sc.chimney.x + i * 0.6, y: sc.chimney.y - i * 2.5, age: i * 0.25 })
        break
      case TAG.lantern:
        burst(ex.lantern.x, ex.lantern.y, 7, { speed: [1, 4], g: 0, life: 3, sway: true })
        break
      case TAG.windmill:
        millBoost = 7
        break
      case TAG.fields:
        for (let i = 0; i < 3; i++) fx("bird", x + i * 2, y - 1, 3.2, { dir: i % 2 ? -1 : 1, t0: t + i * 0.15 })
        break
      case TAG.tree:
        fx("bird", x, y, 3.2, { dir: Math.random() < 0.5 ? -1 : 1 })
        burst(x, y, 6, { speed: [1, 4], angle: [0, Math.PI], g: 2, life: 2.5, sway: true })
        break
      case TAG.river:
        fx("fish", x, y, 1, { dir: Math.random() < 0.5 ? -1 : 1 })
        burst(x, y, 5, { speed: [5, 9], angle: [-Math.PI * 0.85, -Math.PI * 0.15], g: 30, life: 0.6 })
        break
      case TAG.pond:
        fx("ring", x, y, 1.6, { ref: 9 })
        fx("ring", x, y, 1.6, { ref: 9, t0: t + 0.35 })
        burst(x, y, 4, { speed: [4, 7], angle: [-Math.PI * 0.8, -Math.PI * 0.2], g: 30, life: 0.5 })
        break
      case TAG.sea:
        fx("whale", x, Math.max(y, sc.sea.H + 4), 3)
        burst(x, Math.max(y, sc.sea.H + 4) - 3, 22, {
          speed: [16, 24],
          angle: [-Math.PI / 2 - 0.25, -Math.PI / 2 + 0.25],
          g: 28,
          life: 1.3,
          delay: 1,
        })
        break
      case TAG.beach:
        fx("crab", x, Math.round(y), 5)
        break
      case TAG.lighthouse:
        beamUntil = t + 3
        break
      case TAG.mountain: {
        const dir = Math.random() < 0.5 ? -1 : 1
        burst(x, y, 16, { speed: [6, 12], angle: dir > 0 ? [0.2, 0.7] : [Math.PI - 0.7, Math.PI - 0.2], g: 6, life: 1.6, delay: 0.8 })
        break
      }
      case TAG.road:
        burst(x, y, 8, { speed: [3, 7], angle: [-Math.PI, 0], g: 10, life: 0.7 })
        break
      case TAG.ground:
        if (fxs.filter((e) => e.kind === "flower").length >= 14) fxs.splice(fxs.findIndex((e) => e.kind === "flower"), 1)
        fx("flower", Math.round(x), Math.round(y), 15)
        break
      default:
        // empty sky: fireworks
        burst(x, y, 28, { speed: [10, 16], g: 5, life: 1.3 })
        burst(x, y, 10, { speed: [3, 6], g: 2, life: 0.9 })
    }
  }

  function drawEffects() {
    const f = frame!
    const sc = scene!
    const span = cols + 40
    const isWet = (x: number, y: number) => {
      const v = sc.grid.get(Math.round(x), Math.round(y))
      return v === WATER || v === RIVER || v === SEA
    }
    const bubbles: Fx[] = []
    for (const e of fxs) {
      const s2 = t - e.t0
      if (s2 < 0) continue
      const p = s2 / e.dur
      switch (e.kind) {
        case "bubble":
          bubbles.push(e)
          break
        case "ring": {
          const r = 1 + p * (e.ref ?? 8)
          for (let k = 0; k < 40; k++) {
            const a = (k / 40) * Math.PI * 2
            const x = e.x + Math.cos(a) * r
            const y = e.y + Math.sin(a) * r * 0.35
            if (isWet(x, y)) f.set(x, y, INK)
          }
          break
        }
        case "bird": {
          const x = e.x + (e.dir ?? 1) * s2 * 22
          const y = e.y - s2 * 10 - s2 * s2 * 3
          const up = Math.floor(t * 8) % 2
          f.set(x, y, INK)
          f.set(x - 1, y - up, INK)
          f.set(x + 1, y - up, INK)
          break
        }
        case "rain": {
          const c = sc.clouds[e.ref ?? 0]
          if (!c) break
          const cx = ((((c.x + t * c.v) % span) + span) % span) - 20
          for (let i = 0; i < 10; i++) {
            const rx = cx - 3 + ((i * 5) % 18)
            const ry = c.y + 4 + ((t * 28 + i * 7.3) % 26)
            f.set(rx, ry, INK)
            f.set(rx, ry + 1, INK)
          }
          break
        }
        case "whale": {
          const rise = Math.sin(Math.min(1, p) * Math.PI)
          for (let dx = -5; dx <= 5; dx++) {
            const top = e.y - Math.round(Math.sqrt(Math.max(0, 25 - dx * dx)) * 0.5 * rise)
            for (let y = top + 1; y <= e.y; y++) f.set(e.x + dx, y, FILL)
            if (top < e.y) f.set(e.x + dx, top, INK)
          }
          if (rise > 0.6) f.set(e.x - 3, e.y - 1, SOLID) // eye
          break
        }
        case "crab": {
          const x = Math.round(e.x + Math.sin(s2 * 2.5) * 8)
          const y = e.y
          const step = Math.floor(t * 8) % 2
          const rows = ["I...I", ".ISI.", "IFFFI", step ? ".I.I." : "I.I.I"]
          rows.forEach((row, j) => {
            for (let i = 0; i < 5; i++) if (row[i] !== ".") f.set(x - 2 + i, y - 3 + j, row[i] === "I" ? INK : row[i] === "S" ? SOLID : FILL)
          })
          break
        }
        case "flower": {
          const h = Math.min(3, Math.floor(s2 / 0.12))
          for (let i = 1; i <= h; i++) f.set(e.x, e.y - i, INK)
          if (h >= 3) {
            f.set(e.x + 1, e.y - 2, INK) // leaf
            f.set(e.x, e.y - 5, INK)
            f.set(e.x - 1, e.y - 4, INK)
            f.set(e.x + 1, e.y - 4, INK)
            f.set(e.x, e.y - 3, INK)
            f.set(e.x, e.y - 4, FILL)
          }
          break
        }
        case "villager": {
          // the door swings open and someone steps out to wave
          for (let y = e.y - 9; y <= e.y; y++) for (let x = e.x - 1; x <= e.x + 2; x++) f.set(x, y, FILL)
          const wave = Math.floor(t * 6) % 2
          const px = e.x
          f.set(px, e.y - 8, INK)
          f.set(px + 1, e.y - 8, INK)
          f.set(px - 1, e.y - 7, INK)
          f.set(px + 2, e.y - 7, INK)
          f.set(px, e.y - 6, INK)
          f.set(px + 1, e.y - 6, INK)
          for (let y = e.y - 5; y <= e.y - 2; y++) {
            f.set(px, y, SHADE)
            f.set(px + 1, y, SHADE)
          }
          f.set(px - 1, e.y - 4, INK)
          f.set(px + 2, e.y - (wave ? 6 : 5), INK)
          f.set(px + 3, e.y - (wave ? 7 : 5), INK)
          f.set(px, e.y - 1, INK)
          f.set(px + 1, e.y - 1, INK)
          f.set(px, e.y, INK)
          f.set(px + 1, e.y, INK)
          break
        }
        case "fish": {
          const d = e.dir ?? 1
          const x = Math.round(e.x + d * p * 10)
          const y = Math.round(e.y - Math.sin(p * Math.PI) * 9)
          f.set(x, y, INK)
          f.set(x + d, y, INK)
          f.set(x - d, y, INK)
          f.set(x - 2 * d, y - 1, INK)
          f.set(x - 2 * d, y + 1, INK)
          break
        }
      }
    }
    for (const q of particles) if (q.age >= 0) f.set(q.x, q.y, q.ty)
    // speech bubbles on top
    for (const e of bubbles) {
      const text = e.text ?? ""
      const w = text.length * 4 - 1
      const x0 = Math.round(e.x - w / 2) - 2
      const x1 = x0 + w + 3
      const y1 = Math.round(e.y) - 2
      const y0 = y1 - 8
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const corner = (x === x0 || x === x1) && (y === y0 || y === y1)
          if (corner) continue
          f.set(x, y, x === x0 || x === x1 || y === y0 || y === y1 ? INK : FILL)
        }
      f.set(Math.round(e.x), y1 + 1, INK)
      f.set(Math.round(e.x), y1, FILL)
      ;[...text].forEach((ch, i) => {
        const glyph = FONT[ch]
        if (!glyph) return
        glyph.forEach((row, j) => {
          for (let k = 0; k < 3; k++) if (row[k] === "1") f.set(x0 + 2 + i * 4 + k, y0 + 2 + j, INK)
        })
      })
    }
  }

  function shouldRun() {
    return (
      visible &&
      !document.hidden &&
      (!reduced || n !== target || fxs.length > 0 || particles.length > 0 || millBoost > 0.05 || sunBoost > 0.05)
    )
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
  const onClick = (e: MouseEvent) => {
    if (!scene) return
    const rect = canvas.getBoundingClientRect()
    react((e.clientX - rect.left) / S, (e.clientY - rect.top) / S - PAD)
    kick()
  }
  canvas.style.cursor = "pointer"
  canvas.addEventListener("click", onClick)

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
    canvas.removeEventListener("click", onClick)
    document.removeEventListener("visibilitychange", onVisibility)
  }
}

document.addEventListener("nav", () => {
  for (const host of document.querySelectorAll<HTMLElement>(".pixel-village")) {
    window.addCleanup(mount(host))
  }
})
