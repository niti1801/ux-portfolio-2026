import { useEffect, useRef, type RefObject } from 'react'

type Point = { x: number; y: number }

type Props = {
  /** Intersection + pointer + size target (e.g. hero `<section>`, lab `<div>`) */
  heroRef: RefObject<HTMLElement | null> | RefObject<HTMLDivElement | null>
  reducedMotion: boolean
}

/** Match `.hero-bg::before` (`background-size: 36px`) so lines meet the CSS dots */
const GRID_STEP = 36
/** Cursor influence — tight patch that follows movement (px) */
const INFLUENCE_RADIUS = 104
/** Per-frame decay on activation when not refreshed by cursor (trail length) */
const TRAIL_DECAY = 0.965
/** How quickly activation rises/falls toward cursor target each frame */
const RESPONSE_EASING = 0.28
/** Stop rAF when no pointer and all activations below this */
const ACTIVATION_CUTOFF = 0.008
/** Edge opacity scales with min(endpoint activation) */
const LINE_ALPHA_SCALE = 0.4
const MIN_EDGE_ALPHA = 0.018
const MAX_LINE_WIDTH = 1.35
const MIN_LINE_WIDTH = 0.85
const NODE_MIN_RADIUS = 0.78
const NODE_MAX_RADIUS = 2.05
const NODE_ALPHA_SCALE = 0.34
const POINTER_FOLLOW_EASING = 0.18
const THREAD_RADIUS = 260
const THREAD_BOOST_SCALE = 0.95

/** Reduce visual density around headline copy so text has more breathing room. */
function calmZoneFactor(x: number, y: number, w: number, h: number): number {
  const cx = w * 0.34
  const cy = h * 0.43
  const rx = w * 0.33
  const ry = h * 0.28
  const nx = (x - cx) / Math.max(rx, 1)
  const ny = (y - cy) / Math.max(ry, 1)
  const d2 = nx * nx + ny * ny
  if (d2 >= 1) return 1
  const t = 1 - d2
  return 1 - t * 0.72
}

/** Subtle irregular motion for rendered positions only (activation uses base grid). */
const DRIFT_STRENGTH = 1.1

function organicDrift(i: number, x: number, y: number, driftT: number): { dx: number; dy: number } {
  const p = i * 0.618 + x * 0.009 + y * 0.011
  const dx =
    Math.sin(driftT * 1.1 + p) * 0.52 +
    Math.sin(driftT * 0.73 + p * 1.7 + x * 0.02) * 0.35
  const dy =
    Math.cos(driftT * 0.97 + p * 1.2) * 0.48 +
    Math.cos(driftT * 0.64 + p * 0.9 + y * 0.02) * 0.4
  return { dx: dx * DRIFT_STRENGTH, dy: dy * DRIFT_STRENGTH }
}

function buildGrid(width: number, height: number, step: number): Point[] {
  const nodes: Point[] = []
  const half = step / 2
  for (let x = half; x < width; x += step) {
    for (let y = half; y < height; y += step) {
      nodes.push({ x, y })
    }
  }
  return nodes
}

/** Undirected 4-neighbor edges (right + down) aligned to the grid */
function buildNeighborEdges(nodes: Point[], step: number): Array<[number, number]> {
  const map = new Map<string, number>()
  for (let i = 0; i < nodes.length; i++) {
    map.set(`${nodes[i].x},${nodes[i].y}`, i)
  }
  const edges: Array<[number, number]> = []
  for (let i = 0; i < nodes.length; i++) {
    const { x, y } = nodes[i]
    const right = map.get(`${x + step},${y}`)
    if (right !== undefined && i < right) edges.push([i, right])
    const down = map.get(`${x},${y + step}`)
    if (down !== undefined && i < down) edges.push([i, down])
  }
  return edges
}

function dist(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx
  const dy = ay - by
  return Math.hypot(dx, dy)
}

