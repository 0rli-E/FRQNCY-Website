# FRQNCY v1 — Public Roadmap

*What FRQNCY is shipping. Two surfaces — the website you're on, the harness underneath. Where each is today, and what's next.*

*Version 1.0 — 2026-05-12. Updated as items ship.*

---

## Editorial position

> Frqncy is for things not against them as we know we create what we focus on. So we are not against war, terror, inequality or the like. We are for peace, freedom and free will and the free expression of every individual. People will say oh but what people then still want to kill each other for the experience? Well if you come from oneness and love why would you ever want to hurt anyone? People hurting others stems from the fact they are themselves hurting in lack, pain or any other destructive state. When you come from a place of gratitude, wholeness and love you will spread gratitude, wholeness and love.

> The goal has to be to take as many of the undecided as possible to new earth and maybe even some of the deeply negative and lost, and give them everything they need to move on into new earth.

> We are part of birthing new earth.

---

## The shape of FRQNCY

Two parallel tracks, one mission. The **website** is the public face — the topic graph people actually read, browse, fund. The **harness** is the engineering substrate — agents, integrations, the AI layer underneath. Both serve the same editorial line.

**Brand architecture.** Three product names sit under the FRQNCY umbrella, each with its own surface but routed through the same content graph and treasury:

- **FRQNCY** — the network itself. The topic graph, the editorial position, the website at `frqncy.network`, the harness, the capital layer. The mother brand.
- **NRG** — the social media surface. The connections / interests / dating layer that lives at `/social/` and rides on the network's identity layer.
- **VBRTN** ("vibration") — the mobile app. iOS + Android Capacitor shell that ships the FRQNCY network natively plus the wake/sleep alarm feature. App Store / Play Store display name. Internal bundle IDs stay `network.frqncy.app` so the codebase costume doesn't have to change with the marketing skin.

```
┌──────────────────────────────────────────────────────┐
│   THE WEBSITE                                        │
│   frqncy.network — the public network                │
│                                                      │
│   227 topics  ·  908 entities  ·  1,116 URLs         │
│   324 books  ·  311 people  ·  115 orgs              │
│   11 places  ·  76 media  ·  8 music  ·  8 studies   │
└──────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────┐
│   THE HARNESS                                        │
│   frqncy-harness — the engineering layer             │
│                                                      │
│   Agents · Integrations · AI · Treasury · Bots       │
└──────────────────────────────────────────────────────┘
```

---

## Track 1 · The Website

### What's live

**Editorial substrate**
- 8 pillars (Curate · Educate · Research · Broadcast · Sell · Fund · Build · Settle)
- 18 domains, 227 topics
- 324 books · 311 people · 115 orgs · 11 places · 76 media · 8 music · 8 studies
- Aligned Goods (curated tools, products, books) at `/aligned/`
- Pillar pages with the 6-book FRQNCY-picks treatment
- Topic + domain + entity pages all auto-generated from beds

**Surfaces shipped**
- Homepage with the network-pulse marquee (one mixed band, image-forward, paused on hover)
- `/about` — vision, manifesto, distinction (spiritual tech + materialism), 100th monkey thesis
- `/start-here` · `/platform` — the entry points
- `/v2/explore.html` — interactive force-directed graph of the network
- `/v2/watch/` — video library
- `/v2/courses/` — 6 long-form courses
- `/music/` · `/music-topic/` · `/v2/concerts/` — three-leg music surface
- `/v2/fund/` · `/v2/crypto/` · `/v2/crypto/projects.html` · `/v2/crypto/explorer.html` — capital pillar pages
- `/podcast` — the FRQNCY podcast page
- `/social/` (NRG) — social layer (auth + feed, Astro-built)
- `/membership/` — membership entry
- `/space` — community space
- `/my-frqncy/dashboard/` · `/my-frqncy/charts/` · `/my-frqncy/practice/` — member dashboards
- **NEW (May 12 batch):** `/donate` · `/launchpad` · `/newsletter` · `/events` · `/v2/concerts/` · `/frqncy-ai`
- `/chart` · `/chart-v2/` — chart generator
- `/aligned/` — the aligned-goods catalogue

**Chrome & infrastructure**
- Canonical header across every page (65 pages auto-synced from `_chrome/global-header.html`)
- Universal back button, breadcrumbs, search bar, My FRQNCY gold CTA
- Tiny floating ♥ Donate button on every page (EVM + Solana wallets, copy-to-clipboard)
- Service worker (v43) with versioned shell, data, and runtime caches
- Cloudflare Pages deploy from `main`

**Editorial chrome**
- Voice playbook + Editorial Standards
- Master Roadmap, Manifesto, Crypto Stack, Projects Paper, Content Roadmap, Physical Milestones, First-retreat plan
- Specs for agents, integrations, and the Telegram channel launch

---

### What's next on the website (Q3 → Q4)

Ordered by who-this-helps-most:

