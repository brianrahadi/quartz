import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  // top bar: title on the left, search + dark mode icons on the right
  header: [
    Component.Flex({
      components: [
        { Component: Component.PageTitle(), grow: true, justify: "start" },
        { Component: Component.Search() },
        { Component: Component.Darkmode() },
      ],
      gap: "0.9rem",
    }),
  ],
  afterBody: [],
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
