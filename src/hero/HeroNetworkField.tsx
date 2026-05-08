import { useEffect, useRef, useState, type RefObject } from 'react'

type Rect = { left: number; top: number; right: number; bottom: number }

type Props = {
  heroRef: RefObject<HTMLElement | null>
  /** Copy / headline column — ghost dots & pill “no overlap” zone */
  textColumnRef: RefObject<HTMLElement | null>
  /** Desktop hero photo only; nodes & edges avoid this rect (mobile column is display:none → ignored). */
  portraitExcludeRef: RefObject<HTMLElement | null>
  keywords: readonly string[]
  reducedMotion: boolean
}

const NUM_ANCHORS = 10
const EDGE_MARGIN = 36
const NAV_SAFE_GAP = 12
const FORBIDDEN_PAD = 28
/** Keep keyword anchors out of the hero copy column (drifting nodes may still pass behind) */
const ANCHOR_TEXT_AVOID_PAD = 24
const PILL_EXCLUSION_PAD = 56
const ANCHOR_MIN_SEP = 72
const HIT_RADIUS = 28
/** Idle backbone — keep sparse; motion + cursor fill in the rest */
const CONNECT_BASE = 68
const CONNECT_CURSOR = 198
/** Extra link reach while the pointer is moving (decays after movement stops) */
const SCRUB_DECAY_MS = 520
const SCRUB_EXTRA_REACH = 14
const SCRUB_SMOOTH = 0.11
/** Soft pull of dots toward the pointer (acceleration × falloff; strength does not ramp when idle) */
const CURSOR_ATTRACT_R = 165
const CURSOR_ATTRACT_INNER = 26
const CURSOR_ATTRACT_ACCEL = 0.00095
/** Cursor only “lights” a few chords at a time; the set retargets as you move */
const CURSOR_NEAREST_NODES = 5
const CURSOR_MAX_EDGES = 4
const ANCHOR_LATERAL_MAX_EDGES = 3
const DRIFT_SPEED = 0.038
const CLUSTER_R = 86
const CLUSTER_EDGE_MAX = 88
/** Wider, softer magnet — fun to sweep without harsh snaps */
const MAGNET_MID_DROPOFF = 88
const MAGNET_NODE_DROPOFF = 56
const MAGNET_ALONG_DROPOFF = 42
const MAGNET_EXTRA_PAIR_DIST = 58
/** Edge brightness cap — holding the cursor still does not ramp brightness */
const MAGNET_ALPHA_CAP = 0.3
const CURSOR_NODE_GLOW_R = 122
/** Ghost dots in copy column — count scales with drifting node count */
const GHOST_RATIO = 16 / 92
const GHOST_MIN = 7
const GHOST_MAX = 26
const GHOST_INSET = 12
const GHOST_DRIFT = 0.011
const ANCHOR_RING_R = 6.75
const ANCHOR_DOT_R = 2.85
const ANCHOR_RING_WIDTH = 1.35

/** Degenerate rect so `inRect` is never true for in-hero coordinates (no portrait to exclude). */
const EMPTY_FORBIDDEN: Rect = { left: -1, top: -1, right: -2, bottom: -2 }

function clampInt(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)))
}

/**
 * Drifting node + ghost counts from the hero layout box (responsive, not device name).
 * Wide viewports (e.g. 16" laptop) get a denser field; narrow ones stay lighter.
 */
function nodeCountsForHero(w: number, h: number): { numNormal: number; numGhost: number } {
  let numNormal: number

  if (w >= 1480) numNormal = 150
  else if (w >= 1320) numNormal = 138
  else if (w >= 1160) numNormal = 124
  else if (w >= 1024) numNormal = 112
  else if (w >= 900) numNormal = 98
  else if (w >= 780) numNormal = 86
  else if (w >= 640) numNormal = 72
  else if (w >= 520) numNormal = 58
  else if (w >= 400) numNormal = 48
  else numNormal = 40

  if (h >= 580) numNormal = Math.round(numNormal * 1.06)
  else if (h < 420) numNormal = Math.round(numNormal * 0.9)
  else if (h < 360) numNormal = Math.round(numNormal * 0.86)

  numNormal = clampInt(numNormal, 38, 158)

  const numGhost = clampInt(numNormal * GHOST_RATIO, GHOST_MIN, GHOST_MAX)

  return { numNormal, numGhost }
}

/** Anchor = radio style: outer ring + inner dot */
/** Prefer ~peering distances (interconnected hops); downweight short tangles (“spider web”). */
function backboneBias(d: number): number {
  const shortPen = d < 36 ? 0.52 : d < 52 ? 0.82 : 1
  const u = (d - 82) / 50
  const bell = Math.exp(-u * u)
  return (0.42 + 0.58 * bell) * shortPen
}

function rectRelative(inner: DOMRect, outer: DOMRect): Rect {
  return {
    left: inner.left - outer.left,
    top: inner.top - outer.top,
    right: inner.right - outer.left,
    bottom: inner.bottom - outer.top,
  }
}

function inflate(r: Rect, pad: number): Rect {
  return {
    left: r.left - pad,
    top: r.top - pad,
    right: r.right + pad,
    bottom: r.bottom + pad,
  }
}

function inRect(x: number, y: number, r: Rect): boolean {
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
}

function inAllowed(x: number, y: number, outer: Rect, forbidden: Rect): boolean {
  if (!inRect(x, y, outer)) return false
  return !inRect(x, y, forbidden)
}

