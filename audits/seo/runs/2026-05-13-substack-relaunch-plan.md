# Run log — Substack relaunch plan

*Date: 2026-05-14. Agent: Substack-relaunch planning agent. Outputs: `audits/seo/SUBSTACK-RELAUNCH-PLAN.md` (the plan) and this run log.*

---

## Context entering this run

Per Phase 5.3 sameAs audit (`SAMEAS-MATRIX.md` §10), `frqncy.substack.com` is Orlando's existing Substack — last public post December 2023, positioned as "Daily Crypto Update." It is one of only two verified-live FRQNCY surfaces (the other is `@0xOrli` on X). For the sameAs strategy and the visibility plan to work, the Substack needs to either become the FRQNCY-Network publication or get clearly handed off as Orlando's personal blog. The brief asked for option (a): re-position as the FRQNCY-Network publication, plan the first four issues, ship the first within 30 days.

## Inputs read (in prompt order)

1. `audits/seo/CONTEXT.md` — confirms FRQNCY identity, voice rules, IA, ban-list reference (`~/.frqncy-harness/voice-anchor.md` not accessible from this session's cwd, but the ban-list summary in `CONTEXT.md` §4 is sufficient: no "unlock," "leverage," "synergy," "10x," "circle back," "low-hanging fruit"; no spiritual cliches as direct self-description; present-tense declarative; conviction not hype).
2. `audits/seo/SAMEAS-MATRIX.md` — confirms the Substack row's state and target re-positioning. The recommended "FRQNCY Network" publication name and 138-char subtitle in this plan are tightened versions of the §10 brief.
3. `proposals/VISIBILITY-PLAN.md` — confirms the newsletter-backend wiring is in scope for Days 1-30 and the Telegram cross-promo threshold is 30 posts (Days 31-60).
4. `audits/seo/runs/2026-05-13-phase-5.8-reference-essay-reading-list-network-states.md` — the canonical essay that Issue 2 will reflect on.
5. `audits/seo/runs/2026-05-13-phase-5.8-publication-brief.md` — confirms quarterly essay cadence (5/year, one per quarter + one bonus). Plan keeps this; pairs it with bi-weekly *Notes from the graph* to fill the in-between weeks.
6. `editorial-standards/index.html` — confirms the published-standard frame; Issue 3 is built around it.
7. `proposals/EDITORIAL-STANDARDS.md` — the picks-and-conflicts source. Issue 3 quotes the five-test structure from §1.
8. `proposals/EDITORIAL-VALUES-V2.md` — the slogan and voice doc. Used to keep the welcome-email copy on-brand (no retired "FRQNCY makes the unable able"; uses the network/invitation framing implicitly without quoting the homepage slogan inside the Substack).
9. `audits/seo/NEWSLETTER-PROSPECTS.md` — sourced the six Substack recommendation seeds (Morgan, Hoel, Eisenstein, Rowson, Jarow, Pinchbeck).
10. `audits/seo/MENTION-MONITORING.md` — the brand-collision landscape. Drove the "every brand cue says FRQNCY Network" stance and the §H risk section.

## WebSearch verifications

Three queries, all 2026-05-14:

| Query | Finding | Plan impact |
|---|---|---|
| `Substack custom domain pricing 2026 publication features` | Custom domain is a **$50 one-time fee per publication**, not a recurring monthly cost. Substack remains free to publish; takes 10% only on paid subscription revenue. | Corrected the prompt's `$80-100/mo` figure (that was Substack Pro's old positioning, since collapsed). Plan §D reframes the decision as "free vs. $50 once" and recommends deferring until after Issue 4 ships, then `essays.frqncy.network`. |
| `Substack platform changes 2025 2026 new features publication` | Major shifts: Recommendations drives 30-50% of new signups; Notes is a discovery surface; livestreaming + video + audio + TV app expanded through 2025-2026; email automations rolled out to all creators in 2026; algorithmic Notes feed prioritizes unknown creators (good for new publications). | Plan §E3 sets up Recommendations as the day-one growth lever. Plan §F leaves automations as an option without committing to them. The "Substack as home base" reality validates the choice to make Substack the newsletter backend rather than Klaviyo. |
| `"FRQNCY" substack newsletter` | Confirmed the existing `frqncy.substack.com` is Orlando's Daily Crypto Update. Surfaced collision-landscape on Substack alone: "The Frequency" (Elba O'Ward), Frequency Amplified, Global Frequency (Matt Devost), Frequency Cycleworks, On My Frequency, Hoover Institution's "Freedom Frequency", Fritinancy. | Plan §H names these explicitly; reinforces why every brand cue must read "FRQNCY Network," not bare "FRQNCY." |

## Key decisions documented