| Priority | Item | Status | Notes |
|---|---|---|---|
| ◉ | First retreat (Essência) ticketing live | spec ready | Needs Luma calendar ID + retreat dates |
| ◉ | Newsletter backend wire-up | UI live, backend stub | Klaviyo or Substack |
| ◉ | Telegram channel launch | playbook ready | See `TELEGRAM-CHANNEL-LAUNCH.md` |
| ○ | Affiliate links across books | schema sketched | Add `affiliate_links[]` to each book entry |
| ○ | Multilingual rollout begin (DE first) | infrastructure spec | EN → DE → ZH → ES |
| ○ | Topic-page Studies surface | bed exists (8 studies) | Render studies block on every relevant topic |
| ○ | Auto-ingest videos from tracked channels | spec ready | Cron + classifier + PR per ingest |
| ◌ | Wikipedia entry for FRQNCY Network | notability dossier needed | Phase 5 of SEO plan |
| ◌ | LinkedIn-style social layer expansion | shell exists at `/social/` | Adds connections + interest matching |

Legend: ◉ ship in next 6 weeks · ○ ship in next quarter · ◌ ship when foundation is denser

---

## Track 2 · The Harness

### What's there today

The harness exists as a working private repo (`github.com/0rli-E/frqncy-harness`). It runs Claude-SDK agents on demand against the website repo — content generation, audits, scraping, codegen. The pieces below describe the *targeted* shape (what the harness will be), not its current minimal state.

### What's next on the harness

| Layer | Agent / piece | Status | Build cost (solo) |
|---|---|---|---|
| Foundation | Runtime + supervision + logging + channel adapters | partial | 3 weeks |
| Outbound | **Hermes** — outbound messenger (Gmail, Telegram, Signal, DM) | spec ready | 3 weeks |
| Inbound | **OpenClaw** — inbound classifier + reply drafter | spec ready | 4 weeks |
| Workflows | **Ironclaw** — end-to-end multi-step workflows | spec ready | 6 weeks |
| Money | **Amex Bot** — transaction classifier + flagger | spec ready | 2 weeks |
| Control | **TG-Topic** — Telegram bot for content patches | spec ready | 2 weeks |
| Control | **TG-Harness** — full harness control from Telegram | spec ready | 1 week (after others) |

Build order (solo): Foundation → Amex → Hermes → OpenClaw → TG-Topic → TG-Harness → Ironclaw. Roughly **5 months elapsed** solo; **2.5 months with one engineer** alongside.

Full specs in `proposals/SPECS-AGENTS.md`.

---

## Track 3 · The Capital Layer *(Q1 → Q2 next year)*

The crypto stack — sequenced separately, gated on website maturity.

| Stage | Item | Target |
|---|---|---|
| T+0 | Treasury setup (multi-sig, council election design) | Q3 |
| T+3mo | **BLNC** stablecoin testnet → mainnet beta | Q4 |
| T+5mo | **FRQNY** governance token contracts + distribution model | Q4 |
| T+6mo | Liquidity bootstrap on Echo (echo.xyz) | Q4 |
| T+6mo | Veto Council elected | Q4 |
| T+6-9mo | AI battletest of the full stack | Q1 next |
| T+9-12mo | Public mainnet + Launchpad live | Q1-Q2 next |

Full sequencing in `proposals/FRQNCY-CRYPTO-STACK.md`.

---

## Track 4 · Physical World

The off-screen surfaces.

| Milestone | Format | Status | Target |
|---|---|---|---|
| First retreat | 5 days · 20-30 people · Essência | spec ready, needs dates + Luma | Q4 |
| Salon programme | Monthly · ~15 people · Lisbon / Berlin / NY | concept | Q4 onwards |
| FRQNCY Days | Quarterly · ~80 people · public ticketing | concept | 2027 Q1 |
| Semi-permanent space | 200-400m² in Lisbon or Berlin | gated on retreat + salon proof | 2027 Q2+ |

Full plan in `proposals/FIRST-PHYSICAL-MILESTONES.md`.

---

## Legal

