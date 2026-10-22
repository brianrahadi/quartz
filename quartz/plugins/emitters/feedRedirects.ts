import { FullSlug, resolveRelative } from "../../util/path"
import { feedAnchor, feedIndexSlug, isFeedItem } from "../../util/feed"
import { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"
import { BuildCtx } from "../../util/ctx"
import { VFile } from "vfile"

// feed items (e.g. clippings) don't get their own page; their URL redirects to
// their card on the feed so old links, search results and backlinks still work
async function* processFile(ctx: BuildCtx, file: VFile) {
  const slug = file.data.slug as FullSlug
  if (!isFeedItem(slug)) return
  const target = `${resolveRelative(slug, feedIndexSlug(slug))}#${feedAnchor(slug)}`
  const title = String(file.data.frontmatter?.title ?? slug).replace(/[<>&"]/g, "")
  yield write({
    ctx,
    content: `
        <!DOCTYPE html>
        <html lang="en-us">
        <head>
        <title>${title}</title>
        <link rel="canonical" href="${target}">
        <meta name="robots" content="noindex">
        <meta charset="utf-8">
        <meta http-equiv="refresh" content="0; url=${target}">
        </head>
        </html>
        `,
    slug,
    ext: ".html",
  })
}

export const FeedRedirects: QuartzEmitterPlugin = () => ({
  name: "FeedRedirects",
  async *emit(ctx, content) {
    for (const [_tree, file] of content) {
      yield* processFile(ctx, file)
    }
  },
  async *partialEmit(ctx, _content, _resources, changeEvents) {
    for (const changeEvent of changeEvents) {
      if (!changeEvent.file) continue
      if (changeEvent.type === "add" || changeEvent.type === "change") {
        yield* processFile(ctx, changeEvent.file)
      }
    }
  },
})
