# FRQNCY Integrations & Backend Specs

*The pieces that hang off the network but aren't agents. Newsletter backend, livestream, auto-ingest, Ethos integration, AI summaries, social layer, referral system.*

*Updated: 2026-05-12. Status: spec-only.*

---

## 1 · Newsletter backend *(task #56)*

**Surface:** `/newsletter` (live as of this commit)
**Backend:** to build

### Schema
```
subscriber {
  email           UNIQUE
  topic_subs[]    array of topic IDs the user chose
  ref_code        if they came in via a referral
  status          pending | active | unsubscribed
  created_at
  confirmed_at
  last_sent_at
}
```

### Provider
Lean toward **Klaviyo** or **ConvertKit/Kit** — both support topic-tagged segments natively. Substack is tempting (frqncy.substack.com already exists) but its tagging model is weaker.

### Cadence per topic
- Crypto: weekly
- Network State, Settle, Fund: bi-weekly
- Curate, Educate, Research, Broadcast, Sell, Build: monthly
- Events: only when there's an event

### Build cost
~1 week. Half is the double-opt-in + unsubscribe-per-topic plumbing.

---

## 2 · Live-stream capability *(task #52)*

**Use case:** FRQNCY Salons that have remote attendees. Podcast recordings broadcast live. Retreat opening sessions for the wider network.

### Stack
- **Capture:** OBS Studio on host machine.
- **Distribution:** Cloudflare Stream (simple, cheap) or Mux (premium).
- **Embed:** `<iframe src="https://customer-xxx.cloudflarestream.com/$VIDEO_ID/iframe">` on the relevant FRQNCY page.
- **Chat:** Telegram channel mirroring chat into the page (LiveChat plugin).
- **Replay:** auto-archive to `/v2/watch/` after the stream ends.

### Build cost
~1 week to wire. The hardware (camera, mic, lighting) is the bigger lift.

---

## 3 · Auto-ingest videos *(task #53)*

**Job:** When a tracked YouTube channel publishes a new video, automatically:
1. Pull the metadata (title, duration, description, thumbnail).
2. Decide if it qualifies (topic match? channel allowlist? quality heuristic?).
3. Add to `videos.json` under the right topic.
4. Open a PR for editorial review.

### Tracked channels (seed list)
- Eckhart Tolle · Shi Heng Yi Online · Mike Maloney's GoldSilver · Dr Joe Dispenza · Bashar (Darryl Anka) · Sadhguru · Stoa · Aubrey Marcus · Andrew Huberman · Lex Fridman · The Stoa · Network School · Próspera · Naval · TheTinMen

### Pipeline
1. Cron job every 2 hours pulls each channel's RSS feed (`https://www.youtube.com/feeds/videos.xml?channel_id=XXXXX`).
2. For each new entry, classify topic via the FRQNCY-aligned model (or Claude fallback).
3. If confidence > 0.8 and topic is on the network, append to `videos.json` and open PR.
4. Below threshold → human review queue.

### Build cost
~1 week. Mostly the classifier; channel polling is trivial.

---

## 4 · Ethos integration *(task #82)*

**What Ethos is:** ethos.network — onchain reputation primitive. Users get a score based on attestations from other users. Higher score = more trusted; can be staked against by detractors.

### Integration shape
- FRQNCY member profile shows Ethos score next to FRQNCY-internal credentials.
- Network actions (curating content, hosting events, attending retreats) generate Ethos attestations between members.
- The Launchpad uses Ethos score as one of several signals for founder trust.
- Long term: FRQNY governance weight = f(token balance, Ethos score, FRQNCY-internal tenure).

### Build cost
~2 weeks. Ethos has docs; integration is API-level. Defining what FRQNCY actions count as attestations is the editorial work.

---

## 5 · AI marketing + crypto summaries *(task #67)*

**Job:** Weekly auto-generated summaries — what FRQNCY did this week, what the crypto markets did, what the network is reading — published as the home-page News & Notes block and the Crypto dispatch.

### Implementation
- A scheduled task (Cloudflare Cron Trigger) runs Saturday 18:00 UTC.
- Pulls: this week's commits to the FRQNCY repo (filter to content/editorial), this week's posts on `/social/`, crypto market data (CoinGecko API for top-30 + FRQNCY-rated projects).
- Drafts a summary via the FRQNCY-aligned model (or Claude fallback).
- Posts to `/v2/news/this-week/` and sends to the Crypto + General newsletter dispatches.
- Voice-checked before send.

### Build cost
~1 week once newsletter backend exists.

---

## 6 · LinkedIn-like social layer *(task #63)*

