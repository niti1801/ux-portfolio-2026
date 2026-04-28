import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { SITE_THEME_MODE } from './src/config/siteThemeMode'

/** Inlined for `darkOnly` in index.html; full mode uses the static script in index.html. */
const THEME_SCRIPT_DARK_ONLY = `      (function () {
        try {
          document.documentElement.setAttribute('data-theme', 'dark')
        } catch (e) {}
      })()`.trimStart()

// https://vite.dev/config/
// Production (GitHub Pages) uses the repo name as the path; local dev uses root.
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/ux-portfolio-2026/' : '/',
  plugins: [
    react(),
    {
      name: 'index-html-theme-script',
      transformIndexHtml(html) {
        if (SITE_THEME_MODE !== 'darkOnly') return html
        return html.replace(
          /<script data-theme-initial>[\s\S]*?<\/script>/,
          `<script data-theme-initial>\n${THEME_SCRIPT_DARK_ONLY}\n    </script>`,
        )
      },
    },
  ],
})
