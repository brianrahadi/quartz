---
title: Introduction to React Workshop
draft: false
tags:
  - guide
---

Intro to React Workshop materials that [Marcus](https://github.com/marcusgchan) and I hosted as part of ChaosHacks 2024 workshop

### Materials
- [Google slides](https://docs.google.com/presentation/d/e/2PACX-1vSS_BStV_3DDm-VCCXuVjBn33CU3dDSnbTqjoMIyPirUGtEgQAh27jIYvuETr_L9wl5UjRoSd42BalG/pub?start=false&loop=false&delayms=3000)
- [Github code](https://github.com/ssss-sfu/react-intro-workshop-2024)
### Setup Prerequisites
1. [Visual Studio Code](https://code.visualstudio.com/)
2. [NPM](https://www.npmjs.com/)
3. VSCode Extensions
	- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
4. [Vercel](https://vercel.com/) account
5. [GitHub](https://github.com/) account (optional, but nice to haves for Vercel + Git Integration)
### Project Setup
The React project uses `Vite` - `TypeScript + SWC` and `tailwindcss`. Deployment will use [Vercel](https://vercel.com/).

1. Create the project folder
	1. `npm create vite@latest`
	2. Select your project name - `chaoshacks24-react`
	3. Choose `react` as the framework
	4. Choose `TypeScript + SWC`
		- `TypeScript` to build your project with full type-safety
		- `SWC` (Speedy Web Compiler) is super-fast TypeScript / JavaScript compiler written in Rust.
	5. `cd test-project`
2. Install `tailwindcss` and embed it into project
	1. `npm install -D tailwindcss postcss autoprefixer`
	2. `npx tailwindcss init -p`
	3. Configure template paths in `tailwind.config.js`
		```
		/** @type {import('tailwindcss').Config} */
		export default {
		  content: [
		    "./index.html",
		    "./src/**/*.{js,ts,jsx,tsx}",
		  ],
		  theme: {
		    extend: {},
		  },
		  plugins: [],
		}
		```
	4. Add tailwind directives in `./src/index.css`
		```
		@tailwind base;
		@tailwind components;
		@tailwind utilities;
		```
3. Enjoy development time
	1. `npm run dev`
	2. Go to http://localhost:5173/
	3. **Recommended**: Deploy with Vercel first, so it helps as another environment to run and test during development
4. Deployment with Vercel - [Guide](https://vitejs.dev/guide/static-deploy#vercel) (2 initial ways)
	- Command Line Interface - Easier but less convenient over time
		1. `npm i -g vercel`
			1. Install vercel
		2. `vercel`
			1. Set up vercel deployment
			2. Also used to update and upload project folder to newest build
	- Using GitHub - Better Integration and no need to redeploy every time - connected with GitHub.
		1. Make repository in GitHub
		2. Go to `vercel.com` and import project from Repository
		3. Everytime code is pushed to GitHub will be automatically redeployed in Vercel

### Acknowledgements
- https://react.dev/
- https://tailwindcss.com/docs/guides/vite
- https://vitejs.dev/guide/static-deploy#vercel
- nwHacks 2024 Intro to React Slides