Yes. Below is the **complete costed model** for the marks we discussed:
1. **FRQNCY NETWORK**
2. **FRQNCY**
3. **VBRTN**
4. **NRG SOCIAL**
I am using a **realistic class model**, not the cheapest fake version.
---
# Assumptions used
## Recommended classes by mark
| Mark               |                    Classes assumed | Why                                                                                  |
| ------------------ | ---------------------------------: | ------------------------------------------------------------------------------------ |
| **FRQNCY NETWORK** |  **5 classes** — 9, 38, 41, 42, 45 | app/software, communications/social, music/education, SaaS/AI, social networking     |
| **FRQNCY**         |          **3 classes** — 9, 41, 42 | app/software, personal development/music/content, SaaS/AI                            |
| **VBRTN**          |          **3 classes** — 9, 41, 42 | app/product/content/platform                                                         |
| **NRG SOCIAL**     | **5 classes** — 35, 38, 41, 42, 45 | community/business network, social platform, events/content, SaaS, social networking |
Total = **16 class-filings** across **4 marks**.
Costs below are mostly **official government fees only**, not lawyer/agent fees, translations, objections, oppositions, or office-action responses.
---
# Main total: USA + EU + UK + Asia priority countries
## Full recommended filing package
| Territory       |                                      Cost basis | Local official cost | Approx. EUR |
| --------------- | ----------------------------------------------: | ------------------: | ----------: |
| **EU / EUIPO**  | 4 marks, 16 classes using EUIPO class structure |          **€4,800** |  **€4,800** |
| **USA**         |                                 $350/class × 16 |          **$5,600** |  **€4,827** |
| **UK**          |   £205 first class + £60 extra classes per mark |          **£1,540** |  **€1,778** |
| **China**       |                              CNY 300/class × 16 |       **CNY 4,800** |    **€583** |
| **Singapore**   |           S$280/class pre-approved wording × 16 |         **S$4,480** |  **€3,011** |
| **Malaysia**    |  RM950/class official pre-approved wording × 16 |        **RM15,200** |  **€3,288** |
| **Japan**       |             Filing + registration official fees |        **¥677,600** |  **€3,670** |
| **South Korea** |             Filing + registration official fees |   **KRW 2,784,000** |  **€1,752** |
| **India**       |                 Company rate, ₹9,000/class × 16 |        **₹144,000** |  **€1,282** |
| **Canada**      |       CIPO first/additional class fee structure |    **CAD 3,752.72** |  **€2,351** |
| **Australia**   |                       A$250/class picklist × 16 |         **A$4,000** |  **€2,448** |
| **UAE**         |                            AED 6,500/class × 16 |     **AED 104,000** | **€24,413** |
## Total for this full serious package
# **≈ €54,202 official fees**
That includes UAE. UAE is by far the cost bomb.
## Same package without UAE
# **≈ €29,789 official fees**
This is much more realistic.
---
# Core-first package
This is what I would actually do first if you want to be cost-conscious:
| Territory | Marks       | Approx. EUR |
| --------- | ----------- | ----------: |
| EU        | all 4 marks |      €4,800 |
| USA       | all 4 marks |      €4,827 |
| UK        | all 4 marks |      €1,778 |
| China     | all 4 marks |        €583 |
| Singapore | all 4 marks |      €3,011 |
| Malaysia  | all 4 marks |      €3,288 |
## Total core-first package
# **≈ €18,287 official fees**
This protects the main commercial blocks without going crazy.
---
# Ultra-lean version: only FRQNCY NETWORK first
Because **FRQNCY NETWORK** is the cleanest and strongest mark, this is the cheapest serious shield.
Assuming **FRQNCY NETWORK** in **5 classes**:
| Territory | Local cost | Approx. EUR |
| --------- | ---------: | ----------: |
| EU        |     €1,350 |      €1,350 |
| USA       |     $1,750 |      €1,508 |
| UK        |       £445 |        €514 |
| China     |  CNY 1,500 |        €182 |
| Singapore |    S$1,400 |        €941 |
| Malaysia  |    RM4,750 |      €1,028 |
## Total for FRQNCY NETWORK in first 6 territories
# **≈ €5,523 official fees**
If you add Japan, Korea, India, Canada, Australia, and UAE:
| Extra territory    | Approx. EUR |
| ------------------ | ----------: |
| Japan              |      €1,142 |
| South Korea        |        €548 |
| India company rate |        €401 |
| Canada             |        €681 |
| Australia          |        €765 |
| UAE                |      €7,629 |
## FRQNCY NETWORK in 12 territories including UAE
# **≈ €16,688 official fees**
## FRQNCY NETWORK in 12 territories excluding UAE
# **≈ €9,059 official fees**
This is probably the best practical version.
---
# Asia extended cost review
For Asia, using the full 4-mark / 16-class model:
| Asian territory |                           Local official cost |   Approx. EUR | Notes                                                          |
| --------------- | --------------------------------------------: | ------------: | -------------------------------------------------------------- |
| **China**       |                                     CNY 4,800 |          €583 | Very cheap official fees; file early because of squatting risk |
| **Singapore**   |                                       S$4,480 |        €3,011 | Based on pre-approved wording                                  |
| **Malaysia**    |                                      RM15,200 |        €3,288 | Based on MyIPO ordinary pre-approved fee                       |
| **Japan**       |                                      ¥677,600 |        €3,670 | Includes filing + registration stage                           |
| **South Korea** |                                 KRW 2,784,000 |        €1,752 | Includes filing + registration stage                           |
| **India**       | ₹144,000 company / ₹72,000 individual-startup | €1,282 / €641 | Depends on applicant type                                      |
| **Hong Kong**   |                                    HKD 20,000 |        €2,210 | Estimated from HK first/additional class structure             |
| **Taiwan**      |                        NTD 48,000 filing only |        €1,368 | Registration/grant costs may add more                          |
| **Indonesia**   |                                IDR 28,800,000 |        €1,516 | General applicant estimate                                     |
| **Thailand**    |                                   THB 230,400 |        €6,144 | Expensive if more than 5 goods/services per class              |
| **Philippines** |            PHP 41,472 filing only, big entity |          €628 | Additional publication/DAU fees can apply                      |
| **UAE**         |                                   AED 104,000 |       €24,413 | Very expensive; file later unless strategically essential      |
## Asia total including UAE
# **≈ €49,864 official fees**
## Asia total excluding UAE
# **≈ €25,451 official fees**
---
# Fee sources used
The main official-fee basis:
* **EUIPO**: €850 first class, €50 second class, €150 for each third/subsequent class. ([EUIPO][1])
* **USPTO**: $350 base application fee per class. ([US-Patentamt][2])
* **UKIPO**: £205 for one class, £60 per additional class. ([GOV.UK][3])
* **WIPO Madrid**: base fee CHF 653 black-and-white / CHF 903 color, plus designation fees. ([WIPO][4])
* **China CNIPA**: CNY 300 per class up to 10 items, CNY 30 per extra item. ([CNIPA][5])
* **Singapore IPOS**: S$280 per class if using pre-approved goods/services; non-pre-approved can be higher. ([IP-Behörde Singapur][6])
* **Malaysia MyIPO**: official page lists RM950 per class using pre-approved wording; Malaysia had a temporary RM650 campaign in 2025, but I would budget the standard official fee unless MyIPO confirms a current reduction. ([MyIPO][7])
* **Japan JPO**: ¥3,400 + ¥8,600 per class application fee; registration fees apply after allowance. ([Japan Patent Office][8])
* **South Korea KIPO**: electronic filing KRW 52,000 per class; registration fees apply after allowance. ([KIPO][9])
* **India**: ₹4,500 per class for individuals/startups/MSMEs online, ₹9,000 per class for companies/LLPs. ([Intepat][10])
* **Canada CIPO**: CAD 491.06 first class and CAD 149.04 each additional class for 2026 online applications. ([Innovation, Wissenschaft und Wirtschaft][11])
* **Australia**: A$250 per class using the standard picklist application. ([ipa][12])
* **UAE**: AED 750 filing/examination + AED 750 publication + AED 5,000 registration = AED 6,500 per class. ([The Jurist][13])
* **Philippines**: IPOPHL filing fees per class differ by small/big entity. ([IPOPHL][14])
* **Thailand**: if more than 5 items in a class, filing fee can be THB 9,000/class plus registration fee THB 5,400/class. ([Harris Sliwoski LLP][15])
* **Indonesia**: general applicant filing fee commonly cited as IDR 1,800,000 per class. ([Am Badar][16])
* **Vietnam**: official fee structure exists, but final cost depends heavily on goods/services count and local handling. ([IP Vietnam][17])
Currency conversions are approximate. I used recent EUR cross-rates around May 2026; XE showed, for example, 1 EUR ≈ 1.1603 USD, 0.8659 GBP, 1.4879 SGD, 1.5961 CAD, and 1.6342 AUD on 19 May 2026. ([Xe][18])
---
# Cheapest recommended filing strategy
## Phase 1 — file immediately
File:
# **FRQNCY NETWORK**
In:
1. **EU**
2. **USA**
3. **UK**
4. **China**
5. **Singapore**
6. **Malaysia**
Classes:
* 9
* 38
* 41
* 42
* 45
Estimated official fees:
# **≈ €5,523**
This is the cleanest "angel shield" that actually protects the empire.
---
## Phase 2 — within 6 months
Add:
# **FRQNCY**
In the same territories:
* EU
* USA
* UK
* China
* Singapore
* Malaysia
Classes:
* 9
* 41
* 42
Estimated additional official fees:
| Territory | Approx. EUR |
| --------- | ----------: |
| EU        |      €1,050 |
| USA       |        €905 |
| UK        |        €375 |
| China     |        €109 |
| Singapore |        €565 |
| Malaysia  |        €617 |
## Phase 2 total
# **≈ €3,621**
Cumulative Phase 1 + Phase 2:
# **≈ €9,144**
---
## Phase 3 — add VBRTN
Same 6 territories, 3 classes.
Approx. same as FRQNCY:
# **≈ €3,621**
Cumulative:
# **≈ €12,765**
---
## Phase 4 — add NRG SOCIAL
Same 6 territories, 5 classes.
Approx. same as FRQNCY NETWORK:
# **≈ €5,523**
Cumulative for all 4 marks in the 6 key territories:
# **≈ €18,287**
That matches the full core-first model.
---
# What I would **not** do yet
I would **not** file UAE immediately unless you have real Gulf launch/investor/wealth-community strategy. It alone adds about:
# **€24,413**
for the full 4-mark package.
I would also not file all long-tail Asian countries immediately. For the money, you get much more protection by filing **EU + USA + UK + China + Singapore + Malaysia** first.
---
# Requirements to create/file the trademarks
## 1. Decide applicant
You need to choose who owns the marks:
| Option                        | Pros                                                     | Cons                                       |
| ----------------------------- | -------------------------------------------------------- | ------------------------------------------ |
| **You personally**            | Fast, simple, can file before company structure is ready | Later assignment to company may cost money |
| **Company / holding company** | Cleaner for investors, licensing, asset ownership        | Requires entity setup                      |
| **IP holding company**        | Best long-term if you build a brand empire               | More admin/accounting                      |
My recommendation:
If company structure is not ready, file **FRQNCY NETWORK** personally now, then assign it later to the company/IP holding entity.
But if the company is ready, file through the company.
---
## 2. Choose mark type
For each mark, file as:
# **Word mark**
Not logo first.
A word mark protects the name independent of font, style, color, or logo.
So file:
* FRQNCY NETWORK — word mark
* FRQNCY — word mark
* VBRTN — word mark
* NRG SOCIAL — word mark
Logo marks can come later.
---
## 3. Prepare goods/services wording
You need precise descriptions per class.
### Class 9 example
"Downloadable mobile applications for personal development, music discovery, social networking, community engagement, artificial intelligence-assisted coaching, habit tracking, journaling, audio content, and creator networking."
### Class 38 example
"Providing online forums, chatrooms, messaging services, streaming and transmission of audio, video, text, and multimedia content via digital networks."
### Class 41 example
"Education and entertainment services; providing online non-downloadable audio, video, courses, workshops, coaching content, music content, podcasts, and personal development content."
### Class 42 example
"Software as a service; platform as a service; providing temporary use of non-downloadable software using artificial intelligence for personal development, creator networking, community management, music discovery, content recommendations, and digital identity."
### Class 45 example
"Online social networking services; internet-based social introduction and networking services; online community services for personal development, creators, artists, and members."
For **NRG SOCIAL**, Class 35 may also matter:
"Advertising, marketing, business networking, creator promotion, online marketplace services, community management, and brand partnership services."
---
## 4. Evidence of use / intent
Depending on country, you may need:
* applicant name and address
* mark name
* goods/services list
* classes
* logo image only if filing logo
* priority claim details, if any
* proof of use, if filing use-based in the USA
* bona fide intent to use, if filing U.S. intent-to-use
* Power of Attorney, especially for local agents
* company certificate, if filing as company
* passport/ID in some jurisdictions
* translations/transliterations for some Asian countries
* local address/agent in many jurisdictions
For the U.S., if you are not using the mark yet in commerce, you can file **intent-to-use**. That gives you a filing date, but later you must file proof of use before registration.
---
# Documents to prepare now
Create one folder:
# `FRQNCY Trademark Filing Pack`
Inside:
1. **Applicant details**
   * full legal name
   * address
   * nationality/company registration
   * email
   * phone
