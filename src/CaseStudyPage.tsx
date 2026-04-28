import { caseStudies, type CaseStudy } from './content/caseStudies'

type CaseStudyPageProps = {
  study: CaseStudy
}

export function CaseStudyPage({ study }: CaseStudyPageProps) {
  const baseHref = import.meta.env.BASE_URL

  return (
    <main className="case-study-page">
      <section className="case-study-hero">
        <div className="container">
          <a href={`${baseHref}#work`} className="case-study-back-link">
            ← Back to portfolio
          </a>
          <div className="case-study-kicker">
            <span>{study.domain}</span>
            <span>{study.year}</span>
          </div>
          <h1 className="display display-lg case-study-title">{study.title}</h1>
          <p className="case-study-summary">{study.recruiterTakeaway}</p>
        </div>
      </section>

      <section className="case-study-details">
        <div className="container">
          <div className="case-study-details-grid">
            <div className="case-study-card">
              <h2>Recruiter Snapshot</h2>
              <ul>
                <li>
                  <strong>Role:</strong> {study.role}
                </li>
                <li>
                  <strong>Duration:</strong> {study.duration}
                </li>
                <li>
                  <strong>Team:</strong> {study.team}
                </li>
                <li>
                  <strong>Participants:</strong> {study.participants}
                </li>
              </ul>
            </div>

            <div className="case-study-card">
              <h2>Methods Used</h2>
              <ul>
                {study.methods.map((method) => (
                  <li key={method}>{method}</li>
                ))}
              </ul>
            </div>

            <div className="case-study-card impact">
              <h2>Business Impact</h2>
              <ul>
                {study.impact.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="case-study-content">
        <div className="container">
          <div className="case-study-panel">
            <h2>Challenge</h2>
            <p>{study.challenge}</p>
          </div>

          <div className="case-study-panel">
            <h2>Approach</h2>
            <ol>
              {study.approach.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="case-study-footer-cta">
        <div className="container">
          <h2 className="display display-sm">Want the full walkthrough?</h2>
          <p>I can share the complete artifact set and synthesis docs in an interview.</p>
          <a href={`${baseHref}#contact`} className="btn-primary">
            Contact Niti
          </a>
        </div>
      </section>

      <footer className="case-study-footer">
        <div className="container">
          <div className="case-study-footer-links">
            {caseStudies.map((item) => (
              <a key={item.slug} href={`${baseHref}case-studies/${item.slug}`}>
                {item.domain}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}
