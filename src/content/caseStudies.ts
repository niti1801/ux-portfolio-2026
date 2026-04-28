export type CaseStudy = {
  slug: string
  title: string
  domain: string
  year: string
  duration: string
  role: string
  team: string
  participants: string
  methods: string[]
  impact: string[]
  challenge: string
  approach: string[]
  recruiterTakeaway: string
}

export const caseStudies: CaseStudy[] = [
  {
    slug: 'healthcare-onboarding-redesign',
    title: 'Redesigning patient onboarding for a digital health platform',
    domain: 'Healthcare',
    year: '2024',
    duration: '12 weeks',
    role: 'Lead UX Researcher',
    team: '1 product manager, 1 designer, 5 engineers',
    participants: '48 patients, 6 clinicians',
    methods: ['Contextual inquiry', 'Moderated usability testing', 'Funnel analysis'],
    impact: [
      '52% reduction in onboarding drop-off',
      '23% increase in completed first appointments',
      'Prioritized roadmap adopted across 3 squads',
    ],
    challenge:
      'Patients were abandoning a 7-step onboarding flow before reaching first value. Stakeholders needed clear evidence on where friction happened and which fixes would move activation fastest.',
    approach: [
      'Mapped current-state flow and identified high-friction steps from analytics.',
      'Ran contextual inquiry sessions to understand emotional and environmental barriers.',
      'Tested revised prototypes with patients and clinicians, then translated findings into prioritized fixes.',
    ],
    recruiterTakeaway:
      'This project demonstrates end-to-end ownership from framing ambiguous problems to driving measurable activation outcomes.',
  },
  {
    slug: 'fintech-trust-barriers',
    title: 'Understanding trust barriers in a peer-to-peer lending app',
    domain: 'Fintech',
    year: '2023',
    duration: '8 weeks',
    role: 'Senior UX Researcher',
    team: '1 product lead, 1 content designer, 4 engineers',
    participants: '32 lenders and borrowers',
    methods: ['Diary study', 'Depth interviews', 'Concept testing'],
    impact: [
      '6 trust principles integrated into product and content guidelines',
      '18% increase in first loan completion after launch',
      'Shared framework reused in subsequent credit features',
    ],
    challenge:
      'Users were hesitant to complete first transactions because trust cues were inconsistent and disconnected from real decision-making moments.',
    approach: [
      'Conducted a 2-week diary study to capture trust signals over time.',
      'Synthesized emotional and behavioral patterns into opportunity areas.',
      'Partnered with product/design to validate concepts that addressed top trust blockers.',
    ],
    recruiterTakeaway:
      'This study highlights strategic research influence by shaping principles that scaled beyond a single feature.',
  },
  {
    slug: 'ecommerce-checkout-friction',
    title: 'Checkout friction mapping across 5 user segments',
    domain: 'E-commerce',
    year: '2022',
    duration: '10 weeks',
    role: 'UX Research Lead',
    team: '2 designers, 1 data analyst, 6 engineers',
    participants: '125 shoppers across 5 segments',
    methods: ['Card sorting', 'Tree testing', 'Task-based usability tests'],
    impact: [
      'Resolved a key IA issue linked to 28% cart abandonment',
      'Reduced support tickets tied to checkout confusion by 31%',
      'Created reusable navigation hypotheses for growth experiments',
    ],
    challenge:
      'Teams suspected checkout usability problems but lacked confidence in where information architecture was failing across diverse shopper types.',
    approach: [
      'Segmented users by shopping intent and behavior to compare navigation expectations.',
      'Ran card sorting and tree testing to expose mental model mismatches.',
      'Validated IA revisions with task-based tests before engineering implementation.',
    ],
    recruiterTakeaway:
      'This case shows comfort with mixed-method studies at scale and close partnership with analytics and delivery teams.',
  },
  {
    slug: 'social-app-accessibility-audit',
    title: 'Accessibility audit of a social media app for older adults',
    domain: 'Consumer',
    year: '2023',
    duration: '6 weeks',
    role: 'UX Researcher',
    team: '1 accessibility specialist, 1 product designer, 3 engineers',
    participants: '24 adults aged 60+',
    methods: ['Accessibility-focused usability sessions', 'Heuristic review', 'Issue severity ranking'],
    impact: [
      '31 accessibility gaps identified and prioritized',
      '3-sprint remediation plan accepted by product leadership',
      'Improved readability, navigation clarity, and interaction confidence',
    ],
    challenge:
      'Older adults experienced avoidable usability and accessibility friction, but the team needed concrete, prioritized evidence to justify remediation work.',
    approach: [
      'Ran inclusive usability sessions tailored to older-adult interaction patterns.',
      'Combined observed barriers with heuristic findings to create a clear severity model.',
      'Converted findings into an actionable backlog with engineering effort estimates.',
    ],
    recruiterTakeaway:
      'This project reflects strong inclusive research practice and clear translation of findings into delivery-ready scope.',
  },
]

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return caseStudies.find((study) => study.slug === slug)
}
