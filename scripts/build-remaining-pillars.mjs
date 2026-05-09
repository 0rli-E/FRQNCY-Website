#!/usr/bin/env node
// Builds the 6 remaining canonical pillar pages from the Sell scaffold.
//
// Reads v2/sell/index.html, applies pillar-specific substitutions per the
// PILLARS config below, writes to v2/<slug>/index.html. Each output gets
// the BESPOKE-LOCK marker (inherited from sell) so generate.js will leave
// it alone.
//
// Run: node scripts/build-remaining-pillars.mjs
//
// To rebuild a single pillar: edit its config + delete v2/<slug>/index.html
// then re-run. Existing files are overwritten.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sellSrc = await fs.readFile(path.join(ROOT, 'v2/sell/index.html'), 'utf8');
const TODAY = '2026-05-09';
const TODAY_HUMAN = 'May 9, 2026';

// ── Substitution markers — exact strings from the Sell scaffold ──────────
const M = {
  cssComment: `/* ════════════════════════════════════════════════════════════════════
   WELLBEING — Pillar.
   "The body knows how. Wellbeing is what happens when you stop interfering."
   ──────────────────────────────────────────────────────────────────── */`,
  accentCssComment: `  /* Wellbeing-specific accent — vital sage / living-green */`,
  bodyClass: `main.wellbeing-body { position: relative; background: var(--navy); padding: 0 clamp(1.5rem, 5vw, 3rem); }`,
  ldJson: `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"Wellbeing — The body knows how","description":"A field guide to the six pillars of vitality and the lineages worth listening to.","url":"https://frqncy.network/v2/sell/","isPartOf":{"@type":"WebSite","name":"FRQNCY Network","url":"https://frqncy.network"},"breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"FRQNCY","item":"https://frqncy.network"},{"@type":"ListItem","position":2,"name":"Explore","item":"https://frqncy.network/v2/explore.html"},{"@type":"ListItem","position":3,"name":"Wellbeing","item":"https://frqncy.network/v2/sell/"}]}}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","@id":"https://frqncy.network/v2/sell/","url":"https://frqncy.network/v2/sell/","hasPart":[{"@type":"WebPageElement","name":"Five small things, repeated.","url":"https://frqncy.network/v2/sell/#five-small-things-repeated"}]}</script>`,
  breadcrumb: `      <a href="/v2/explore.html">Explore</a><span class="sep">/</span>
      <span>Wellbeing</span>`,
  hero: `      <div class="hero-eyebrow">Sell · Pillar · How we exchange value</div>
      <h1 class="hero-title">Sell</h1>
      <p class="hero-desc">
        We sell because vision needs capital and the public layer of the network must stay
        free. We sell as transparent service — never as extraction. The page below is how.
      </p>
      <div class="hero-quote">
        People don't buy what you do; they buy why you do it.
        <cite>Simon Sinek · Start With Why · The Golden Circle</cite>
      </div>`,
  bylineDate: `Updated <time datetime="2026-04-29">April 29, 2026</time>`,
  picks: `<section class="section section-wide fade-up">
  <span class="label">What we point to</span>
  <h2>The voices that taught us <strong>this HOW.</strong></h2>
  <p style="max-width:62ch;margin:0 0 2rem;">
    The Golden Circle is the spine. The other voices below taught us how to sell without
    becoming the thing we set out to replace.
  </p>

  <div class="picks">
    <div class="pick">
      <div class="pick-eyebrow">01 / Watch first</div>
      <h4>How Great Leaders Inspire Action</h4>
      <p>Simon Sinek, TED, 2009. The Golden Circle.</p>
      <a class="pick-link" href="/v2/watch/" target="_blank" rel="noopener noreferrer">Open Watch →</a>
    </div>

    <div class="pick">
      <div class="pick-eyebrow">02 / Read</div>
      <h4>Start With Why</h4>
      <p>Simon Sinek, 2009. The book-length expansion of the talk.</p>
      <a class="pick-link" href="https://simonsinek.com/books/start-with-why/" target="_blank" rel="noopener noreferrer">Find the book →</a>
    </div>

    <div class="pick">
      <div class="pick-eyebrow">03 / Persuade</div>
      <h4>Influence: The Psychology of Persuasion</h4>
      <p>Robert Cialdini, 1984. The six principles, used honestly.</p>
      <a class="pick-link" href="https://archive.org/details/influencepsychol0000cial" target="_blank" rel="noopener noreferrer">Find the book →</a>
    </div>

    <div class="pick">
      <div class="pick-eyebrow">04 / Negotiate</div>
      <h4>Never Split the Difference</h4>
      <p>Chris Voss, 2016. Tactical empathy from an FBI hostage negotiator.</p>
      <a class="pick-link" href="https://archive.org/details/never-split-the-difference" target="_blank" rel="noopener noreferrer">Find the book →</a>
    </div>

    <div class="pick">
      <div class="pick-eyebrow">05 / Steward</div>
      <h4>The Berkshire Letters</h4>
      <p>Warren Buffett, 1965–. Capital allocation as ethical practice.</p>
      <a class="pick-link" href="https://www.berkshirehathaway.com/letters/letters.html" target="_blank" rel="noopener noreferrer">Read the letters →</a>
    </div>
  </div>
</section>`,
  quotes: `  <div class="quotes-grid">
    <blockquote class="q">
      The goal is not to do business with everybody who needs what you have. The goal is to do business with people who believe what you believe.
      <cite>Simon Sinek · Start With Why</cite>
    </blockquote>
    <blockquote class="q">
      The most important thing in communication is hearing what isn't said.
      <cite>Peter Drucker</cite>
    </blockquote>
    <blockquote class="q">
      Price is what you pay. Value is what you get.
      <cite>Warren Buffett · Berkshire Hathaway letters</cite>
    </blockquote>
  </div>`,
  methodology: `<section class="section section-wide fade-up">
  <span class="label">How it actually works</span>
  <h2>Five non-negotiables, <strong>one method.</strong></h2>
  <p style="max-width:62ch;margin:0 0 2rem;">
    The Golden Circle says: lead with WHY, then HOW, then WHAT. FRQNCY's WHY is that
    consciousness is the ground of everything and every isle of life is rethink-from-it-able.
    The HOW of selling on FRQNCY follows from that: five operating non-negotiables, drawn
    from <a href="/proposals/REVENUE-MODEL.md" style="color:var(--gold-light)">REVENUE-MODEL.md</a>
    and <a href="/proposals/EDITORIAL-STANDARDS.md" style="color:var(--gold-light)">EDITORIAL-STANDARDS.md</a>,
    that govern every commercial decision the network makes.
  </p>

  <div class="giving-pair">
    <div class="giving-text">
      <p>
        <strong>1. The public layer stays free, forever.</strong> No ads on the site, ever.
        No paywalls on read-this-on-FRQNCY content — life stories, profiles, summaries, topic
        pages. External links are footnotes, not destinations. The gift is what builds the
        trust; the trust is what makes any revenue surface credible.
      </p>
    </div>
    <blockquote class="giving-quote">
      The gift is what makes the trust; the trust is what makes the revenue surfaces credible.
      <cite>FRQNCY · Revenue Model</cite>
    </blockquote>
  </div>

  <div class="giving-pair">
    <div class="giving-text">
      <p>
        <strong>2. Picks are independent of money flow.</strong> A FRQNCY pick is personally
        vetted — someone has read the book, used the product, met the person. We never start
        with "we could partner here" and back into a pick. Money flows are disclosed via a
        <code>revenue_relationship</code> field (<em>null / contributor / partner / affiliate</em>) on every
        entity. Sponsored content is not a category. The integrity test is one question:
        would FRQNCY pick this if there were no possibility of money ever flowing from the
        relationship?
      </p>
    </div>
    <blockquote class="giving-quote">
      Would FRQNCY pick this if there were no possibility of money ever flowing? If yes, fine. If no, decline — regardless of the financial upside.
      <cite>FRQNCY · Editorial Standards · §7</cite>
    </blockquote>
  </div>

  <div class="giving-pair">
    <div class="giving-text">
      <p>
        <strong>3. Membership is support, not unlock.</strong> When the Sanctuary Spaces and
        the Network membership go live, members fund the network — they don't unlock content
        the public can't see. The same is true for courses: a free intro lesson exists for
        anyone, and the paid tier is for the practitioner who wants the full path. We never
        gate the teaching; we sell the depth, the cohort, the access to the room.
      </p>
    </div>
    <blockquote class="giving-quote">
      The membership offer is "support the network" — never "unlock Sanctuary features."
      <cite>FRQNCY · Sanctuary Roadmap</cite>
    </blockquote>
  </div>

  <p style="max-width:62ch;margin:2rem 0 0;">
    <strong>4. Capital flows two ways and is disclosed.</strong> Money in: from courses,
    Aligned Goods contributor relationships, eventual Space memberships, and the Fund.
    Money out: into making and curating the public layer, into the Fund's portfolio of
    aligned projects, into the operating budget of the Sanctuary Spaces. Every commercial
    relationship is disclosed on the entity's profile. We do not buy our way onto other
    sites and we do not sell our way out of editorial integrity.<br><br>
    <strong>5. The leverage is the world model.</strong> One curated entry reaches everyone,
    forever, at zero marginal cost. One person added to <code>people.json</code> propagates
    across life story, books, topic-page presence, search index, and chart-personalised
    recommendation — from one edit. One course built can be infinitely delivered. One pick
    decision propagates everywhere automatically. This is leverage the substack-and-tip-jar
    model never gets.
  </p>
</section>`,
  constellationHeading: `Sell across the <strong>network.</strong>`,
  constellationCta: `      <a href="/v2/explore.html?focus=sell" class="constellation-cta">Explore the full reach of Sell ↗</a>`,
  closing: `    <blockquote style="border:0; padding:0; margin:0;">
      Start with why.
      <cite>Simon Sinek · The Golden Circle</cite>
    </blockquote>`,
};

