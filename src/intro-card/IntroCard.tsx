import './intro-card.css'

/**
 * Saved “intro card” — profile card with floating badges (removed from hero).
 * Import where needed: `import { IntroCard } from './intro-card/IntroCard'`
 */
export function IntroCard() {
  return (
    <div className="intro-card-root">
      <div className="float-badge float-badge-1">
        <div className="badge-dot" style={{ background: 'var(--success)' }} />
        <span style={{ fontSize: 12, fontWeight: 500 }}>User satisfaction ↑ 34%</span>
      </div>
      <div className="float-badge float-badge-2">
        <span>🎯</span>
        <span style={{ fontSize: 12, fontWeight: 500 }}>12 usability issues found</span>
      </div>
      <div className="hero-card">
        <div className="hero-avatar">N</div>
        <div className="hero-card-name">Niti Punjabi</div>
        <div className="hero-card-role">Senior UX Researcher · San Jose, CA</div>
        <div className="hero-tags-row">
          <span className="tag tag-primary">User Interviews</span>
          <span className="tag tag-teal">Usability Testing</span>
          <span className="tag tag-gold">Journey Mapping</span>
          <span className="tag tag-sand">Mixed Methods</span>
        </div>
        <div className="hero-methods">
          <div className="hero-method">
            <div className="hero-method-icon">🔍</div>
            <div className="hero-method-name">Discovery</div>
            <div>Interviews & surveys</div>
          </div>
          <div className="hero-method">
            <div className="hero-method-icon">🧪</div>
            <div className="hero-method-name">Evaluation</div>
            <div>Usability testing</div>
          </div>
          <div className="hero-method">
            <div className="hero-method-icon">📊</div>
            <div className="hero-method-name">Analysis</div>
            <div>Thematic coding</div>
          </div>
          <div className="hero-method">
            <div className="hero-method-icon">🗺️</div>
            <div className="hero-method-name">Synthesis</div>
            <div>Journey mapping</div>
          </div>
        </div>
      </div>
    </div>
  )
}
