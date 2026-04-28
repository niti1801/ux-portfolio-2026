import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionStyle } from 'framer-motion'
import lightNavLogo from './assets/light-logo-original-sq.png'
import darkNavLogo from './assets/dark-logo-original-sq.png'
import nitiHeroPortrait from './assets/niti-profile-img1.png'
import { HeroNetworkCanvas } from './hero/HeroNetworkCanvas'
import { siteShowsThemeSwitch } from './config/siteThemeMode'
import { useTheme } from './theme/ThemeProvider'
import './portfolio.css'

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
  const navRef = useRef<HTMLElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const orb1Ref = useRef<HTMLDivElement>(null)
  const orb2Ref = useRef<HTMLDivElement>(null)
  const orb3Ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { resolvedTheme, setPreference } = useTheme()
  const showThemeSwitch = siteShowsThemeSwitch()

  const toggleTheme = useCallback(() => {
    setPreference(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setPreference])

  const goHome = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0) return
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    try {
      history.replaceState(null, '', '#home')
    } catch {
      /* ignore */
    }
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
    const els = document.querySelectorAll('.reveal')
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
    return () => io.disconnect()
  }, [])

  return (
    <>

<nav id="nav" ref={navRef}>
  <div className="container">
    <div className="nav-inner">
      <div className="nav-brand-shell">
        <a
          href="#home"
          className="nav-brand"
          aria-label="Niti Punjabi — home"
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
        <li><a href="#work">Work</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#methods">Methods</a></li>
        <li><a href="#testimonials">Testimonials</a></li>
      </ul>
      <div className="nav-actions">
        <a href="#contact" className="btn-ghost">Let's talk</a>
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
        <div className="hero-tag">
          <div className="hero-tag-dot" />
          <span className="eyebrow">Available for new projects</span>
        </div>
        <h1 className="display display-xl hero-title">
          <span className="hero-title-line">I make complex </span>
          <span className="hero-title-line">
            things <em>feel human</em>.
          </span>
        </h1>
        <p className="hero-desc">
          I'm Niti Punjabi — a UX Researcher helping teams discover what users truly need, and translating those insights into products people love.
        </p>
        <div className="hero-stats">
          <div>
            <div className="hero-stat-num">8+</div>
            <div className="hero-stat-label">Years of research</div>
          </div>
          <div>
            <div className="hero-stat-num">40+</div>
            <div className="hero-stat-label">Products shaped</div>
          </div>
          <div>
            <div className="hero-stat-num">600+</div>
            <div className="hero-stat-label">Users interviewed</div>
          </div>
        </div>
      </div>

      <div className="hero-portrait reveal">
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
      <div className="eyebrow">Case Studies</div>
      <h2 className="display display-lg" style={{marginTop: 16.0}}>Selected work</h2>
      <p className="section-subtitle">A curated collection of research projects that drove measurable product outcomes.</p>
    </div>

    <div className="work-grid">
      <ParallaxFeaturedShell
        cardClassName="work-card-featured reveal"
        visual="🏥"
      >
        <div className="work-card-meta">
          <span className="work-card-num">01</span>
          <span className="tag tag-primary">Healthcare</span>
          <span className="tag tag-sand">2024</span>
        </div>
        <h3 className="work-card-title">Redesigning patient onboarding for a digital health platform</h3>
        <p className="work-card-desc">Discovered critical friction points in a 7-step registration flow through contextual inquiry and usability testing, leading to a 52% drop-off reduction.</p>
        <div className="work-card-details">
          <div><div className="work-detail-label">Methods</div><div className="work-detail-value">Contextual Inquiry, Usability Testing</div></div>
          <div><div className="work-detail-label">Duration</div><div className="work-detail-value">12 weeks</div></div>
          <div><div className="work-detail-label">Participants</div><div className="work-detail-value">48 patients, 6 clinicians</div></div>
          <div><div className="work-detail-label">Outcome</div><div className="work-detail-value">52% drop-off reduction</div></div>
        </div>
        <a href="#" className="work-card-link">Read case study →</a>
      </ParallaxFeaturedShell>

      <ParallaxFeaturedShell
        cardClassName="work-card-featured reveal reveal-delay-1"
        rtl
        parallaxInvert
        imageClassName="teal-grad"
        visual="🏦"
      >
        <div className="work-card-meta">
          <span className="work-card-num">02</span>
          <span className="tag tag-teal">Fintech</span>
          <span className="tag tag-sand">2023</span>
        </div>
        <h3 className="work-card-title">Understanding trust barriers in a peer-to-peer lending app</h3>
        <p className="work-card-desc">Led a diary study and in-depth interviews to map trust formation over time, uncovering 6 key trust signals that became design principles.</p>
        <div className="work-card-details">
          <div><div className="work-detail-label">Methods</div><div className="work-detail-value">Diary Study, Depth Interviews</div></div>
          <div><div className="work-detail-label">Duration</div><div className="work-detail-value">8 weeks</div></div>
          <div><div className="work-detail-label">Participants</div><div className="work-detail-value">32 lenders {'&'} borrowers</div></div>
          <div><div className="work-detail-label">Outcome</div><div className="work-detail-value">6 design principles adopted</div></div>
        </div>
        <a href="#" className="work-card-link">Read case study →</a>
      </ParallaxFeaturedShell>

      <ParallaxFeaturedShell
        cardClassName="work-card-featured reveal reveal-delay-2"
        imageClassName="gold-grad"
        visual="🛒"
      >
        <div className="work-card-meta">
          <span className="work-card-num">03</span>
          <span className="tag tag-gold">E-commerce</span>
          <span className="tag tag-sand">2022</span>
        </div>
        <h3 className="work-card-title">Checkout friction mapping across 5 user segments</h3>
        <p className="work-card-desc">Card sorting and tree testing revealed a mental model mismatch in navigation that caused 28% cart abandonment.</p>
        <div className="work-card-details">
          <div><div className="work-detail-label">Methods</div><div className="work-detail-value">Card Sorting, Tree Testing</div></div>
          <div><div className="work-detail-label">Duration</div><div className="work-detail-value">10 weeks</div></div>
          <div><div className="work-detail-label">Participants</div><div className="work-detail-value">125 shoppers across 5 segments</div></div>
          <div><div className="work-detail-label">Outcome</div><div className="work-detail-value">IA redesign; 28% abandonment driver addressed</div></div>
        </div>
        <a href="#" className="work-card-link">Read case study →</a>
      </ParallaxFeaturedShell>

      <ParallaxFeaturedShell
        cardClassName="work-card-featured reveal reveal-delay-3"
        rtl
        parallaxInvert
        imageStyle={{ background: 'linear-gradient(135deg, var(--primary-s), var(--accent-s))' }}
        visual="📱"
      >
        <div className="work-card-meta">
          <span className="work-card-num">04</span>
          <span className="tag tag-teal">Consumer</span>
          <span className="tag tag-sand">2023</span>
        </div>
        <h3 className="work-card-title">Accessibility audit of a social media app for older adults</h3>
        <p className="work-card-desc">Inclusive research with 24 adults aged 60+ surfaced 31 accessibility gaps, prioritized into a 3-sprint backlog.</p>
        <div className="work-card-details">
          <div><div className="work-detail-label">Methods</div><div className="work-detail-value">Usability Sessions, Heuristic Review</div></div>
          <div><div className="work-detail-label">Duration</div><div className="work-detail-value">6 weeks</div></div>
          <div><div className="work-detail-label">Participants</div><div className="work-detail-value">24 adults aged 60+</div></div>
          <div><div className="work-detail-label">Outcome</div><div className="work-detail-value">31 gaps → 3-sprint backlog</div></div>
        </div>
        <a href="#" className="work-card-link">Read case study →</a>
      </ParallaxFeaturedShell>
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
        <div className="eyebrow reveal">About me</div>
        <h2 className="display display-lg reveal reveal-delay-1" style={{marginTop: 16.0, marginBottom: 28.0}}>
          Curious by nature. Rigorous by design.
        </h2>
        <p className="about-lead reveal reveal-delay-1">
          I believe that the best products are built on a deep understanding of the <em>people</em> who use them.
        </p>
        <p className="about-body reveal reveal-delay-2">
          With over 8 years of experience in UX research, I've partnered with teams at startups and enterprise companies to uncover the "why" behind user behavior. My work spans healthcare, fintech, and consumer apps — always grounded in empathy and rigor.
        </p>
        <p className="about-body reveal reveal-delay-2">
          I'm particularly passionate about inclusive research practices — making sure we hear from users who are often left out of the conversation: non-native speakers, people with disabilities, and those in emerging markets.
        </p>

        <div className="about-skills reveal reveal-delay-3">
          <div className="about-skill"><div className="about-skill-icon">🎙️</div> Moderated interviews</div>
          <div className="about-skill"><div className="about-skill-icon">📋</div> Survey design</div>
          <div className="about-skill"><div className="about-skill-icon">🧪</div> Usability testing</div>
          <div className="about-skill"><div className="about-skill-icon">🗺️</div> Journey mapping</div>
          <div className="about-skill"><div className="about-skill-icon">📊</div> Mixed methods</div>
          <div className="about-skill"><div className="about-skill-icon">🏷️</div> Affinity diagramming</div>
        </div>

        <a href="#contact" className="btn-primary reveal reveal-delay-3" style={{width: "fit-content"}}>Get in touch →</a>
      </div>
    </div>
  </div>
</section>


<section className="methods" id="methods">
  <div className="container">
    <div className="section-header centered reveal">
      <div className="eyebrow">Research Methods</div>
      <h2 className="display display-lg" style={{marginTop: 16.0}}>My toolkit</h2>
      <p className="section-subtitle">A mix of qualitative and quantitative methods — chosen to fit the question, not the other way around.</p>
    </div>

    <div className="methods-grid">
      <div className="method-card primary reveal">
        <div className="method-icon">🎙️</div>
        <div className="method-name">User Interviews</div>
        <p className="method-desc">Semi-structured conversations designed to surface mental models, motivations, and latent needs that surveys can't capture.</p>
        <div className="method-when">Best for</div>
        <div className="method-tags">
          <span className="method-tag">Discovery</span>
          <span className="method-tag">Generative research</span>
          <span className="method-tag">Mental models</span>
        </div>
      </div>

      <div className="method-card teal reveal reveal-delay-1">
        <div className="method-icon">🧪</div>
        <div className="method-name">Usability Testing</div>
        <p className="method-desc">Moderated and unmoderated sessions that reveal where users struggle, not just what they say they want.</p>
        <div className="method-when">Best for</div>
        <div className="method-tags">
          <span className="method-tag">Evaluative</span>
          <span className="method-tag">Prototype validation</span>
          <span className="method-tag">Iteration</span>
        </div>
      </div>

      <div className="method-card gold reveal reveal-delay-2">
        <div className="method-icon">📖</div>
        <div className="method-name">Diary Studies</div>
        <p className="method-desc">Longitudinal self-reporting that captures real-world context and behavioral change over time — not just snapshots.</p>
        <div className="method-when">Best for</div>
        <div className="method-tags">
          <span className="method-tag">Longitudinal</span>
          <span className="method-tag">Habit formation</span>
          <span className="method-tag">Context capture</span>
        </div>
      </div>

      <div className="method-card teal reveal reveal-delay-1">
        <div className="method-icon">🗺️</div>
        <div className="method-name">Journey Mapping</div>
        <p className="method-desc">Collaborative synthesis workshops that align teams around the full user experience, end-to-end, with emotional highs and lows.</p>
        <div className="method-when">Best for</div>
        <div className="method-tags">
          <span className="method-tag">Synthesis</span>
          <span className="method-tag">Cross-functional alignment</span>
          <span className="method-tag">Opportunity mapping</span>
        </div>
      </div>

      <div className="method-card primary reveal reveal-delay-2">
        <div className="method-icon">🃏</div>
        <div className="method-name">Card Sorting {'&'} Tree Testing</div>
        <p className="method-desc">Quantitative IA methods that reveal how users categorize information and find their way through navigation hierarchies.</p>
        <div className="method-when">Best for</div>
        <div className="method-tags">
          <span className="method-tag">Information Architecture</span>
          <span className="method-tag">Navigation</span>
          <span className="method-tag">Taxonomy</span>
        </div>
      </div>

      <div className="method-card gold reveal reveal-delay-3">
        <div className="method-icon">📊</div>
        <div className="method-name">Survey {'&'} Analytics</div>
        <p className="method-desc">Quantitative methods that validate qualitative findings at scale — combining behavioral data with attitudinal signals.</p>
        <div className="method-when">Best for</div>
        <div className="method-tags">
          <span className="method-tag">Validation</span>
          <span className="method-tag">Segmentation</span>
          <span className="method-tag">Measurement</span>
        </div>
      </div>
    </div>
  </div>
</section>


<section id="testimonials">
  <div className="container">
    <div className="section-header centered reveal">
      <div className="eyebrow">Testimonials</div>
      <h2 className="display display-lg" style={{marginTop: 16.0}}>What colleagues say</h2>
    </div>

    <div className="testimonials-grid">
      
      <div className="testimonial-card featured reveal">
        <div>
          <div className="testimonial-quote-mark">"</div>
        </div>
        <p className="testimonial-text">
          Niti has an extraordinary ability to translate complex user behaviors into clear, actionable insights. Her research on our onboarding flow saved us months of guesswork and directly contributed to a 34% lift in activation.
        </p>
        <div className="testimonial-author" style={{border: "none", padding: 0}}>
          <div className="testimonial-avatar t-av-1">AP</div>
          <div>
            <div className="testimonial-name">Arjun Patel</div>
            <div className="testimonial-role">VP of Product · HealthFlow</div>
          </div>
        </div>
      </div>

      <div className="testimonial-card reveal reveal-delay-1">
        <div className="testimonial-quote-mark">"</div>
        <p className="testimonial-text">Working with Niti changed how our entire team thinks about research. She doesn't just deliver findings — she makes us better at asking the right questions.</p>
        <div className="testimonial-author">
          <div className="testimonial-avatar t-av-2">SK</div>
          <div>
            <div className="testimonial-name">Sara Kim</div>
            <div className="testimonial-role">Head of Design · Novo Bank</div>
          </div>
        </div>
      </div>

      <div className="testimonial-card reveal reveal-delay-2">
        <div className="testimonial-quote-mark">"</div>
        <p className="testimonial-text">Niti's inclusive research approach brought voices into our process we had never heard before. The result was a product that actually works for everyone.</p>
        <div className="testimonial-author">
          <div className="testimonial-avatar t-av-3">ML</div>
          <div>
            <div className="testimonial-name">Maya Lopes</div>
            <div className="testimonial-role">Engineering Lead · Shopa</div>
          </div>
        </div>
      </div>

      <div className="testimonial-card reveal reveal-delay-3">
        <div className="testimonial-quote-mark">"</div>
        <p className="testimonial-text">The diary study Niti ran gave us more insight in 6 weeks than 2 years of analytics had. Her synthesis process is methodical, empathetic, and genuinely inspiring.</p>
        <div className="testimonial-author">
          <div className="testimonial-avatar" style={{background: "linear-gradient(135deg,#d9a74a,#af840d)"}}>RJ</div>
          <div>
            <div className="testimonial-name">Ravi Joshi</div>
            <div className="testimonial-role">Chief Product Officer · Lendi</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>


<section className="footer-cta" id="contact">
  <div className="container">
    <div className="eyebrow">Let's work together</div>
    <h2 className="display display-lg footer-cta-title" style={{marginTop: 16.0}}>
      Have a research challenge?
    </h2>
    <p className="footer-cta-subtitle">
      I&apos;m open to research contracts, full-time roles, and speaking engagements. Let&apos;s find out what your users really need.
    </p>
    <div className="footer-cta-actions">
      <a href="mailto:niti@example.com" className="btn-primary">niti@example.com →</a>
      <a href="#" className="btn-outline">Download CV</a>
    </div>
  </div>
</section>

<footer>
  <div className="container">
    <div className="footer-inner">
      <div className="footer-logo">
        <img
          src={resolvedTheme === 'dark' ? darkNavLogo : lightNavLogo}
          width={32}
          height={32}
          alt="Niti Punjabi"
        />
      </div>
      <ul className="footer-links">
        <li><a href="#">LinkedIn</a></li>
        <li><a href="#">Twitter / X</a></li>
        <li><a href="#">Read.cv</a></li>
        <li><a href="#">Medium</a></li>
      </ul>
      <div className="footer-copy">© 2026 Niti Punjabi</div>
    </div>
  </div>
</footer>
    </>
  )
}
