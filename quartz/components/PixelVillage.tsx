import { QuartzComponent, QuartzComponentConstructor } from "./types"
// @ts-ignore
import script from "./scripts/village.inline"
import style from "./styles/village.scss"

// renders nothing itself; it ships the script + styles that turn any
// <div class="pixel-village"></div> in markdown into the animated 1-bit village
export default (() => {
  const PixelVillage: QuartzComponent = () => null
  PixelVillage.css = style
  PixelVillage.afterDOMLoaded = script
  return PixelVillage
}) satisfies QuartzComponentConstructor
