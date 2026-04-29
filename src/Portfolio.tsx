import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type ReactNode,
} from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionStyle, type MotionValue } from 'framer-motion'
import lightNavLogo from './assets/light-logo-original-sq.png'
import darkNavLogo from './assets/dark-logo-original-sq.png'
import nitiHeroPortrait from './assets/niti-profile-img1.png'
import { landingPageCopy } from './content/landingPageCopy'
import { HeroNetworkCanvas } from './hero/HeroNetworkCanvas'
import { siteShowsThemeSwitch } from './config/siteThemeMode'
import { useTheme } from './theme/ThemeProvider'
import './portfolio.css'

type NavSection = 'work' | 'about' | 'methods' | 'testimonials' | 'contact'

/** Strip trailing arrow from markdown CTA so the arrow can animate like the resume button */
function workCardCtaLabel(cardCta: string): string {
  return cardCta.replace(/\s*[→›]\s*$/, '').trim()
}

function splitRoleCompany(role: string): { roleLabel: string; companyLabel: string } {
  const [roleLabelRaw, companyLabelRaw] = role.split('·').map((part) => part.trim())
  return {
    roleLabel: roleLabelRaw ?? role,
    companyLabel: companyLabelRaw ?? '',
  }
}

type ParallaxFeaturedShellProps = {
  cardClassName: string
  rtl?: boolean
  imageClassName?: string
  imageStyle?: CSSProperties
  /** Alternate vertical range so adjacent cards feel less identical */
  parallaxInvert?: boolean
  visual: ReactNode
  children: ReactNode
}

type StackedWorkCardProps = {
  index: number
  total: number
  progress: MotionValue<number>
  stackRef: RefObject<HTMLDivElement | null>
  children: ReactNode
}

function StackedWorkCard({ index, total, progress, stackRef, children }: StackedWorkCardProps) {
  const reduceMotion = useReducedMotion()
  const smoothProgress = useSpring(progress, { stiffness: 165, damping: 21, mass: 0.3 })
  const targetScale = reduceMotion === true ? 1 : 0.945
  const segment = 1 / total
  const isLast = index === total - 1
  const shrinkStart = Math.min(index * segment + segment * 0.62, 1)
  const shrinkEnd = Math.min(index * segment + segment * 0.9, 1)
  const yLift = reduceMotion === true ? 0 : -18
  const scale = useTransform(smoothProgress, (p) => {
    if (isLast) return 1
    if (reduceMotion === true) return 1
    if (p <= shrinkStart) return 1
    if (p >= shrinkEnd) return targetScale
    const t = (p - shrinkStart) / Math.max(shrinkEnd - shrinkStart, 0.0001)
    return 1 + (targetScale - 1) * t
  })
  const y = useTransform(smoothProgress, (p) => {
    if (isLast) return 0
    if (reduceMotion === true) return 0
    if (p <= shrinkStart) return 0
    if (p >= shrinkEnd) return yLift
    const t = (p - shrinkStart) / Math.max(shrinkEnd - shrinkStart, 0.0001)
    return yLift * t
  })
  return (
    <div ref={stackRef} className="work-stack-item" style={{ zIndex: index + 1 }}>
      <motion.div className="work-stack-sticky" style={{ scale, y }}>
        {children}
      </motion.div>
    </div>
  )
}

function ParallaxFeaturedShell({
  cardClassName,
  rtl,
  imageClassName,
  imageStyle,
  parallaxInvert,
  visual,
  children,
}: ParallaxFeaturedShellProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'end start'],
  })
  const y0 = reduceMotion === true ? 0 : parallaxInvert ? 28 : -28
  const y1 = reduceMotion === true ? 0 : parallaxInvert ? -28 : 28
  const imageY = useTransform(scrollYProgress, [0, 1], [y0, y1])

  const imageClasses = ['work-card-image', imageClassName].filter(Boolean).join(' ')
  const motionImageStyle = {
    ...(rtl ? { direction: 'ltr' as const } : {}),
    ...(imageStyle ?? {}),
    y: imageY,
  } satisfies MotionStyle

  return (
    <div ref={cardRef} className={cardClassName} style={rtl ? { direction: 'rtl' } : undefined}>
      <motion.div className={imageClasses} style={motionImageStyle}>
        {visual}
      </motion.div>
      <div className="work-card-body" style={rtl ? { direction: 'ltr' } : undefined}>
        {children}
      </div>
    </div>
  )
}

