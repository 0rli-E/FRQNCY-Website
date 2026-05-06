# FRQNCY — 90-Day Execution Plan

**Window:** 2026-04-27 → 2026-07-26
**Operator:** Orlando, solo (harness agents as force-multiplier)
**Budget envelope:** ~$100 (zero-capex; time + free/cheap tooling)
**North star:** every item in `VISION-1H-DEMO.md`. This plan is the next 90 days' slice.
**Constraint rule:** in-scope = anything shippable under the budget (code, content, wiring, drafts on the site). Capital-heavy items become **content topics on the site** plus an entry in the **Future Roadmap** appendix.

---

## Where things stand on Day 0 (from full code audit, 2026-04-27)

**Already alive:**
- Main static site (`/v2/`, 146 topic pages, 766 resources, 695 URLs in sitemap).
- AI chat widget (Cloudflare Workers AI / Qwen 30B, free; KB auto-built from topic graph).
- Build/deploy: GitHub Actions + Cloudflare Pages auto-deploy.
- Watch (6 teachers, hand-curated videos.json + generate-watch.js).
- Courses (5 courses live as published content; `courses.json` + `generate-courses.js`).
- Aligned Goods (40 entries, curated, all `affiliate:false`).
- MCP server (`mcp-servers/frqncy-content/`, 11 tools, wired into harness).
- Harness `@frqncy/harness` v0.7.0-alpha.1: 7 provider lanes, 7 tools, MCP client, gtr sandbox, trace store, $5/$25 cost caps, lethal-trifecta gate, 202 tests passing.

**Scaffolded but not deployed:**
- Social platform (`social-src/`): Astro+Preact+Supabase, all components built, three migrations exist (leaderboard intentionally removed in 003), env vars not set, not deployed to `/social/*`.
- Chart-v2 HD engine (`chart-v2/hd-engine.js`): built, blocked on ≥5 Jovian Archive fixtures (only ~2 today). Public `chart.html` still hands off.
- `my-frqncy.html` (1,435 lines): multi-step form, no backend persistence.
- Mobile app (`app/`, Capacitor 7): 5 stub pages, no functional logic.
- `space.html`: info page, no booking, no Luma.

**Zero-state:** Sanctuary scoring, Luma sync, video auto-ingest, wallet/payments, goods checkout, referrals, membership tiers, Fund page, land, Lugano operations.

**Stale notes to clean up:** `CLAUDE.md` says harness is v0.4.0-alpha.1 with 112 tests — actually v0.7.0-alpha.1 with 202 tests.

---

## The 90 days at a glance

| Phase | Weeks | Theme | Headline outcome |
|---|---|---|---|
| **Phase 1 — Stand it up** | 1–2 | Get every scaffolded surface to "live" | Social platform deployed; chart engine calibrated; my-frqncy persists |
| **Phase 2 — Personalisation + FRQNCY OS** | 3–4 | Track A: charts → My FRQNCY → Sanctuary scoring. Track B: n8n + Telegram + Council org with harness as substrate | A logged-in user tracks practice; Orlando's Telegram bot routes to the Council |
| **Phase 3 — Membership + Referrals** | 5–6 | Make the economy real (one tier, one Stripe, one referral loop) | Stripe live; ref codes work; first paying member possible |
| **Phase 4 — Auto-grow loops** | 7–8 | Harness self-optimisation seed + content auto-grow | Trace reflection script + nightly resource-PR agent + video ingestion v0 |
| **Phase 5 — Content depth + crypto cards** | 9–10 | Make the site read like a book + ship crypto values content | 30 thin topic pages levelled up; crypto values + Ethos + Obi + Maloney + Trudeau live |
| **Phase 6 — Mobile + chat-anywhere** | 11–12 | Capacitor app shippable; FRQNCY chat usable on every device | TestFlight build of FRQNCY mobile; AI chat works on mobile |
| **Phase 7 — Demo + roadmap reset** | 13 | 1h demo dry-run; Future Roadmap finalised; Q3 plan written | Recorded demo; `EXECUTION-PLAN-Q3.md` |

---

## Phase 1 — Stand it up (Weeks 1–2: Apr 27 → May 10)

Goal: every scaffolded thing becomes alive on a real URL.

### Week 1 (Apr 27 → May 3)

