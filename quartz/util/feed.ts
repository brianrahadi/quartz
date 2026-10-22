import { FullSlug, joinSegments } from "./path"

/**
 * Folders rendered as a single scrollable feed instead of one page per note.
 * Each note in these folders becomes a card on `<folder>/index`, and its own
 * URL is a tiny redirect to `<folder>/#<anchor>`.
 */
export const FEED_FOLDERS = ["clippings"]

function feedFolderOf(slug: string | undefined): string | undefined {
  if (!slug) return undefined
  return FEED_FOLDERS.find((f) => slug.startsWith(f + "/"))
}

/** a note that lives inside a feed folder (not the folder index itself) */
export function isFeedItem(slug: string | undefined): boolean {
  return !!feedFolderOf(slug) && !slug!.endsWith("/index")
}

/** the folder index page that renders the feed */
export function isFeedIndex(slug: string | undefined): boolean {
  return !!slug && FEED_FOLDERS.some((f) => slug === f + "/index")
}

/** stable, URL-safe id for a feed item's card */
export function feedAnchor(slug: string): string {
  const base = slug.split("/").pop() ?? slug
  return (
    base
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  )
}

export function feedIndexSlug(slug: string): FullSlug {
  return joinSegments(feedFolderOf(slug)!, "index") as FullSlug
}
