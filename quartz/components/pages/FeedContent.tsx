import { Element, Root } from "hast"
import { ComponentChildren } from "preact"
import { QuartzPluginData } from "../../plugins/vfile"
import { FullSlug, normalizeHastElement } from "../../util/path"
import { htmlToJsx } from "../../util/jsx"
import { feedAnchor, isFeedItem } from "../../util/feed"

// a folder (e.g. clippings) rendered as one scrollable, social-feed style page:
// every note becomes a card, newest first, and nothing links to a separate page.

const SOCIAL_HOSTS = new Set(["x.com", "twitter.com", "bsky.app", "threads.net", "mastodon.social"])

function hostOf(url: string | undefined): string | undefined {
  if (!url) return undefined
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return undefined
  }
}

// frontmatter author is usually a list of wikilinks: ["[[@kepano]]"]
function authorOf(fm: Record<string, unknown> | undefined): string | undefined {
  const raw = fm?.author
  const first = Array.isArray(raw) ? raw[0] : raw
  if (typeof first !== "string" || !first.trim()) return undefined
  return first.replace(/^\[\[|\]\]$/g, "").split("|").pop()!.trim()
}

function savedDate(f: QuartzPluginData): Date | undefined {
  const raw = f.frontmatter?.created as unknown
  const d = raw ? new Date(raw as string) : f.dates?.created
  return d && !isNaN(d.getTime()) ? d : undefined
}

function formatDay(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

function avatarFor(host: string | undefined, author: string | undefined): string | undefined {
  // real profile pictures for social posts, site favicons for everything else
  if (author?.startsWith("@") && (host === "x.com" || host === "twitter.com")) {
    return `https://unavatar.io/x/${author.slice(1)}?fallback=false`
  }
  return host ? `https://www.google.com/s2/favicons?domain=${host}&sz=128` : undefined
}

function FeedCard({ page, feedSlug }: { page: QuartzPluginData; feedSlug: FullSlug }) {
  const fm = page.frontmatter as Record<string, unknown> | undefined
  const source = typeof fm?.source === "string" ? fm.source : undefined
  const host = hostOf(source)
  const author = authorOf(fm)
  const isSocial = !!host && SOCIAL_HOSTS.has(host)
  const name = author ?? host ?? "unknown"
  const avatar = avatarFor(host, author)
  const saved = savedDate(page)
  const anchor = feedAnchor(page.slug!)
  const title = page.frontmatter?.title

  let body: ComponentChildren = null
  const ast = page.htmlAst as Root | undefined
  if (ast && ast.children.length > 0) {
    // re-base relative links from the clipping's own path onto the feed page
    const children = ast.children.map((child) =>
      child.type === "element"
        ? normalizeHastElement(child as Element, feedSlug, page.slug! as FullSlug)
        : child,
    )
    body = htmlToJsx(page.filePath!, { type: "root", children } as Root) as ComponentChildren
  } else if (page.description) {
    body = <p>{page.description}</p>
  }

  return (
    <article class="feed-card" id={anchor} data-host={host}>
      <div class="feed-card-head">
        <span class="feed-avatar" aria-hidden="true">
          <span class="feed-avatar-letter">{name.replace(/^@/, "").charAt(0).toUpperCase()}</span>
          {avatar && (
            <img
              src={avatar}
              alt=""
              loading="lazy"
              referrerpolicy="no-referrer"
              {...{ onerror: "this.remove()" }}
            />
          )}
        </span>
        <span class="feed-who">
          <span class="feed-author">{name}</span>
          <span class="feed-meta">
            {host && author && <span class="feed-host">{host}</span>}
            {host && author && saved && <span class="feed-dot">·</span>}
            {saved && (
              <a class="feed-date" href={`#${anchor}`} title="Link to this clipping">
                <time datetime={saved.toISOString()}>{formatDay(saved)}</time>
              </a>
            )}
          </span>
        </span>
      </div>
      {!isSocial && title && (
        <h2 class="feed-title">
          {source ? (
            <a href={source} class="external" target="_blank" rel="noopener noreferrer">
              {title}
            </a>
          ) : (
            title
          )}
        </h2>
      )}
      {body && <div class="feed-body">{body}</div>}
      {source && (
        <div class="feed-card-foot">
          <a href={source} class="external feed-source" target="_blank" rel="noopener noreferrer">
            {isSocial ? "View post" : `Read on ${host}`} ↗
          </a>
        </div>
      )}
    </article>
  )
}

export function FeedContent({
  allFiles,
  feedSlug,
}: {
  allFiles: QuartzPluginData[]
  feedSlug: FullSlug
}) {
  const folder = feedSlug.replace(/\/index$/, "") + "/"
  const items = allFiles
    .filter((f) => f.slug?.startsWith(folder) && isFeedItem(f.slug) && !f.frontmatter?.draft)
    .sort((a, b) => (savedDate(b)?.getTime() ?? 0) - (savedDate(a)?.getTime() ?? 0))

  return (
    <div class="feed">
      {items.map((page) => (
        <FeedCard page={page} feedSlug={feedSlug} />
      ))}
      <p class="feed-end">welp, you read it all.</p>
    </div>
  )
}