**Note:** The shell already exists at `/social/` (NRG — the FRQNCY social app). This task is about expanding it into a proper connections + interest-matching layer.

### Features needed
- **Profile** — bio, interests (topic IDs), looking-for, recent FRQNCY activity.
- **Matching** — graph search over topic overlaps, geographic proximity, mutual connections.
- **Intros** — opt-in algorithm proposes 3 high-quality intros per week. Users can accept, decline, defer.
- **Messaging** — direct messaging on top of the matching layer.
- **Endorsements** — credentialing via Ethos attestations (see §4) layered on top.

### Build cost
~6–8 weeks. The NRG shell already provides auth + DB; the hard parts are the matching algorithm and the editorial bar on the social space.

---

## 7 · Dating layer *(task #64)*

**Designed to be deleted** — that's the framing. The dating layer rides on the same matching algorithm as the social layer (§6); it adds romantic-context filters, opt-in only.

### Why deletable
The success metric is the opposite of most dating apps: time-to-deletion. If a user gets into a relationship that holds, they should leave. The app is built to support that — no streaks, no engagement metrics, no swipe addiction loops. A small set of carefully matched suggestions per week. People meet, leave the app, stay on FRQNCY for the rest.

### Differentiator
- Built on top of a curated network of people who have already passed the FRQNCY editorial bar.
- Interest depth > looks. Onboarding requires a written response, not a photo grid.
- Ethos attestations from prior partners (if opted into) — the real-world reference equivalent.

### Build cost
~2 weeks on top of the social layer. The hard parts are policy questions, not engineering.

---

## 8 · Referral + affiliate links *(tasks #45, #58)*

### Books
- Add `affiliate_links` array to each book entry in `books.json`. Schema:
  ```
  affiliate_links: [
    { vendor: 'amazon', url: 'https://amazon.com/...', commission_pct: 4 },
    { vendor: 'bookshop', url: 'https://bookshop.org/...', commission_pct: 10 },
    { vendor: 'frqncy-store', url: 'https://store.frqncy.network/...', commission_pct: 100 }
  ]
  ```
- Book pages render the Bookshop link first (aligned indie bookstores), Amazon second.
- Revenue accrues to the FRQNCY treasury.

### Memberships, retreats, aligned goods
- Same `affiliate_links` pattern on `orgs.json`, `places.json`, and the aligned-goods bed.
- Each link tags with `?ref=frqncy` so even untracked clicks are attributable post-hoc.

### Referrals (Sell pillar)
- Every FRQNCY member gets a permanent `ref_code` (already captured in subscribe flow — see `assets/frqncy-membership.js`).
- Two flavours:
  - **Member referrals:** invite-a-friend, rewards both sides with FRQNY (when the token is live) or store credit.
  - **Project referrals:** any FRQNCY-spotlighted project pays a flat % to the network for traffic that converted.

### Build cost
- Books / orgs schema update: 2 days.
- Sell-pillar surface + ref-code wiring: 1 week.
- Token-based rewards: wait for FRQNY launch.

---

## 9 · Visibility boost *(task #78)*

**Blocked on:** the notebook content.

When the notebook arrives, this becomes a marketing plan — channels (X, YouTube, TG, podcast tour, Substack cross-posts), cadence, ICP. Holding the spec slot.

---

## 10 · Multilingual *(task #83)*

### Order
1. English (canonical) — done.
2. **German** — first translation, hand-edited. Orlando native, easiest QA.
3. **Chinese (Simplified)** — second. Largest audience. Requires native editor.
4. **Spanish** — third. Latin America + Spain. Native editor.

Then the longer tail: French, Portuguese, Japanese, Korean, Italian, Russian, Arabic, Hindi, Indonesian, Dutch, Turkish.

### Implementation
- Subdomain or path-prefix? Path-prefix (`/de/...`, `/zh/...`) — keeps SEO equity on one domain.
- Content extraction → translation provider (Lokalise or Phrase) → write back.
- Per-page `<link rel="alternate" hreflang="…">` for each language variant.
- Voice playbook gets translated alongside copy — voice is not language-agnostic.

### Build cost
- Infrastructure: ~3 weeks (path-prefix routing, hreflang, translation pipeline).
- Per-language translation: ~$0.05/word machine + human edit; site at ~80k words means $4k/language done well.

---

## Cross-references

- `proposals/MASTER-ROADMAP.md` — layers 5, 6, 8, 9
- `proposals/SPECS-AGENTS.md` — the agent harness
- `proposals/FRQNCY-CRYPTO-STACK.md` — FRQNY token (needed for referral rewards)
- `proposals/FRQNCY-VOICE-PLAYBOOK.md` — what every translation has to clear