2. **Brand list**
   * FRQNCY NETWORK
   * FRQNCY
   * VBRTN
   * NRG SOCIAL
3. **Class strategy**
   * Classes per mark
   * goods/services wording
4. **Evidence folder**
   * domain registration for frqncy.network
   * old screenshots
   * Git commits
   * app mockups
   * pitch decks
   * Notion docs
   * social posts
   * emails
   * invoices
   * dated personal-development app concepts
5. **Conflict folder**
   * FRQNCY. app screenshots
   * UK FRQNCY. application
   * U.S. FRQNCY apparel mark
   * FRQNCY music label
   * any related screenshots
6. **Ownership decision**
   * personal filing or company filing
---
# Final recommendation
The cheapest serious path is:
## Now
# File **FRQNCY NETWORK**
EU + USA + UK + China + Singapore + Malaysia
Classes 9, 38, 41, 42, 45
Estimated official fees: **≈ €5,523**
## Then within 6 months
# File **FRQNCY**
same territories
Classes 9, 41, 42
Additional official fees: **≈ €3,621**
## Then
# File **VBRTN**
same territories
Additional official fees: **≈ €3,621**
## Last
# File **NRG SOCIAL**
same territories
Additional official fees: **≈ €5,523**
Total for the practical core shield:
# **≈ €18,287 official fees**
The full 12-territory version with all four marks including UAE is:
# **≈ €54,202 official fees**
The full 12-territory version excluding UAE is:
# **≈ €29,789 official fees**
My grounded advice: **do not spend €54k now. Start with the €5.5k FRQNCY NETWORK shield, then expand.**
[1]: https://www.euipo.europa.eu/en/trade-marks/before-applying/fees-payments?utm_source=chatgpt.com "Fees and payments - EUIPO - European Union"
[2]: https://www.uspto.gov/trademarks/trademark-fee-information?utm_source=chatgpt.com "Trademark fee information"
[3]: https://www.gov.uk/how-to-register-a-trade-mark/start-your-application?utm_source=chatgpt.com "Apply to register a trade mark"
[4]: https://www.wipo.int/en/web/madrid-system/how_to/file/fees?utm_source=chatgpt.com "Filing International Trademark Applications – Fees and ..."
[5]: https://english.cnipa.gov.cn/col/col3005/index.html?utm_source=chatgpt.com "China National Intellectual Property Administration Fees"
[6]: https://www.ipos.gov.sg/about-ip/trade-marks/how-to-register/?utm_source=chatgpt.com "How to Register Trade Marks - Singapore"
[7]: https://www.myipo.gov.my/trademark-forms-and-fees/?utm_source=chatgpt.com "Trademark Forms and Fees"
[8]: https://www.jpo.go.jp/e/system/process/tesuryo/hyou.html?utm_source=chatgpt.com "Schedule of fees | Japan Patent Office"
[9]: https://www.kipo.go.kr/en/HtmlApp?c=93006&catmenu=ek04_04_01&utm_source=chatgpt.com "Fees and Payments"
[10]: https://www.intepat.com/blog/trademark-registration-fees-india?utm_source=chatgpt.com "Trademark Registration Fees India (2026)"
[11]: https://ised-isde.canada.ca/site/canadian-intellectual-property-office/en/trademarks/fees-trademarks?utm_source=chatgpt.com "Fees for trademarks"
[12]: https://www.ipaustralia.gov.au/trade-marks/timeframes-and-fees/trade-mark-price-calculator?utm_source=chatgpt.com "Trade mark price calculator"
[13]: https://www.the-jurist.com/article/significant-reductions-of-trademark-fees?utm_source=chatgpt.com "Further significant reductions of trademark fees in the UAE"
[14]: https://www.ipophil.gov.ph/services/schedule-of-fees/trademark-related-fees/?utm_source=chatgpt.com "Trademark-related fees"
[15]: https://harris-sliwoski.com/blog/registering-a-trademark-in-thailand/?utm_source=chatgpt.com "Registering a Trademark in Thailand: What You Need to ..."
[16]: https://ambadar.com/insights/trademark/complete-guide-of-trademark-registration-indonesia/?utm_source=chatgpt.com "Complete Guide of Trademark Registration Indonesia"
[17]: https://ipvietnam.gov.vn/en_US/web/english/trademarks?utm_source=chatgpt.com "TRADEMARKS - INTELLECTUAL PROPERTY OFFICE OF ..."
[18]: https://www.xe.com/currencytables/?from=EUR&utm_source=chatgpt.com "Historical Rates Tables - EUR"

