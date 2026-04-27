---
name: Theme toggle visibility
overview: Single circular theme control (not a two-slot pill). Default icon matches current appearance; hover uses a white circle and crossfades to the opposite icon. Device-follow (system) remains in code; double-click resets to device.
todos:
  - id: single-icon-morph
    content: One 2.5rem button; moon default in dark / sun in light; hover white bg + icon swap animation
    status: completed
  - id: click-doubleclick
    content: Click locks opposite theme; double-click sets preference system
    status: completed
isProject: false
---

# Theme toggle: single morphing icon (updated)

## Words

- **Device theme** — Light or dark from the browser (`prefers-color-scheme`).
- **Auto** — Follow device; code value **`system`** ([ThemeProvider](../../src/theme/ThemeProvider.tsx)).
- **Light** / **Dark** — Locked themes; **`light`** / **`dark`**.

## Goal (current design)

- **Not a toggle pill** with two separate slots. **One** circular control (same footprint as other nav icon buttons, ~`2.5rem`).
- **Default icon** reflects **current appearance** (`resolvedTheme`):
  - **Dark** site → show **moon** only.
  - **Light** site → show **sun** only.
- **Hover:** **White** circular background (`#ffffff`) behind the control; the icon **animates** (crossfade + slight scale/rotate) into the **opposite** icon (moon → sun in dark mode, sun → moon in light mode).
- **Click:** Locks the **other** theme (`setPreference` to opposite of `resolvedTheme`).
- **Double-click:** Sets **`system`** again (match device). Document in `title` / hidden hint.

## Behavior

| User intent | Code `preference` | Site |
|-------------|-------------------|------|
| Auto | `system` | Follows device |
| Lock light | `light` | Always light |
| Lock dark | `dark` | Always dark |

First visit: **`system`**; [index.html](../../index.html) inline script unchanged.

## Implementation

- [src/components/ThemeToggle.tsx](../../src/components/ThemeToggle.tsx): one `<button>`; stacked moon/sun layers; `data-resolved={resolvedTheme}` for CSS.
- [src/components/ThemeToggle.css](../../src/components/ThemeToggle.css): hover `background: #ffffff`; layer opacity/transform transitions; `prefers-reduced-motion` short-circuit.
- Shared nav pill hit tokens in [src/index.css](../../src/index.css) remain for **Work / About / Contact** only; theme control no longer uses the pill split styling.

## Check

- Hover: white fill + morph; click switches theme; double-click restores device matching.
- Keyboard focus ring; screen reader label describes click vs double-click affordance.
