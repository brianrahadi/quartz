import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/sand.inline"
import style from "./styles/sand.scss"
import { classNames } from "../util/lang"

// a falling-sand toy shown as a banner on the home page only
export default (() => {
  const SandBanner: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    if (fileData.slug !== "index") return null
    return (
      <div class={classNames(displayClass, "sand-banner")}>
        <canvas
          class="sand-canvas"
          aria-label="Falling sand toy: click and drag to pour pixel sand"
        ></canvas>
        <button class="sand-clear" type="button" aria-label="Clear the sand">
          clear
        </button>
      </div>
    )
  }

  SandBanner.css = style
  SandBanner.afterDOMLoaded = script

  return SandBanner
}) satisfies QuartzComponentConstructor
