import aboutRaw from '../../Landing page copy/about.md?raw'
import contactRaw from '../../Landing page copy/contact.md?raw'
import footerRaw from '../../Landing page copy/footer.md?raw'
import heroRaw from '../../Landing page copy/hero.md?raw'
import methodsRaw from '../../Landing page copy/methods.md?raw'
import navigationRaw from '../../Landing page copy/navigation.md?raw'
import testimonialsRaw from '../../Landing page copy/testimonials.md?raw'
import workRaw from '../../Landing page copy/work.md?raw'

type CopyMap = Record<string, string>

function parseSectionMarkdown(raw: string): CopyMap {
  const map: CopyMap = {}
  const lines = raw.replace(/\r/g, '').split('\n')
  let currentKey = ''
  let buffer: string[] = []

  const flush = () => {
    if (!currentKey) return
    const value = buffer.join('\n').trim()
    if (value) map[currentKey] = value
    buffer = []
  }

  for (const line of lines) {
    if (line.startsWith('## ')) {
      flush()
      currentKey = line.slice(3).trim().toLowerCase().replace(/\s+/g, '_')
      continue
    }
    if (currentKey) buffer.push(line)
  }
  flush()

  return map
}

function pick(map: CopyMap, key: string, fallback: string): string {
  return map[key] ?? fallback
}

const hero = parseSectionMarkdown(heroRaw)
const nav = parseSectionMarkdown(navigationRaw)
const work = parseSectionMarkdown(workRaw)
const about = parseSectionMarkdown(aboutRaw)
const methods = parseSectionMarkdown(methodsRaw)
const testimonials = parseSectionMarkdown(testimonialsRaw)
const contact = parseSectionMarkdown(contactRaw)
const footer = parseSectionMarkdown(footerRaw)

