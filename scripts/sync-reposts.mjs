#!/usr/bin/env node
// Saves Substack restacks and X reposts into content/clippings as
// Obsidian Web Clipper–style notes. No dependencies (Node 18+).
//
// Env:
//   SUBSTACK_HANDLE   Substack handle (default: brianrahadi)
//   X_HANDLE          your X handle; posts by you are skipped (default: brianrahadi)
//   X_RSS_FEED_URL    rss.app feed URL for x.com/<handle> (optional; X skipped if unset)
//   DRY_RUN=1         print what would be written, write nothing

import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..")
const CLIP_DIR = path.join(ROOT, "content", "clippings")
const STATE_FILE = path.join(ROOT, ".github", "sync-reposts", "seen.json")
const SUBSTACK_HANDLE = process.env.SUBSTACK_HANDLE || "brianrahadi"
const X_HANDLE = (process.env.X_HANDLE || "brianrahadi").toLowerCase()
const X_FEED = process.env.X_RSS_FEED_URL || ""
const DRY = process.env.DRY_RUN === "1"
const UA = "Mozilla/5.0 (compatible; quartz-clippings-sync/1.0)"

// ---------- helpers ----------
const today = () => new Date().toISOString().slice(0, 10)
const day = (d) => {
  const t = new Date(d)
  return isNaN(t) ? today() : t.toISOString().slice(0, 10)
}
const yq = (s) => JSON.stringify(String(s ?? "").replace(/\s+/g, " ").trim())
const safeName = (s) =>
  String(s)
    .replace(/[\\/:*?"<>|#^\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180) || "Untitled"
const clip = (s, n) => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim()
  return t.length > n ? t.slice(0, n) : t
}
const normUrl = (u) => {
  try {
    const x = new URL(u)
    x.hostname = x.hostname.replace(/^(www\.|mobile\.)?(twitter|x)\.com$/, "x.com")
    x.search = ""
    x.hash = ""
    return x.toString().replace(/\/$/, "")
  } catch {
    return String(u)
  }
}
const decode = (s) =>
  String(s ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&")

// Minimal HTML -> markdown for tweet bodies.
function htmlToMd(html) {
  let s = decode(html)
  const imgs = []
  s = s.replace(/<img[^>]*src="([^"]+)"[^>]*>/gi, (_, src) => {
    imgs.push(`![Image](${src})`)
    return ""
  })
  s = s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|blockquote|li)>/gi, "\n\n")
    .replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
      const t = text.replace(/<[^>]+>/g, "").trim()
      if (!t) return ""
      if (/^[@#]/.test(t) || t === href || /^https?:\/\//.test(t)) return t
      return `[${t}](${href})`
    })
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  return [s, imgs.join(" ")].filter(Boolean).join("\n\n")
}

async function getJson(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } })
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} for ${url}`)
  return r.json()
}
async function getText(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA } })
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} for ${url}`)
  return r.text()
}

// ---------- dedupe ----------
function loadSeen() {
  const seen = new Set()
  try {
    for (const u of JSON.parse(fs.readFileSync(STATE_FILE, "utf8"))) seen.add(u)
  } catch {}
  // Anything you already clipped by hand counts as seen too.
  for (const f of fs.readdirSync(CLIP_DIR)) {
    if (!f.endsWith(".md")) continue
    const m = fs.readFileSync(path.join(CLIP_DIR, f), "utf8").match(/^source:\s*"?([^"\n]+)"?/m)
    if (m) seen.add(normUrl(m[1].trim()))
  }
  return seen
}

function writeClip(c, seen, written) {
  const key = normUrl(c.source)
  if (seen.has(key)) return
  let base = safeName(c.title)
  let file = path.join(CLIP_DIR, `${base}.md`)
  if (fs.existsSync(file) || written.has(file)) {
    base = `${base} ${c.uid}`
    file = path.join(CLIP_DIR, `${base}.md`)
  }
  const fm = [
    "---",
    `title: ${yq(c.title)}`,
    `source: ${yq(c.source)}`,
    "author:",
    ...c.authors.map((a) => `  - ${yq(`[[${a}]]`)}`),
    `published: ${c.published}`,
    `created: ${c.created}`,
    `description: ${yq(clip(c.description, 140))}`,
    "tags:",
    '  - "clippings"',
    `via: ${yq(c.via)}`,
    "---",
  ].join("\n")
  const body = `${fm}\n${c.body.trim()}\n`
  seen.add(key)
  written.add(file)
  if (DRY) console.log(`\n--- would write ${path.relative(ROOT, file)}\n${body}`)
  else fs.writeFileSync(file, body)
  console.log(`+ ${path.relative(ROOT, file)}`)
}