export function Portfolio() {
  const copy = landingPageCopy
  const baseHref = import.meta.env.BASE_URL
  const navRef = useRef<HTMLElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const orb1Ref = useRef<HTMLDivElement>(null)
  const orb2Ref = useRef<HTMLDivElement>(null)
  const orb3Ref = useRef<HTMLDivElement>(null)
  const portraitRef = useRef<HTMLDivElement>(null)
  const workStackRef1 = useRef<HTMLDivElement>(null)
  const workStackRef2 = useRef<HTMLDivElement>(null)
  const workStackRef3 = useRef<HTMLDivElement>(null)
  const workStackRef4 = useRef<HTMLDivElement>(null)
  const workStackRefs = [workStackRef1, workStackRef2, workStackRef3, workStackRef4]
  const workStackRootRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { resolvedTheme, setPreference } = useTheme()
  const showThemeSwitch = siteShowsThemeSwitch()
  const [activeSection, setActiveSection] = useState<NavSection | null>(null)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [mobileNavTopOffset, setMobileNavTopOffset] = useState(80)
  const { scrollYProgress: workStackProgress } = useScroll({
    target: workStackRootRef,
    offset: ['start 78%', 'end 22%'],
  })
  const testimonialSlides = [
    { quote: copy.testimonials.featuredQuote, name: copy.testimonials.featuredName, role: copy.testimonials.featuredRole },
    { quote: copy.testimonials.card1Quote, name: copy.testimonials.card1Name, role: copy.testimonials.card1Role },
    { quote: copy.testimonials.card2Quote, name: copy.testimonials.card2Name, role: copy.testimonials.card2Role },
    { quote: copy.testimonials.card3Quote, name: copy.testimonials.card3Name, role: copy.testimonials.card3Role },
  ]
  const contactHeadingEmphasis = 'for me?'
  const contactHeadingLower = copy.contact.heading.toLowerCase()
  const contactHeadingStart = contactHeadingLower.lastIndexOf(contactHeadingEmphasis)
  const contactHeadingHasEmphasis = contactHeadingStart >= 0
  const contactHeadingPrefix = contactHeadingHasEmphasis
    ? copy.contact.heading.slice(0, contactHeadingStart).trimEnd()
    : copy.contact.heading
  const workHeadingEmphasis = 'work'
  const workHeadingLower = copy.work.heading.toLowerCase()
  const workHeadingStart = workHeadingLower.lastIndexOf(workHeadingEmphasis)
  const workHeadingHasEmphasis = workHeadingStart >= 0
  const workHeadingPrefix = workHeadingHasEmphasis
    ? copy.work.heading.slice(0, workHeadingStart).trimEnd()
    : copy.work.heading
  const workHeadingSuffix = workHeadingHasEmphasis
    ? copy.work.heading.slice(workHeadingStart + workHeadingEmphasis.length)
    : ''
  const testimonialsHeadingEmphasis = 'say'
  const testimonialsHeadingLower = copy.testimonials.heading.toLowerCase()
  const testimonialsHeadingStart = testimonialsHeadingLower.lastIndexOf(testimonialsHeadingEmphasis)
  const testimonialsHeadingHasEmphasis = testimonialsHeadingStart >= 0
  const testimonialsHeadingPrefix = testimonialsHeadingHasEmphasis
    ? copy.testimonials.heading.slice(0, testimonialsHeadingStart).trimEnd()
    : copy.testimonials.heading
  const testimonialsHeadingSuffix = testimonialsHeadingHasEmphasis
    ? copy.testimonials.heading.slice(testimonialsHeadingStart + testimonialsHeadingEmphasis.length)
    : ''

  const toggleTheme = useCallback(() => {
    setPreference(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setPreference])

  const closeMobileNav = useCallback(() => {
    setIsMobileNavOpen(false)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }, [])

  const goHome = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0) return
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const isMobileViewport = window.matchMedia('(max-width: 900px)').matches
    const clickedName =
      e.target instanceof Element && e.target.closest('.nav-brand__name') !== null
    if (isMobileViewport) {
      e.preventDefault()
      if (clickedName) {
        closeMobileNav()
        window.scrollTo({ top: 0, behavior: 'smooth' })
        try {
          history.replaceState(null, '', '#home')
        } catch {
          /* ignore */
        }
      } else if (isMobileNavOpen) {
        closeMobileNav()
      } else {
        setIsMobileNavOpen(true)
      }
      return
    }
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    try {
      history.replaceState(null, '', '#home')
    } catch {
      /* ignore */
    }
  }, [closeMobileNav, isMobileNavOpen])

  const onPortraitPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduceMotion === true) return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const nx = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1)
    const ny = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1)
    const tx = (nx - 0.5) * 10
    const ty = (ny - 0.5) * 8
    el.style.setProperty('--portrait-shift-x', `${tx.toFixed(2)}px`)
    el.style.setProperty('--portrait-shift-y', `${ty.toFixed(2)}px`)
  }, [reduceMotion])

  const onPortraitPointerLeave = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    el.style.setProperty('--portrait-shift-x', '0px')
    el.style.setProperty('--portrait-shift-y', '0px')
  }, [])

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 40)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (reduceMotion) return
    const hero = heroRef.current
    if (!hero) return

    const orbEls = [orb1Ref.current, orb2Ref.current, orb3Ref.current]
    const strengths = [
      { sx: 24, sy: 18 },
      { sx: 32, sy: 24 },
      { sx: 44, sy: 32 },
    ]
    const t = strengths.map(() => ({ tx: 0, ty: 0, cx: 0, cy: 0 }))
    let raf = 0

    const tick = () => {
      let alive = false
      for (let i = 0; i < t.length; i++) {
        t[i].cx += (t[i].tx - t[i].cx) * 0.08
        t[i].cy += (t[i].ty - t[i].cy) * 0.08
        const el = orbEls[i]
        if (el) el.style.transform = `translate3d(${t[i].cx.toFixed(2)}px, ${t[i].cy.toFixed(2)}px, 0)`
        if (Math.abs(t[i].tx - t[i].cx) > 0.05 || Math.abs(t[i].ty - t[i].cy) > 0.05) alive = true
      }
      raf = alive ? requestAnimationFrame(tick) : 0
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse') return
      const r = hero.getBoundingClientRect()
      const nx = (e.clientX - r.left) / r.width - 0.5
      const ny = (e.clientY - r.top) / r.height - 0.5
      for (let i = 0; i < t.length; i++) {
        t[i].tx = nx * strengths[i].sx
        t[i].ty = ny * strengths[i].sy
      }
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const onLeave = () => {
      for (let i = 0; i < t.length; i++) {
        t[i].tx = 0
        t[i].ty = 0
      }
      if (!raf) raf = requestAnimationFrame(tick)
    }

    hero.addEventListener('pointermove', onMove)
    hero.addEventListener('pointerleave', onLeave)
    return () => {
      hero.removeEventListener('pointermove', onMove)
      hero.removeEventListener('pointerleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [reduceMotion])

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
    if (els.length === 0) return

    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('visible'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0, rootMargin: '0px 0px 10% 0px' },
    )
    els.forEach((el) => io.observe(el))

    // Fallback: ensure content never stays hidden if observer misses (e.g., hash loads).
    const revealSafetyTimer = window.setTimeout(() => {
      els.forEach((el) => el.classList.add('visible'))
    }, 1400)

    return () => {
      io.disconnect()
      window.clearTimeout(revealSafetyTimer)
    }
  }, [])

  useEffect(() => {
    const sectionIds: NavSection[] = ['work', 'about', 'methods', 'testimonials', 'contact']
    const sectionEls = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    if (sectionEls.length === 0) return

    const updateActiveSection = () => {
      const navHeight = navRef.current?.offsetHeight ?? 0
      const activationLine = navHeight + window.innerHeight * 0.35
      let currentId: NavSection | null = null

      for (const sectionEl of sectionEls) {
        if (sectionEl.getBoundingClientRect().top <= activationLine) {
          currentId = sectionEl.id as NavSection
        } else {
          break
        }
      }

      setActiveSection(currentId)
    }

    let rafId = 0
    const onScrollOrResize = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = 0
        updateActiveSection()
      })
    }

    updateActiveSection()
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize)

    return () => {
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  useEffect(() => {
    if (reduceMotion === true) return
    const timer = window.setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonialSlides.length)
    }, 5200)
    return () => window.clearInterval(timer)
  }, [reduceMotion, testimonialSlides.length])

  useEffect(() => {
    if (!isMobileNavOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileNavOpen])

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia('(min-width: 901px)').matches) {
        setIsMobileNavOpen(false)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const syncMobileNavTopOffset = () => {
      const nextOffset = navRef.current?.offsetHeight ?? 80
      setMobileNavTopOffset(nextOffset)
    }
    syncMobileNavTopOffset()
    window.addEventListener('resize', syncMobileNavTopOffset)
    window.addEventListener('scroll', syncMobileNavTopOffset, { passive: true })
    return () => {
      window.removeEventListener('resize', syncMobileNavTopOffset)
      window.removeEventListener('scroll', syncMobileNavTopOffset)
    }
  }, [])

  return (
    <>

<nav id="nav" ref={navRef} className={isMobileNavOpen ? 'mobile-nav-open' : undefined}>
  <div className="container">
    <div className="nav-inner">
      <div className={isMobileNavOpen ? 'nav-brand-shell mobile-nav-open' : 'nav-brand-shell'}>
        <a
          href="#home"
          className="nav-brand"
          aria-label={isMobileNavOpen ? 'Close menu' : 'Niti Punjabi — home'}
          onClick={goHome}
        >
          <span className="nav-brand__logo" aria-hidden="true">
            <img
              src={resolvedTheme === 'dark' ? darkNavLogo : lightNavLogo}
              width={40}
              height={40}
              alt=""
              decoding="async"
            />
          </span>
          <span className="nav-brand__name">Niti Punjabi</span>
        </a>
      </div>
      <ul className="nav-links">
        <li><a href="#work" className={activeSection === 'work' ? 'active' : undefined} onClick={closeMobileNav}>{copy.nav.work}</a></li>
        <li><a href="#about" className={activeSection === 'about' ? 'active' : undefined} onClick={closeMobileNav}>{copy.nav.about}</a></li>
        <li><a href="#testimonials" className={activeSection === 'testimonials' ? 'active' : undefined} onClick={closeMobileNav}>{copy.nav.testimonials}</a></li>
        <li><a href="#contact" className={activeSection === 'contact' ? 'active' : undefined} onClick={closeMobileNav}>{copy.nav.contact}</a></li>
      </ul>
      <div className="nav-actions">
        <a
          href="https://drive.google.com/file/d/10gm4pZdElG34pMUI_1riEnLzsZZx0nUg/view"
          className="btn-ghost"
          target="_blank"
          rel="noreferrer"
        >
          {copy.nav.resume}<span className="btn-ghost__arrow" aria-hidden="true">→</span>
        </a>
        {showThemeSwitch ? (
          <button
            type="button"
            className="theme-toggle"
            title="Toggle theme"
            aria-label="Toggle color theme"
            onClick={toggleTheme}
          >
            {resolvedTheme === 'dark' ? '☀️' : '🌙'}
          </button>
        ) : null}
      </div>
    </div>
  </div>
  <div
    className={isMobileNavOpen ? 'mobile-nav-backdrop open' : 'mobile-nav-backdrop'}
    style={{ top: mobileNavTopOffset }}
    onClick={closeMobileNav}
  >
    <div className={isMobileNavOpen ? 'mobile-nav-drawer open' : 'mobile-nav-drawer'} onClick={(e) => e.stopPropagation()}>
      <ul className="mobile-nav-links">
        <li><a href="#work" onClick={closeMobileNav}>{copy.nav.work}</a></li>
        <li><a href="#about" onClick={closeMobileNav}>{copy.nav.about}</a></li>
        <li><a href="#testimonials" onClick={closeMobileNav}>{copy.nav.testimonials}</a></li>
        <li><a href="#contact" onClick={closeMobileNav}>{copy.nav.contact}</a></li>
      </ul>
    </div>
  </div>
</nav>


<section className="hero" id="home" ref={heroRef}>
  <div className="hero-bg">
    <HeroNetworkCanvas heroRef={heroRef} reducedMotion={reduceMotion === true} />
    <div className="hero-orb-wrap" ref={orb1Ref}>
      <div className="hero-orb hero-orb-1"></div>
    </div>
    <div className="hero-orb-wrap" ref={orb2Ref}>
      <div className="hero-orb hero-orb-2"></div>
    </div>
    <div className="hero-orb-wrap" ref={orb3Ref}>
      <div className="hero-orb hero-orb-3"></div>
    </div>
  </div>
  <div className="container">
    <div className="hero-grid">
      <div className="hero-content">
        <div className="hero-meta-row">
          <a href="#contact" className="hero-tag">
            <div className="hero-tag-dot" aria-hidden="true" />
            <span className="eyebrow">{copy.hero.availability}</span>
          </a>
          <div className="hero-location" aria-label="Location">
            <span className="hero-location__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z" />
                <circle cx="12" cy="10" r="2.6" />
              </svg>
            </span>
            <span>Mountain View, CA</span>
          </div>
        </div>
        <div className="hero-portrait hero-portrait-mobile" aria-hidden="true">
          <div className="hero-portrait-frame">
            <img src={nitiHeroPortrait} alt="" />
          </div>
        </div>
        <h1 className="display display-xl hero-title">
          <span className="hero-title-line">{copy.hero.titleLine1} </span>
          <span className="hero-title-line">
            {copy.hero.titleLine2Prefix} <em>{copy.hero.titleLine2Emphasis}</em>.
          </span>
        </h1>
        <p className="hero-desc">
          {copy.hero.description}
        </p>
      </div>

      <div
        ref={portraitRef}
        className="hero-portrait reveal"
        onPointerMove={onPortraitPointerMove}
        onPointerLeave={onPortraitPointerLeave}
      >
        <div className="hero-portrait-frame">
          <img src={nitiHeroPortrait} alt="Niti Punjabi" />
        </div>
      </div>
    </div>
  </div>
</section>


<section id="work">
  <div className="container">
    <div className="section-header reveal">
      <div className="eyebrow">{copy.work.eyebrow}</div>
      <h2 className="display display-lg work-heading" style={{marginTop: 16.0}}>
        {workHeadingPrefix}
        {workHeadingHasEmphasis ? (
          <>
            {' '}
            <em>{workHeadingEmphasis}</em>
            {workHeadingSuffix}
          </>
        ) : null}
      </h2>
      <p className="section-subtitle">
        {copy.work.subtitlePrefix}
        {' '}
        <a href="#contact" className="section-subtitle-link">{copy.work.subtitleLink}</a>
        {copy.work.subtitleSuffix}
      </p>
    </div>

    <div className="work-grid" ref={workStackRootRef}>
      <StackedWorkCard index={0} total={4} progress={workStackProgress} stackRef={workStackRefs[0]}>
        <ParallaxFeaturedShell
          cardClassName="work-card-featured reveal"
          visual="🏥"
        >
        <div className="work-card-meta">
          <span className="work-card-num">01</span>
          <span className="tag tag-primary">{copy.work.card1Tag}</span>
          <span className="tag tag-sand">{copy.work.card1Year}</span>
        </div>
        <h3 className="work-card-title">{copy.work.card1Title}</h3>
        <p className="work-card-desc">{copy.work.card1Description}</p>
        <div className="work-card-details">
          <div><div className="work-detail-label">Methods</div><div className="work-detail-value">{copy.work.card1Methods}</div></div>
          <div><div className="work-detail-label">Duration</div><div className="work-detail-value">{copy.work.card1Duration}</div></div>
          <div><div className="work-detail-label">Participants</div><div className="work-detail-value">{copy.work.card1Participants}</div></div>
          <div><div className="work-detail-label">Outcome</div><div className="work-detail-value">{copy.work.card1Outcome}</div></div>
        </div>
        <a href={`${baseHref}case-studies/healthcare-onboarding-redesign`} className="work-card-link">
          {workCardCtaLabel(copy.work.cardCta)}
          <span className="work-card-link__arrow" aria-hidden="true">→</span>
        </a>
        </ParallaxFeaturedShell>
      </StackedWorkCard>

      <StackedWorkCard index={1} total={4} progress={workStackProgress} stackRef={workStackRefs[1]}>
        <ParallaxFeaturedShell
          cardClassName="work-card-featured reveal reveal-delay-1"
          rtl
          parallaxInvert
          imageClassName="teal-grad"
          visual="🏦"
        >
        <div className="work-card-meta">
          <span className="work-card-num">02</span>
          <span className="tag tag-teal">{copy.work.card2Tag}</span>
          <span className="tag tag-sand">{copy.work.card2Year}</span>
        </div>
        <h3 className="work-card-title">{copy.work.card2Title}</h3>
        <p className="work-card-desc">{copy.work.card2Description}</p>
        <div className="work-card-details">
          <div><div className="work-detail-label">Role</div><div className="work-detail-value">{copy.work.card2Role}</div></div>
          <div><div className="work-detail-label">Methods</div><div className="work-detail-value">{copy.work.card2Methods}</div></div>
          <div><div className="work-detail-label">Duration</div><div className="work-detail-value">{copy.work.card2Duration}</div></div>
          <div><div className="work-detail-label">Outcome</div><div className="work-detail-value">{copy.work.card2Outcome}</div></div>
        </div>
        <a href={`${baseHref}case-studies/fintech-trust-barriers`} className="work-card-link">
          {workCardCtaLabel(copy.work.cardCta)}
          <span className="work-card-link__arrow" aria-hidden="true">→</span>
        </a>
        </ParallaxFeaturedShell>
      </StackedWorkCard>

      <StackedWorkCard index={2} total={4} progress={workStackProgress} stackRef={workStackRefs[2]}>
        <ParallaxFeaturedShell
          cardClassName="work-card-featured reveal reveal-delay-2"
          imageClassName="gold-grad"
          visual="🛒"
        >
        <div className="work-card-meta">
          <span className="work-card-num">03</span>
          <span className="tag tag-gold">{copy.work.card3Tag}</span>
          <span className="tag tag-sand">{copy.work.card3Year}</span>
        </div>
        <h3 className="work-card-title">{copy.work.card3Title}</h3>
        <p className="work-card-desc">{copy.work.card3Description}</p>
        <div className="work-card-details">
          <div><div className="work-detail-label">Methods</div><div className="work-detail-value">{copy.work.card3Methods}</div></div>
          <div><div className="work-detail-label">Duration</div><div className="work-detail-value">{copy.work.card3Duration}</div></div>
          <div><div className="work-detail-label">Participants</div><div className="work-detail-value">{copy.work.card3Participants}</div></div>
          <div><div className="work-detail-label">Outcome</div><div className="work-detail-value">{copy.work.card3Outcome}</div></div>
        </div>
        <a href={`${baseHref}case-studies/ecommerce-checkout-friction`} className="work-card-link">
          {workCardCtaLabel(copy.work.cardCta)}
          <span className="work-card-link__arrow" aria-hidden="true">→</span>
        </a>
        </ParallaxFeaturedShell>
      </StackedWorkCard>

      <StackedWorkCard index={3} total={4} progress={workStackProgress} stackRef={workStackRefs[3]}>
        <ParallaxFeaturedShell
          cardClassName="work-card-featured reveal reveal-delay-3"
          rtl
          parallaxInvert
          imageStyle={{ background: 'linear-gradient(135deg, var(--primary-s), var(--accent-s))' }}
          visual="📱"
        >
        <div className="work-card-meta">
          <span className="work-card-num">04</span>
          <span className="tag tag-teal">{copy.work.card4Tag}</span>
          <span className="tag tag-sand">{copy.work.card4Year}</span>
        </div>
        <h3 className="work-card-title">{copy.work.card4Title}</h3>
        <p className="work-card-desc">{copy.work.card4Description}</p>
        <div className="work-card-details">
          <div><div className="work-detail-label">Methods</div><div className="work-detail-value">{copy.work.card4Methods}</div></div>
          <div><div className="work-detail-label">Duration</div><div className="work-detail-value">{copy.work.card4Duration}</div></div>
          <div><div className="work-detail-label">Participants</div><div className="work-detail-value">{copy.work.card4Participants}</div></div>
          <div><div className="work-detail-label">Outcome</div><div className="work-detail-value">{copy.work.card4Outcome}</div></div>
        </div>
        <a href={`${baseHref}case-studies/social-app-accessibility-audit`} className="work-card-link">
          {workCardCtaLabel(copy.work.cardCta)}
          <span className="work-card-link__arrow" aria-hidden="true">→</span>
        </a>
        </ParallaxFeaturedShell>
      </StackedWorkCard>
    </div>
  </div>
</section>


<section className="about" id="about">
  <div className="container">
    <div className="about-grid">
      <div className="about-visual-wrap reveal">
        <div className="about-portrait">
          <div className="about-portrait-inner">NP</div>
          <div className="about-portrait-label">
            <strong>Niti Punjabi</strong>
            Senior UX Researcher · 8 years
          </div>
        </div>
        <div className="about-years">
          <span className="about-years-num">8+</span>
          <div className="about-years-label">
            Years in
            <br />
            research
          </div>
        </div>
      </div>

      <div className="about-content">
        <div className="eyebrow reveal">{copy.about.eyebrow}</div>
        <h2 className="display display-lg reveal reveal-delay-1" style={{marginTop: 16.0, marginBottom: 28.0}}>
          {copy.about.heading}
        </h2>
        <p className="about-lead reveal reveal-delay-1">
          {copy.about.lead}
        </p>
        <p className="about-body reveal reveal-delay-2">
          {copy.about.paragraph1}
        </p>
        <p className="about-body reveal reveal-delay-2">
          {copy.about.paragraph2}
        </p>

        <div className="about-skills reveal reveal-delay-3">
          <div className="about-skill"><div className="about-skill-icon">🎙️</div> Moderated interviews</div>
          <div className="about-skill"><div className="about-skill-icon">📋</div> Survey design</div>
          <div className="about-skill"><div className="about-skill-icon">🧪</div> Usability testing</div>
          <div className="about-skill"><div className="about-skill-icon">🗺️</div> Journey mapping</div>
          <div className="about-skill"><div className="about-skill-icon">📊</div> Mixed methods</div>
          <div className="about-skill"><div className="about-skill-icon">🏷️</div> Affinity diagramming</div>
        </div>

        <a href={`${baseHref}about`} className="btn-tertiary reveal reveal-delay-3" style={{width: "fit-content"}}>
          {workCardCtaLabel(copy.about.cta)}
          <span className="btn-ghost__arrow" aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  </div>
</section>
<section id="testimonials">
  <div className="container">
    <div className="section-header centered reveal">
      <div className="eyebrow">{copy.testimonials.eyebrow}</div>
      <h2 className="display display-lg testimonials-heading" style={{marginTop: 16.0}}>
        {testimonialsHeadingPrefix}
        {testimonialsHeadingHasEmphasis ? (
          <>
            {' '}
            <em>{testimonialsHeadingEmphasis}</em>
            {testimonialsHeadingSuffix}
          </>
        ) : null}
      </h2>
    </div>

    <div className="testimonials-carousel reveal">
      <div
        className="testimonials-carousel-track"
        style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}
      >
        {testimonialSlides.map((slide) => {
          const roleParts = splitRoleCompany(slide.role)
          return (
            <article className="testimonial-slide" key={`${slide.name}-${slide.role}`}>
              <div className="testimonial-quote-mark">"</div>
              <p className="testimonial-text">{slide.quote}</p>
              <div className="testimonial-author">
                <div>
                  <div className="testimonial-name">{slide.name}</div>
                  <div className="testimonial-role">{roleParts.roleLabel}</div>
                  {roleParts.companyLabel ? (
                    <div className="testimonial-company">{roleParts.companyLabel}</div>
                  ) : null}
                </div>
              </div>
            </article>
          )
        })}
      </div>
      <div className="testimonials-dots" aria-hidden="true">
        {testimonialSlides.map((slide, index) => (
          <span
            key={`dot-${slide.name}-${index}`}
            className={index === activeTestimonial ? 'testimonial-dot active' : 'testimonial-dot'}
          />
        ))}
      </div>
    </div>
  </div>