---

## Where you can help

If you're reading this and want in:

- **The retreat.** First cohort opens once dates are locked. Mailing list at `/newsletter` (pick "Events").
- **The Launchpad.** Building a project that fits the editorial line? `launchpad@frqncy.network`.
- **The harness.** One engineer alongside Orlando cuts the build timeline in half. Reach out via `/social/profile/orlando`.
- **The content.** Submit a book, person, org, place, video, or piece of music at `/aligned/submit` (coming) or DM via Telegram once the channel is live.
- **The capital.** Pre-treasury, donations route through the wallets at `/donate`. Post-treasury, Launchpad allocations become public.

---

## From the notebook · 2026-05-15

*Captured from a handwritten roadmap page. Items below are slotted into the four tracks using the same status legend as the rest of this doc.*

### Website + editorial additions

| Priority | Item | Status | Notes |
|---|---|---|---|
| ◉ | A place for truth, honesty, and alignment | positioning live | Make the editorial position explicit on `/about` and `/start-here` — the line that names what FRQNCY *is for* |
| ◉ | Podcast with amazing guests | pipeline live | Tier-1 outreach in `PODCAST-OUTREACH-PLAN.md` |
| ◉ | Referral network | scaffolded | Affiliate links across books, memberships, aligned goods |
| ◉ | Social Media Roadmap | plan ready | See `VISIBILITY-PLAN.md` — owned / earned / discovery channels |
| ○ | Research papers surface | concept | Dedicated bed + topic-level surfacing for studies + papers we've curated |
| ○ | Research · supporting the passionate unrelenting dreamers | concept | Editorial line for the Research pillar — the dreamers who don't get academic funding are who we point at |
| ○ | FRQNCY crypto curation | concept | Crypto-projects curation as its own editorial surface (`/crypto/projects.html` is the seed) |
| ○ | Courses for people to learn | shell live | `/courses/` exists with 6 long-form courses; deepen catalogue + add cohort flow |
| ◌ | Roadmap surface (public) | this doc | A polished public roadmap page on `frqncy.network` — currently markdown only |