1. **Publication name: FRQNCY Network.** Top pick of three. Alternates ranked: "The Reading List with Conviction" (#2; editorial register strong but weakens brand SEO), "The Topic Graph" (#3; distinctive but decouples from FRQNCY brand at the consolidation moment). Subtitle: *The reading list with conviction — long essays from the topic graph for consciousness. Money, energy, mind, and matter. No paid placement.* (138 chars.)
2. **Cadence: bi-weekly.** Two surfaces: quarterly essays (5/year, per Phase 5.8 brief, primary on frqncy.network) + bi-weekly *Notes from the graph* (Substack-primary, ~26/year). Pause threshold: 14 days without an issue triggers an explicit "pausing" note. Honesty in cadence is part of the editorial standard.
3. **Custom domain: defer.** Ship on `frqncy.substack.com`. Re-evaluate after Issue 4. Recommended target if green-lit: `essays.frqncy.network` (not `newsletter.frqncy.network`, which is reserved for the signup-form route already shipped on the site).
4. **Newsletter backend: Substack, not Klaviyo.** One subscriber list. Klaviyo's segmentation strength is for a different revenue shape than FRQNCY's (Fund + Membership, not e-commerce drips). Cost: Substack free vs. Klaviyo $20-150/mo. The `/newsletter/` form on `frqncy.network` posts to Substack's subscribe endpoint (or redirect-fallback if the API is fragile).
5. **Cross-publishing: FRQNCY-first, Substack-second.** Canonical reference essays at `frqncy.network/essays/<slug>/`; Substack version is a 1500-2500 word author's-reflection cross-post 48-72h later with `rel="canonical"` pointing to the on-site URL. *Notes* are Substack-primary.
6. **Telegram cross-promo: Day-31 threshold.** Mirror of `VISIBILITY-PLAN.md` Days 31-60. Substack and Telegram run parallel for the first 30 days; cross-link at Day 31+ when Telegram has 30 posts in archive.
7. **Recommendations slots: seed six on day one.** Tom Morgan, Erik Hoel, Charles Eisenstein, Jonathan Rowson, Oshan Jarow, Daniel Pinchbeck (all from `NEWSLETTER-PROSPECTS.md`). Substack does not require their consent. Seventh slot: the FRQNCY Podcast once handle is set.
8. **2023 archive: kept, not deleted.** Moved to "Pre-relaunch archive" section, marked as such, never weaponized for traffic. Trust > short-term tidiness.

## Hard-constraint compliance

| Constraint | Status |
|---|---|
| Don't modify topic page / item page / generator / active-dev directory | Compliant. Plan is text-only output in `audits/seo/`. Any cross-link from a topic page back to the Substack is explicitly flagged as needing the generator pipeline / BESPOKE marker. |
| Don't publish anything | Compliant. Plan only. |
| Don't fabricate Substack platform features | Compliant. WebSearch-verified custom-domain pricing ($50 once), Recommendations behaviour (30-50% of new signups), Notes algorithm, 2026 video/audio/TV-app expansion, email-automations rollout. Corrected the prompt's `$80-100/mo` figure. |
| Don't pitch as just "FRQNCY" — always "FRQNCY Network" | Compliant. Plan §H makes this explicit; all subject lines, footers, byline conventions use the qualified form. |
| Don't use banned phrases | Compliant. Verified no use of "unlock," "leverage," "synergy," "10x," "circle back," "low-hanging fruit," "vibrations" as self-description, or "the alternative to" framing. No spiritual cliches in self-description. |
| Don't promise specific subscriber outcomes | Compliant. Plan §I makes this explicit. No "we'll hit 500 by Q4" numbers anywhere. The plan is about substrate, not predictions. |
| FRQNCY voice: present-tense, declarative, conviction not hype | Compliant. About-page copy, welcome email, all four issue openings are present-tense declarative. No "FRQNCY aims to" or "we believe we can become." |
| Acknowledge brand-collision risk | Compliant. Plan §H names the audio-brand collision (FRQNCY Media + FMG both have podcast/audio brand awareness) and lays out the differentiation strategy (topic graph + editorial standards as citable trust artifact). |
| Every issue outline grounded in a real shipped FRQNCY page or artifact | Compliant. Issue 1 grounds in the relaunch fact + `/about` + `/editorial-standards/` + `/explore.html`. Issue 2 grounds in the shipped Phase 5.8 essay at `/essays/reading-list-network-states/`. Issue 3 grounds in `/editorial-standards/` and `EDITORIAL-STANDARDS.md`. Issue 4 grounds in the live `/meditation/` topic page. |

## Deliverable summary (for parent agent's relay)

- **Recommended publication name:** *FRQNCY Network* (top pick). Alternates: *The Reading List with Conviction* (#2), *The Topic Graph* (#3).
- **Recommended cadence:** bi-weekly. Quarterly long-form reference essays (5/year, frqncy.network-first) + bi-weekly *Notes from the graph* (Substack-primary, ~26/year).
- **Recommended custom-domain choice:** defer at relaunch. Ship on `frqncy.substack.com` initially. Re-evaluate after Issue 4. If greenlit, pay the $50 one-time fee and point `essays.frqncy.network` at the publication.
- **Issue subjects in order:**
  1. *FRQNCY Network — the publication relaunches.*
  2. *The reading list for network states.*
  3. *Why we publish our editorial standards.*
  4. *The five-book canon for meditation.*
- **Single biggest risk:** **audio-brand collision with FRQNCY Media (Atlanta) and FMG's existing "FRQNCY" podcast.** Both have established podcast/audio audiences and will be the dominant entities a first-time visitor confuses with the Substack relaunch. The Substack's defence is two-fold — every brand cue uses "FRQNCY Network" not bare "FRQNCY," and the published editorial standards page on frqncy.network acts as the citable trust artifact that the other Frequency-entities do not have. If any single piece of the relaunch breaks the qualifier discipline (subject line, footer, social-share copy), Google's entity-resolution algorithm will fuse the Substack into the wrong neighbour.

## Next actions for Orlando

1. Read the plan at `audits/seo/SUBSTACK-RELAUNCH-PLAN.md`.
2. Log into the Substack admin; capture the current subscriber count + welcome-email + about-page state for the diagnosis baseline before editing.
3. Decide on the publication name (recommendation: FRQNCY Network).
4. Execute the §C migration steps in order. Estimated total time: 30-45 minutes.
5. Ship Issue 1 within 14 days (inside-of-30 target).
6. Issues 2-4 follow on the bi-weekly clock.
7. After Issue 4: revisit the custom-domain decision.

---

*Run log written 2026-05-14. Sits beside the plan it documents. Both ready for review.*