// ── Helper: render the methodology section from a config ─────────────────
function renderMethodology({ slug, title, intro, items, finalParagraph }) {
  const id = `five-non-negotiables`;
  const blocks = items.slice(0, 3).map((it, i) => `
  <div class="giving-pair">
    <div class="giving-text">
      <p>
        <strong>${i + 1}. ${it.label}</strong> ${it.body}
      </p>
    </div>
    <blockquote class="giving-quote">
      ${it.pullText}
      <cite>${it.pullCite}</cite>
    </blockquote>
  </div>`).join('\n');
  const tail = items.slice(3).map((it, i) => `<strong>${i + 4}. ${it.label}</strong> ${it.body}`).join('<br><br>\n    ');
  return `<section class="section section-wide fade-up" id="${id}">
  <span class="label">How it actually works</span>
  <h2>Five non-negotiables, <strong>one method.</strong></h2>
  <p style="max-width:62ch;margin:0 0 2rem;">
    ${intro}
  </p>
${blocks}

  <p style="max-width:62ch;margin:2rem 0 0;">
    ${tail}${finalParagraph ? '<br><br>\n    ' + finalParagraph : ''}
  </p>
</section>`;
}

function renderPicks({ h2Strong, body, items }) {
  const cards = items.map((p, i) => `    <div class="pick">
      <div class="pick-eyebrow">${String(i + 1).padStart(2, '0')} / ${p.eyebrow}</div>
      <h4>${p.title}</h4>
      <p>${p.body}</p>
      <a class="pick-link" href="${p.url}" target="_blank" rel="noopener noreferrer">${p.cta || 'Find the book →'}</a>
    </div>`).join('\n\n');
  return `<section class="section section-wide fade-up">
  <span class="label">What we point to</span>
  <h2>The voices that taught us <strong>${h2Strong}</strong></h2>
  <p style="max-width:62ch;margin:0 0 2rem;">
    ${body}
  </p>

  <div class="picks">
${cards}
  </div>
</section>`;
}

function renderQuotes(items) {
  const blocks = items.map(q => `    <blockquote class="q">
      ${q.text}
      <cite>${q.cite}</cite>
    </blockquote>`).join('\n');
  return `  <div class="quotes-grid">
${blocks}
  </div>`;
}

function renderHero({ slug, title, eyebrow, descHtml, quoteText, quoteCite }) {
  return `      <div class="hero-eyebrow">${eyebrow}</div>
      <h1 class="hero-title">${title}</h1>
      <p class="hero-desc">
        ${descHtml}
      </p>
      <div class="hero-quote">
        ${quoteText}
        <cite>${quoteCite}</cite>
      </div>`;
}

function renderClosing({ text, cite }) {
  return `    <blockquote style="border:0; padding:0; margin:0;">
      ${text}
      <cite>${cite}</cite>
    </blockquote>`;
}

