/**
 * Branch policy (see README “Theme branches”):
 * - `main` (live site) → 'darkOnly' — always dark, no sun/moon control
 * - `light-and-dark-mode` (saved full experience) → 'full' — light, dark, system, toggle
 *
 * The only file that should differ between those branches (for theming) is this one.
 */
export type SiteThemeMode = 'full' | 'darkOnly'

export const SITE_THEME_MODE: SiteThemeMode = 'full'

export const siteShowsThemeSwitch = () => SITE_THEME_MODE === 'full'