### Harness additions

| Layer | Item | Status | Notes |
|---|---|---|---|
| AI | **Mankind-aligned neural Network** (FRQNCY AI) | concept page live | `/frqncy-ai` exists; the mankind-aligned thesis needs build sequencing |
| AI | **Harness that powers the World tree** | concept | Naming for the harness substrate — every FRQNCY surface as a branch off one root system |
| AI | **AI managing Fund** across all topics | concept | An agent that allocates Launchpad / Fund capital across topics based on impact + KPIs |
| Onboarding | **Crypto onboarding "___"** | concept (name pending) | A guided onboarding flow for crypto-curious newcomers — agent name to be chosen |

### Capital-layer additions

| Stage | Item | Status | Notes |
|---|---|---|---|
| Architecture | We integrate on top of all relevant chains and sit on top of them | thesis | FRQNCY as chain-agnostic — every relevant L1/L2 wrapped into one surface |
| T+3mo | **Stablecoin** — BLNC | spec ready | `FRQNCY-CRYPTO-STACK.md` |
| T+5mo | **Crypto token** — FRQNY | spec ready | Governance / coordination / incentivisation / fund functions |
| T+6mo | **FRQNCY LP's** | spec ready | Liquidity pools, custody, wrappers — Orb Markets reference architecture |
| T+6mo | **FRQNCY Janus** "___" finishing touches · Veto Council | spec ready | Veto Council guards monetary attack; Janus is the council/oversight piece (final name pending) |
| Ongoing | Funding research + mankind-aligned projects, scored on impact + KPIs | concept | The allocation logic for the AI-managed Fund above |
| Ongoing | FRQNCY ZPC becomes more autonomous | concept | The Zero-Point Capital piece runs increasingly without manual sign-off |
| North star | FRQNCY lives from its monetary income | thesis | Treasury self-sustaining — no external dependency once liquid |

