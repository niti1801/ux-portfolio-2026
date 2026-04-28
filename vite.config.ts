import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { SITE_THEME_MODE } from './src/config/siteThemeMode'

/** Inlined for `darkOnly` in index.html; full mode uses the static script in index.html. */
const THEME_SCRIPT_DARK_ONLY = `      (function () {
        try {
          document.documentElement.setAttribute('data-theme', 'dark')
        } catch (e) {}
      })()`.trimStart()

// Use root paths so the site works on a custom apex domain.
const SITE_BASE = '/'

// https://vite.dev/config/
export default defineConfig({
  base: SITE_BASE,
  server: {
    open: SITE_BASE,
  },
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
