import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { SimpleSlug } from "./quartz/util/path"

const recentNotes = [
  Component.RecentNotes({
    title: "Recent Posts",
    limit: 1,
    filter: (f) =>
      f.slug!.startsWith("posts/") && f.slug! !== "posts/index" && !f.frontmatter?.noindex,
    linkToMore: "posts/" as SimpleSlug,
    showTags: false,
  }),
  Component.RecentNotes({
    title: "Recent Clippings",
    limit: 1,
    filter: (f) =>
      f.slug!.startsWith("clippings/") && f.slug! !== "clippings/index" && !f.frontmatter?.noindex,
    linkToMore: "clippings/" as SimpleSlug,
    showTags: false,
  }),
  // Component.RecentNotes({
  //   title: "Recent Notes",
  //   limit: 2,
  //   filter: (f) => f.slug!.startsWith("notes/") && f.slug! !== "notes/index" && !f.frontmatter?.noindex,
  //   linkToMore: "notes/" as SimpleSlug,
  // }),
]

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [...recentNotes.map((c) => Component.MobileOnly(c))],
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
  left: [
    // title on the left, search + dark mode icons on the right, all in one row
    Component.Flex({
      components: [
        { Component: Component.PageTitle(), grow: true, justify: "start" },
        { Component: Component.Search() },
        { Component: Component.Darkmode() },
      ],
      gap: "0.9rem",
    }),
    // Component.Explorer(),
    ...recentNotes.map((c) => Component.DesktopOnly(c)),
  ],
  right: [
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    // title on the left, search + dark mode icons on the right, all in one row
    Component.Flex({
      components: [
        { Component: Component.PageTitle(), grow: true, justify: "start" },
        { Component: Component.Search() },
        { Component: Component.Darkmode() },
      ],
      gap: "0.9rem",
    }),
    // Component.Explorer(),
    ...recentNotes.map((c) => Component.DesktopOnly(c)),

  ],
  right: [],
}
