import { Portfolio } from './Portfolio'
import { CaseStudyPage } from './CaseStudyPage'
import { AboutPage } from './AboutPage'
import { getCaseStudyBySlug } from './content/caseStudies'
import { ThemeProvider } from './theme/ThemeProvider'

function App() {
  const baseHref = import.meta.env.BASE_URL
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')
  const path = window.location.pathname
  const appPath = basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path
  const isAboutPage = appPath === '/about'
  const caseStudyMatch = appPath.match(/^\/case-studies\/([^/]+)$/)
  const caseStudySlug = caseStudyMatch?.[1]
  const caseStudy = caseStudySlug ? getCaseStudyBySlug(caseStudySlug) : undefined

  return (
    <ThemeProvider>
      {caseStudy ? (
        <CaseStudyPage study={caseStudy} />
      ) : isAboutPage ? (
        <AboutPage />
      ) : caseStudySlug ? (
        <main className="case-study-not-found">
          <div className="container">
            <h1 className="display display-md">Case study not found</h1>
            <p>Try returning to the portfolio and opening a case study from the Work section.</p>
            <a href={`${baseHref}#work`} className="btn-primary">
              Back to Work
            </a>
          </div>
        </main>
      ) : (
        <Portfolio />
      )}
    </ThemeProvider>
  )
}

export default App