export const landingPageCopy = {
  nav: {
    work: pick(nav, 'work', 'Work'),
    about: pick(nav, 'about', 'About'),
    methods: pick(nav, 'methods', 'Methods'),
    testimonials: pick(nav, 'testimonials', 'Testimonials'),
    contact: pick(nav, 'contact', 'Contact'),
    resume: pick(nav, 'resume', 'Resume'),
  },
  hero: {
    availability: pick(hero, 'availability', 'Available for new projects'),
    titleLine1: pick(hero, 'title_line_1', 'I make complex'),
    titleLine2Prefix: pick(hero, 'title_line_2_prefix', 'things'),
    titleLine2Emphasis: pick(hero, 'title_line_2_emphasis', 'feel human'),
    description: pick(
      hero,
      'description',
      "I'm Niti Punjabi — a UX Researcher helping teams discover what users truly need, and translating those insights into products people love.",
    ),
    stat1Value: pick(hero, 'stat_1_value', '8+'),
    stat1Label: pick(hero, 'stat_1_label', 'Years of research'),
    stat2Value: pick(hero, 'stat_2_value', '40+'),
    stat2Label: pick(hero, 'stat_2_label', 'Products shaped'),
    stat3Value: pick(hero, 'stat_3_value', '600+'),
    stat3Label: pick(hero, 'stat_3_label', 'Users interviewed'),
  },
  work: {
    eyebrow: pick(work, 'eyebrow', 'Case Studies'),
    heading: pick(work, 'heading', 'Selected work'),
    subtitle: pick(
      work,
      'subtitle',
      'A curated collection of research projects that drove measurable product outcomes.',
    ),
    subtitlePrefix: pick(
      work,
      'subtitle_prefix',
      'A glimpse into some of my recent research and design projects. For complete case study walkthroughs, please feel free to ',
    ),
    subtitleLink: pick(work, 'subtitle_link', 'reach out'),
    subtitleSuffix: pick(work, 'subtitle_suffix', '.'),
    card1Tag: pick(work, 'card_1_tag', 'Healthcare'),
    card1Year: pick(work, 'card_1_year', '2024'),
    card1Title: pick(work, 'card_1_title', 'Redesigning patient onboarding for a digital health platform'),
    card1Description: pick(work, 'card_1_description', 'Discovered critical friction points in a 7-step registration flow through contextual inquiry and usability testing, leading to a 52% drop-off reduction.'),
    card1Methods: pick(work, 'card_1_methods', 'Contextual Inquiry, Usability Testing'),
    card1Duration: pick(work, 'card_1_duration', '12 weeks'),
    card1Participants: pick(work, 'card_1_participants', '48 patients, 6 clinicians'),
    card1Outcome: pick(work, 'card_1_outcome', '52% drop-off reduction'),
    card2Tag: pick(work, 'card_2_tag', 'Fintech'),
    card2Year: pick(work, 'card_2_year', '2023'),
    card2Title: pick(work, 'card_2_title', 'Understanding trust barriers in a peer-to-peer lending app'),
    card2Description: pick(work, 'card_2_description', 'Led a diary study and in-depth interviews to map trust formation over time, uncovering 6 key trust signals that became design principles.'),
    card2Role: pick(
      work,
      'card_2_role',
      'UX Research (end-to-end owner: planning, moderating, analyzing, delivering)',
    ),
    card2Methods: pick(work, 'card_2_methods', 'Diary Study, Depth Interviews'),
    card2Duration: pick(work, 'card_2_duration', '8 weeks'),
    card2Outcome: pick(work, 'card_2_outcome', '6 design principles adopted'),
    card3Tag: pick(work, 'card_3_tag', 'E-commerce'),
    card3Year: pick(work, 'card_3_year', '2022'),
    card3Title: pick(work, 'card_3_title', 'Checkout friction mapping across 5 user segments'),
    card3Description: pick(work, 'card_3_description', 'Card sorting and tree testing revealed a mental model mismatch in navigation that caused 28% cart abandonment.'),
    card3Methods: pick(work, 'card_3_methods', 'Card Sorting, Tree Testing'),
    card3Duration: pick(work, 'card_3_duration', '10 weeks'),
    card3Participants: pick(work, 'card_3_participants', '125 shoppers across 5 segments'),
    card3Outcome: pick(work, 'card_3_outcome', 'IA redesign; 28% abandonment driver addressed'),
    card4Tag: pick(work, 'card_4_tag', 'Consumer'),
    card4Year: pick(work, 'card_4_year', '2023'),
    card4Title: pick(work, 'card_4_title', 'Accessibility audit of a social media app for older adults'),
    card4Description: pick(work, 'card_4_description', 'Inclusive research with 24 adults aged 60+ surfaced 31 accessibility gaps, prioritized into a 3-sprint backlog.'),
    card4Methods: pick(work, 'card_4_methods', 'Usability Sessions, Heuristic Review'),
    card4Duration: pick(work, 'card_4_duration', '6 weeks'),
    card4Participants: pick(work, 'card_4_participants', '24 adults aged 60+'),
    card4Outcome: pick(work, 'card_4_outcome', '31 gaps → 3-sprint backlog'),
    cardCta: pick(work, 'card_cta', 'Read case study →'),
  },
  about: {
    eyebrow: pick(about, 'eyebrow', 'About me'),
    heading: pick(about, 'heading', 'Curious by nature. Rigorous by design.'),
    lead: pick(
      about,
      'lead',
      'I believe that the best products are built on a deep understanding of the people who use them.',
    ),
    paragraph1: pick(
      about,
      'paragraph_1',
      `With over 8 years of experience in UX research, I've partnered with teams at startups and enterprise companies to uncover the "why" behind user behavior. My work spans healthcare, fintech, and consumer apps — always grounded in empathy and rigor.`,
    ),
    paragraph2: pick(
      about,
      'paragraph_2',
      "I'm particularly passionate about inclusive research practices — making sure we hear from users who are often left out of the conversation: non-native speakers, people with disabilities, and those in emerging markets.",
    ),
    cta: pick(about, 'cta', 'Get in touch →'),
  },
  methods: {
    eyebrow: pick(methods, 'eyebrow', 'Research Methods'),
    heading: pick(methods, 'heading', 'My toolkit'),
    subtitle: pick(
      methods,
      'subtitle',
      'A mix of qualitative and quantitative methods — chosen to fit the question, not the other way around.',
    ),
    bestForLabel: pick(methods, 'best_for_label', 'Best for'),
    card1Name: pick(methods, 'card_1_name', 'User Interviews'),
    card1Description: pick(methods, 'card_1_description', "Semi-structured conversations designed to surface mental models, motivations, and latent needs that surveys can't capture."),
    card1Tag1: pick(methods, 'card_1_tag_1', 'Discovery'),
    card1Tag2: pick(methods, 'card_1_tag_2', 'Generative research'),
    card1Tag3: pick(methods, 'card_1_tag_3', 'Mental models'),
    card2Name: pick(methods, 'card_2_name', 'Usability Testing'),
    card2Description: pick(methods, 'card_2_description', 'Moderated and unmoderated sessions that reveal where users struggle, not just what they say they want.'),
    card2Tag1: pick(methods, 'card_2_tag_1', 'Evaluative'),
    card2Tag2: pick(methods, 'card_2_tag_2', 'Prototype validation'),
    card2Tag3: pick(methods, 'card_2_tag_3', 'Iteration'),
    card3Name: pick(methods, 'card_3_name', 'Diary Studies'),
    card3Description: pick(methods, 'card_3_description', 'Longitudinal self-reporting that captures real-world context and behavioral change over time — not just snapshots.'),
    card3Tag1: pick(methods, 'card_3_tag_1', 'Longitudinal'),
    card3Tag2: pick(methods, 'card_3_tag_2', 'Habit formation'),
    card3Tag3: pick(methods, 'card_3_tag_3', 'Context capture'),
    card4Name: pick(methods, 'card_4_name', 'Journey Mapping'),
    card4Description: pick(methods, 'card_4_description', 'Collaborative synthesis workshops that align teams around the full user experience, end-to-end, with emotional highs and lows.'),
    card4Tag1: pick(methods, 'card_4_tag_1', 'Synthesis'),
    card4Tag2: pick(methods, 'card_4_tag_2', 'Cross-functional alignment'),
    card4Tag3: pick(methods, 'card_4_tag_3', 'Opportunity mapping'),
    card5Name: pick(methods, 'card_5_name', 'Card Sorting & Tree Testing'),
    card5Description: pick(methods, 'card_5_description', 'Quantitative IA methods that reveal how users categorize information and find their way through navigation hierarchies.'),
    card5Tag1: pick(methods, 'card_5_tag_1', 'Information Architecture'),
    card5Tag2: pick(methods, 'card_5_tag_2', 'Navigation'),
    card5Tag3: pick(methods, 'card_5_tag_3', 'Taxonomy'),
    card6Name: pick(methods, 'card_6_name', 'Survey & Analytics'),
    card6Description: pick(methods, 'card_6_description', 'Quantitative methods that validate qualitative findings at scale — combining behavioral data with attitudinal signals.'),
    card6Tag1: pick(methods, 'card_6_tag_1', 'Validation'),
    card6Tag2: pick(methods, 'card_6_tag_2', 'Segmentation'),
    card6Tag3: pick(methods, 'card_6_tag_3', 'Measurement'),
  },
  testimonials: {
    eyebrow: pick(testimonials, 'eyebrow', 'Testimonials'),
    heading: pick(testimonials, 'heading', 'What colleagues say'),
    featuredQuote: pick(testimonials, 'featured_quote', 'Niti has an extraordinary ability to translate complex user behaviors into clear, actionable insights. Her research on our onboarding flow saved us months of guesswork and directly contributed to a 34% lift in activation.'),
    featuredInitials: pick(testimonials, 'featured_initials', 'AP'),
    featuredName: pick(testimonials, 'featured_name', 'Arjun Patel'),
    featuredRole: pick(testimonials, 'featured_role', 'VP of Product · HealthFlow'),
    card1Quote: pick(testimonials, 'card_1_quote', "Working with Niti changed how our entire team thinks about research. She doesn't just deliver findings — she makes us better at asking the right questions."),
    card1Initials: pick(testimonials, 'card_1_initials', 'SK'),
    card1Name: pick(testimonials, 'card_1_name', 'Sara Kim'),
    card1Role: pick(testimonials, 'card_1_role', 'Head of Design · Novo Bank'),
    card2Quote: pick(testimonials, 'card_2_quote', "Niti's inclusive research approach brought voices into our process we had never heard before. The result was a product that actually works for everyone."),
    card2Initials: pick(testimonials, 'card_2_initials', 'ML'),
    card2Name: pick(testimonials, 'card_2_name', 'Maya Lopes'),
    card2Role: pick(testimonials, 'card_2_role', 'Engineering Lead · Shopa'),
    card3Quote: pick(testimonials, 'card_3_quote', "The diary study Niti ran gave us more insight in 6 weeks than 2 years of analytics had. Her synthesis process is methodical, empathetic, and genuinely inspiring."),
    card3Initials: pick(testimonials, 'card_3_initials', 'RJ'),
    card3Name: pick(testimonials, 'card_3_name', 'Ravi Joshi'),
    card3Role: pick(testimonials, 'card_3_role', 'Chief Product Officer · Lendi'),
  },
  contact: {
    eyebrow: pick(contact, 'eyebrow', "Let's work together"),
    heading: pick(contact, 'heading', 'Have a research challenge?'),
    subtitle: pick(
      contact,
      'subtitle',
      "I'm open to research contracts, full-time roles, and speaking engagements. Let's find out what your users really need.",
    ),
    email: pick(contact, 'email', 'niti@example.com'),
    downloadCv: pick(contact, 'download_cv', 'Download CV'),
  },
  footer: {
    linkedinLabel: pick(footer, 'linkedin_label', 'LinkedIn'),
    linkedinUrl: pick(footer, 'linkedin_url', '#'),
    copyright: pick(footer, 'copyright', '© 2026 Niti Punjabi'),
    email: pick(footer, 'email', 'niti@example.com'),
  },
}
