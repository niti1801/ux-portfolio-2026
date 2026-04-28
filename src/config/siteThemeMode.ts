/**
 * Branch policy (see README “Theme branches”):
 * - `main` (live site) → 'darkOnly' — always dark, no sun/moon control
 * - `light-and-dark-mode` (saved full experience) → 'full' — light, dark, system, toggle
 *
 * The only file that should differ between those branches (for theming) is this one.
 */
export type SiteThemeMode = 'full' | 'darkOnly'

/** Set per branch. Cast keeps comparisons valid in TS (literal branch vs `light-and-dark-mode`). */
const THEME_MODE = 'darkOnly' as SiteThemeMode
export const SITE_THEME_MODE: SiteThemeMode = THEME_MODE
export const siteShowsThemeSwitch = () => THEME_MODE === 'full'
