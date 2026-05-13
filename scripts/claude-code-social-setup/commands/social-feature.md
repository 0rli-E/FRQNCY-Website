---
description: Start work on a new NRG feature — pull context from the roadmap, identify the right track, draft a plan.
---

Orlando wants to ship a new NRG feature. Walk through this orientation sequence:

1. **Pull the roadmap context.** Read `proposals/ROADMAP-90D-2026-05.md` and identify which Track this feature belongs to:
   - Track 1 — operator unblock (Week 1)
   - Track 2 — NRG-native depth (Weeks 1–8)
   - Track 3 — onchain identity + reputation (Weeks 3–10)
   - Track 4 — member acquisition (starts Week 2)

2. **Check whether the feature is already planned.** Search the roadmap, deferred list, and `proposals/` for matches. If the feature is on the deferred list, ask Orlando whether to pull it forward (and what gets pushed in exchange).

3. **Map the touch surface.** List which files in the repo will need to change. Cross-reference with `CLAUDE.md` § Repo layout. Common combinations:

   - **NRG-side feature:** `social-src/src/components/*.tsx` + `social-src/src/lib/*.ts` + possibly a new `supabase/migrations/0NN_*.sql` + possibly a `functions/api/*.js` for server-side. Rebuild via `/social-rebuild` when done.
   - **AI worker feature:** `functions/illuminator/*.js` or `functions/api/chat.js` + matching `assets/*-widget.js` for any vanilla page surface.
   - **Vanilla page feature** (my-frqncy, aligned, membership): `assets/frqncy-*.js` (vanilla ES module) + a static HTML page. No build step.
   - **Member-gated surface:** wire `assets/frqncy-member-gate.js` `getActiveMembership()` / `isActiveMember()`. Voice: "deeper view for members" never "exclusive".
   - **Bluesky bridge feature:** `social-src/src/lib/atproto-bridge.ts` + `social-src/src/components/Federated*.tsx` or `Bluesky*.tsx`.

4. **Identify required operator gates.** Migrations need Supabase SQL editor. New env vars need Cloudflare Pages dashboard. New Stripe products need Stripe dashboard. Surface these upfront so Orlando knows what he'll need to do at the end.

5. **Run voice review.** Any user-facing copy in the feature needs `/social-voice` before merge. Reference the editorial values in `CLAUDE.md` and the canonical voice playbook.

6. **Output a feature plan in this shape:**

   - **Title + Track**: one line
   - **Touch surface**: bullet list of files
   - **Migration needed?**: Y/N, with migration number if Y (next available based on `ls supabase/migrations/*.sql | tail -1`)
   - **New env vars?**: list
   - **Operator gates after merge**: list
   - **Voice-review prompt**: a sentence describing the copy that needs voice review
   - **Build + deploy step**: which `/social-*` command Orlando runs at the end

7. Ask Orlando to confirm the plan before writing code.

Default to small, shippable milestones. If the feature is bigger than a session, split it explicitly into v0.1 / v0.2 / v0.3 with what lands in each.
