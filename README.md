# FRQNCY Website

A conscious living network — curation, community, and connection across 14 domains of human knowledge and experience.

**Live site:** [frqncy.network](https://frqncy.network)

---

## Structure

```
FRQNCY WEBSITE/
├── index.html          ← Main landing page (open this)
├── about.html          ← Vision & mission
├── platform.html       ← The curation platform
├── podcast.html        ← The FRQNCY podcast
├── space.html          ← The physical space / Network State
├── content.json        ← Single source of truth for all network data
├── generate.js         ← Static site generator — run to rebuild v2/
├── functions/
│   └── api/
│       └── subscribe.js  ← Cloudflare Pages Function: email collection
├── v2/
│   ├── explore.html    ← Clickable network map
│   └── [138 topic subpages]
└── versions/           ← Archived previous versions (ignore)
```

---

## Deployment

Hosted on **Cloudflare Pages** — auto-deploys when you push to GitHub.

- Build command: *(none — static site)*
- Output directory: `/`
- Functions directory: `functions/`

### Environment Variables (set in Cloudflare Pages → Settings)

| Variable | Description |
|---|---|
| `BREVO_API_KEY` | Brevo API key (xkeysib-...) |
| `BREVO_LIST_ID` | Brevo list ID number for FRQNCY Waitlist |

See `EMAIL-SETUP.md` for full Brevo setup instructions.

---

## Adding Content

All network content lives in `content.json`. To update resources:

1. Edit `content.json` — add entries under the relevant node ID in `resources`
2. Run `node generate.js` to rebuild all 138 pages in `v2/`
3. Commit and push — Cloudflare auto-deploys

### Resource format

```json
"t-quantum": [
  {
    "title": "Resource Name",
    "url": "https://example.com",
    "type": "book|tool|org|media|person|course",
    "desc": "One sentence on why this matters.",
    "frqncy_pick": true
  }
]
```

---

## Local Development

Open `index.html` in a browser — everything works locally except the email form
(`/api/subscribe` only runs on Cloudflare Pages).
