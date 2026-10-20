import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/runner.inline"
import style from "./styles/runner.scss"
import { classNames } from "../util/lang"

// a small endless-runner game shown as a banner on the home page only
export default (() => {
  const RunnerBanner: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    if (fileData.slug !== "index") return null
    return (
      <div class={classNames(displayClass, "runner-banner")}>
        <canvas
          class="runner-canvas"
          tabIndex={0}
          aria-label="Mini game: press space or tap to jump over the bugs"
        ></canvas>
      </div>
    )
  }

  RunnerBanner.css = style
  RunnerBanner.afterDOMLoaded = script

  return RunnerBanner
}) satisfies QuartzComponentConstructor
