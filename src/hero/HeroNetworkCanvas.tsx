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
const TRAIL_DECAY = 0.94
/** Stop rAF when no pointer and all activations below this */
const ACTIVATION_CUTOFF = 0.008
/** Edge opacity scales with min(endpoint activation) */
const LINE_ALPHA_SCALE = 0.4
const MIN_EDGE_ALPHA = 0.018
const MAX_LINE_WIDTH = 1.35
const MIN_LINE_WIDTH = 0.85

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
      pointerRef.current.x = ev.clientX - r.left
      pointerRef.current.y = ev.clientY - r.top
      pointerRef.current.inside = true
      schedule()
    }

    const onEnter = (e: Event) => {
      const ev = e as PointerEvent
      pointerRef.current.inside = true
      const r = hero.getBoundingClientRect()
      pointerRef.current.x = ev.clientX - r.left
      pointerRef.current.y = ev.clientY - r.top
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
      const cx = p.x
      const cy = p.y
      const R = INFLUENCE_RADIUS

      let maxAct = 0
      if (p.inside) {
        for (let i = 0; i < nodes.length; i++) {
          const d = dist(nodes[i].x, nodes[i].y, cx, cy)
          const bump = cursorFalloff(d, R)
          const v = Math.max(activation[i] * TRAIL_DECAY, bump)
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

      for (let e = 0; e < edges.length; e++) {
        const [i, j] = edges[e]
        const ai = activation[i]
        const aj = activation[j]
        const edgeStrength = Math.min(ai, aj)
        const alpha = edgeStrength * LINE_ALPHA_SCALE
        if (alpha < MIN_EDGE_ALPHA) continue
        ctx.globalAlpha = Math.min(1, alpha)
        ctx.lineWidth = MIN_LINE_WIDTH + edgeStrength * (MAX_LINE_WIDTH - MIN_LINE_WIDTH)
        const a = nodes[i]
        const b = nodes[j]
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
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
