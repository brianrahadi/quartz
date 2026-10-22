import { ComponentChildren } from "preact"
import { Root, Element } from "hast"
import { visit } from "unist-util-visit"
import { htmlToJsx } from "../../util/jsx"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { getDate } from "../Date"

// Fill `<span class="updated" data-source="posts/"></span>` markers in page content with the
// date that section was last updated. A source ending in "/" means "newest page in that folder";
// anything else is a single page slug (e.g. "about/projects").
function fillLastUpdated(tree: Root, { allFiles, cfg }: QuartzComponentProps) {
  visit(tree, "element", (node: Element) => {
    const source = node.properties?.dataSource
    const classes = node.properties?.className
    if (typeof source !== "string" || !Array.isArray(classes) || !classes.includes("updated")) {
      return
    }

    const isFolder = source.endsWith("/")
    const pages = allFiles.filter((f) =>
      isFolder
        ? f.slug!.startsWith(source) && !f.slug!.endsWith("/index") && !f.frontmatter?.noindex
        : f.slug === source,
    )
    const latest = pages
      .map((f) => getDate(cfg, f))
      .filter((d): d is Date => d instanceof Date && !isNaN(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0]
    if (!latest) {
      node.children = []
      return
    }

    const sameYear = latest.getFullYear() === new Date().getFullYear()
    const label = latest
      .toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        ...(sameYear ? {} : { year: "numeric" }),
      })
      .toLowerCase()
    node.properties.title = `last updated ${latest.toISOString().slice(0, 10)}`
    node.children = [
      {
        type: "element",
        tagName: "time",
        properties: { dateTime: latest.toISOString() },
        children: [{ type: "text", value: label }],
      },
    ]
  })
}

const Content: QuartzComponent = (props: QuartzComponentProps) => {
  const { fileData, tree } = props
  fillLastUpdated(tree as Root, props)
  const content = htmlToJsx(fileData.filePath!, tree) as ComponentChildren
  const classes: string[] = fileData.frontmatter?.cssclasses ?? []
  const classString = ["popover-hint", ...classes].join(" ")
  return <article class={classString}>{content}</article>
}

export default (() => Content) satisfies QuartzComponentConstructor