/** Smooth bump 0..1 from distance to cursor (quadratic falloff) */
function cursorFalloff(d: number, radius: number): number {
  if (d >= radius || radius <= 0) return 0
  const t = 1 - d / radius
  return t * t
}

export function HeroNetworkCanvas({ heroRef, reducedMotion }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Point[]>([])
  const edgesRef = useRef<Array<[number, number]>>([])
  const activationRef = useRef<Float32Array>(new Float32Array(0))
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 })
  const pointerRef = useRef({ x: 0, y: 0, inside: false })
  const pointerTargetRef = useRef({ x: 0, y: 0 })
  const inViewRef = useRef(true)

  useEffect(() => {
    if (reducedMotion) return

    const canvas = canvasRef.current
    const hero = heroRef.current
    if (!canvas || !hero) return

    const root = document.documentElement
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let alive = true

    const resize = () => {
      const w = hero.clientWidth
      const h = hero.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      sizeRef.current = { w, h, dpr }
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const nodes = buildGrid(w, h, GRID_STEP)
      nodesRef.current = nodes
      edgesRef.current = buildNeighborEdges(nodes, GRID_STEP)
      activationRef.current = new Float32Array(nodes.length)
    }

    const pickColors = () => {
      const cs = getComputedStyle(root)
      const primary = (cs.getPropertyValue('--primary').trim() || '#ea9780').replace(/\s+/g, '')
      return { primary }
    }

    const schedule = () => {
      if (raf) return
      raf = requestAnimationFrame(loop)
    }

    const onMove = (e: Event) => {
      const ev = e as PointerEvent
      if (ev.pointerType && ev.pointerType !== 'mouse') return
      const r = hero.getBoundingClientRect()
      pointerTargetRef.current.x = ev.clientX - r.left
      pointerTargetRef.current.y = ev.clientY - r.top
      pointerRef.current.inside = true
      schedule()
    }

    const onEnter = (e: Event) => {
      const ev = e as PointerEvent
      pointerRef.current.inside = true
      const r = hero.getBoundingClientRect()
      const nx = ev.clientX - r.left
      const ny = ev.clientY - r.top
      pointerTargetRef.current.x = nx
      pointerTargetRef.current.y = ny
      pointerRef.current.x = nx
      pointerRef.current.y = ny
      schedule()
    }

    const onLeave = () => {
      pointerRef.current.inside = false
      schedule()
    }

    const loop = () => {
      raf = 0
      if (!alive || !inViewRef.current) return

      const { w, h } = sizeRef.current
      if (w < 1 || h < 1) return

      const p = pointerRef.current
      const nodes = nodesRef.current
      const edges = edgesRef.current
      const activation = activationRef.current
      if (p.inside) {
        p.x += (pointerTargetRef.current.x - p.x) * POINTER_FOLLOW_EASING
        p.y += (pointerTargetRef.current.y - p.y) * POINTER_FOLLOW_EASING
      }
      const cx = p.x
      const cy = p.y
      const R = INFLUENCE_RADIUS
      const t = performance.now() * 0.0012
      const driftT = performance.now() * 0.00038

      let maxAct = 0
      if (p.inside) {
        for (let i = 0; i < nodes.length; i++) {
          const d = dist(nodes[i].x, nodes[i].y, cx, cy)
          const bump = cursorFalloff(d, R)
          const decayed = activation[i] * TRAIL_DECAY
          const v = decayed + (bump - decayed) * RESPONSE_EASING
          activation[i] = v
          if (v > maxAct) maxAct = v
        }
      } else {
        for (let i = 0; i < activation.length; i++) {
          activation[i] *= TRAIL_DECAY
          const v = activation[i]
          if (v > maxAct) maxAct = v
        }
      }

      ctx.clearRect(0, 0, w, h)

      if (maxAct < ACTIVATION_CUTOFF && !p.inside) {
        activation.fill(0)
        return
      }

      const colors = pickColors()
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = colors.primary

      let portraitCenterX = 0
      let portraitCenterY = 0
      let hasPortraitTarget = false
      const portraitEl = hero.querySelector('.hero-portrait') as HTMLElement | null
      if (portraitEl?.matches(':hover')) {
        const heroRect = hero.getBoundingClientRect()
        const portraitRect = portraitEl.getBoundingClientRect()
        portraitCenterX = portraitRect.left - heroRect.left + portraitRect.width * 0.5
        portraitCenterY = portraitRect.top - heroRect.top + portraitRect.height * 0.5
        hasPortraitTarget = true
      }

      for (let e = 0; e < edges.length; e++) {
        const [i, j] = edges[e]
        const ai = activation[i]
        const aj = activation[j]
        const edgeStrength = Math.min(ai, aj)
        const a = nodes[i]
        const b = nodes[j]
        const mx = (a.x + b.x) * 0.5
        const my = (a.y + b.y) * 0.5
        const zone = calmZoneFactor(mx, my, w, h)
        let alpha = edgeStrength * LINE_ALPHA_SCALE * zone
        if (hasPortraitTarget) {
          const pd = dist(mx, my, portraitCenterX, portraitCenterY)
          const towardPortrait = cursorFalloff(pd, THREAD_RADIUS)
          alpha *= 1 + towardPortrait * THREAD_BOOST_SCALE
        }
        if (alpha < MIN_EDGE_ALPHA) continue
        ctx.globalAlpha = Math.min(1, alpha)
        ctx.lineWidth = MIN_LINE_WIDTH + edgeStrength * (MAX_LINE_WIDTH - MIN_LINE_WIDTH)
        const da = organicDrift(i, a.x, a.y, driftT)
        const db = organicDrift(j, b.x, b.y, driftT)
        ctx.beginPath()
        ctx.moveTo(a.x + da.dx, a.y + da.dy)
        ctx.lineTo(b.x + db.dx, b.y + db.dy)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      // Soft, breathing nodes at active intersections for a warmer, human feel.
      for (let i = 0; i < nodes.length; i++) {
        const a = activation[i]
        if (a < 0.07) continue
        const n = nodes[i]
        const pulse = 0.86 + Math.sin(t + i * 0.19) * 0.14
        const zone = calmZoneFactor(n.x, n.y, w, h)
        const alpha = Math.min(1, a * NODE_ALPHA_SCALE * pulse * zone)
        if (alpha < 0.02) continue
        const r = NODE_MIN_RADIUS + a * (NODE_MAX_RADIUS - NODE_MIN_RADIUS) * pulse
        ctx.globalAlpha = alpha
        ctx.fillStyle = colors.primary
        const d = organicDrift(i, n.x, n.y, driftT)
        ctx.beginPath()
        ctx.arc(n.x + d.dx, n.y + d.dy, r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      if (p.inside || maxAct >= ACTIVATION_CUTOFF) {
        raf = requestAnimationFrame(loop)
      }
    }

    const ro = new ResizeObserver(() => {
      resize()
      if (inViewRef.current && pointerRef.current.inside) {
        schedule()
      }
    })
    ro.observe(hero)

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        inViewRef.current = e?.isIntersecting ?? true
        if (!inViewRef.current && raf) {
          cancelAnimationFrame(raf)
          raf = 0
          ctx.clearRect(0, 0, sizeRef.current.w, sizeRef.current.h)
          activationRef.current.fill(0)
        }
      },
      { threshold: 0, rootMargin: '80px' },
    )
    io.observe(hero)

    resize()

    hero.addEventListener('pointermove', onMove, { passive: true })
    hero.addEventListener('pointerenter', onEnter, { passive: true })
    hero.addEventListener('pointerleave', onLeave, { passive: true })

    return () => {
      alive = false
      ro.disconnect()
      io.disconnect()
      hero.removeEventListener('pointermove', onMove)
      hero.removeEventListener('pointerenter', onEnter)
      hero.removeEventListener('pointerleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [heroRef, reducedMotion])

  if (reducedMotion) return null

  return <canvas ref={canvasRef} className="hero-network-canvas" aria-hidden />
}