**M Apr 27 — Backend status snapshot + housekeeping**
- Update `CLAUDE.md` to reflect harness v0.7.0-alpha.1 / 202 tests / 7 lanes.
- Decide and document: is the social platform's `pages/leaderboard.astro` getting *removed* or *renamed* to a non-ranking surface? (CLAUDE.md says no leaderboards; leave a placeholder page that 410s or redirects until decided.)
- Verify `mcp.json` has `frqncy-content` wired into the harness (it's not by default per audit). Run `frqncy-harness mcp test frqncy-content`.
- Output: `proposals/BACKEND-STATUS.md` (single source of truth — supersedes ad-hoc setup checklists).

**T Apr 28 — Social platform: apply migrations + env vars**
- Run migrations 001 / 002 / 003 in Supabase (per `SETUP-NEXT-STEPS.md`).
- Set `SUPABASE_URL` + `SUPABASE_ANON_KEY` in Cloudflare Pages env.
- Deploy `social-src/` to `/social/*` route.
- Confirm `/social/login`, `/social/` index, `/social/profile/` load.
- Cost: $0 (Supabase + Cloudflare free tier).

**W Apr 29 — Social platform: feed UI + post composer**
- Wire `Feed.tsx` to read `posts` from Supabase via `lib/api.ts`.
- Wire `PostComposer.tsx` to write a post (with optional `conviction` tag — keep it as self-expression, not ranking).
- Wire `PostCard.tsx` to render posts with comments stub.
- Acceptance: can sign up, post, see post in feed, log out, log back in, see post.

**Th Apr 30 — Social platform: comments + follow + bookmarks**
- Wire `CommentsThread.tsx` + `CommentForm.tsx` against `comments` table.
- Wire `FollowButton.tsx` against `follows` table.
- Wire `BookmarksView.tsx` against `bookmarks` table.
- Wire `NotificationsList.tsx` (read-only at this stage; insert triggers come next week).

**F May 1 — Social platform: messages + search**
- Wire `ChatWindow.tsx` + `MessageInput.tsx` against `messages` table using `useMessages.ts`.
- Wire `SearchView.tsx` against the FTS index from migration 003.
- Acceptance: two test accounts can DM each other; search returns posts.

**Sa May 2 — Deploy AI HD reading worker** *(the chart engine itself is already alive — see correction below)*
- The production chart at `/chart/` (HD + Gene Keys + Natal) is already live, calibrated against Jovian Archive (1.83° wheel offset, 26/26 gates match), and renders the full bodygraph SVG + Hologenetic Profile inline. No calibration sprint needed.
- The AI HD reading button calls `workers/hd-reading.js`, which is **not yet deployed**. Run `wrangler deploy` after `wrangler login` is set. Add the `AI` binding via Pages dashboard.
- Verify `chart.html`'s `WORKER_URL` matches the deployed Worker URL.

**Su May 3 — chart-v2 cleanup decision**
- `chart-v2/` (separate ES-module engine + calibration harness) is a refactor-in-progress, not a prerequisite. Decide: (a) finish the refactor now (consolidate 1,565 inline lines into modules + harness for future fixture additions), or (b) defer to Phase 5+. Default = defer. The production engine works.

### Week 2 (May 4 → May 10)

**M May 4 — my-frqncy backend wiring**
- Create Supabase `charts` table (per `SETUP-NEXT-STEPS.md`). Columns: user_id, birth_date, birth_time, birth_location, computed_chart (jsonb), created_at.
- Wire `my-frqncy.html` form to POST to a Cloudflare Function that writes to Supabase.
- On return visit: prefill from saved chart instead of re-asking.

**T May 5 — Gene Keys polish** *(layer is already live — see correction)*
- `chart.js` already renders the full Hologenetic Profile (11 spheres × Activation/Venus/Pearl sequences, with Shadow/Gift/Siddhi for all 64 keys).
- This day becomes: improve the Gene Keys results layout (typography, sequence grouping, copy), add a "what is this?" intro for first-time users, link each key to its full profile page if/when those exist.

**W May 6 — Personalisation engine v0**
- On `my-frqncy.html`: given chart, query MCP `frqncy-content` for topics/resources tagged with the user's HD type / authority / sun gate. Render as "your domains" + "teachers aligned to your design."
- Use `crypto-projects.json`-style filter logic; keep it simple (substring match + manual taxonomy).

**Th May 7 — Mailing list: Brevo wiring (or stay on Substack)**
- Decide: Substack-only (zero work) vs Brevo (write `functions/api/subscribe.js`, set `BREVO_API_KEY`, log subscribers to Supabase too).
- Default recommendation: Brevo + Supabase write, so referral codes can attach to subscribe events.

**F May 8 — Referral plumbing v0**
- Generate a short ref code on first signup; store on user record.
- Capture `?ref=XYZ` from URL → write to subscriber/user record on signup.
- Build `/my-frqncy/referrals/` view: shows your code, your referral count, who joined via you.
- No reward logic yet (that's Phase 3).

**Sa May 9 — Cleanup + audit**
- Pass through every page: confirm no broken links, no leaderboard surfaces, no "ranking" copy.
- Run `link-audit` script.
- Push.

**Su May 10 — Phase 1 retrospective**
- 30-min walkthrough of every newly-live surface.
- Strike-through items in `VISION-1H-DEMO.md` that are now true.
- Note Phase 1 surprises in `BACKEND-STATUS.md`.

---

## Phase 2 — Personalisation loop + FRQNCY OS rollout (Weeks 3–4: May 11 → May 24)

> **Reconciliation note (added 2026-04-28).** Phase 2 now runs two parallel tracks. Track A is the original personalisation loop. Track B is the **FRQNCY OS** rollout per `proposals/FRQNCY-OS-STATUS.md` and `frqncy-harness/proposals/HARNESS-AS-PHASE2-SUBSTRATE.md` — the n8n + Telegram + Council agent organisation, with the harness as LLM substrate. Track B was previously sitting outside the 90-day plan; folding it in now per Orlando's call.
>
> **Track B blockers before kickoff:** (1) the **n8n vs. alternatives** research note (`proposals/N8N-ALTERNATIVES-RESEARCH.md` — to be written) must land before Track B Day 1 so we lock the workflow runtime on evidence, not default. (2) The harness-as-substrate proposal needs a final ack — no large changes expected, but worth a re-read before kickoff. (3) Hostinger VPS provisioned + SSH access verified.
>
> **Track allocation:** treat Track A as ~60% of Week 3–4 effort and Track B as ~40%. If Track B's runtime choice slides (e.g., we pick Temporal or Cloudflare Workflows over n8n and need extra learning time), Track B compresses to "OS spine + first three personas" by end of Phase 2 and the rest carries into Phase 4.

Goal: a member's daily-use loop is real (Track A). Charts → My FRQNCY → Sanctuary scoring → next practice. AND: Orlando's personal AI org is operational (Track B) — Telegram in, Council/CEO/Workers behind, harness as LLM substrate, traces flowing.

### Week 3 (May 11 → May 17)

**Mon–Tue — Sanctuary practice tracker schema**
- ✓ shipped — see `proposals/PRACTICE-TRACKER.md`.
- Migration 012 (`supabase/migrations/012_practice_tracker.sql`) — `practice_logs` table + `practice_scores` view, RLS-locked to owner. "Streak" reframed as `consistency_days_30d`; no leaderboard surface anywhere per CLAUDE.md.

**Wed–Thu — Practice tracker UI**
- ✓ shipped — see `proposals/PRACTICE-TRACKER.md`.
- `/my-frqncy/practice/` (vanilla HTML). 9 curated practices in `assets/frqncy-practice.js`. Suggestion card → 25-min progress-ring timer → mood-post (1-5 dot scale) + notes → save. "Recent" list of last 7 sessions.

**Fri — Personal charts (graphs)**
- ✓ shipped — see `proposals/PRACTICE-TRACKER.md`.
- `/my-frqncy/charts/` (vanilla HTML, Chart.js via CDN). Three private charts: consistency bars (days turned to each practice in last 30, never "streak"), minutes-per-day line over 30 days, mood-delta histogram. No comparison surface.

**Sat–Sun — Daily-use ritual surface**
- ✓ shipped — see `proposals/PRACTICE-TRACKER.md`.
- `my-frqncy.html` injection: signed-in users see "Today's path" card above the birth-data form. Pulls `getDailySuggestion()` from `assets/frqncy-practice.js` — four-case logic (practiced today / no recent / consistent / fall-through). Begin button hands off to `/my-frqncy/practice/?practice=<slug>`.

### Week 4 (May 18 → May 24)

**Mon–Tue — AI HD reading worker live**
- Deploy `workers/hd-reading.js` to Cloudflare Workers.
- On `chart.html`: "Get AI Reading" button → calls worker → returns synthesized reading from chart data + Word Illuminator-style structured output.
- System prompt grounded in the canonical HD/Gene Keys sources (see IDEAS-INBOX A1 for source set principle).

**Wed — Word Illuminator structured-output upgrade**
- ✓ shipped — see `proposals/WORD-ILLUMINATOR-AI-WORKER.md`.

**Thu — Notifications + mentions**
- Insert notifications on follow, comment, mention.
- Wire `NotificationsList.tsx` write side.

**Fri–Sat — Profile pages + projects**
- Profile public page rendering on `/social/profile/[username]/`.
- `ProjectPicker.tsx` + `ProjectTagInput.tsx` wired so users can tag posts to a project (own self-expression, not ranking).

**Sun — Phase 2 demo + commit**
- Walk a logged-in user from signup → birth data → chart → my-frqncy → log a practice → see streak update. Record screencast.
- Track B demo: send a Telegram message to the FRQNCY bot, watch it route through the runtime to a Council member, get a response, confirm the trace landed in `~/.frqncy-harness/traces/`.

### Track B — FRQNCY OS rollout (parallel, Weeks 3–4)

Detailed task graph in `proposals/FRQNCY-OS-STATUS.md` — the doc has 32 prompts written, a Week 2 atomic build guide, and a Phase 2 plan v0.3. Headline tasks for the 90-day plan integration:

- **Wk 3 Mon — runtime choice locked.** Decision deliverable: which workflow runtime hosts the org. Default candidate is n8n; the comparison note (Temporal, Inngest, Trigger.dev, Activepieces, Pipedream, Windmill, native Cloudflare Workflows) must be written first. See `proposals/N8N-ALTERNATIVES-RESEARCH.md` (TBD).
- **Wk 3 Tue–Wed — Hostinger VPS + runtime install.** Provision, harden, install runtime, deploy a hello-world Telegram echo workflow.
- **Wk 3 Thu — Harness-as-substrate wiring.** Hermes Agent installed; harness skill loaded; runtime nodes call out to the harness CLI for all LLM work per `HARNESS-AS-PHASE2-SUBSTRATE.md`. Verify trace logs flow.
- **Wk 3 Fri — Supabase memory layer.** Tables: `agent_outputs` (with `trace_conversation_id` back to harness), `approvals`, `agent_memory` (pgvector), `agent_versions`. Drop `audit_log` (the harness trace IS the audit log per the substrate proposal). Graphiti deferred to Phase 4.
- **Wk 3 Sat–Sun — FRQNCY router persona live.** First persona deployed: routes incoming Telegram messages to the right Council member or CEO line. Test end-to-end with three sample messages.
- **Wk 4 Mon–Tue — Council personas v0.** All seven Council members (Krishna, Kali, Merlin, Saraswati, Sai Maa, Spivey, Trudeau) with their spiritually-set system prompts wired. CEO line wired. Each callable from the router.
- **Wk 4 Wed — C-Suite scaffolding.** Six C-Suite personas with placeholder prompts; Worker bench with two sample workers.
- **Wk 4 Thu — Veto authority + cost rollup.** Council veto path implemented. Per-conversation cost guardrails ($5 soft, $25 hard) confirm firing through the harness layer.
- **Wk 4 Fri — Learning Agent v0.** Reads recent trace store entries, surfaces patterns to Orlando in the morning Telegram digest. Read-only, no auto-edit.

**Track B success criteria for Phase 2 close:** Orlando sends a Telegram message; it lands; the right persona responds; cost is logged; trace is stored. Everything else (the full 32 personas, C-Suite depth, Graphiti memory) carries into later phases.

---

## Phase 3 — Membership + Referrals + Aligned disclosure (Weeks 5–6: May 25 → Jun 7)

Goal: one paying tier exists; referral rewards work; Aligned Goods has a transparency layer.

### Week 5 (May 25 → May 31)

**Mon–Tue — Membership v0 (one tier)**
- ✓ shipped — see `proposals/MEMBERSHIP-V0.md`.
- One tier (Network Member). Migration 013 (`supabase/migrations/013_membership_referrals.sql`) adds `memberships` + `ref_codes` + `ref_signups` with owner-only RLS and no public ranking surface per CLAUDE.md.
- `functions/api/checkout-session.js` opens Stripe Checkout (test-mode-first, REST via fetch, no SDK). `functions/api/stripe-webhook.js` syncs membership status. `assets/frqncy-membership.js` exposes `getMyMembership` / `getOrCreateRefCode` / `getMyRefSignups` / `attributeSignup` for vanilla pages. NavAuth dropdown gains a Membership link; my-frqncy shows a quiet "Become a member" pill for non-members.
- Operator dashboard steps remain: create Stripe products + prices, set `STRIPE_SECRET_KEY` / `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL` / `STRIPE_WEBHOOK_SECRET` in Cloudflare Pages env vars, configure the Stripe webhook endpoint.

**Wed — Member-only surfaces (light)**
- Behind member: `/my-frqncy/practice/` advanced charts, AI HD reading, full course lessons.
- Public: chart computation, basic my-frqncy, course intro, social platform.

**Thu — Aligned Goods disclosure layer**
- Add `revenue_relationship` field to `aligned-goods.json` schema (`null | "contributor" | "partner" | "affiliate"`).
- Render a small badge on cards. Disclosure footer on `/aligned/`.
- All current entries stay `null` until a real relationship exists.

**Fri — Course pricing field + checkout**
- Add `pricing` field to `courses.json` per REVENUE-MODEL.md (`{model: "free"|"paid"|"tiered"|"pwyc", suggested}`).
- Pick ONE course (Quantum Grammar, probably) and put it behind a $19 paywall as the experiment.
- Keep the other four free.

**Sat–Sun — Editorial standards doc**
- Write `proposals/EDITORIAL-STANDARDS.md`: defines what makes a FRQNCY pick, conflict-of-interest disclosure rules, who can mark a pick. (REVENUE-MODEL.md says this is the precondition for scaling any revenue surface.)

### Week 6 (Jun 1 → Jun 7)

**Mon–Tue — Referral rewards**
- Refer 3 → free month membership credit. Refer 10 → quarterly gathering invite. Refer 25 → permanent founder badge on profile.
- Logic in Cloudflare Function on signup; rewards stored on user record.

**Wed — Public membership + Fund pages content**
- Flesh out `/v2/fund/` from stub: public thesis, examples of conscious-business companies, no deal flow shown.
- Membership FAQ + "what your money funds" transparency page.

**Thu–Fri — Stripe → live mode + first paying member**
- Switch from test to live keys. Soft-launch to Norman + 5 hand-picked allies.
- Watch for bugs in production.

**Sat–Sun — Phase 3 retrospective**
- Stripe revenue dashboard exists. Strike vision items.

---

## Phase 4 — Auto-grow loops (Weeks 7–8: Jun 8 → Jun 21)

Goal: harness starts to feed the site with less manual input.

### Week 7 (Jun 8 → Jun 14)

✓ shipped 2026-04-30 (ahead of schedule) — see `proposals/AUTO-GROW-LOOPS-V0.md` and `scripts/auto-grow/`. v0 implementation diverged from the original outline below in three ways: (1) trace reflection became `scripts/auto-grow/trace-reflect.mjs` (output to `scripts/auto-grow/output/` rather than `~/.frqncy-harness/reports/`); (2) resource-PR loop became a plain Node URL-scraper over Supabase NRG posts instead of a `frqncy-harness agent` run — the lethal-trifecta concern is sidestepped because there's no LLM in the loop yet; (3) video ingestion uses YouTube channel-page scraping (no API key) instead of the YouTube Data API. v0.2 candidate is to swap the scraper for a `frqncy-harness agent` invocation that drafts in FRQNCY voice from `frqncy-content` MCP tools.

**Mon–Tue — Trace reflection script** *(original outline; superseded above)*
- `scripts/reflect-traces.js`: reads `~/.frqncy-harness/traces/`, groups by model/tool/error/cost/token-usage, writes weekly markdown summary to `~/.frqncy-harness/reports/`.
- Surface top 5 most expensive conversations, top 5 tool failures, model cost-per-success.
- Plant the seed of "harness self-optimises" — manual but data-driven for now.

**Wed–Fri — Resource-PR auto-grow agent** *(original outline; superseded above)*
- Cron in Cloudflare Cron (or local cron + git push): nightly `frqncy-harness agent` run for one rotating topic. Prompt: "Find 1–3 new resources on `<topic>` published in the last 30 days from authoritative sources. Output as `resources.json`-shaped entries. Open a PR draft. Never auto-merge."
- Lethal-trifecta gate enforced (`web_search` + `web_fetch` + `write` is exactly the trifecta — set severity to "warn" with manual review).
- Test on `decentralised-ai` and `crypto` first (they move fast). Then schedule across other topics.

**Sat–Sun — Video ingestion v0 (NOT full automation)** *(original outline; superseded above)*
- Manual but assisted: a script that takes a YouTube channel ID, lists last 20 videos via YouTube Data API (free tier 10k req/day), proposes additions to `videos.json` as a PR.
- Run weekly per teacher. Still hand-reviewed.
- Vision says "automatically upload" but the editorial value is "every teaching lives on the site" — full auto-ingest contradicts curation. This compromise gives speed without losing taste.

### Week 8 (Jun 15 → Jun 21)

**Mon — Per-day / per-month cost aggregates in harness**
- Patch `frqncy-harness costs` to support `--day`, `--month`, project/thread filtering (per harness AGENT.md gap #10).
- Push a v0.7.x release.

**Tue–Wed — MCP server: writeable side**
- Extend `mcp-servers/frqncy-content/` with three write tools: `propose_resource`, `propose_topic_addition`, `propose_topic_edit`. Each writes to a draft file under `proposals/auto-drafts/` + opens a PR. Manual merge.
- This gives the harness a clean way to "add to FRQNCY" without overwriting anything.

**Thu–Fri — Newsletter automation v0**
- Weekly digest email via Brevo: top 3 new topics, top 5 new resources, one featured course, one Aligned Goods spotlight. Auto-draft via harness; manual review + send.

**Sat–Sun — Phase 4 retrospective**
- Trace reflection report exists; one auto-grow PR has been merged; first weekly digest sent.

---

## Post-Phase-3 federation extras (opportunistic, source-side first)

These are off-plan federation increments that ship into the source as time and reader value allow. They don't gate any phase, but they keep the federation narrative honest while the protocol pivot itself stays deferred to Q1–Q2 2027 per `proposals/PROTOCOL-LESSONS-2026-04.md`.

✓ **Bluesky timeline reader (shipped 2026-05-02 — see `proposals/BLUESKY-TIMELINE-READER.md`).** NRG can now read the connected user's Bluesky home timeline, not just publish to it. New "Federated" tab on the global feed interleaves NRG + Bluesky posts chronologically. Read-only — likes / replies / reposts go to bsky.app via permalink. NRG flips from publisher-with-side-bridge to federated reader-and-publisher. Source-side only at this point; deploys whenever the next `social-src` build runs.

Candidate v1.1 follow-ups (queued, not scheduled):
- Surface replies on cross-posted NRG posts under the NRG row (closes the asymmetry where NRG already knows the at-uri but never reads it).
- Cursor-based pagination on the Federated tab.
- Image embed rendering + external-link OG card preview.
- Repost surfacing with an explicit "X reposted" badge.

---

## Phase 5 — Content depth + crypto cards (Weeks 9–10: Jun 22 → Jul 5)

Goal: high-priority content from IDEAS-INBOX is live; navigation and crypto-cards are sharp.

**Reframe (2026-04-28):** the topic-page sprint via templated content blocks ended after lifting ~35 stubs out of the 10-paragraph baseline. Going forward, **every topic page is treated as its own commission** — its own layout, structural metaphor, typography, and visual language emerging from the subject itself. FRQNCY is an artwork; each topic is an expression. That's months-to-years of work and doesn't fit in a 90-day window. The remaining ~50 stubs stay as stubs until each gets unique treatment, on demand, one at a time. See `proposals/BACKEND-STATUS.md` for the three-state framing (commissioned / scaffolded / stub).

### Week 9 (Jun 22 → Jun 28)

**Topic-page work this week is bespoke, not batched.** Pick 1–2 topics that genuinely call to be made now (likely ones tied to current Sanctuary / Aligned / Crypto threads, or ones that surfaced from real visitor questions). Treat each as its own piece — layout, typography, and structure designed for that subject.

### Week 10 (Jun 29 → Jul 5) — already partly delivered ahead of schedule

**Mon — Crypto: values + slogans live** *(landed 2026-04-28 in commit e894d09)*
- On `/v2/crypto/`: add slogan "Crypto is freedom technology." Add Bitcoin values list (borderlessness, immutability, censorship resistance, permissionless, scarcity, transparency).
- "What crypto provides" section: financial sovereignty, banking the unbanked, programmable money, unconfiscatable savings, micropayments, etc.

**Tue — Money topic: Mike Maloney content**
- Add attributes of money + money vs currency distinction. Add "Hidden Secrets of Money" series to Watch (`videos.json`).

**Wed — Books: Kevin Trudeau canon**
- Add YWIYC, Gurukev/GuruKev, The Book of Secrets, plus the rest of the Trudeau canon (enumerate first).
- Ensure entries get `picked_in` only where genuinely picked, per editorial standards.

**Thu — Ethos as featured project + Obi profile**
- Ethos crypto project page (entity), pin to `/v2/crypto/projects.html`.
- Obi profile page on `/people/obi/`. (No outreach call scheduled by the plan; calls are operator's choice.)

**Fri — Capital-heavy items as topic pages**
- Stub topic pages for: Próspera, Lugano, Model City, FRQNCY Water (St. Leonhard × Lauretana as examples), Permaculture, Aquaponics. These exist as content even if not operated.
- Each page: framing, who's doing it well today, what FRQNCY's stake is, where this is going.

**Sat — Slogans canonical placement**
- "FRQNCY makes the unable able" + "FRQNCY empowers the empowering" land somewhere visible: rotating homepage hero strapline + footer.

**Sun — Phase 5 retrospective**
- 30+ topic pages levelled up. Crypto values content live. Trudeau / Maloney / Ethos / Obi entries live.

---

## Phase 6 — Mobile + chat-anywhere (Weeks 11–12: Jul 6 → Jul 19)

Goal: FRQNCY is usable on every device. Chat-and-do-crypto from your phone.

### Week 11 (Jul 6 → Jul 12)

**Mon–Tue — Mobile app: real pages, not stubs**
- Replace `wake.html`, `sleep.html`, `bedside.html`, `alarm.html`, `settings.html` stubs with real screens.
- Bare minimum: a `/my-frqncy` view, a chart view, a chat view, a practice-log view, settings.

**Wed — Mobile: AI chat embedded**
- Embed the existing `chat-widget.js` flow inside the Capacitor app. Calls the same `/api/chat` Cloudflare Function. No extra cost.

**Thu — Mobile: practice logger native**
- Native local-notifications via `@capacitor/local-notifications` to remind for practice. Logs to Supabase on next sync via `sync-manager.ts`.

**Fri–Sun — Mobile: TestFlight + Android beta**
- iOS build via `npm run cap:ios`. Submit to TestFlight (Apple Dev account is the budget pinch — $99/year. If not already paid, this is the *one* approved capital line. If skipping, ship as PWA only.)
- Android build via `npm run cap:android`. Internal testing track on Play Console (free).

### Week 12 (Jul 13 → Jul 19)

**Mon — Crypto-on-mobile (in scope = wallet-deep-link)**
- Add a "Tip in crypto" link on teacher profile pages and Aligned Goods entries — opens a Solana Pay or Ethereum deep link to user's wallet (Phantom / Rainbow / MetaMask). No FRQNCY-side custody. No on-site checkout. Free to implement.
- This is the cheapest first hit at "crypto value is integrated" — frictionless, user keeps custody, we just provide the link.

**Tue — Wallet auth (optional, if time)**
- Add "Sign in with Solana" / "Sign in with Ethereum" via Supabase Auth's Web3 plugin. Skip if it eats more than half a day.

**Wed–Thu — Word Illuminator on mobile + share**
- Word Illuminator works on the phone with the IDEAS-INBOX A3 structure.
- Add native share so users can post a Word Illumination output to Telegram / WhatsApp.

**Fri — Site polish pass + accessibility audit**
- Run an accessibility audit. Fix top 10 issues. Verify mobile renders well across pages.

**Sat–Sun — Phase 6 retrospective**

---

## Phase 7 — Demo + Q3 reset (Week 13: Jul 20 → Jul 26)

**Mon — Full audit pass**
- Walk every surface. Mark vision items strike-through. Document remaining gaps.

**Tue — 1h demo dry-run**
- Record yourself walking through FRQNCY for an hour as if explaining it to an investor / collaborator / friend. No slides. Save the recording.

**Wed–Thu — Future Roadmap finalised**
- `proposals/FUTURE-ROADMAP.md`: every item that didn't fit (Sanctuary Spaces opening, Lugano lease, land, model city, Próspera, FRQNCY water, 3D printing, publisher, accelerator, restaurants, suppliers in Malaysia, fully on-chain social, multi-chain integration, DeFi super app, podcast launch, Echo fund onboarding, etc.). Each entry: state today, what unblocks it (capital / partnership / time), rough cost, next concrete action.

**Fri — Q3 plan**
- Write `proposals/EXECUTION-PLAN-Q3.md` (Jul 27 → Oct 25). First 90-day cycle informs second.

**Sat — Public update**
- Post a transparent "what shipped in 90 days" on `/social/space/roadmap/` and via the newsletter.

**Sun — Rest. Plant the next seed.**

---

## Future Roadmap (out of 90-day scope)

These items remain in the vision but aren't shippable under $100/solo. Each lands as a topic page on the site (so the teaching lives on FRQNCY) and graduates to an execution sprint when the unblocker arrives.

### Capital-blocked

| Item | Unblocker | Approx capital | Notes |
|---|---|---|---|
| FRQNCY Spaces (first physical Sanctuary) | Lease + ops budget | $30k–150k setup, $5k–20k/mo | Membership tier already drafted. |
| Lugano FRQNCY | Same | Same | Pillar location per vision. |
| Próspera FRQNCY | Próspera relationship | $10k+ to start | Treat as topic page until partner emerges. |
| Land / forest preservation | Land purchase or lease-to-own | $100k+ | Topic page now; deal flow doc later. |
| Model city (permaculture, energy-independent, aquaponics) | Land + design partner | $1M+ | Topic page now. |
| Sauna / Water Filter / Books / Signs partnerships | Direct outreach | $0–5k | Topic page now; outreach is operator activity, not in plan. |
| FRQNCY water (St. Leonhard × Lauretana) | Partnership + co-pack | $20k+ | Topic page now; pitch later. |

### Capacity-blocked (would need hires)

| Item | Why blocked |
|---|---|
| Full video auto-upload pipeline (vs. assisted ingestion) | Editorial review can't scale solo. v0 in Phase 4 is the right floor. |
| Onchain social media replatform | Architectural rebuild; needs a dedicated quarter. Supabase is the right stack for now. |
| Multi-chain economy across Bittensor / Sol / ETH / BTC / Near / Zec / Bio / peaq / Sui / Hype | Each chain is its own integration. Pick one (Solana) per quarter. |
| DeFi super app | Needs a focused team-sprint and likely a co-founder for the financial product. |
| Echo fund / launchpad listing | Fund vehicle (LLC or DAO) needs to legally exist first. |
| Podcast launch with guest list | Outreach + recording + edit pipeline. Host activity, not in this plan's lane. |
| 3D printing line | Hardware + partner. |
| Publisher | Editorial team. |
| Accelerator | Mentor network + capital. |
| Restaurants | Kitchen partnership. |
| Sortable-by-jurisdiction goods | Legal map per category. |
| Solana Pay / AMEX checkout | Payment processor onboarding (KYC, fees). Phase 6 deep-link is the cheap floor. |

### Already-aligned but deferred to Q3+

- Skool-like sub-product (per vision: "Create a subpart of FRQNCY that is like Skool"). Likely natural extension of the social platform once feed + courses + practice loop are mature.
- Daemon deployments (OpenClaw / Hermes Telegram bridges per IDEAS-INBOX F1/F2). Useful but not on the path to the 1h demo.
- Bi-temporal memory in harness (Graphiti / Zep). Harness v2+ work.
- DSPy + GRPO trace optimisation. Harness v2+ work.
- Voyager-style auto-skill library. Harness v3 work.
- Inkified REPL polish. Deferred indefinitely per AGENT.md.
- Codex MCP + Opus 5.5 cross-pollination (IDEAS-INBOX E4). Investigate when Opus 5.5 is current.

---

## How this plan stays honest

- End of every Sunday: 30-min retrospective. Strike-through what shipped in `VISION-1H-DEMO.md`. Note surprises in `BACKEND-STATUS.md`.
- One commit per shipped surface, no batching.
- If a week slips, slip the week, don't drop the surface. The order matters — Phase 2 depends on Phase 1; Phase 4 depends on Phase 3.
- If something on the vision becomes urgent for an external reason (a partnership materialises, capital lands, an opportunity opens), pull it forward and bump a content day.
- Don't add features beyond this plan during the 90 days. New ideas → `IDEAS-INBOX.md` → triage at end of phase.

## Decisions still pending operator input

The following are reasoned defaults that you can override at any time. None block starting Phase 1.

1. **Membership tier name + price.** Default: "Network member, €19/mo or €190/yr." Refine in Week 5.
2. **First paid course.** Default: Quantum Grammar at $19 one-time. Refine in Week 5.
3. **Apple Developer account ($99/yr).** Default: skip; ship as PWA + Android internal testing only. Override if iOS reach matters in Q2.
4. **YouTube Data API key.** Default: use your free-tier key for video ingestion v0. Refine in Week 7.
5. **Whether `pages/leaderboard.astro` survives.** Default: rename to `/social/conviction-feed/` (a non-ranking display of recent conviction posts). Override in Week 1.

Edit this doc as reality moves. Strike items as they ship.