function closestOutsideForbidden(x: number, y: number, f: Rect): { x: number; y: number } {
  const dxL = x - f.left
  const dxR = f.right - x
  const dyT = y - f.top
  const dyB = f.bottom - y
  const m = Math.min(dxL, dxR, dyT, dyB)
  if (m === dxL) return { x: f.left - 4, y }
  if (m === dxR) return { x: f.right + 4, y }
  if (m === dyT) return { x, y: f.top - 4 }
  return { x, y: f.bottom + 4 }
}

function clampToOuter(x: number, y: number, outer: Rect): { x: number; y: number } {
  return {
    x: Math.min(outer.right, Math.max(outer.left, x)),
    y: Math.min(outer.bottom, Math.max(outer.top, y)),
  }
}

/** Pillow around copy / portrait — full pad on desktop, gentler on tablet so pills can hug anchors */
function pillExclusionInflatePad(heroCanvasWidth: number): number {
  if (heroCanvasWidth >= 1200) return PILL_EXCLUSION_PAD
  if (heroCanvasWidth >= 980) return 42
  if (heroCanvasWidth >= 760) return 34
  if (heroCanvasWidth >= 520) return 28
  return 22
}

/** Approx footprint vs CSS `.hero-network-pill` (≈52vw caps) for collision tests */
function pillLayoutSize(heroCanvasWidth: number): { pw: number; ph: number } {
  const inner = Math.max(160, heroCanvasWidth - EDGE_MARGIN * 2)
  const pw = Math.min(220, Math.max(138, Math.round(inner * 0.5)))
  const ph = 34
  return { pw, ph }
}

function pillBounds(left: number, top: number, pw: number, ph: number): Rect {
  return { left, top, right: left + pw, bottom: top + ph }
}

function rectIntersects(a: Rect, b: Rect): boolean {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom)
}

function pillFitsExclusions(
  left: number,
  top: number,
  outer: Rect,
  exclusions: Rect[],
  pw: number,
  ph: number,
): boolean {
  const b = pillBounds(left, top, pw, ph)
  if (b.left < outer.left || b.top < outer.top || b.right > outer.right || b.bottom > outer.bottom) return false
  for (const f of exclusions) {
    if (rectIntersects(b, f)) return false
  }
  return true
}

/**
 * Tight presets, then orbit + coarse grid minimizing distance — avoids drifting to hero center when
 * large exclusion zones dominate on iPad-ish widths.
 */
function placePillNearAnchor(
  ax: number,
  ay: number,
  outer: Rect,
  exclusions: Rect[],
  pw: number,
  ph: number,
): { left: number; top: number } {
  const halfW = pw / 2
  const halfH = ph / 2
  const ok = (left: number, top: number) => pillFitsExclusions(left, top, outer, exclusions, pw, ph)

  const attempts: Array<[number, number]> = [
    [ax + 4, ay - ph - 4],
    [ax + 4, ay + 6],
    [ax - pw - 4, ay - ph * 0.5],
    [ax - pw * 0.5 - 4, ay - ph - 4],
    [ax + 12, ay - ph - 8],
    [ax - pw - 8, ay - ph - 6],
    [ax - pw - 8, ay + 6],
    [ax + 8, ay + Math.max(8, ph * 0.35)],
    [ax - pw * 0.35, ay + 8],
  ]
  for (const [left, top] of attempts) {
    if (ok(left, top)) return { left, top }
  }

  const ringSteps = 20
  const maxRadius = Math.hypot(outer.right - outer.left, outer.bottom - outer.top) * 0.55
  for (let ri = 0; ri <= 50; ri++) {
    const rad = Math.max(ph * 0.42, 6) + ri * 4
    if (rad > maxRadius) break
    for (let ai = 0; ai < ringSteps; ai++) {
      const ang = (ai / ringSteps) * Math.PI * 2
      const cx = ax + Math.cos(ang) * rad
      const cy = ay + Math.sin(ang) * rad
      const left = cx - halfW
      const top = cy - halfH
      if (ok(left, top)) return { left, top }
    }
  }

  let bestD = Infinity
  let best: { left: number; top: number } | null = null
  const step = Math.max(8, Math.min(13, Math.round(pw * 0.055)))
  for (let left = outer.left + 4; left <= outer.right - pw - 4; left += step) {
    for (let top = outer.top + 4; top <= outer.bottom - ph - 4; top += step) {
      if (!ok(left, top)) continue
      const d = Math.hypot(left + halfW - ax, top + halfH - ay)
      if (d < bestD) {
        bestD = d
        best = { left, top }
      }
    }
  }
  if (best) return best

  let cx = ax + halfW
  let cy = ay - halfH - 10
  const u = clampToOuter(cx, cy, {
    left: outer.left + halfW,
    top: outer.top + halfH,
    right: outer.right - halfW,
    bottom: outer.bottom - halfH,
  })
  cx = u.x
  cy = u.y
  return { left: cx - halfW, top: cy - halfH }
}

function distPointSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const abx = bx - ax
  const aby = by - ay
  const apx = px - ax
  const apy = py - ay
  const ab2 = abx * abx + aby * aby || 1
  let t = (apx * abx + apy * aby) / ab2
  t = Math.max(0, Math.min(1, t))
  const qx = ax + abx * t
  const qy = ay + aby * t
  return Math.hypot(px - qx, py - qy)
}