function renderLdJson({ slug, title, articleHeadline, articleDesc, breadcrumbName, hasPartName, hasPartAnchor }) {
  return `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":${JSON.stringify(articleHeadline)},"description":${JSON.stringify(articleDesc)},"url":"https://frqncy.network/v2/${slug}/","isPartOf":{"@type":"WebSite","name":"FRQNCY Network","url":"https://frqncy.network"},"breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"FRQNCY","item":"https://frqncy.network"},{"@type":"ListItem","position":2,"name":"Explore","item":"https://frqncy.network/v2/explore.html"},{"@type":"ListItem","position":3,"name":${JSON.stringify(breadcrumbName)},"item":"https://frqncy.network/v2/${slug}/"}]}}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","@id":"https://frqncy.network/v2/${slug}/","url":"https://frqncy.network/v2/${slug}/","hasPart":[{"@type":"WebPageElement","name":${JSON.stringify(hasPartName)},"url":"https://frqncy.network/v2/${slug}/#${hasPartAnchor}"}]}</script>`;
}

// ── Pillar configs ───────────────────────────────────────────────────────

const PILLARS = {
  builder: {
    title: 'Builder',
    breadcrumbName: 'Builder',
    metaDesc: "Building as care — the site, the social platform, Sanctuary. Every surface declares its lifecycle. The work is the artifact; the integrity is the ground.",
    bodyClassName: 'builder',
    accentPrimary: '#5A6B7B',
    accentLight: '#8FA3B5',
    accentRgbCommas: '90, 107, 123',
    cssCommentBody: '"There is one timeless way of building." — Christopher Alexander',
    accentCssCommentBody: 'Builder-specific accent — slate / forge / steel',
    hero: {
      eyebrow: 'Builder · Pillar · How we make',
      descHtml: `We build because the network needs places to inhabit. The site is the open library;
        the social platform is the practice room; Sanctuary is the room where one person works
        on themselves. The work is the artifact; the integrity is the ground.`,
      quoteText: "There is one timeless way of building.",
      quoteCite: 'Christopher Alexander · The Timeless Way of Building',
    },
    closing: { text: 'The quality without a name.', cite: 'Christopher Alexander · The Timeless Way of Building' },
    ldArticleHeadline: 'Builder — How we make',
    ldArticleDesc: 'How FRQNCY builds: private by default, honest about lifecycle state, slow on purpose, tied to the network without depending on it.',
    methodology: {
      intro: `Building is the operating discipline of the network's surfaces — the site, the
        social platform, Sanctuary. Five rules, drawn from <a href="/proposals/SANCTUARY-ROADMAP.md" style="color:var(--gold-light)">SANCTUARY-ROADMAP.md</a>
        and <a href="/proposals/BACKEND-STATUS.md" style="color:var(--gold-light)">BACKEND-STATUS.md</a>,
        govern every surface FRQNCY ships.`,
      items: [
        { label: 'Private by default.', body: 'Local-first works completely. Cloud sync is opt-in via signed-in account. Yours, not borrowed — exportable as JSON at any moment, importable on any device. The user is the keeper of their own data.', pullText: 'Private by default. Yours. Exportable. The user is the keeper.', pullCite: 'FRQNCY · Sanctuary Roadmap · Principles' },
        { label: 'Honest about state.', body: 'Every surface declares its lifecycle: alive, scaffolded, zero-state. We don\'t fake polish over scaffold. If a migration isn\'t applied, the warning is in the console; the experience never silently fails.', pullText: 'Alive. Scaffolded. Zero-state. We don\'t fake polish over scaffold.', pullCite: 'FRQNCY · Backend Status · Legend' },
        { label: 'Slow.', body: 'Surfaces written for contemplation, not throughput. Cormorant italic for the things that should land softly. No engagement loops, no push-for-the-sake-of-push. The work invites the user to slow down — never to scroll harder.', pullText: 'Surfaces for contemplation, not throughput.', pullCite: 'FRQNCY · Sanctuary Roadmap · Principles' },
      ],
      tail: [
        { label: 'Tied to the network without depending on it.', body: 'Every Sanctuary surface is usable end-to-end with no other FRQNCY surface visited. The Word Illuminator deep-links from any topic page; visited topics auto-mark across the site. But the Sanctuary remains usable end-to-end alone. The network amplifies; it doesn\'t gate.' },
        { label: 'Not extracted.', body: 'All Sanctuary functionality stays free in perpetuity. Membership is support — it does not unlock features the public can\'t see. The build serves the user, never the metric. No streak-loss penalties, no comparison to others, no algorithmic recommendations. The user is the predictor; the surface is the mirror.' },
      ],
    },
    picks: {
      h2Strong: 'how to build.',
      body: `Building good places — physical or digital — is older than software by millennia.
        These five voices, across architecture, design, organisations, and software, are how
        FRQNCY learned to make.`,
      items: [
        { eyebrow: 'Patterns', title: 'A Pattern Language', body: 'Christopher Alexander, 1977. 253 patterns from window-seat to city — the canon of human-shaped places.', url: 'https://archive.org/details/apatternlanguage0000alex' },
        { eyebrow: 'Time', title: 'How Buildings Learn', body: 'Stewart Brand, 1994. Buildings change, software does too. Layered systems and the slow layers underneath.', url: 'https://archive.org/details/how-buildings-learn-stewart-brand-1995' },
        { eyebrow: 'Affordance', title: 'The Design of Everyday Things', body: 'Donald Norman, 1988. Affordance, signifier, mapping — what objects ask of the people who use them.', url: 'https://archive.org/details/design-of-everyday-things-revised-and-expanded-edition-the-don-norman-z-lib.org-1' },
        { eyebrow: 'Principles', title: 'Inventing on Principle', body: 'Bret Victor, 2012. The talk on building with values explicit — what you believe shows up in the tools you make.', url: 'https://vimeo.com/36579366', cta: 'Watch the talk →' },
        { eyebrow: 'Systems', title: 'Operating Manual for Spaceship Earth', body: 'Buckminster Fuller, 1969. Whole-system thinking applied to civilisation as the building.', url: 'https://archive.org/details/operatingmanualf00full' },
      ],
    },
    quotes: [
      { text: 'Form follows function.', cite: 'Louis Sullivan' },
      { text: 'Make it work. Make it right. Make it fast.', cite: 'Kent Beck' },
      { text: 'What you cannot enforce, do not command.', cite: 'Sophocles' },
    ],
  },

  research: {
    title: 'Research',
    breadcrumbName: 'Research',
    metaDesc: 'Research as first-principles inquiry — every topic approached fresh, primary sources only, the practitioner\'s perspective rather than the encyclopedia\'s.',
    bodyClassName: 'research',
    accentPrimary: '#4A5BA0',
    accentLight: '#7A8BC9',
    accentRgbCommas: '74, 91, 160',
    cssCommentBody: '"The first principle is that you must not fool yourself." — Richard Feynman',
    accentCssCommentBody: 'Research-specific accent — scholarly indigo / periwinkle',
    hero: {
      eyebrow: 'Research · Pillar · How we ask',
      descHtml: `We research because every topic deserves to be approached fresh — first principles,
        primary sources, the practitioner's perspective rather than the encyclopedia's. The
        library is the open canon; each topic is its own piece of the artwork.`,
      quoteText: "The first principle is that you must not fool yourself — and you are the easiest person to fool.",
      quoteCite: 'Richard Feynman · Caltech Commencement, 1974',
    },
    closing: { text: 'The map is not the territory.', cite: 'Alfred Korzybski · Science and Sanity' },
    ldArticleHeadline: 'Research — How we ask',
    ldArticleDesc: 'The procedure FRQNCY uses to commission a topic page: primary sources, voice-locked, each topic its own piece, six parallel research passes per commission.',
    methodology: {
      intro: `Research is the procedure FRQNCY uses to commission each topic page. Five rules,
        drawn from <a href="/proposals/TOPIC-COMMISSION-CONTEXT-GRAPH.md" style="color:var(--gold-light)">TOPIC-COMMISSION-CONTEXT-GRAPH.md</a>
        and <a href="/proposals/FRQNCY-VOICE-PLAYBOOK.md" style="color:var(--gold-light)">FRQNCY-VOICE-PLAYBOOK.md</a>,
        govern every commission FRQNCY ships.`,
      items: [
        { label: 'No second-hand summaries.', body: 'Primary sources only. Read the book, use the product, meet the person. Wikipedia is not a source; it is at best a starting index. Master quotes come from the original work, with the citation.', pullText: 'Primary sources only. Wikipedia is not a source.', pullCite: 'FRQNCY · Editorial Practice' },
        { label: 'Voice-locked.', body: 'Every commission passes the voice playbook checklist before ship: present tense, declarative shortness, no clichés, no instructional hedging. The voice is constant across the network — it does not change by topic.', pullText: 'Voice is constant. It does not change by channel or audience.', pullCite: 'FRQNCY · Voice Playbook' },
        { label: 'Each topic is its own piece.', body: 'Layout, typography, structural metaphor, accent colour, motion language — they emerge from the subject. Water descends. Crypto encrypts. Mycelium branches. Whatever the topic\'s gesture is becomes the page\'s gesture.', pullText: 'Each topic is its own piece. The structural metaphor emerges from the subject.', pullCite: 'FRQNCY · Topic Commission Graph · §3' },
      ],
      tail: [
        { label: 'The contested layer is honest.', body: 'What the mainstream contests, why, and FRQNCY\'s framing — without true-believer or dismissive registers. We don\'t flatten difficulty into agreement. We don\'t hide what we believe. The reader can locate where they stand.' },
        { label: 'Six parallel passes per topic.', body: 'Best-designed sites in the topic\'s neighbourhood. Verified image and video sources. Master quotes. Empirical layer. Contested layer. Adjacent picks. The recipe is the rigor — and once five commissions exist, the harness can run it end-to-end with light operator direction.' },
      ],
    },
    picks: {
      h2Strong: 'how to ask.',
      body: `Research is older than universities. These five voices, across physics, economics,
        philosophy, systems, and political theory, are how FRQNCY learned to think.`,
      items: [
        { eyebrow: 'First principles', title: 'The Feynman Lectures on Physics', body: 'Richard Feynman, 1963. The textbook of textbooks — physics derived from observation, not authority.', url: 'https://www.feynmanlectures.caltech.edu/', cta: 'Read online (free) →' },
        { eyebrow: 'Re-thinking economy', title: 'Sacred Economics', body: 'Charles Eisenstein, 2011. Money, gift, and the transition between civilisational stories.', url: 'https://archive.org/details/sacredeconomicsmoneygiftandsocietyintheageoftransitioncharleseisenstein', cta: 'Find the book →' },
        { eyebrow: 'Mind', title: 'The Master and His Emissary', body: 'Iain McGilchrist, 2009. Hemispheres of the brain as two ways of knowing the world — and what we lost when one took over.', url: 'https://archive.org/details/themasterandhisemissary', cta: 'Find the book →' },
        { eyebrow: 'Systems', title: 'Thinking in Systems', body: 'Donella Meadows, 2008. Stocks, flows, feedback loops — the literacy that lets you see what holds a system in place.', url: 'https://archive.org/details/thinking-in-systems-by-donella-h-meadows', cta: 'Find the book →' },
        { eyebrow: 'Polity', title: 'The Human Condition', body: 'Hannah Arendt, 1958. Labour, work, action — first-principles political philosophy of what it means to be human together.', url: 'https://archive.org/details/the-human-condition', cta: 'Find the book →' },
      ],
    },
    quotes: [
      { text: 'The unexamined life is not worth living.', cite: 'Socrates · via Plato\'s Apology' },
      { text: 'Doubt is not a pleasant condition, but certainty is absurd.', cite: 'Voltaire' },
      { text: 'All models are wrong, but some are useful.', cite: 'George Box · Statistician' },
    ],
  },

  media: {
    title: 'Media',
    breadcrumbName: 'Media',
    metaDesc: 'Media as plain speech about non-plain things. The podcast is the long room. The voice playbook is the tuning. Conviction matters more than reach.',
    bodyClassName: 'media',
    accentPrimary: '#C97C5D',
    accentLight: '#E5A081',
    accentRgbCommas: '201, 124, 93',
    cssCommentBody: '"The medium is the message." — Marshall McLuhan',
    accentCssCommentBody: 'Media-specific accent — broadcast amber / peach',
    hero: {
      eyebrow: 'Media · Pillar · How we speak',
      descHtml: `Media is how the field talks to itself. The podcast is the long room. The voice
        playbook is the tuning. We write and broadcast because conviction matters more than
        reach — and conviction without voice does not travel.`,
      quoteText: "The medium is the message.",
      quoteCite: 'Marshall McLuhan · Understanding Media',
    },
    closing: { text: 'Plain speech about non-plain things.', cite: 'FRQNCY · Voice Playbook' },
    ldArticleHeadline: 'Media — How we speak',
    ldArticleDesc: 'How FRQNCY broadcasts: remembrance over teaching, present-tense certainty, declarative shortness, conviction without dogma, plain speech about non-plain things.',
    methodology: {
      intro: `Media is the operating voice of the network. Five rules, drawn from
        <a href="/proposals/FRQNCY-VOICE-PLAYBOOK.md" style="color:var(--gold-light)">FRQNCY-VOICE-PLAYBOOK.md</a>
        and <a href="/proposals/EDITORIAL-VALUES-V2.md" style="color:var(--gold-light)">EDITORIAL-VALUES-V2.md</a>,
        govern every public sentence FRQNCY writes.`,
      items: [
        { label: 'Remembrance over teaching.', body: 'We mirror what the reader already is — we do not instruct toward something new. The operative verb is remember, not learn or achieve. CTAs assume the reader\'s knowingness; the site is a mirror, not a library.', pullText: 'A mirror, not a library. You remember what you truly are.', pullCite: 'FRQNCY · Voice Playbook · Voice Attribute 1' },
        { label: 'Present-tense certainty.', body: 'FRQNCY is, not will be. Every meaningful claim about the network is in the present. In-progress items get declarative framing ("a podcast on the way" not "we are working toward launching a podcast"). No future-promise, no past-nostalgia.', pullText: 'FRQNCY is, not will be. You are, not you can become.', pullCite: 'FRQNCY · Voice Playbook · Voice Attribute 2' },
        { label: 'Declarative shortness, lists of three.', body: 'Short sentences. Triads — three fragments in sequence — at least once per major section. No subordinate clauses. No additionally / moreover / however. The signature rhythm is unconditional, eternal, burning — not academic prose.', pullText: 'Unconditional love. Eternal light. Burning passion.', pullCite: 'FRQNCY · Voice Playbook · Voice Attribute 3' },
      ],
      tail: [
        { label: 'Conviction without dogma.', body: 'State positions plainly. Be willing to be too much for someone who isn\'t ready — but never rank people. Conviction as self-expression is welcome; conviction as judgment of others is not. Practices framed as experiments. Curation rationale stated, not hedged.' },
        { label: 'Plain speech about non-plain things.', body: 'Metaphysics delivered without academic hedging or wellness-borrowed register. No "in some traditions." No "soul food," "high vibe," "manifest," "do the work," "level up." The two registers — physics and sacred — held simultaneously, never alternated.' },
      ],
    },
    picks: {
      h2Strong: 'how to speak.',
      body: `Media long predates microphones. These five voices, across mediation, attention,
        social platforms, the essay, and the writing process, taught FRQNCY how to write.`,
      items: [
        { eyebrow: 'Mediation', title: 'Understanding Media', body: 'Marshall McLuhan, 1964. The canon of mediation — what mediums do to the mind that consumes them.', url: 'https://archive.org/details/understandingmed0000mclu' },
        { eyebrow: 'Attention', title: 'Amusing Ourselves to Death', body: 'Neil Postman, 1985. What television did to public discourse, written before social platforms — exact, not nostalgic.', url: 'https://archive.org/details/amusingourselves00post' },
        { eyebrow: 'Platforms', title: 'Ten Arguments for Deleting Your Social Media Accounts', body: 'Jaron Lanier, 2018. The architect of VR on what the platforms become when their incentives run unchecked.', url: 'https://archive.org/details/ten-arguments-for-deleting-your-social-media-accounts-right-now' },
        { eyebrow: 'Essay', title: 'Slouching Towards Bethlehem', body: 'Joan Didion, 1968. The essay as instrument — observation that does not editorialise but cannot be ignored.', url: 'https://archive.org/details/slouching-towards-bethlehem' },
        { eyebrow: 'Process', title: 'Draft No. 4', body: 'John McPhee, 2017. Fifty years of writing, distilled — structure, drafting, the discipline of revision.', url: 'https://archive.org/details/draft-no-4-on-the-writing-process' },
      ],
    },
    quotes: [
      { text: 'The truth, like sleep, is incompatible with effort.', cite: 'Jiddu Krishnamurti' },
      { text: 'Speech is silver. Silence is golden.', cite: 'Thomas Carlyle' },
      { text: 'Tell the truth, even if your voice shakes.', cite: 'Maggie Kuhn' },
    ],
  },

  education: {
    title: 'Education',
    breadcrumbName: 'Education',
    metaDesc: 'Education as the slow path. The library is the open canon. Courses are the chosen path. The chart is the personalised map. We hold the teaching open.',
    bodyClassName: 'education',
    accentPrimary: '#5A7045',
    accentLight: '#88A573',
    accentRgbCommas: '90, 112, 69',
    cssCommentBody: '"Education is the kindling of a flame, not the filling of a vessel." — Plutarch',
    accentCssCommentBody: 'Education-specific accent — forest / sage / scholarly leather',
    hero: {
      eyebrow: 'Education · Pillar · How we learn',
      descHtml: `Education is the slow path. The library is the open canon — every teaching lives on
        the site, free forever. Courses are the chosen path for those who want depth. The
        chart is the personalised map. We hold the teaching open; we do not push it.`,
      quoteText: "Education is the kindling of a flame, not the filling of a vessel.",
      quoteCite: 'Plutarch · On Listening',
    },
    closing: { text: 'He who knows others is wise; he who knows himself is enlightened.', cite: 'Lao Tzu · Tao Te Ching' },
    ldArticleHeadline: 'Education — How we learn',
    ldArticleDesc: 'How FRQNCY teaches: every teaching on the site, practices as experiments, the chart personalises without prescribing, the slow path, the thesis never paywalled.',
    methodology: {
      intro: `Education is the slow operating discipline of the network. Five rules, drawn from
        <a href="/proposals/EDITORIAL-VALUES-V2.md" style="color:var(--gold-light)">EDITORIAL-VALUES-V2.md</a>
        and <a href="/proposals/REVENUE-MODEL.md" style="color:var(--gold-light)">REVENUE-MODEL.md</a>,
        govern every teaching surface FRQNCY ships.`,
      items: [
        { label: 'The library is open.', body: 'Every teaching lives on the site — life stories, profiles, summaries, topic pages. Free forever. External links are footnotes, not destinations. The site is the canonical home of the work over time, not a directory of where else to go.', pullText: 'Every teaching lives on the site. External links are footnotes.', pullCite: 'FRQNCY · Editorial Values · §2' },
        { label: 'Practices as experiments, not prescriptions.', body: 'Techniques are framed as instruments to try, never as obligations. The reader stays the agent. We do not say "you must" or "do the work" — we describe what a practice is for, what it does, and what to notice if you try it.', pullText: 'Practices as experiments, not prescriptions. The reader stays the agent.', pullCite: 'FRQNCY · Editorial Values · §2' },
        { label: 'The chart personalises without prescribing.', body: 'Human Design + Gene Keys + Natal — the user\'s own signature, used to filter the open canon. The chart is the map, the user is the cartographer. We never tell the user what to do; we surface what their design is asking them to attend to.', pullText: 'The chart is the map. The user is the cartographer.', pullCite: 'FRQNCY · Sanctuary Roadmap · Phase 3' },
      ],
      tail: [
        { label: 'Slow path, not engagement loop.', body: 'Courses unfold over time. Topics reward depth. We design for retention of substance — the material the user can use a year from now — not retention of attention. No streaks-as-leaderboard, no notification cascades, no "you\'re falling behind" framing.' },
        { label: 'Thesis never paywalled.', body: 'Free intro lessons exist for everyone; paid tiers are for the practitioner who wants the cohort, the depth, the access to the room. The teaching is free; the depth is supported. We never gate the thesis behind a checkout.' },
      ],
    },
    picks: {
      h2Strong: 'how to learn.',
      body: `Education predates schools by all of human history. These five voices, across
        liberation, the child mind, observation, and the slow path, are how FRQNCY learned
        what learning is.`,
      items: [
        { eyebrow: 'Liberation', title: 'Deschooling Society', body: 'Ivan Illich, 1971. School as institution of conformity — and what learning could be without it.', url: 'https://archive.org/details/illich-deschooling-society' },
        { eyebrow: 'Pedagogy', title: 'Pedagogy of the Oppressed', body: 'Paulo Freire, 1968. Banking-model versus problem-posing education — and which one frees the student.', url: 'https://archive.org/details/pedagogyofoppres0000frei' },
        { eyebrow: 'The child mind', title: 'The Absorbent Mind', body: 'Maria Montessori, 1949. The child as natural learner — what they reveal when the adult stops interfering.', url: 'https://archive.org/details/absorbentmind0000mont' },
        { eyebrow: 'Observation', title: 'How Children Fail', body: 'John Holt, 1964. Observation, not theory — what actually goes wrong in the classroom, written from inside one.', url: 'https://archive.org/details/howchildrenfail0000holt' },
        { eyebrow: 'Slow', title: 'Home Education', body: 'Charlotte Mason, 1886. The slow, attention-shaped approach — short lessons, living books, narration over testing.', url: 'https://archive.org/details/homeeducation00maso' },
      ],
    },
    quotes: [
      { text: 'Strange is our situation here upon Earth.', cite: 'Albert Einstein · The World As I See It' },
      { text: 'Wisdom begins in wonder.', cite: 'Socrates · via Plato' },
      { text: 'An investment in knowledge pays the best interest.', cite: 'Benjamin Franklin' },
    ],
  },

  fund: {
    title: 'Fund',
    breadcrumbName: 'Fund',
    metaDesc: 'Capital as a force for conscious civilisation — backing builders, researchers, and creators at the frontier. Carry funds the free public layer.',
    bodyClassName: 'fund',
    accentPrimary: '#6B5BC4',
    accentLight: '#9485E0',
    accentRgbCommas: '107, 91, 196',
    cssCommentBody: '"Money is a kind of poetry." — Wallace Stevens',
    accentCssCommentBody: 'Fund-specific accent — deep purple / amethyst',
    hero: {
      eyebrow: 'Fund · Pillar · How we allocate',
      descHtml: `We fund what the world model lights up. Capital flows to the builders, researchers,
        and creators working at the frontier of conscious civilisation. The fund is the engine;
        the public site is the cathedral. We always give in abundance.`,
      quoteText: "Money is a kind of poetry.",
      quoteCite: 'Wallace Stevens · Adagia',
    },
    closing: { text: 'A map of where we see the world going — and which builders we believe are taking us there.', cite: 'FRQNCY · Fund · Vision' },
    ldArticleHeadline: 'Fund — How we allocate',
    ldArticleDesc: 'How FRQNCY allocates capital: conviction precedes investment, carry funds the free public layer, every relationship disclosed, no paid placement, always give in abundance.',
    methodology: {
      intro: `The Fund is the long-horizon revenue surface of the network. Five rules, drawn from
        <a href="/proposals/REVENUE-MODEL.md" style="color:var(--gold-light)">REVENUE-MODEL.md §5</a>
        and <a href="/proposals/EDITORIAL-STANDARDS.md" style="color:var(--gold-light)">EDITORIAL-STANDARDS.md</a>,
        govern every check the Fund writes.`,
      items: [
        { label: 'Capital follows conviction, not the reverse.', body: 'The pick decision precedes any investment. We do not engineer a conviction to justify a check, and we do not start from "we could partner here" and back into a pick. The world model lights up; the capital follows.', pullText: 'Conviction precedes capital. The world model lights up; the capital follows.', pullCite: 'FRQNCY · Editorial Standards · §1.4' },
        { label: 'Carry funds the free public layer.', body: 'Successful exits underwrite the network\'s gift. The Fund is the engine; the public site — every topic page, every life story, every summary — is the cathedral. The free layer stays free in perpetuity because the Fund keeps it solvent.', pullText: 'Carry funds the gift. The free layer stays free because the Fund keeps it solvent.', pullCite: 'FRQNCY · Revenue Model · §5' },
        { label: 'Disclose every relationship.', body: 'A portfolio company appearing on FRQNCY\'s editorial surfaces declares the relationship via its <code>revenue_relationship</code> field — null, contributor, partner, or affiliate. Disclosure renders automatically. No buried footnotes, no exception, no rationalisation about "this one is different."', pullText: 'Every relationship declared. No exception, no rationalisation.', pullCite: 'FRQNCY · Editorial Standards · §2' },
      ],
      tail: [
        { label: 'No paid placement, ever.', body: 'Capital cannot buy a pick. If money becomes the reason something appears, it is not editorial — it is an ad, and FRQNCY does not run ads. This rule is load-bearing: it is the only protection trust has against the fund\'s own incentives.' },
        { label: 'Always give in abundance.', body: 'The Fund\'s posture is positive-sum. We back what amplifies the field — never what extracts from it. Limited partners are FRQNCY members at higher tiers, public capable of investing, and aligned institutional capital. Every transaction we make has a winner on both sides.' },
      ],
    },
    picks: {
      h2Strong: 'how to allocate.',
      body: `Capital allocation as discipline is older than venture capital by centuries. These
        five voices, across value, second-order thinking, mental models, opportunity cost, and
        what we count as value, are how FRQNCY learned to fund.`,
      items: [
        { eyebrow: 'Discipline', title: 'The Intelligent Investor', body: 'Benjamin Graham, 1949. Capital allocation as patient, contrarian, value-anchored discipline — the textbook Warren Buffett calls his foundation.', url: 'https://archive.org/details/the-intelligent-investor-benjamin-graham' },
        { eyebrow: 'Second order', title: 'The Most Important Thing', body: 'Howard Marks, 2011. Risk, cycles, and second-order thinking — what separates investing from speculation.', url: 'https://archive.org/details/the-most-important-thing-illuminated-howard-marks' },
        { eyebrow: 'Mental models', title: 'Poor Charlie\'s Almanack', body: 'Charlie Munger, 2005. Latticework of mental models for capital — and a lifetime of avoiding stupid mistakes.', url: 'https://archive.org/details/poor-charlies-almanack-the-wit-and-wisdom-of-charles-t.-munger', cta: 'Find the book →' },
        { eyebrow: 'Opportunity cost', title: 'Economics in One Lesson', body: 'Henry Hazlitt, 1946. The seen and the unseen — opportunity cost as the foundation of every economic question.', url: 'https://archive.org/details/economicsinonelesson00hazl' },
        { eyebrow: 'Value', title: 'The Value of Everything', body: 'Mariana Mazzucato, 2018. What we count as value-creating versus value-extracting — and why the distinction shapes civilisation.', url: 'https://archive.org/details/the-value-of-everything-making-and-taking-in-the-global-economy' },
      ],
    },
    quotes: [
      { text: 'The best time to plant a tree was twenty years ago. The second best time is now.', cite: 'Chinese proverb' },
      { text: 'The four most dangerous words in investing are: this time it\'s different.', cite: 'John Templeton' },
      { text: 'In the long run, we are all dead.', cite: 'John Maynard Keynes' },
    ],
  },

  'network-state': {
    title: 'Network State',
    breadcrumbName: 'Network State',
    metaDesc: 'A network of bodies — Lugano first, then everywhere. Reciprocal access. Cooperation over competition. Membership is support, not unlock.',
    bodyClassName: 'networkstate',
    accentPrimary: '#3D7B7E',
    accentLight: '#6FA8AA',
    accentRgbCommas: '61, 123, 126',
    cssCommentBody: '"A network of people, building their dream life." — FRQNCY',
    accentCssCommentBody: 'Network-state-specific accent — alpine teal / lake stone',
    hero: {
      eyebrow: 'Network State · Pillar · How we belong',
      descHtml: `The network state is the geography of FRQNCY. Lugano is the first node. Sanctuary
        spaces are the bodies. Membership is the practice of belonging — to a place, to a
        network, to oneself.`,
      quoteText: "A network of people, building their dream life.",
      quoteCite: 'FRQNCY · Homepage',
    },
    closing: { text: 'We invite you to find yourself.', cite: 'FRQNCY · Homepage' },
    ldArticleHeadline: 'Network State — How we belong',
    ldArticleDesc: 'How FRQNCY constitutes its network of physical sanctuaries: cooperation over competition, reciprocal access, real assets, founders write themselves out, membership is support.',
    methodology: {
      intro: `The Network State is the long-horizon physical pillar of FRQNCY. Five rules, drawn
        from <a href="/proposals/REVENUE-MODEL.md" style="color:var(--gold-light)">REVENUE-MODEL.md §4</a>,
        <a href="/proposals/EDITORIAL-VALUES-V2.md" style="color:var(--gold-light)">EDITORIAL-VALUES-V2.md</a>,
        and <a href="/proposals/SANCTUARY-ROADMAP.md" style="color:var(--gold-light)">SANCTUARY-ROADMAP.md</a>,
        govern every Space FRQNCY opens.`,
      items: [
        { label: 'Cooperation over competition.', body: 'Every transaction in the network is positive-sum. No leaderboards. No ranking of people. Conviction as self-expression is welcome — judgment of others is not. The network is a system of relationships, not a hierarchy.', pullText: 'No leaderboards. Cooperation over competition.', pullCite: 'FRQNCY · Editorial Values · §2' },
        { label: 'Reciprocal access.', body: 'A member of one Space has access — or reciprocal-rate access — to every other Space worldwide. The network-state premium is the whole network, not just your local node. Lugano-Berlin-Lisbon is one practice space spread across three cities.', pullText: 'A member of one Space has access to every Space.', pullCite: 'FRQNCY · Revenue Model · §4' },
        { label: 'Real assets, eventually.', body: 'Long-lease or owned property. The building is part of the Sanctuary, not a backdrop to it. Physical sanctuaries are the bodies of the network — they hold gatherings, retreats, sound baths, breathwork sessions, dinners — and over time become assets that compound across generations.', pullText: 'The building is part of the Sanctuary, not a backdrop to it.', pullCite: 'FRQNCY · Revenue Model · §4 long-term' },
      ],
      tail: [
        { label: 'Founders write themselves out.', body: 'Each Space starts with a founding cohort and progresses toward operator independence. The network is governed by its inhabitants. Founders earn lifetime rates and a voice in the room while the Space is being designed — but the Space outlives any one of them.' },
        { label: 'Membership is support, not unlock.', body: 'All FRQNCY public functionality stays free. Membership funds the network\'s underwriting — the Spaces, the cohort programs, the operator stipend. It does not buy access to a teaching the public can\'t see. The free layer remains free, forever, in every city the network touches.' },
      ],
    },
    picks: {
      h2Strong: 'how to belong.',
      body: `Network states are older than nation states by millennia. These five voices, across
        the operating manual, civilisations as choice, the long view, urban form, and the dawn
        of cities, are how FRQNCY learned to constitute itself.`,
      items: [
        { eyebrow: 'Manual', title: 'The Network State', body: 'Balaji Srinivasan, 2022. The operating manual for digital communities crystallising into physical sovereignty — the book FRQNCY argues with daily.', url: 'https://thenetworkstate.com/', cta: 'Read online (free) →' },
        { eyebrow: 'The long view', title: 'Sapiens', body: 'Yuval Noah Harari, 2011. Cognitive, agricultural, scientific revolutions — the long arc of human collective action.', url: 'https://archive.org/details/sapiens-a-brief-history-of-humankind' },
        { eyebrow: 'Civilisation', title: 'The Dawn of Everything', body: 'David Graeber & David Wengrow, 2021. Civilisations as choice — the freedoms our ancestors had that we forgot were possible.', url: 'https://archive.org/details/the-dawn-of-everything-a-new-history-of-humanity' },
        { eyebrow: 'Urban form', title: 'The City in History', body: 'Lewis Mumford, 1961. What makes a settlement work — across millennia, across forms, across collapses.', url: 'https://archive.org/details/cityinhistory0000mumf' },
        { eyebrow: 'Possibility', title: 'The More Beautiful World Our Hearts Know Is Possible', body: 'Charles Eisenstein, 2013. The interbeing thesis applied to collective belonging — not utopia, but the next coherent step.', url: 'https://archive.org/details/the-more-beautiful-world-our-hearts-know-is-possible-charles-eisenstein' },
      ],
    },
    quotes: [
      { text: 'Geography is destiny.', cite: 'Attributed to Napoleon Bonaparte' },
      { text: 'It takes a village.', cite: 'African proverb' },
      { text: 'We are the ones we\'ve been waiting for.', cite: 'June Jordan · Poem for South African Women' },
    ],
  },
};

