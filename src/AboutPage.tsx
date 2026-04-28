import { landingPageCopy } from './content/landingPageCopy'

export function AboutPage() {
  const baseHref = import.meta.env.BASE_URL
  const copy = landingPageCopy

  return (
    <main className="about-page">
      <section className="about-page-hero">
        <div className="container">
          <a href={`${baseHref}#about`} className="case-study-back-link">
            ← Back to portfolio
          </a>
          <div className="eyebrow">{copy.about.eyebrow}</div>
          <h1 className="display display-lg about-page-title">{copy.about.heading}</h1>
          <p className="about-page-lead">{copy.about.lead}</p>
        </div>
      </section>

      <section className="about-page-content">
        <div className="container">
          <div className="about-page-panel">
            <p>{copy.about.paragraph1}</p>
            <p>{copy.about.paragraph2}</p>
          </div>

          <div className="about-page-skills">
            <span>Moderated interviews</span>
            <span>Survey design</span>
            <span>Usability testing</span>
            <span>Journey mapping</span>
            <span>Mixed methods</span>
            <span>Affinity diagramming</span>
          </div>

          <section className="methods about-page-methods" id="methods">
            <div className="section-header centered">
              <div className="eyebrow">{copy.methods.eyebrow}</div>
              <h2 className="display display-lg" style={{ marginTop: 16.0 }}>{copy.methods.heading}</h2>
              <p className="section-subtitle">{copy.methods.subtitle}</p>
            </div>

            <div className="methods-grid">
              <div className="method-card primary">
                <div className="method-icon">🎙️</div>
                <div className="method-name">{copy.methods.card1Name}</div>
                <p className="method-desc">{copy.methods.card1Description}</p>
                <div className="method-when">{copy.methods.bestForLabel}</div>
                <div className="method-tags">
                  <span className="method-tag">{copy.methods.card1Tag1}</span>
                  <span className="method-tag">{copy.methods.card1Tag2}</span>
                  <span className="method-tag">{copy.methods.card1Tag3}</span>
                </div>
              </div>

              <div className="method-card teal">
                <div className="method-icon">🧪</div>
                <div className="method-name">{copy.methods.card2Name}</div>
                <p className="method-desc">{copy.methods.card2Description}</p>
                <div className="method-when">{copy.methods.bestForLabel}</div>
                <div className="method-tags">
                  <span className="method-tag">{copy.methods.card2Tag1}</span>
                  <span className="method-tag">{copy.methods.card2Tag2}</span>
                  <span className="method-tag">{copy.methods.card2Tag3}</span>
                </div>
              </div>

              <div className="method-card gold">
                <div className="method-icon">📖</div>
                <div className="method-name">{copy.methods.card3Name}</div>
                <p className="method-desc">{copy.methods.card3Description}</p>
                <div className="method-when">{copy.methods.bestForLabel}</div>
                <div className="method-tags">
                  <span className="method-tag">{copy.methods.card3Tag1}</span>
                  <span className="method-tag">{copy.methods.card3Tag2}</span>
                  <span className="method-tag">{copy.methods.card3Tag3}</span>
                </div>
              </div>

              <div className="method-card teal">
                <div className="method-icon">🗺️</div>
                <div className="method-name">{copy.methods.card4Name}</div>
                <p className="method-desc">{copy.methods.card4Description}</p>
                <div className="method-when">{copy.methods.bestForLabel}</div>
                <div className="method-tags">
                  <span className="method-tag">{copy.methods.card4Tag1}</span>
                  <span className="method-tag">{copy.methods.card4Tag2}</span>
                  <span className="method-tag">{copy.methods.card4Tag3}</span>
                </div>
              </div>

              <div className="method-card primary">
                <div className="method-icon">🃏</div>
                <div className="method-name">{copy.methods.card5Name}</div>
                <p className="method-desc">{copy.methods.card5Description}</p>
                <div className="method-when">{copy.methods.bestForLabel}</div>
                <div className="method-tags">
                  <span className="method-tag">{copy.methods.card5Tag1}</span>
                  <span className="method-tag">{copy.methods.card5Tag2}</span>
                  <span className="method-tag">{copy.methods.card5Tag3}</span>
                </div>
              </div>

              <div className="method-card gold">
                <div className="method-icon">📊</div>
                <div className="method-name">{copy.methods.card6Name}</div>
                <p className="method-desc">{copy.methods.card6Description}</p>
                <div className="method-when">{copy.methods.bestForLabel}</div>
                <div className="method-tags">
                  <span className="method-tag">{copy.methods.card6Tag1}</span>
                  <span className="method-tag">{copy.methods.card6Tag2}</span>
                  <span className="method-tag">{copy.methods.card6Tag3}</span>
                </div>
              </div>
            </div>
          </section>

          <a href={`${baseHref}#contact`} className="btn-primary">
            Contact Niti
          </a>
        </div>
      </section>
    </main>
  )
}