function segmentCrossesForbidden(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  f: Rect,
  samples = 6,
): boolean {
  for (let s = 0; s <= samples; s++) {
    const t = s / samples
    const x = ax + (bx - ax) * t
    const y = ay + (by - ay) * t
    if (inRect(x, y, f)) return true
  }
  return false
}

function hashIJ(i: number, j: number): number {
  return ((i + 1) * 5023 + (j + 1) * 877) >>> 0
}

function isInteractiveTarget(t: EventTarget | null): boolean {
  if (!(t instanceof Element)) return false
  return Boolean(t.closest('a, button, input, textarea, select, [role="button"]'))
}

export function HeroNetworkField({ heroRef, textColumnRef, portraitExcludeRef, keywords, reducedMotion }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pill, setPill] = useState<{ label: string; left: number; top: number } | null>(null)

  const layoutRef = useRef({
    w: 0,
    h: 0,
    dpr: 1,
    numNormal: 92,
    outer: { left: 0, top: 0, right: 0, bottom: 0 } as Rect,
    forbidden: EMPTY_FORBIDDEN,
    anchorTextAvoid: EMPTY_FORBIDDEN,
    pillExclusions: [] as Rect[],
    nx: new Float32Array(0),
    ny: new Float32Array(0),
    nvx: new Float32Array(0),
    nvy: new Float32Array(0),
    anchorMask: new Uint8Array(0),
    anchorSlot: new Int8Array(0),
    ghostNx: new Float32Array(0),
    ghostNy: new Float32Array(0),
    ghostNvX: new Float32Array(0),
    ghostNvY: new Float32Array(0),
    ghostBounds: { left: 0, top: 0, right: 0, bottom: 0 } as Rect,
  })

  const pointerRef = useRef({ x: 0, y: 0, inside: false })
  const hoverAnchorRef = useRef(-1)
  const lastPointerMoveRef = useRef(performance.now())
  const lastPointerPosRef = useRef({ x: -99999, y: -99999 })
  const cursorScrubSmoothedRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const hero = heroRef.current
    const textColumnEl = textColumnRef.current
    if (!canvas || !hero || !textColumnEl) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const kw = [...keywords.slice(0, NUM_ANCHORS)]
    while (kw.length < NUM_ANCHORS) kw.push(`Keyword ${kw.length + 1}`)

    const rnd = () => Math.random()

    const pairAlphaSmooth = new Map<string, number>()
    let pruneFrame = 0

    const rebuild = () => {
      const hr = hero.getBoundingClientRect()
      const w = hr.width
      const h = hr.height
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2)
      const navEl = document.getElementById('nav')
      const navRect = navEl?.getBoundingClientRect()
      const navBottomInsideHero =
        navRect && navRect.bottom > hr.top
          ? Math.min(h - EDGE_MARGIN, Math.max(0, navRect.bottom - hr.top + NAV_SAFE_GAP))
          : 0
      const textColumnR = rectRelative(textColumnEl.getBoundingClientRect(), hr)
      const portraitEl = portraitExcludeRef.current
      const prDom = portraitEl?.getBoundingClientRect()
      const portraitR =
        portraitEl && prDom && prDom.width >= 8 && prDom.height >= 8
          ? rectRelative(prDom, hr)
          : null
      const outer: Rect = {
        left: EDGE_MARGIN,
        top: Math.max(EDGE_MARGIN, navBottomInsideHero),
        right: w - EDGE_MARGIN,
        bottom: h - EDGE_MARGIN,
      }
      const forbidden = portraitR ? inflate(portraitR, FORBIDDEN_PAD) : EMPTY_FORBIDDEN
      const anchorTextAvoid = inflate(textColumnR, ANCHOR_TEXT_AVOID_PAD)
      const pillPad = pillExclusionInflatePad(w)
      const pillExclusions: Rect[] = [inflate(textColumnR, pillPad)]
      if (portraitR) pillExclusions.push(inflate(portraitR, pillPad))

      const { numNormal, numGhost } = nodeCountsForHero(w, h)
      const total = numNormal + NUM_ANCHORS
      const nx = new Float32Array(total)
      const ny = new Float32Array(total)
      const nvx = new Float32Array(total)
      const nvy = new Float32Array(total)
      const anchorMask = new Uint8Array(total)
      const anchorSlot = new Int8Array(total)
      anchorSlot.fill(-1)

      const placeRandom = (): { x: number; y: number } | null => {
        for (let t = 0; t < 90; t++) {
          const x = outer.left + rnd() * (outer.right - outer.left)
          const y = outer.top + rnd() * (outer.bottom - outer.top)
          if (inAllowed(x, y, outer, forbidden)) return { x, y }
        }
        return null
      }

      const placeAnchor = (): { x: number; y: number } | null => {
        for (let t = 0; t < 140; t++) {
          const x = outer.left + rnd() * (outer.right - outer.left)
          const y = outer.top + rnd() * (outer.bottom - outer.top)
          if (!inAllowed(x, y, outer, forbidden)) continue
          if (inRect(x, y, anchorTextAvoid)) continue
          return { x, y }
        }
        return null
      }

      const snapAnchorOutOfText = (x: number, y: number): { x: number; y: number } => {
        if (!inRect(x, y, anchorTextAvoid)) return { x, y }
        const o = closestOutsideForbidden(x, y, anchorTextAvoid)
        return clampToOuter(o.x, o.y, outer)
      }

      for (let i = 0; i < numNormal; i++) {
        const p = placeRandom()
        const x = p?.x ?? outer.left + 20
        const y = p?.y ?? outer.top + 20
        nx[i] = x
        ny[i] = y
        const ang = rnd() * Math.PI * 2
        nvx[i] = Math.cos(ang) * DRIFT_SPEED * (0.6 + rnd())
        nvy[i] = Math.sin(ang) * DRIFT_SPEED * (0.6 + rnd())
      }

      const ax = new Float32Array(NUM_ANCHORS)
      const ay = new Float32Array(NUM_ANCHORS)
      for (let a = 0; a < NUM_ANCHORS; a++) {
        let placed = false
        for (let t = 0; t < 120 && !placed; t++) {
          const p = placeAnchor()
          if (!p) continue
          let ok = true
          for (let b = 0; b < a; b++) {
            if (Math.hypot(p.x - ax[b], p.y - ay[b]) < ANCHOR_MIN_SEP) {
              ok = false
              break
            }
          }
          if (ok) {
            ax[a] = p.x
            ay[a] = p.y
            placed = true
          }
        }
        if (!placed) {
          ax[a] = outer.left + (a + 1) * 40
          ay[a] = outer.top + 30
          const sn = snapAnchorOutOfText(ax[a], ay[a])
          ax[a] = sn.x
          ay[a] = sn.y
        }
      }

      for (let a = 0; a < NUM_ANCHORS; a++) {
        const i = numNormal + a
        const snapped = snapAnchorOutOfText(ax[a], ay[a])
        nx[i] = snapped.x
        ny[i] = snapped.y
        const ang = rnd() * Math.PI * 2
        nvx[i] = Math.cos(ang) * DRIFT_SPEED * 0.45
        nvy[i] = Math.sin(ang) * DRIFT_SPEED * 0.45
        anchorMask[i] = 1
        anchorSlot[i] = a
      }

      const gb: Rect = {
        left: textColumnR.left + GHOST_INSET,
        top: textColumnR.top + GHOST_INSET,
        right: textColumnR.right - GHOST_INSET,
        bottom: textColumnR.bottom - GHOST_INSET,
      }
      const gw = gb.right - gb.left
      const gh = gb.bottom - gb.top
      let ghostNx = new Float32Array(0)
      let ghostNy = new Float32Array(0)
      let ghostNvX = new Float32Array(0)
      let ghostNvY = new Float32Array(0)
      if (gw >= 28 && gh >= 28) {
        ghostNx = new Float32Array(numGhost)
        ghostNy = new Float32Array(numGhost)
        ghostNvX = new Float32Array(numGhost)
        ghostNvY = new Float32Array(numGhost)
        for (let g = 0; g < numGhost; g++) {
          ghostNx[g] = gb.left + rnd() * gw
          ghostNy[g] = gb.top + rnd() * gh
          const ga = rnd() * Math.PI * 2
          ghostNvX[g] = Math.cos(ga) * GHOST_DRIFT
          ghostNvY[g] = Math.sin(ga) * GHOST_DRIFT
        }
      }

      layoutRef.current = {
        w,
        h,
        dpr,
        numNormal,
        outer,
        forbidden,
        anchorTextAvoid,
        pillExclusions,
        nx,
        ny,
        nvx,
        nvy,
        anchorMask,
        anchorSlot,
        ghostNx,
        ghostNy,
        ghostNvX,
        ghostNvY,
        ghostBounds: gb,
      }

      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      pairAlphaSmooth.clear()
    }

    const pickColors = () => {
      const r = document.documentElement
      const cs = getComputedStyle(r)
      const primary = (cs.getPropertyValue('--primary').trim() || '#d07258').replace(/\s+/g, '')
      const border = (cs.getPropertyValue('--border').trim() || '#eadcca').replace(/\s+/g, '')
      const text2 = (cs.getPropertyValue('--text-2').trim() || '#685b4b').replace(/\s+/g, '')
      const text3 = (cs.getPropertyValue('--text-3').trim() || '#ad977d').replace(/\s+/g, '')
      /** Graph edges: body secondary text reads on both light wash and dark hero orbs */
      const line = text2
      return { primary, border, text2, text3, line }
    }

    const updatePillUI = (slot: number, ax: number, ay: number) => {
      const { outer, pillExclusions, w: heroCW } = layoutRef.current
      const { pw, ph } = pillLayoutSize(heroCW)
      const { left, top } = placePillNearAnchor(ax, ay, outer, pillExclusions, pw, ph)
      setPill({ label: kw[slot] ?? kw[0], left, top })
    }

    let raf = 0
    let alive = true
    let t0 = performance.now()

    const syncPill = () => {
      const slot = hoverAnchorRef.current
      const L = layoutRef.current
      if (slot < 0 || slot >= NUM_ANCHORS) {
        setPill(null)
        return
      }
      const i = L.numNormal + slot
      updatePillUI(slot, L.nx[i], L.ny[i])
    }

    const loop = (now: number) => {
      if (!alive) return
      const t = (now - t0) * 0.001
      const L = layoutRef.current
      const { w, h, numNormal, outer, forbidden, anchorTextAvoid, nx, ny, nvx, nvy, anchorMask } = L
      if (w < 32 || h < 32) {
        raf = requestAnimationFrame(loop)
        return
      }

      const colors = pickColors()
      const p = pointerRef.current
      const mx = p.x
      const my = p.y

      const moveT = p.inside
        ? Math.min(1, Math.max(0, 1 - (now - lastPointerMoveRef.current) / SCRUB_DECAY_MS))
        : 0
      cursorScrubSmoothedRef.current += (moveT - cursorScrubSmoothedRef.current) * SCRUB_SMOOTH
      const cursorScrub = cursorScrubSmoothedRef.current

      if (!reducedMotion) {
        const nx2 = L.nx
        const ny2 = L.ny
        for (let i = 0; i < nx2.length; i++) {
          if (p.inside) {
            const px = nx2[i]
            const py = ny2[i]
            const dx = mx - px
            const dy = my - py
            const dist = Math.hypot(dx, dy)
            if (dist > CURSOR_ATTRACT_INNER && dist < CURSOR_ATTRACT_R) {
              const span = CURSOR_ATTRACT_R - CURSOR_ATTRACT_INNER
              const t = (dist - CURSOR_ATTRACT_INNER) / span
              const falloff = (1 - t) ** 1.65
              const accel = CURSOR_ATTRACT_ACCEL * falloff
              nvx[i] += (dx / dist) * accel
              nvy[i] += (dy / dist) * accel
            }
          }
          let x = nx2[i] + nvx[i]
          let y = ny2[i] + nvy[i]
          if (inRect(x, y, forbidden)) {
            const o = closestOutsideForbidden(nx2[i], ny2[i], forbidden)
            x = o.x
            y = o.y
            nvx[i] *= -0.88
            nvy[i] *= -0.88
          }
          if (anchorMask[i] === 1 && inRect(x, y, anchorTextAvoid)) {
            const o = closestOutsideForbidden(nx2[i], ny2[i], anchorTextAvoid)
            x = o.x
            y = o.y
            nvx[i] *= -0.88
            nvy[i] *= -0.88
          }
          if (x < outer.left) {
            x = outer.left
            nvx[i] = Math.abs(nvx[i])
          } else if (x > outer.right) {
            x = outer.right
            nvx[i] = -Math.abs(nvx[i])
          }
          if (y < outer.top) {
            y = outer.top
            nvy[i] = Math.abs(nvy[i])
          } else if (y > outer.bottom) {
            y = outer.bottom
            nvy[i] = -Math.abs(nvy[i])
          }
          nx2[i] = x
          ny2[i] = y
        }
      }

      if (!reducedMotion && L.ghostNx.length > 0) {
        const gb = L.ghostBounds
        const gx = L.ghostNx
        const gy = L.ghostNy
        const gvx = L.ghostNvX
        const gvy = L.ghostNvY
        for (let gi = 0; gi < gx.length; gi++) {
          let x = gx[gi] + gvx[gi]
          let y = gy[gi] + gvy[gi]
          if (x <= gb.left) {
            x = gb.left
            gvx[gi] = Math.abs(gvx[gi])
          } else if (x >= gb.right) {
            x = gb.right
            gvx[gi] = -Math.abs(gvx[gi])
          }
          if (y <= gb.top) {
            y = gb.top
            gvy[gi] = Math.abs(gvy[gi])
          } else if (y >= gb.bottom) {
            y = gb.bottom
            gvy[gi] = -Math.abs(gvy[gi])
          }
          gx[gi] = x
          gy[gi] = y
        }
      }

      ctx.clearRect(0, 0, w, h)
      const meshBreath = 0.42 + 0.58 * Math.sin(t * 0.55)
      const idleLinkMax = CONNECT_BASE * (0.48 + 0.065 * meshBreath)

      const total = nx.length
      const hoverslot = hoverAnchorRef.current
      const hiIdxPre = hoverslot >= 0 ? numNormal + hoverslot : -1

      let pointerMaxReach = hoverslot >= 0 ? CONNECT_CURSOR + 28 : CONNECT_CURSOR + 8
      if (p.inside) {
        pointerMaxReach +=
          (hoverslot >= 0 ? MAGNET_EXTRA_PAIR_DIST * 0.82 : MAGNET_EXTRA_PAIR_DIST * 1.15) +
          cursorScrub * SCRUB_EXTRA_REACH
      }

      /** At most CURSOR_MAX_EDGES among nearest nodes — evolves as the pointer moves */
      let cursorChosenKeys: Set<string> | undefined
      if (p.inside) {
        const byDist = new Array<number>(total)
        for (let idx = 0; idx < total; idx++) byDist[idx] = idx
        byDist.sort((a, b) => {
          const da = Math.hypot(mx - nx[a], my - ny[a])
          const db = Math.hypot(mx - nx[b], my - ny[b])
          return da - db
        })
        const nearestN = byDist.slice(0, CURSOR_NEAREST_NODES)
        type CursorCand = { i: number; j: number; segD: number; d: number }
        const cand: CursorCand[] = []
        for (let a = 0; a < nearestN.length; a++) {
          for (let b = a + 1; b < nearestN.length; b++) {
            const u = nearestN[a]
            const v = nearestN[b]
            const ii = u < v ? u : v
            const jj = u < v ? v : u
            const ax = nx[ii]
            const ay = ny[ii]
            const bx = nx[jj]
            const by = ny[jj]
            const d = Math.hypot(ax - bx, ay - by)
            if (d > pointerMaxReach) continue
            if (segmentCrossesForbidden(ax, ay, bx, by, forbidden)) continue
            cand.push({
              i: ii,
              j: jj,
              segD: distPointSeg(mx, my, ax, ay, bx, by),
              d,
            })
          }
        }
        cand.sort((a, b) => a.segD - b.segD || a.d - b.d)
        cursorChosenKeys = new Set<string>()
        for (let k = 0; k < Math.min(CURSOR_MAX_EDGES, cand.length); k++) {
          cursorChosenKeys.add(`${cand[k].i},${cand[k].j}`)
        }
      }

      /** Short non-spoke chords inside anchor halo — keeps hover intentional */
      let anchorLateralChosen: Set<string> | undefined
      let anchorSpokeChosen: Set<string> | undefined
      if (hoverslot >= 0 && hiIdxPre >= 0) {
        const hi = hiIdxPre
        const sub: number[] = []
        for (let idx = 0; idx < total; idx++) {
          if (idx === hi) continue
          if (Math.hypot(nx[idx] - nx[hi], ny[idx] - ny[hi]) < CLUSTER_R) sub.push(idx)
        }
        sub.sort(
          (a, b) =>
            Math.hypot(nx[a] - nx[hi], ny[a] - ny[hi]) - Math.hypot(nx[b] - nx[hi], ny[b] - ny[hi]),
        )
        const capped = sub.slice(0, 6)
        const lateral: Array<{ i: number; j: number; d: number }> = []
        const spokes: Array<{ i: number; j: number; d: number }> = []
        for (let a = 0; a < capped.length; a++) {
          const j = capped[a]
          const ii = Math.min(hi, j)
          const jj = Math.max(hi, j)
          const d = Math.hypot(nx[ii] - nx[jj], ny[ii] - ny[jj])
          if (d < CLUSTER_EDGE_MAX) spokes.push({ i: ii, j: jj, d })
        }
        for (let a = 0; a < capped.length; a++) {
          for (let b = a + 1; b < capped.length; b++) {
            const i = Math.min(capped[a], capped[b])
            const j = Math.max(capped[a], capped[b])
            const d = Math.hypot(nx[i] - nx[j], ny[i] - ny[j])
            if (d >= CLUSTER_EDGE_MAX) continue
            lateral.push({ i, j, d })
          }
        }
        lateral.sort((a, b) => a.d - b.d)
        spokes.sort((a, b) => a.d - b.d)
        anchorLateralChosen = new Set<string>()
        for (let k = 0; k < Math.min(ANCHOR_LATERAL_MAX_EDGES, lateral.length); k++) {
          anchorLateralChosen.add(`${lateral[k].i},${lateral[k].j}`)
        }
        anchorSpokeChosen = new Set<string>()
        for (let k = 0; k < Math.min(2, spokes.length); k++) {
          anchorSpokeChosen.add(`${spokes[k].i},${spokes[k].j}`)
        }
      }

      for (let i = 0; i < total; i++) {
        for (let j = i + 1; j < total; j++) {
          const ax = nx[i]
          const ay = ny[i]
          const bx = nx[j]
          const by = ny[j]
          const d = Math.hypot(ax - bx, ay - by)
          if (d > pointerMaxReach) continue
          if (segmentCrossesForbidden(ax, ay, bx, by, forbidden)) continue

          const bb = backboneBias(d)
          let alpha = 0
          if (d < idleLinkMax) {
            const h = hashIJ(i, j)
            const twinkle = 0.55 + 0.45 * Math.sin(t * 0.38 + (h % 50) * 0.09)
            alpha += (1 - d / idleLinkMax) * 0.01 * meshBreath * twinkle * bb
          }

          const slotI = L.anchorSlot[i]
          const slotJ = L.anchorSlot[j]
          if (slotI >= 0 && slotJ >= 0 && d < 118) {
            const anchorMeshGate = p.inside || hoverslot >= 0 ? 1 : 0.2
            const roamDamp = p.inside && hoverslot < 0 ? 0.35 : 1
            alpha += 0.007 * meshBreath * (0.7 + 0.3 * Math.sin(t * 0.9 + slotI)) * bb * anchorMeshGate * roamDamp
          }

          if (p.inside && cursorChosenKeys?.has(`${i},${j}`)) {
            const midX = (ax + bx) * 0.5
            const midY = (ay + by) * 0.5
            const midDist = Math.hypot(mx - midX, my - midY)
            const da = Math.hypot(mx - ax, my - ay)
            const db = Math.hypot(mx - bx, my - by)
            const distSeg = distPointSeg(mx, my, ax, ay, bx, by)
            const along = Math.exp(-distSeg / MAGNET_ALONG_DROPOFF)
            const midNear = Math.exp(-midDist / MAGNET_MID_DROPOFF)
            /** Sweep along chords (less “hub at cursor” than pulling endpoints) */
            const towardChord = along * (0.13 + 0.62 * midNear)
            const nearest = Math.min(da, db)
            const endSoft = Math.exp(-nearest / MAGNET_NODE_DROPOFF) * along * 0.17
            const scrubMag = 1 + cursorScrub * 0.28
            const cap = MAGNET_ALPHA_CAP
            const gather = Math.min(cap, (towardChord + endSoft) * bb * scrubMag)
            alpha += gather * (0.94 + 0.06 * Math.sin(t * 0.85 + midDist * 0.012))
          }

          let distAi = 0
          let distAj = 0
          let inAi = false
          let inAj = false
          if (hiIdxPre >= 0) {
            const cxA = nx[hiIdxPre]
            const cyA = ny[hiIdxPre]
            distAi = Math.hypot(ax - cxA, ay - cyA)
            distAj = Math.hypot(bx - cxA, by - cyA)
            inAi = distAi < CLUSTER_R
            inAj = distAj < CLUSTER_R
          }

          if (hoverslot >= 0 && hiIdxPre >= 0) {
            const hi = hiIdxPre
            const cxA = nx[hi]
            const cyA = ny[hi]
            const midXA = (ax + bx) * 0.5
            const midYA = (ay + by) * 0.5
            const distMidAnch = Math.hypot(midXA - cxA, midYA - cyA)
            /** Weaker centroid pull — avoids dense radial burst; still reads as “near” the anchor */
            alpha += Math.exp(-distMidAnch / (CLUSTER_R * 1.15)) * 0.006 * bb * Math.max(0, 1 - d / (CLUSTER_EDGE_MAX * 1.25))

            if (inAi && inAj && d < CLUSTER_EDGE_MAX) {
              const isSpoke = i === hi || j === hi
              const pk = `${i},${j}`
              const allowSpoke = isSpoke && (anchorSpokeChosen?.has(pk) ?? false)
              const allowLateral = !isSpoke && (anchorLateralChosen?.has(pk) ?? false)
              if (allowSpoke || allowLateral) {
                const w = (1 - d / CLUSTER_EDGE_MAX) * (0.82 + 0.18 * Math.sin(t * 0.65 + i * 0.05 + j * 0.025))
                /** Lateral hops dominate; spokes stay faint → mesh, not hub-and-spokes */
                if (isSpoke) alpha += w * 0.012
                else alpha += w * 0.048
              }
            }
          }

          const touchesHoveredAnchor = hiIdxPre >= 0 && (i === hiIdxPre || j === hiIdxPre)
          const clusterOnly =
            hiIdxPre >= 0 && i !== hiIdxPre && j !== hiIdxPre && inAi && inAj && d < CLUSTER_EDGE_MAX

          const key = `${i},${j}`
          let smooth = alpha
          if (!reducedMotion) {
            const prev = pairAlphaSmooth.get(key) ?? 0
            const rise = alpha > prev + 0.002
            let rateRise = rise ? (alpha > 0.1 ? 0.28 : alpha > 0.05 ? 0.22 : 0.16) : 0.15
            let rateFall = 0.17
            if (touchesHoveredAnchor || clusterOnly) {
              /** Slow ease-in/out around the anchor — magnetic attachment without a scribble burst */
              rateRise = rise ? 0.078 : 0.078
              rateFall = 0.042
            } else if (p.inside) {
              /** Smooth “joining” as the cursor discovers chords */
              rateRise = rise ? (alpha > 0.08 ? 0.1 : 0.078) : 0.078
              rateFall = 0.055
            }
            smooth = prev * (1 - (rise ? rateRise : rateFall)) + alpha * (rise ? rateRise : rateFall)
            if (smooth < 0.014 && alpha < 0.008) {
              pairAlphaSmooth.delete(key)
            } else {
              pairAlphaSmooth.set(key, smooth)
            }
          }

          if (smooth < 0.026) continue
          smooth = Math.min(
            clusterOnly ? 0.4 : touchesHoveredAnchor ? 0.36 : 0.52,
            smooth,
          )
          /** Accent lateral mesh near anchor; spokes stay body-colored → interconnected, not radial */
          const accentEdge = clusterOnly
          const isSpoke = touchesHoveredAnchor
          ctx.strokeStyle = accentEdge ? colors.primary : colors.line
          ctx.globalAlpha = accentEdge
            ? Math.min(1, smooth * 0.9)
            : isSpoke
              ? Math.min(1, smooth * 0.98)
              : Math.min(1, smooth * 1.06)
          ctx.lineWidth = 0.56 + (accentEdge ? 0.14 : isSpoke ? 0.05 : 0.07)
          const reveal = reducedMotion ? 1 : Math.min(1, (smooth - 0.012) / 0.2 + 0.04)
          if (reveal < 0.998 && d > 4 && !reducedMotion) {
            ctx.setLineDash([Math.max(0.6, d * reveal), 8000])
          } else {
            ctx.setLineDash([])
          }
          ctx.beginPath()
          ctx.moveTo(ax, ay)
          ctx.lineTo(bx, by)
          ctx.stroke()
          ctx.setLineDash([])
        }
      }

      const gnx = L.ghostNx
      const gny = L.ghostNy
      if (gnx.length > 0) {
        for (let gi = 0; gi < gnx.length; gi++) {
          const pulse = 0.85 + 0.15 * Math.sin(t * 1.2 + gi * 0.91)
          ctx.fillStyle = colors.text3
          ctx.globalAlpha = 0.09 * pulse
          ctx.beginPath()
          ctx.arc(gnx[gi], gny[gi], 0.92 + 0.12 * pulse, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }

      pruneFrame += 1
      if (pruneFrame >= 90) {
        pruneFrame = 0
        for (const [k, v] of pairAlphaSmooth) {
          if (v < 0.008) pairAlphaSmooth.delete(k)
        }
      }

      ctx.globalAlpha = 1
      for (let i = 0; i < total; i++) {
        const x = nx[i]
        const y = ny[i]
        const isA = anchorMask[i] === 1
        if (isA) {
          const pulse = reducedMotion
            ? 1
            : 0.92 + 0.08 * Math.sin(t * 2.35 + i * 0.31)
          const ringR = ANCHOR_RING_R * pulse
          const dotR = ANCHOR_DOT_R * (reducedMotion ? 1 : 0.96 + 0.04 * Math.sin(t * 2.8 + i * 0.27))
          let ringAlpha = 0.88 * pulse
          let fillAlpha = 0.95 * pulse
          if (p.inside && !reducedMotion) {
            const dc = Math.hypot(mx - x, my - y)
            const glow = Math.exp(-dc / (CURSOR_NODE_GLOW_R * 0.88))
            ringAlpha += glow * 0.1
            fillAlpha += glow * 0.06
          }
          ctx.strokeStyle = colors.primary
          ctx.fillStyle = colors.primary
          ctx.lineWidth = ANCHOR_RING_WIDTH
          ctx.globalAlpha = ringAlpha
          ctx.beginPath()
          ctx.arc(x, y, ringR, 0, Math.PI * 2)
          ctx.stroke()
          ctx.globalAlpha = fillAlpha
          ctx.beginPath()
          ctx.arc(x, y, dotR, 0, Math.PI * 2)
          ctx.fill()
        } else {
          const rBase = 1.45 + (reducedMotion ? 0 : 0.25 * Math.sin(t * 0.6 + i * 0.17))
          let r = rBase
          let dotA = 0.32
          if (p.inside && !reducedMotion) {
            const dc = Math.hypot(mx - x, my - y)
            const glow = Math.exp(-dc / CURSOR_NODE_GLOW_R)
            r = rBase * (1 + 0.45 * glow)
            dotA = 0.3 + glow * 0.34
          }
          ctx.fillStyle = colors.text2
          ctx.globalAlpha = dotA
          ctx.beginPath()
          ctx.arc(x, y, r, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1

      raf = requestAnimationFrame(loop)
    }

    rebuild()
    raf = requestAnimationFrame(loop)

    const ro = new ResizeObserver(() => {
      rebuild()
      syncPill()
    })
    ro.observe(hero)
    ro.observe(textColumnEl)
    const portraitObs = portraitExcludeRef.current
    if (portraitObs) ro.observe(portraitObs)

    const onMove = (e: PointerEvent) => {
      const hr = hero.getBoundingClientRect()
      const lx = e.clientX - hr.left
      const ly = e.clientY - hr.top
      const pr = lastPointerPosRef.current
      if (pr.x < -90000) {
        lastPointerPosRef.current = { x: lx, y: ly }
        lastPointerMoveRef.current = performance.now()
      } else {
        const moved = Math.hypot(lx - pr.x, ly - pr.y)
        if (moved > 2.5) {
          lastPointerMoveRef.current = performance.now()
          lastPointerPosRef.current = { x: lx, y: ly }
        }
      }
      pointerRef.current = {
        x: lx,
        y: ly,
        inside: true,
      }
      let best = -1
      let bestD = HIT_RADIUS
      const L = layoutRef.current
      for (let a = 0; a < NUM_ANCHORS; a++) {
        const i = L.numNormal + a
        const d = Math.hypot(pointerRef.current.x - L.nx[i], pointerRef.current.y - L.ny[i])
        if (d < bestD) {
          bestD = d
          best = a
        }
      }
      if (hoverAnchorRef.current !== best) {
        hoverAnchorRef.current = best
        if (best >= 0) updatePillUI(best, L.nx[L.numNormal + best], L.ny[L.numNormal + best])
        else setPill(null)
      } else if (best >= 0) {
        updatePillUI(best, L.nx[L.numNormal + best], L.ny[L.numNormal + best])
      }
    }

    const onLeave = () => {
      pointerRef.current.inside = false
      hoverAnchorRef.current = -1
      setPill(null)
      lastPointerPosRef.current = { x: -99999, y: -99999 }
      cursorScrubSmoothedRef.current = 0
    }

    const onDown = (e: PointerEvent) => {
      if (isInteractiveTarget(e.target)) return
      if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return
      const hr = hero.getBoundingClientRect()
      const lx = e.clientX - hr.left
      const ly = e.clientY - hr.top
      const L = layoutRef.current
      let hit = false
      for (let a = 0; a < NUM_ANCHORS; a++) {
        const i = L.numNormal + a
        if (Math.hypot(lx - L.nx[i], ly - L.ny[i]) < HIT_RADIUS + 12) {
          hoverAnchorRef.current = a
          updatePillUI(a, L.nx[i], L.ny[i])
          hit = true
          break
        }
      }
      if (!hit) {
        hoverAnchorRef.current = -1
        setPill(null)
      }
    }

    hero.addEventListener('pointermove', onMove, { passive: true })
    hero.addEventListener('pointerleave', onLeave, { passive: true })
    hero.addEventListener('pointerdown', onDown, { passive: true })

    return () => {
      alive = false
      ro.disconnect()
      if (raf) cancelAnimationFrame(raf)
      hero.removeEventListener('pointermove', onMove)
      hero.removeEventListener('pointerleave', onLeave)
      hero.removeEventListener('pointerdown', onDown)
    }
  }, [heroRef, textColumnRef, portraitExcludeRef, keywords, reducedMotion])

  return (
    <>
      <canvas ref={canvasRef} className="hero-network-canvas" aria-hidden />
      {pill ? (
        <div className="hero-network-pill" style={{ left: pill.left, top: pill.top }} role="status" aria-live="polite">
          {pill.label}
        </div>
      ) : null}
    </>
  )
}
