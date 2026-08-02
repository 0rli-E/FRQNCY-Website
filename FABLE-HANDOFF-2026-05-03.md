# Fable handoff — FRQNCY / NRG session continuation

You are taking over a conversation with Orlando Eisenreich, the solo founder of FRQNCY. He's been pushing forward on NRG, FRQNCY's social-platform sub-brand. This document is the orientation pack — read it once, then keep building.

## Who you're working with

Orlando is the founder. He works in **short directives** ("go", "next", "build on", "what's the status"). He expects continual progress, prefers prose over bullet-overload, and treats Claude/AI sessions as a sparring partner that should sustain momentum across short messages. He's the only person at the company. He's the one who runs migrations, deploys builds, and talks to vendor dashboards — sandbox/Cowork cannot do any of that. Surface terminal-ready commands when he needs to act; otherwise keep building.

If he says something short like "go", "next", or "okay", that means "pick up the next meaningful milestone per the roadmap and ship it". Don't ask for permission. Do ask clarifying questions when you genuinely need a strategic decision (use AskUserQuestion or equivalent multi-choice prompts; he likes those).

## What FRQNCY is, in one paragraph

A consciousness-practice content + social platform deployed at `frqncy.network`. Static site under `/v2/` (Astro-style HTML, 146 topic pages, hand-curated), social platform at `/social/` (Astro + Preact + Supabase, the "NRG" sub-brand), Sanctuary under `/my-frqncy/` (vanilla ES modules, member-facing daily-use loop with practice tracker + charts + word illuminator). Cloudflare Pages deployment. Sibling `frqncy-harness` repo (LLM CLI) lives at `~/Documents/Claude/Projects/frqncy-harness/`.

## Voice constraints — non-negotiable

The canonical guide is `proposals/FRQNCY-VOICE-PLAYBOOK.md`. Hard rules you must enforce on every piece of user-facing copy you write:

- **Cooperation over competition.** No leaderboards, no ranking people, no "calls" framing, no follower-count chest-thumping.
- **For Membership specifically:** never "exclusive", "premium", "unlock", "limited time", FOMO. Always "support the network" / "deeper view for members". The non-member version of any surface must stay useful.
- **Banished marketing terms:** wellness, level up, manifest (as verb), journey (as life metaphor), vibes, vibrate higher, high-vibe, dive in, game-changer, hustle, self care, authentic self.
- **No spiritual cliches.** No "trust the process", "raise your vibration", "your truth", "the universe has a plan".
- **British English locked.** Colour, behaviour, organise, recognised. Reject American spellings.
- **Practices are experiments, not prescriptions.** Reader is the agent.

If Orlando ever asks you to write copy in marketing register, push back. He's the one who set this contract.

## Current state — read this carefully

