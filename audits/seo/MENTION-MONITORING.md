# Brand-Mention Monitoring — FRQNCY Network

**Purpose.** Track every public mention of FRQNCY (the topic graph at frqncy.network) so we know what's said, can respond when relevant, and can measure the SEO/AI-citation program over time. Also documents the brand collisions that affect every search.

---

## Critical context — the brand collision landscape

The name "FRQNCY" is contested. Search baseline (2026-04-29) confirms at least five other entities use the name:

1. **FRQNCY Media** (frqncy.media) — editorial documentary podcast studio, Atlanta. Founded 2018 by Michelle Khouri. Clients include Jane Goodall, Diane von Furstenberg, Coca-Cola. **Highest organic search competitor for the unqualified term "FRQNCY".**
2. **FRQNCY Media Group / FMG** (fmgnetworks.com) — conscious-media network for radio + TV hosts. Founded 2004 by Jody Colvard.
3. **FRQNCY** (frqncy.com) — separate entity, scope unclear.
4. **FRQNCY Performance** (frqncyperformance.com) — fitness training brand.
5. **FRQNCY Recording Studios** — Aaron Bucktawor, separate entity.

**Implication for the SEO program:**

- Searching just "FRQNCY" pulls FRQNCY Media first. Always qualify with "frqncy.network" or "FRQNCY Network" or "FRQNCY topic graph" when looking for our entity.
- Some brand searches will collide. Optimize for "FRQNCY Network" + "topic graph for consciousness" + "146 topics" as our distinguishing brand handles.
- Knowledge Graph entry for FRQNCY-the-network needs a clear `description` and `instance of` to disambiguate from FRQNCY-the-podcast-studio. Per the Wikidata briefs (Phase 4.5), this is built into the entity statements.
- When pitching press / podcasts, lead with "FRQNCY Network" or "frqncy.network" — never just "FRQNCY".

---

## Twitter handle correction

Baseline scan found Orlando's actual public handle is **@0xOrli** (display name: "Orlando.FRQNCY"), not @frqncy_network as previously assumed in the homepage Organization schema and `/people/orlando/` Person schema.

**Action item:** verify which handle Orlando wants as the canonical FRQNCY-network public handle. Two options:

a) Register a separate **@frqncy_network** Twitter handle for the brand (recommended; clean separation between Orlando's personal account and the network's institutional voice).

b) Update the Organization + Person schema to use **@0xOrli** if Orlando wants to consolidate.

Until decided, the existing schema has a soft inaccuracy (claims @frqncy_network exists; it may not yet). Low priority but should be fixed within the week.

---

## Monitoring channels (set up in this order)

### 1. Google Alerts — set up today

Free. Email or RSS digest. Set up four alerts:

- `"frqncy.network"` (exact match)
- `"FRQNCY Network"` (exact match)
- `"Orlando Eisenreich"` (exact match)
- `"@frqncy-network/harness"` OR `"frqncy-harness"` (the harness brand)

Setup: <https://www.google.com/alerts>. Choose "All Results" and weekly digest for low-volume terms; daily for any that get noisy later.

### 2. X / Twitter saved searches — today

Saved searches in TweetDeck-equivalent or via API:

- `"frqncy.network"` (mentions of the URL)
- `"FRQNCY Network"`
- `(@0xOrli OR @frqncy_network) lang:en`

Pin as columns. Check daily for direct mentions.

### 3. Plausible referrer log — already wired

Plausible already runs on every page (Phase 0). The referrer report shows where traffic comes from. Watch for:

- `perplexity.ai`, `chat.openai.com`, `claude.ai`, `gemini.google.com`, `copilot.microsoft.com` — direct AI-engine citations
- News domains (any major publication referring traffic = first-time press mention worth tracking)
- Substack / Medium / personal blogs — qualitative coverage

Cadence: weekly review (5 min in the Monday metrics check).

### 4. Cloudflare bot logs — passive

Cloudflare Pages records the User-Agent of every request. Watch for AI crawlers:

- `ClaudeBot`, `anthropic-ai` — Anthropic
- `GPTBot`, `ChatGPT-User`, `OAI-SearchBot` — OpenAI
- `PerplexityBot`, `Perplexity-User` — Perplexity
- `Google-Extended`, `GoogleOther` — Google AI
- `Applebot-Extended` — Apple
- `cohere-ai`, `cohere-training-data-crawler` — Cohere

Bot crawl frequency is a leading indicator that AI engines are indexing FRQNCY for grounding. A spike usually precedes citation activity by 2-4 weeks.

Cadence: monthly export from Cloudflare → bot UA breakdown.

### 5. Hacker News + Reddit — manual

