# UX Portfolio 2026

React + TypeScript + Vite portfolio.

- **Repository:** [github.com/niti1801/ux-portfolio-2026](https://github.com/niti1801/ux-portfolio-2026)
- **Live site:** [niti1801.github.io/ux-portfolio-2026](https://niti1801.github.io/ux-portfolio-2026/)

## Development

Vite is configured to use the same path as the live site (`/ux-portfolio-2026/`), so **local `npm run dev` and `npm run preview` match the GitHub Pages URL** (no separate “CI-only” base).

```sh
npm install
npm run dev
```

- Your browser should open to **http://localhost:5173/ux-portfolio-2026/** (if not, go there manually). The root of the dev server is not the app.
- `npm run build` — production build  
- `npm run preview` — preview the build, usually at **http://localhost:4173/ux-portfolio-2026/**  
- `npm run lint` — ESLint  

The live site is deployed to GitHub Pages when you push to `main` (see [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). If the site is blank the first time, in the repo go to **Settings → Pages** and set the **Build and deployment** source to **GitHub Actions**.

## Theme branches (dark-only live site vs. full light/dark in Git)

The **live site** (`main`) is **dark only**: no light theme and **no** sun/moon control in the nav. All light-mode styles stay in the repo for future use, but the public build is locked to dark.

The full experience (light + dark, OS default, and the **☀️ / 🌙** toggle) is kept on branch **`light-and-dark-mode`**. The only file that is intentionally different between the two (for this behavior) is [`src/config/siteThemeMode.ts`](src/config/siteThemeMode.ts):

- **`main`** — `export const SITE_THEME_MODE = 'darkOnly'`
- **`light-and-dark-mode`** — `export const SITE_THEME_MODE = 'full'`

Workflow: develop features on a branch, merge to `light-and-dark-mode` when the full theme UI is ready; when you are ready to ship the portfolio **without** the toggle, merge into `main` and set (or keep) `SITE_THEME_MODE` to `'darkOnly'` in that one file, then push `main` to update GitHub Pages.

Preview locally: `npm run dev` (with the branch and `siteThemeMode` you have checked out).