// ── Build each pillar ────────────────────────────────────────────────────

function applyPillar(slug, cfg) {
  let out = sellSrc;

  // Block-level swaps FIRST (before any URL replaceAll, because some markers
  // contain sell URLs).

  // CSS comment block.
  const newCssComment = `/* ════════════════════════════════════════════════════════════════════
   ${cfg.title.toUpperCase()} — Pillar.
   ${cfg.cssCommentBody}
   ──────────────────────────────────────────────────────────────────── */`;
  if (!out.includes(M.cssComment)) throw new Error(`[${slug}] cssComment marker not found`);
  out = out.replace(M.cssComment, newCssComment);

  // Accent CSS comment.
  const newAccentCssComment = `  /* ${cfg.accentCssCommentBody} */`;
  if (!out.includes(M.accentCssComment)) throw new Error(`[${slug}] accentCssComment marker not found`);
  out = out.replace(M.accentCssComment, newAccentCssComment);

  // Body class (cosmetic; harmless if not perfectly matched).
  const newBodyClass = `main.${cfg.bodyClassName}-body { position: relative; background: var(--navy); padding: 0 clamp(1.5rem, 5vw, 3rem); }`;
  if (!out.includes(M.bodyClass)) throw new Error(`[${slug}] bodyClass marker not found`);
  out = out.replace(M.bodyClass, newBodyClass);

  // Schema.org JSON-LD.
  const newLdJson = renderLdJson({
    slug,
    title: cfg.title,
    articleHeadline: cfg.ldArticleHeadline,
    articleDesc: cfg.ldArticleDesc,
    breadcrumbName: cfg.breadcrumbName,
    hasPartName: 'Five non-negotiables, one method.',
    hasPartAnchor: 'five-non-negotiables',
  });
  if (!out.includes(M.ldJson)) throw new Error(`[${slug}] ldJson marker not found`);
  out = out.replace(M.ldJson, newLdJson);

  // Breadcrumb nav.
  const newBreadcrumb = `      <a href="/v2/explore.html">Explore</a><span class="sep">/</span>
      <span>${cfg.breadcrumbName}</span>`;
  if (!out.includes(M.breadcrumb)) throw new Error(`[${slug}] breadcrumb marker not found`);
  out = out.replace(M.breadcrumb, newBreadcrumb);

  // Hero.
  const newHero = renderHero({ slug, title: cfg.title, ...cfg.hero });
  if (!out.includes(M.hero)) throw new Error(`[${slug}] hero marker not found`);
  out = out.replace(M.hero, newHero);

  // Picks.
  const newPicks = renderPicks(cfg.picks);
  if (!out.includes(M.picks)) throw new Error(`[${slug}] picks marker not found`);
  out = out.replace(M.picks, newPicks);

  // Quotes grid.
  const newQuotes = renderQuotes(cfg.quotes);
  if (!out.includes(M.quotes)) throw new Error(`[${slug}] quotes marker not found`);
  out = out.replace(M.quotes, newQuotes);

  // Methodology.
  const newMethodology = renderMethodology({
    slug,
    title: cfg.title,
    intro: cfg.methodology.intro,
    items: [...cfg.methodology.items, ...cfg.methodology.tail],
  });
  if (!out.includes(M.methodology)) throw new Error(`[${slug}] methodology marker not found`);
  out = out.replace(M.methodology, newMethodology);

  // Constellation heading.
  const newConstellationHeading = `${cfg.title} across the <strong>network.</strong>`;
  if (!out.includes(M.constellationHeading)) throw new Error(`[${slug}] constellationHeading marker not found`);
  out = out.replace(M.constellationHeading, newConstellationHeading);

  // Constellation CTA.
  const newConstellationCta = `      <a href="/v2/explore.html?focus=${slug}" class="constellation-cta">Explore the full reach of ${cfg.title} ↗</a>`;
  if (!out.includes(M.constellationCta)) throw new Error(`[${slug}] constellationCta marker not found`);
  out = out.replace(M.constellationCta, newConstellationCta);

  // filterByPillar slug.
  out = out.replace(/filterByPillar\('sell'/g, `filterByPillar('${slug}'`);

  // Closing quote.
  const newClosing = renderClosing(cfg.closing);
  if (!out.includes(M.closing)) throw new Error(`[${slug}] closing marker not found`);
  out = out.replace(M.closing, newClosing);

  // Byline date.
  const newByline = `Updated <time datetime="${TODAY}">${TODAY_HUMAN}</time>`;
  if (!out.includes(M.bylineDate)) throw new Error(`[${slug}] bylineDate marker not found`);
  out = out.replace(M.bylineDate, newByline);

  // Whole-file URL/title/asset replacements (AFTER block swaps, because some
  // sell URLs were inside the original markers).
  out = out.replaceAll('https://frqncy.network/v2/sell/', `https://frqncy.network/v2/${slug}/`);
  out = out.replaceAll('/v2/og/sell.png', `/v2/og/${slug}.png`);
  out = out.replaceAll('Sell — FRQNCY Network', `${cfg.title} — FRQNCY Network`);
  out = out.replaceAll(
    "Commerce as transparent service — the way FRQNCY sells. Anchored on Sinek’s Golden Circle: WHY first, HOW second, WHAT last.",
    cfg.metaDesc,
  );

  // Color tokens (3 forms: hex primary, hex light, rgba spaced).
  out = out.replaceAll('#C4973A', cfg.accentPrimary);
  out = out.replaceAll('#E0C06A', cfg.accentLight);
  out = out.replace(/rgba\(196, ?151, ?58,/g, `rgba(${cfg.accentRgbCommas},`);

  return out;
}

let built = 0;
for (const [slug, cfg] of Object.entries(PILLARS)) {
  const dir = path.join(ROOT, 'v2', slug);
  await fs.mkdir(dir, { recursive: true });
  const html = applyPillar(slug, cfg);
  await fs.writeFile(path.join(dir, 'index.html'), html);
  const lines = html.split('\n').length;
  console.log(`✓ ${slug.padEnd(15)} ${lines} lines`);
  built++;
}
console.log(`\nBuilt ${built} pillar pages.`);