- HN search RSS: `https://hn.algolia.com/api/v1/search_by_date?query=frqncy.network&tags=story` (subscribe via feed reader)
- Reddit search saved: `site:reddit.com "frqncy.network"` weekly via Google
- Specific subs to watch: r/consciousness, r/LessWrong, r/networkstate, r/SimpleLiving, r/conscious_capitalism, r/regenerativeagriculture

### 6. Substack search — quarterly manual

Substack is harder to monitor. Quarterly run a manual search at <https://substack.com/search/frqncy.network> to catch newsletter mentions.

### 7. Podcast directory mentions — quarterly

If FRQNCY (the network) gets mentioned on a podcast that's later transcribed, those transcripts can appear in Google search. Monitor via:

- Listen Notes search for "FRQNCY Network" or "frqncy.network"
- Podscribe (if available)

---

## Response playbook

When a mention appears, classify it and respond accordingly:

### Positive coverage

- **Public news / blog / Substack:** thank the author publicly (X reply or comment); add to `/audits/seo/PRESS-TRACKER.md`; consider sending a personal email to the author offering future collaboration (podcast appearance, expansion piece, partner intro).
- **AI engine citation (Perplexity / ChatGPT / Claude):** screenshot it, add to `/audits/seo/runs/quarterly/<YYYY-QN>-ai-citation.csv`. No response needed.
- **Reddit / HN comment thread:** engage thoughtfully if Orlando has time. Don't astroturf. If a substantive question is asked, answer with FRQNCY-voice and link to the relevant topic page.

### Critical or correctional

- **Factual error:** correct politely. Reference the source (editorial standards, the topic page, etc.). Don't get defensive.
- **Substantive critique:** acknowledge what's valid; engage with the specific point; revise the topic page if the critique exposes a real gap. The Editorial Standards review-on-public-contestation rule applies.
- **Off-brand association** (someone misclassifies FRQNCY as a paid-placement site, or confuses it with FRQNCY Media): correct with a one-line clarification + a link to /editorial-standards/ or /about.

### Spam / scrape / impersonation

- **Scraped content showing FRQNCY's curation as someone else's:** DMCA via the host's standard takedown process.
- **Account impersonating @frqncy_network or @0xOrli:** report via the platform's impersonation report flow.
- **Astroturf-feeling positive mentions:** do nothing; let the algorithm handle.

---

## Baseline 2026-04-29

Run today via WebSearch. Findings:

### Direct mentions of frqncy.network

**None found in public web search.** The site has shipped 757 indexed pages, comprehensive schema, llms.txt + ai.txt, but as of today no organic mention has surfaced in search results. This is the baseline.

This is consistent with the fact that:
- GSC + Bing Webmaster verification hasn't been completed (placeholders still in place)
- IndexNow keyfile is on disk but the deploy hook isn't wired
- The site is < 6 months from the curation network's launch
- AI crawlers (per Cloudflare logs, when reviewed) likely haven't indexed yet

### Brand collisions confirmed

Per the table at the top of this doc — five other FRQNCY entities, three of them with established search presence. Strategic: never pitch as just "FRQNCY"; always qualify.

### Twitter handle reality

@0xOrli is Orlando's active public handle. @frqncy_network either doesn't exist yet or isn't being used. Phase 5.3 sameAs work needs to confirm and either register or correct.

---

## Tracking format

Per-mention log lives at `/audits/seo/MENTION-LOG.md`. Each entry:

```
2026-MM-DD  | URL | Source type | Sentiment | Action taken | Notes
```

Source types: `news`, `blog`, `substack`, `podcast`, `social`, `forum`, `ai-citation`, `directory`, `other`.

Sentiment: `positive`, `neutral`, `correction-needed`, `negative`.

Quarterly review: count mentions by source type, sentiment, top sources, top topics referenced.

---

## When to escalate

A mention deserves Orlando's direct attention (not just logging) when:

- It's the first mention from a tier-1 publication (NYT, FT, Forbes, Atlantic, New Yorker, Wired, etc.)
- It's the first AI-engine citation that brings traffic (Plausible referrer shows ≥ 10 visits in 24h from an AI domain)
- It surfaces a real factual error on FRQNCY that could damage trust
- It's the first podcast appearance that goes live (with show notes link)
- Someone significant in the field (named in `audits/seo/CONTEXT.md` or PHASE-5-DISTRIBUTION.md target lists) cites or comments

For all other mentions, log and review at the weekly Monday cadence.

---

## Re-baseline schedule

Every quarter, re-run the WebSearch baseline (queries: "frqncy.network", "FRQNCY Network", "Orlando Eisenreich", "frqncy-harness", "frqncy-content MCP"). Capture the count, top results, and trajectory. The first re-baseline is 2026-07-29.