// ---------- Substack ----------
async function substackClips() {
  const profile = await getJson(
    `https://substack.com/api/v1/user/${encodeURIComponent(SUBSTACK_HANDLE)}/public_profile`,
  )
  const feed = await getJson(`https://substack.com/api/v1/reader/feed/profile/${profile.id}`)
  const out = []
  for (const item of feed.items ?? []) {
    const ctx = item.context ?? {}
    const restacked = day(ctx.timestamp)
    if (ctx.type === "post_restack" && item.post) {
      const p = item.post
      const authors = (p.publishedBylines ?? []).map((b) => b.name).filter(Boolean)
      if (!authors.length && item.publication?.name) authors.push(item.publication.name)
      const excerpt = (p.truncated_body_text || p.description || "").trim()
      const body = [
        p.subtitle ? `*${p.subtitle.trim()}*` : "",
        excerpt ? excerpt.replace(/^/gm, "> ") : "",
        p.cover_image ? `![](${p.cover_image})` : "",
        `[Read on Substack →](${p.canonical_url})`,
      ]
      out.push({
        uid: String(p.id),
        title: p.title || "Substack post",
        source: p.canonical_url,
        authors: authors.length ? authors : ["Unknown"],
        published: day(p.post_date),
        created: restacked,
        description: p.subtitle || p.description || excerpt,
        body: body.filter(Boolean).join("\n\n"),
        via: "substack restack",
      })
    } else if (ctx.type === "comment_restack" && item.comment) {
      const c = item.comment
      const handle = c.handle || ctx.users?.[0]?.handle || "substack"
      const url = `https://substack.com/@${handle}/note/c-${c.id}`
      const imgs = (c.attachments ?? [])
        .map((a) => a.imageUrl || a.image_url)
        .filter(Boolean)
        .map((u) => `![Image](${u})`)
      out.push({
        uid: String(c.id),
        title: `Note by ${c.name || handle} on Substack`,
        source: url,
        authors: [c.name || handle],
        published: day(c.date),
        created: restacked,
        description: c.body,
        body: [String(c.body ?? "").trim(), imgs.join(" ")].filter(Boolean).join("\n\n"),
        via: "substack restack",
      })
    }
  }
  return out
}

// ---------- X via rss.app ----------
async function xClips() {
  if (!X_FEED) {
    console.log("X_RSS_FEED_URL not set; skipping X.")
    return []
  }
  const xml = await getText(X_FEED)
  const tag = (block, name) => {
    const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"))
    return m ? decode(m[1]).trim() : ""
  }
  const out = []
  for (const [, block] of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const link = tag(block, "link") || tag(block, "guid")
    const m = normUrl(link).match(/x\.com\/([^/]+)\/status\/(\d+)/)
    if (!m) continue
    const [, author, id] = m
    // Your own posts are not reposts. Reposts link to the original author's status.
    if (author.toLowerCase() === X_HANDLE) continue
    const html = tag(block, "description") || tag(block, "content:encoded")
    let text = htmlToMd(html) || tag(block, "title")
    text = text.replace(/^RT\s+(by\s+)?@\w+:?\s*/i, "")
    out.push({
      uid: id.slice(-6),
      title: `Post by @${author} on X`,
      source: `https://x.com/${author}/status/${id}`,
      authors: [`@${author}`],
      published: day(tag(block, "pubDate")),
      created: today(),
      description: text.replace(/!\[[^\]]*\]\([^)]*\)/g, ""),
      body: text,
      via: "x repost",
    })
  }
  return out
}

// ---------- main ----------
const seen = loadSeen()
const written = new Set()
let failed = 0
for (const [name, fn] of [
  ["Substack", substackClips],
  ["X", xClips],
]) {
  try {
    const clips = await fn()
    console.log(`${name}: ${clips.length} reposts in feed`)
    for (const c of clips) writeClip(c, seen, written)
  } catch (e) {
    failed++
    console.error(`${name} failed: ${e.message}`)
  }
}
if (!DRY) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true })
  fs.writeFileSync(STATE_FILE, JSON.stringify([...seen].sort(), null, 2) + "\n")
}
console.log(`${written.size} new clipping(s).`)
if (failed === 2) process.exit(1)
