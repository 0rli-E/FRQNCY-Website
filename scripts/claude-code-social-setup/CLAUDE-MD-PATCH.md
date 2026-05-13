# CLAUDE.md patch — installer appends this AFTER the existing app-focused content

The installer inserts the following section into `CLAUDE.md` immediately before `## What's currently in motion`. It gives Claude Code a permanent orientation pack on the NRG social platform so every session starts with the right context.

---

## NRG social platform (the social network at `/social/`)

NRG is FRQNCY's social-platform sub-brand, deployed at `frqncy.network/social`. Astro + Preact + Supabase. Source lives in `social-src/`; the built bundle lives in `social/` (copied from `social-src/dist/social/` at build time).

**Read these on session start for any NRG work:**

1. `proposals/ROADMAP-90D-2026-05.md` — current 90-day roadmap (window 2026-05-03 → 2026-08-01, four tracks)
2. `NRG-LAUNCH-CHECKLIST.md` — operator-gate state (migrations, env vars, Privy/Stripe/Cloudflare setup)
3. `DEPLOY-WEEK-1.md` — day-by-day terminal-ready deploy runbook
4. `proposals/BLUESKY-TIMELINE-READER.md` — federation surface (v1 → v1.2 shipped: reader + reply backflow + reply count)
5. `proposals/PROTOCOL-LESSONS-2026-05.md` — Lens/Nostr/Farcaster refresh + Ethos integration recommendation
6. `social-src/E2EE-NOTES.md` — encrypted DM threat model + key model
7. `proposals/FRQNCY-VOICE-PLAYBOOK.md` — voice constraints non-negotiables (no leaderboards, no ranking, banished marketing terms)

**Migration state:** 17 migrations in `supabase/migrations/`, all idempotent. Use `/social-migration` to audit applied state.

**Build + deploy flow** (cannot run from sandbox — bindfs blocks npm rename, requires terminal):

```
cd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/social-src
rm -rf node_modules package-lock.json dist
npm install --legacy-peer-deps
PUBLIC_SUPABASE_URL='...' PUBLIC_SUPABASE_ANON_KEY='...' PUBLIC_PRIVY_APP_ID='...' npm run build
rm -rf ../social && cp -r dist/social ../social
git add -A && git commit -m '...' && git push
```

Cloudflare Pages auto-deploys in ~2–3 minutes after push.

**NRG-specific slash commands** (under `.claude/commands/social-*.md`):

- `/social-state` — current NRG state (shipped vs broken vs deferred)
- `/social-rebuild` — fix the broken production build (terminal commands)
- `/social-deploy` — Track 1 unblock guide (migrations + env vars + Privy/Stripe + build)
- `/social-smoke` — production smoke test via curl probes
- `/social-migration` — Supabase migration audit (source vs applied)
- `/social-voice` — voice-playbook review on a draft
- `/social-feature` — orientation to start a new NRG feature

**NRG voice constraints (additional to global editorial values above):**

- For Membership: NEVER "exclusive", "premium", "unlock", "limited time", FOMO. DO use: "support the network", "deeper view for members".
- For practice tracking: reframe streaks as "consistency"; "Today's path" not "Today's challenge"; suggestion not prescription.
- Identity card: surface "wallet · keys · export" as portable infrastructure, not as a flex.
- Cross-protocol bridges: read-only is the contract for Bluesky reads. Likes/replies/reposts route to bsky.app via permalink. We host NRG; Bluesky hosts Bluesky.

**Onchain identity (Track 3 of the roadmap):** NRG already has wallet addresses via Privy embedded wallets + signed posts/follows via Ed25519 + public verifiable export at `/api/export`. The remaining "onchain" deltas are (a) `did:web` identity wrapper, (b) Ethos read-only attestations, (c) optional content-anchor (Merkle root → Base nightly). See `PROTOCOL-LESSONS-2026-05.md` for the full strategic call.

**What's deferred through the 90-day window:** Farcaster bridge, Lens bridge, Nostr publish bridge, mobile (Capacitor), E2EE forward secrecy, OAuth+DPoP for Bluesky, personalisation v0.2. Don't start these without checking the roadmap first.