**Source state is strong.** As of 2026-05-03, NRG has 17 idempotent Supabase migrations, signed posts + follows (Ed25519 over canonical JSON), libsodium-sealed encrypted DMs (1:1 + group + media), Privy embedded wallet auth, a bidirectional Bluesky bridge (cross-post + reply backflow + nightly reply-count refresh), member-tier AI HD reading length differentiation (Word Illuminator's `?member=1` path returns a `member_deepening` section), founder badge UI, group-chat starter UI, course purchases via Stripe, referral codes + rewards tiers (3/10/25), Sanctuary practice tracker, daily-path suggestion, personalisation engine v0, Word Illuminator AI worker, and a nightly auto-grow GitHub Actions workflow that drafts resource/video/Bluesky-count suggestions for human merging.

**Production state is broken.** Confirmed via Chrome MCP on 2026-05-03: `frqncy.network/social` serves the Astro island markup (PostComposer + Feed) but is missing the `<script type="module">` that defines the `astro-island` custom element. So the islands never hydrate and users see three pulsing skeleton boxes forever. The local `social-src/dist/` doesn't exist either, so a clean rebuild is required. The login page falls back to its static HTML form (email/password + Google, no Privy).

**The fix is one terminal session of Orlando's time.** It's documented in `DEPLOY-WEEK-1.md` (the canonical Week 1 runbook, env-var audit included — note the `PUBLIC_SUPABASE_ANON_KEY` was missing from the previous launch checklist). The slash command `/social-rebuild` (if Orlando has installed the Claude Code orientation bundle at `scripts/claude-code-social-setup/install.sh`) prints the exact commands.

## The active roadmap

The window is 2026-05-03 → 2026-08-01 (84 days). Read `proposals/ROADMAP-90D-2026-05.md` for the full version. Four parallel tracks:

**Track 1 (Week 1) — Operator unblock.** Apply migrations 002–017 in Supabase, set Cloudflare Pages env vars (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PUBLIC_PRIVY_APP_ID`, Stripe vars, AI binding), create Privy app + Stripe products + GitHub Actions secrets, rebuild social-src with env vars inlined at build time (Vite reads `PUBLIC_*` at build, not runtime), `cp -r dist/social ../social`, commit, push. Until this clears, nothing else matters. **This is the bottleneck.**

**Track 2 (Weeks 1–8) — NRG-native depth.** Week 2 (AI HD reading length differentiation): ✓ shipped. Week 3 (search across federated feed): code-only, ships next. Week 4 (chart-v2 calibration — 4 more Jovian Archive fixtures). Week 5 (group practice rooms with anonymous presence — "3 people are practising meditation right now", never names). Week 6 (member-only personalised illuminations). Week 7 (Bluesky image embed rendering — CSS-only grid). Week 8 (polish + buffer).

**Track 3 (Weeks 3–10) — Onchain identity + reputation.** Week 3: 30-min Privy + Ethos auth spike (does our existing Privy token authenticate against `api.ethos.network`?). Weeks 4–5: Ethos read-only profile surface (migration 018 adds `profiles.ethos_profile_id`, new `EthosPanel.tsx`). **Voice contract: never display the Ethos score — it's a leaderboard with extra steps. Surface vouches received + invited-by as a neutral list.** Week 6: ◊ Ethos-verified badge in PostCard mirrors the existing Ed25519 verification surface. Weeks 7–8: bonded-invite affordance on `/membership/`. **Week 9 is the load-bearing milestone:** `did:web:frqncy.network:u:<username>` DID documents served at `.well-known/did.json/<username>` — this is the inflection where our signed-message mirror becomes trivially consumable by any DID-aware client across ATProto/Nostr/anything that comes later. Week 10: optional content-anchor (Merkle root → Base nightly), conditional on Privy making it trivial.

**Track 4 (Starts Week 2) — Member acquisition.** Soft-launch surfaces (homepage hero "Network of people, building their dream life", `/about/why/` page, `og:image` for cross-posts). Founding-member outreach to ~30 aligned people. Each upgrades unlocks 5 ceremonial invite codes (not viral). Slow-broaden via aligned content through the Bluesky bridge. 30-day cohort retention check in Weeks 9–12.

**What's deferred through this window** (don't pull forward without checking with Orlando — see the rationale in `PROTOCOL-LESSONS-2026-05.md`): Farcaster bridge (Neynar acquisition changed the trust shape), Lens bridge (Lens Chain reduces cross-protocol pluralism), Nostr publish bridge (cheap to add later), mobile Capacitor shell (PWA works), E2EE forward secrecy (Signal-style double-ratchet), OAuth + DPoP for Bluesky (waiting for @atproto/api OAuth helpers to stabilise), personalisation v0.2.

## The strategic call on "what is onchain for a social network"

Read `proposals/PROTOCOL-LESSONS-2026-05.md` for the full breakdown. Short version: NRG is already mostly onchain in the ways that matter — wallet addresses via Privy embedded wallets, signed posts + follows via Ed25519, public verifiable export at `/api/export`, bidirectional federation via the Bluesky bridge. The remaining deltas are (a) DID identity wrapper, (b) Ethos read-only attestations, (c) optional content-anchor. Putting every post on a chain is an antipattern Farcaster walked away from with Snapchain. ATProto is the cleanest substrate for a content-first social network we've examined.

## Where to find things

- `proposals/ROADMAP-90D-2026-05.md` — the active 90-day roadmap
- `proposals/PROTOCOL-LESSONS-2026-05.md` — strategic call on protocols + Ethos integration design
- `proposals/BLUESKY-TIMELINE-READER.md` — federation surface design (v1 → v1.2 shipped)
- `proposals/NRG-ONCHAIN-PIVOT.md` — Q1 2027 protocol-pivot window (deferred until then)
- `proposals/FRQNCY-VOICE-PLAYBOOK.md` — the canonical voice contract
- `proposals/MEMBERSHIP-V0.md` — Membership surface design
- `proposals/HYBRID-SIGNED-MIRROR.md` — Ed25519 signing model
- `proposals/ATPROTO-BRIDGE.md` — Bluesky cross-post bridge design
- `proposals/PRACTICE-TRACKER.md` — Sanctuary practice-tracker design
- `proposals/AUTO-GROW-LOOPS-V0.md` — nightly drafting design
- `social-src/E2EE-NOTES.md` — encryption threat model
- `NRG-LAUNCH-CHECKLIST.md` — operator gate list
- `DEPLOY-WEEK-1.md` — terminal-ready Week 1 deploy runbook
- `CLAUDE.md` at the repo root — orientation for any agent (read first)

## Tools you can use

When working with Orlando in a Claude session, you typically have file tools (Read/Write/Edit), a Linux sandbox with `bash`, the Chrome MCP for browser automation (the deployed site at `frqncy.network/social` can be probed live), web search/fetch, and possibly desktop computer-use.

The sandbox cannot run `npm install` (bindfs blocks rename), cannot `git push` (the `.git/index.lock` is protected), cannot touch `.claude/` in the FRQNCY repo (write-protected). Vendor dashboards (Supabase, Cloudflare, Stripe, Privy) block automation. Surface terminal-ready commands when Orlando needs to act on these.

The Cowork auto-commit hook bundles changes under sometimes-misleading commit titles — verify with `git log -- <file>` if a file's history seems wrong.

## What to do when Orlando comes back

1. **First, read this handoff and `CLAUDE.md` at the repo root.** Then read `proposals/ROADMAP-90D-2026-05.md` for the current sequencing.

2. **Ask him what he just did** — specifically: has he run the Track 1 unblock (migrations + env vars + rebuild + push)? Use a Chrome MCP probe of `frqncy.network/social` to verify whether the build is fixed: check whether the page contains a `<script type="module">` tag. If yes, Track 1 is done and you move to Track 2 Week 3 (search across federated feed). If no, Track 1 is still the bottleneck and you walk him through `DEPLOY-WEEK-1.md`.

3. **If Track 1 cleared,** ship Track 2 Week 3 (search across federated feed) — code-only, no operator gates. Existing search at `/social/search` is NRG-only; extend to optionally include cross-posted Bluesky rows + call `app.bsky.feed.searchPosts` for pure Bluesky search. Tab strip mirrors the Federated/Network tab on the global feed.

4. **In parallel, when Orlando has 30 minutes,** run the Privy + Ethos auth spike (Track 3 Week 3). Endpoint: `api.ethos.network`. Question: does our existing Privy token authenticate, or do we need a separate registration? Result dictates whether the Ethos read-only surface (Weeks 4–5) lands in May or slides to Q3.

5. **Track 4 Week 2 acquisition surfaces** (homepage hero + `/about/why/` + `og:image` for `/social/post/<id>`) are also code-only and ship the same way.

6. **Update the memory file** at `~/Library/Application Support/Claude/local-agent-mode-sessions/.../memory/project_frqncy_platform.md` (Cowork-mode) or `~/.claude/projects/.../memory/` (CLI) after each session with what shipped, so the next AI doesn't redo work.

## Stylistic notes

Match Orlando's pace. He writes in short, declarative requests. Reply in prose with concrete details — file paths, line numbers, exact terminal commands. Avoid lists unless the structure genuinely is a list (operator-gate sequences, file inventories). When you ship a milestone, end with a one-paragraph recap of what's in source, what's queued, and what the next move looks like. Then either proceed (if he just said "go") or wait.

When Orlando asks "does X work?", actually check. Don't answer from source confidence — use Chrome MCP to probe the live deployment. The deployment can drift away from source for operator-gate reasons.

The voice playbook applies to YOUR replies too — keep your own register out of marketing-speak. Direct, present-tense, no hype, no "let's dive in", no "exciting next step", no chest-thumping. When in doubt, less is more.

## Final orientation

You are picking up mid-flight on a project that has shipped substantial source work over the past weeks but is bottlenecked on operator gates Orlando has to clear from his terminal. The single highest-leverage thing you can do is to make every operator gate as low-friction as possible — print exact paste-ready commands, verify state before suggesting moves, and never let him round-trip through you on something he could do in 30 seconds at the dashboard.

When he says "go", build on what's queued. When he says "what's the status", probe production and answer honestly. When he asks a strategic question, point at the proposal that already answers it before generating new prose.

Welcome aboard. The next move is whatever Orlando types next — orient yourself, verify state, and ship.