### Physical-world additions

| Milestone | Item | Status | Notes |
|---|---|---|---|
| Settle | **Physical settlement** | concept | The 8th pillar made real — settlement comes after retreat → salon → space → land |
| Settle | School-like training grounds | concept | Long-form residencies — the "school" model for transmission, not lectures |
| Build | Support energy independence + eco-villages | thesis | Editorial alignment with existing eco-villages; capital allocation through Fund + Launchpad |

### Cross-cutting

| Item | Status | Notes |
|---|---|---|
| NRG · Community Roadmap | scaffolded | Internal roadmap for `/social/` — separate from this doc, plugs into it. NRG = the social-media brand under the FRQNCY umbrella |
| **VBRTN · mobile app** | shell live | The Capacitor app at `/app/` is now branded VBRTN ("vibration") for stores + device. iOS `CFBundleDisplayName`, Android `app_name`, all alarm labels, and the home-screen H1 all read VBRTN. Bundle IDs + Java package stay `network.frqncy.*` so this doesn't relaunch as a new app. Internal codename: still FRQNCY app |
| **Trademark filings — FRQNCY · NRG · VBRTN** | to file | Register all three names as trademarks. FRQNCY (the network), NRG (the social-media surface), VBRTN (the mobile app). Class 9 (software / mobile apps) + class 42 (online platform / SaaS) + class 38 (telecoms / social networking) as relevant. File in the US first, then EU + UK + Germany follow-on |
| My FRQNCY Roadmap → chart integration | concept | Roadmap for the My FRQNCY surface: dashboard ↔ chart deeper integration |
| **My FRQNCY = first stop for newcomers** | concept | First-touch experience: a newcomer arrives, generates their Human Design chart, and that becomes their entry point into the network — chart → dashboard → personalised paths through the topic graph |
| **Sanctuary · Dreambuilding** — Mind-Movies-style vision builder | concept | Build a Mind-Movies-grade dream-builder into the My FRQNCY Sanctuary: user assembles still images + affirmations + music + voiceover into a 3-minute personal vision film, watches on a daily cadence, can re-edit as the dream evolves. Reference: [mindmovies.com/free-trainings.php](https://www.mindmovies.com/free-trainings.php) — Natalie Ledwell's flagship product. FRQNCY version: deeper integration with the chart (auto-suggest visuals from your gates / centres), tied to the daily-practice flow, no upsell funnel, sharable in NRG for accountability |
| All different roadmaps spawning and plugging in | thesis | Each track owns its own roadmap; this v1 doc is the spine they connect to |

Legend (unchanged): ◉ ship in next 6 weeks · ○ ship in next quarter · ◌ ship when foundation is denser

---

## More from the master roadmap

*Everything in `MASTER-ROADMAP.md` that hadn't yet made it into this v1 doc. Mapped into the same four tracks + the social / i18n / visibility cross-cuts.*

### Website — content polish

| Priority | Item | Status | Notes |
|---|---|---|---|
| ◉ | Twitch-style rotating banners on homepage | in build | Mixed marquee shipped; tuning size + speed (#43) |
| ◉ | Luma embed on `/podcast` and `/events` | scaffolded | Replace placeholder iframe with the calendar ID (#2) |
| ◉ | 6-books treatment on pillar pages | shipped on pillars | Carry to remaining surfaces (#65) |
| ○ | Time-travel video added to `/watch/` | blocked | Needs the URL (#42) |
| ○ | "Masonbook" YouTube channel as person/source | blocked | Needs handle (#91) |
| ○ | Spotlight + donation flow for Joe Dispenza's *Frequency* movie | scaffolded | Hero card + dedicated donation CTA on `/media/frequency-movie/` (#54) |
| ○ | Deepen spiritual technology / materialism content | in progress | Continue the editorial thread through `/about` + per-topic intros (#29) |

### Website — platform & infra

| Priority | Item | Status | Notes |
|---|---|---|---|
| ◉ | Service-worker version discipline | partial | Bump `sw.js` version on every JSON/JS shape change |
| ◉ | CI guard: `sync-headers.mjs --check` on every PR | concept | Fail build if any page diverges from canonical header |

### Manifesto · open editorial threads

| Priority | Item | Status | Notes |
|---|---|---|---|
| ○ | "Enlightened Nations" — concept page + reading list + working group | concept | Surface under `d-society`; sequence: page → list → group (#62) |
| ◌ | Single-sentence FRQNCY explainer in DE / ZH / ES | open question | Same line translated, or each language picks its own? Coordinate with i18n |

### Harness — additions

| Layer | Item | Status | Notes |
|---|---|---|---|
| Marketing | **Zusammenfassungen** agent — AI marketing + crypto summaries | partial | Auto-summary of weekly editorial + crypto-stack movement, multi-channel (#67) |
| AI | **FRQNCY AI** — mankind-aligned neural network | concept page live | `/frqncy-ai`; full build is post-harness-foundation (#80) |
| AI | Continuous updates from the sources fed into the **world tree of FRQNCY**, pruned by mankind-aligned AI | concept | The graph stays alive: ingestion agents pull from tracked sources continuously, mankind-aligned AI prunes — removing what's stale, surfacing what's resonant, keeping the editorial line clean without manual sweep every time |

### Capital — additions beyond the stack

| Stage | Item | Status | Notes |
|---|---|---|---|
| Research | FRQNCY Crypto Research stream | started | Initial reading list + coverage backlog (#71, #81) |
| Research | Kick off `crypto.frqncy` meta-sequencing | done as plan | Build sequence from spec into actual ship dates (#92) |
| Surface | Crypto overview page | shipped at `/crypto/` | Keep current as stack matures (#87) |
| Capital flows | Donation buttons: crypto + PayPal + Google Pay | partial (EVM + SOL live) | Add PayPal + Google Pay rails to existing wallet pop (#75) |
| Capital flows | Donation functionality across videos · projects · people · places | partial | Per-entity donate button on every page where it makes sense (#51) |
| Capital flows | Referrals on the Sell pillar | scaffolded | Per-product referral codes in the catalogue (#45) |
| Capital flows | Live-stream capability | concept | Streamed events + paid access through the membership tier (#52) |
| Commerce | **Aligned Goods shop** — online shop for healthy goods, all regions | concept | Builds on `/aligned/` — full e-commerce surface for healthy, FRQNCY-aligned products, with region-aware fulfilment so it serves every market, not just one |

### Social · dating · network state (Layer 5)

| Priority | Item | Status | Notes |
|---|---|---|---|
| ○ | LinkedIn-style social layer (connections + interest matching) | shell live | `/social/` exists; matcher is the next deepening (#63) |
| ○ | Telegram channel — set up + content rhythm | playbook ready | See `TELEGRAM-CHANNEL-LAUNCH.md` (#68) |
| ○ | Topic-based email newsletter | UI live, backend stub | Subscriber picks topics; Klaviyo or Substack (#56) |
| ◌ | Dating layer (designed to be deleted) on the same matcher | concept | Same interest-matching substrate; intentionally ephemeral (#64) |
| ◌ | Integrate with Ethos (reputation layer) | concept | Pull Ethos reputation into FRQNCY profiles (#82) |
| ◌ | Enlightened Nations programme | concept | See manifesto thread above (#62) |

### Internationalisation

| Priority | Item | Status | Notes |
|---|---|---|---|
| ○ | Tier-1 ladder: EN → DE → ZH → ES | infrastructure spec | Start with DE (#83) |
| ◌ | Tier-2 ladder: FR · PT · JP · KO · IT · RU · AR · HI · ID · NL · TR | concept | Sequence after Tier-1 proves the pipeline (#83) |

### Visibility & growth

| Priority | Item | Status | Notes |
|---|---|---|---|
| ◉ | Visibility plan execution | in progress | See `VISIBILITY-PLAN.md` — owned, earned, discovery (#78) |
| ◉ | Podcast guest outreach — finish Tier-1 list | in progress | See `PODCAST-OUTREACH-PLAN.md` (#60) |

### Not on the v1 roadmap (yet)

Things named in the master roadmap as deliberately out of scope for v1:

- A FRQNCY mobile app — adjacent to the network but not the next move.
- A fixed FRQNCY token launch date — the crypto stack is sequenced; launch is conditional on the stack passing AI battletest.
- A FRQNCY physical retreat property purchase — the first retreats use partner properties.

---

## Cross-references

- `MASTER-ROADMAP.md` — every internal task and what layer it lives in
- `FRQNCY-MANIFESTO.md` — the editorial position
- `FRQNCY-CRYPTO-STACK.md` — full crypto sequencing
- `FRQNCY-PROJECTS-PAPER.md` — the projects pipeline inside FRQNCY
- `SPECS-AGENTS.md` — every harness agent specified
- `SPECS-INTEGRATIONS.md` — every backend integration specified
- `FIRST-PHYSICAL-MILESTONES.md` — the retreat + space plan
- `TELEGRAM-CHANNEL-LAUNCH.md` — TG channel playbook
- `CONTENT-ROADMAP-IDEATION.md` — content additions queue
- `OPTIMISATION-PAPER-2026-05-11.md` — the UX / structural P0 paper that kicked this off

---

*This roadmap updates as items move. If anything here is out of date, file an issue or open a PR. The roadmap is only useful if it's current.*
