import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/village.inline"
import style from "./styles/village.scss"

// used as the page footer: a full-width animated 1-bit village along the bottom of the home page.
// (the script also mounts any <div class="pixel-village"></div> placed in markdown)
export default (() => {
  const PixelVillage: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    if (fileData.slug !== "index") return null
    return (
      <footer class="village-footer">
        <div class="pixel-village"></div>
      </footer>
    )
  }
  PixelVillage.css = style
  PixelVillage.afterDOMLoaded = script
  return PixelVillage
}) satisfies QuartzComponentConstructor
