import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { SITE_THEME_MODE, siteShowsThemeSwitch } from '../config/siteThemeMode'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'theme-preference'

type ThemeContextValue = {
  /** When false, the site is locked (no light mode / no UI to change theme) */
  allowsUserThemeChoice: boolean
  /** Stored choice: follow OS, or lock to light / dark */
  preference: ThemePreference
  setPreference: (p: ThemePreference) => void
  /** Effective palette after resolving `system` */
  resolvedTheme: ResolvedTheme
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredPreference(): ThemePreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  } catch {
    /* ignore */
  }
  return 'system'
}

function resolveTheme(preference: ThemePreference, systemDark: boolean): ResolvedTheme {
  if (preference === 'light' || preference === 'dark') return preference
  return systemDark ? 'dark' : 'light'
}

function applyDomTheme(resolved: ResolvedTheme) {
  document.documentElement.dataset.theme = resolved
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const fullMode = siteShowsThemeSwitch()
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    if (typeof window === 'undefined') return 'system'
    if (!fullMode) return 'dark'
    return readStoredPreference()
  })
  const [systemDark, setSystemDark] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  const resolvedTheme = useMemo((): ResolvedTheme => {
    if (SITE_THEME_MODE === 'darkOnly') return 'dark'
    return resolveTheme(preference, systemDark)
  }, [preference, systemDark])

  useEffect(() => {
    applyDomTheme(resolvedTheme)
  }, [resolvedTheme])

  useEffect(() => {
    if (!fullMode) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemDark(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [fullMode])

  const setPreference = useCallback(
    (p: ThemePreference) => {
      if (SITE_THEME_MODE === 'darkOnly') return
      setPreferenceState(p)
      try {
        if (p === 'system') localStorage.removeItem(STORAGE_KEY)
        else localStorage.setItem(STORAGE_KEY, p)
      } catch {
        /* ignore */
      }
    },
    [],
  )

  const value = useMemo(
    () => ({
      allowsUserThemeChoice: fullMode,
      preference: fullMode ? preference : 'dark',
      setPreference,
      resolvedTheme,
    }),
    [fullMode, preference, setPreference, resolvedTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// Hook colocated with provider; split would add noise for a small app.
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