</section>


<section className="footer-cta" id="contact">
  <div className="container">
    <div className="eyebrow">{copy.contact.eyebrow}</div>
    <h2 className="display display-lg footer-cta-title" style={{marginTop: 16.0}}>
      {contactHeadingPrefix}
      {contactHeadingHasEmphasis ? (
        <>
          {' '}
          <em>{contactHeadingEmphasis}</em>
        </>
      ) : null}
    </h2>
    <p className="footer-cta-subtitle">
      {copy.contact.subtitle}
    </p>
    <div className="footer-cta-actions">
      <a href={`mailto:${copy.contact.email}`} className="btn-outline">
        {copy.contact.email}
        <span className="btn-ghost__arrow" aria-hidden="true">→</span>
      </a>
      <a
        href="https://drive.google.com/uc?export=download&id=10gm4pZdElG34pMUI_1riEnLzsZZx0nUg"
        className="btn-tertiary"
      >
        {copy.contact.downloadCv}
        <span className="btn-tertiary__icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v10" />
            <path d="M8 11l4 4 4-4" />
            <path d="M5 19h14" />
          </svg>
        </span>
      </a>
    </div>
  </div>
</section>

<footer>
  <div className="container">
    <div className="footer-inner">
      <div className="footer-copy">
        {copy.footer.copyright}
      </div>
      <ul className="footer-links">
        <li>
          <a
            href={copy.footer.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit Niti Punjabi on LinkedIn"
          >
            <span className="footer-link-label">{copy.footer.linkedinLabel}</span>
            <svg
              viewBox="0 0 24 24"
              className="footer-link-icon"
              aria-hidden="true"
            >
              <rect x="1.5" y="1.5" width="21" height="21" rx="4.5" className="footer-link-icon__bg" />
              <circle cx="7.15" cy="8" r="1.35" className="footer-link-icon__fg" />
              <rect x="5.8" y="10" width="2.7" height="8.2" className="footer-link-icon__fg" />
              <path
                d="M10.3 10h2.55v1.1c.52-.82 1.5-1.35 2.76-1.35c2.22 0 3.59 1.42 3.59 3.95v4.5h-2.62v-4.08c0-1.2-.58-1.95-1.62-1.95c-1.14 0-1.94.83-1.94 2.16v3.87H10.3z"
                className="footer-link-icon__fg"
              />
            </svg>
          </a>
        </li>
      </ul>
    </div>
  </div>
</footer>
    </>
  )
}
