import { QuartzComponentConstructor } from "./types"
import landingStyle from "./styles/landing.scss"

export const TOTAL_CARDS = 8
export const CARDS = {
    basics: (
        <a href={"/"}>
            <div class="card card-1">
                <p class="card-title">The Basics</p>
                <p class="card-subhead">Issue 001</p>
                <img src="/static/1-illo.png" class="card-illustration-1" />
            </div>
        </a>
    ),
}

export default (() => {
    function LandingComponent() {
        return (
            <div>
                <div class="content-container">
                    <p class="landing-header">Welcome to Socratica</p>
                    <p class="page-subhead">
                        This is a guide •{" "}
                        <a href="https://www.socratica.info/" target="_blank">
                            Back to main site
                        </a>{" "}
                        •{" "}
                        <a href="https://github.com/Socratica-Org/toolbox" target="_blank">
                            Contribute
                        </a>{" "}
                        •{" "}
                        <a href="https://toolbox.socratica.info/credits" target="_self">
                            Credits
                        </a>
                    </p>

                    <div class="issue-container">
                        {Object.values(CARDS)}
                        {Array(TOTAL_CARDS - Object.keys(CARDS).length)
                            .fill(0)
                            .map(() => (
                                <div class="card card-coming">
                                    <p class="card-title">Coming Soon</p>
                                    <p class="card-subhead">Issue XXX</p>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        )
    }

    LandingComponent.css = landingStyle
    return LandingComponent
}) satisfies QuartzComponentConstructor
