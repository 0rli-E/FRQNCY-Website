# FRQNCY Website

A consciousness-practice content, social, and mobile platform.

**Live site:** [frqncy.network](https://frqncy.network)

---

## Read First

- `CLAUDE.md` is the orientation pack for agents working in this repo.
- `SETUP-NEXT-STEPS.md` is the short dashboard checklist for the live backend blockers.
- `HANDOFF-2026-04-28-MAKE-EVERYTHING-LIVE.md` explains the Supabase, subscribe, and Sanctuary cloud-sync work.
- `proposals/BACKEND-STATUS.md` is the status ledger for each surface.

---

## Structure

```
FRQNCY WEBSITE/
├── index.html                  ← Main landing page
├── 
│   ├── explore.html            ← Topic graph spine
│   ├── watch/                  ← Video curation
│   ├── courses/                ← Generated course pages
│   └── [topic]/index.html      ← Topic pages
├── resources.json              ← Curated resources
├── search.json                 ← Topic graph data
├── entities.json               ← People / books / orgs / media entities
├── courses.json                ← Course catalog
├── videos.json                 ← Watch catalog
├── social-src/                 ← Astro + Preact + Supabase social platform
├── app/                        ← Capacitor mobile app
├── functions/                  ← Cloudflare Pages Functions
├── supabase/migrations/        ← Active Supabase migration tree
├── scripts/                    ← Standalone tools
├── mcp-servers/frqncy-content/ ← FRQNCY content MCP server
└── proposals/                  ← Planning, architecture, and handoff docs
```

---

## Deployment

Hosted on **Cloudflare Pages**. The build workflow is `.github/workflows/build.yml`.

- Build command: `npm run build`
- Output directory: repo root
- Functions directory: `functions/`

### Required Cloudflare Env Vars

| Variable | Description |
|---|---|
| `PUBLIC_SUPABASE_URL` | Supabase project URL used by server-side functions and builds |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase key for Pages Functions |

### Optional Env Vars

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Sends welcome email from `/api/subscribe` |
| `RESEND_FROM` | Sender, e.g. `FRQNCY <hello@frqncy.network>` |
| `AI` binding | Cloudflare Workers AI binding for the chat widget and AI reading paths |

Brevo docs still exist in `EMAIL-SETUP.md`, but the current homepage subscribe path writes to Supabase and optionally sends through Resend.

---

## Current Backend Blockers

The code for signups, social, DMs, profile uploads, and Sanctuary cloud sync is in the repo. The remaining steps are dashboard-only:

1. Apply `supabase/migrations/002_fix_conversation_rls.sql`.
2. Apply `supabase/migrations/003_subscribers_charts_storage.sql`.
3. Set `PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Cloudflare Pages.

See `SETUP-NEXT-STEPS.md` for the exact click-path and verification curls.

---

## Local Development

Install dependencies once:

```bash
npm install
```

Build generated pages and data:

```bash
npm run build
```

Serve locally:

```bash
npm run serve
```

Run data validation:

```bash
npm run lint
```

Run the link checker:

```bash
npm run check:links
```

---

## Content Changes

Most user-facing content is generated from structured data:

- Add resources in `resources.json`.
- Add or update topics in `search.json`.
- Add courses in `courses.json`, then run `npm run build:courses`.
- Add watch entries in `videos.json` / `playlists.json`, then run `npm run build:watch`.

For topic-page copy, do not run broad templated sweeps. `proposals/BACKEND-STATUS.md` records the current rule: future topic-page work should happen one page at a time, with a treatment specific to the topic.
