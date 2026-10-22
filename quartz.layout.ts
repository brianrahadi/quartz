import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { SimpleSlug } from "./quartz/util/path"

const isIndex = (slug: string) => slug === "index" || slug.endsWith("/index")

// latest posts and clippings, side by side below the home page content
const recentOnHome = Component.ConditionalRender({
  component: Component.Flex({
    components: [
      {
        Component: Component.RecentNotes({
          title: "Recent Posts",
          limit: 2,
          filter: (f) => f.slug!.startsWith("posts/") && !isIndex(f.slug!) && !f.frontmatter?.noindex,
          linkToMore: "posts/" as SimpleSlug,
          showTags: false,
        }),
        grow: true,
        basis: "14rem",
        align: "stretch",
        justify: "start",
      },
      {
        Component: Component.RecentNotes({
          title: "Recent Clippings",
          limit: 2,
          filter: (f) =>
            f.slug!.startsWith("clippings/") && !isIndex(f.slug!) && !f.frontmatter?.noindex,
          linkToMore: "clippings/" as SimpleSlug,
          showTags: false,
        }),
        grow: true,
        basis: "14rem",
        align: "stretch",
        justify: "start",
      },
    ],
    wrap: "wrap",
    gap: "2rem",
  }),
  condition: (page) => page.fileData.slug === "index",
})

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  // top bar: title on the left, search + dark mode icons on the right
  header: [
    Component.Flex({
      components: [
        // name, then GitHub/LinkedIn right after it; search + dark mode stay on the right
        { Component: Component.PageTitle() },
        { Component: Component.SocialLinks(), grow: true, justify: "start" },
        { Component: Component.Search() },
        { Component: Component.Darkmode() },
      ],
      gap: "0.9rem",
    }),
  ],
  afterBody: [recentOnHome],
  // full-width pixel village along the bottom of the home page (replaces the footer)
  footer: Component.PixelVillage(),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
    Component.MobileOnly(Component.TableOfContents()),
  ],
  left: [],
  right: [
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.ArticleTitle(), Component.ContentMeta()],
  left: [],
  right: [],
}
