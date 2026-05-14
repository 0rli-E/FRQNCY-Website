# HARO / Inbound Press Tracker

Every response sent → one row. Every landed quote → status update + landed URL captured.

Operating playbook: `audits/seo/HARO-PIPELINE.md`
Response templates: `audits/seo/HARO-RESPONSE-TEMPLATES.md`

---

## How to use this tracker

1. After sending a response, append a row at the bottom of the table.
2. When the journalist replies (acceptance, follow-up question, or pass), update the `status` column.
3. When a piece publishes with the quote, paste the `landed-url` and flip status to `quoted`.
4. If a piece publishes without the FRQNCY quote, status becomes `passed`.
5. If 14 days pass with no reply, status stays `sent` but add `(14d no reply)` to notes.

### Status values

- `sent` — response submitted, no reply yet
- `replied` — journalist replied, conversation in progress
- `quoted` — quote landed in a published piece, URL captured
- `passed` — journalist published the piece, didn't use FRQNCY's quote
- `expired` — query deadline came and went, no piece visible, no reply

### Platform values

`haro` · `qwoted` · `sos` · `mentionmatch` · `sourcebottle` · `journorequest` · `profnet` · `other`

### Beat values

`meditation` · `conscious-capital` · `curation` · `network-state` · `ai-curation` · `regenerative` · `editorial-process` · `founder-profile` · `other`

---

## Tracker

| Date sent | Platform | Beat | Query (one-line) | Query URL (if shareable) | Journalist | Outlet | Response sent? | Status | Landed URL | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-MM-DD | haro | meditation | Example: strongest 2026 evidence for meditation as a clinical tool | (HARO digests are email-only, no shareable URL) | Jane Doe | Example Wellness Mag | yes | sent | — | 48h deadline; followed Example 1 template; offered headshot |
<!-- ↑ Sample row showing data shape — Orlando, replace this row with real responses as they happen. -->

---

## Weekly review block

Fill in every Monday alongside the Plausible referrer check (5 min).

### Week of 2026-MM-DD

- Responses sent this week:
- Replies received this week:
- Quotes landed this week:
- Notable journalist contact made:
- Platform producing best signal this week:
- Triage notes / template adjustments:

(Append a fresh block per week, newest at the top.)

---

## Quarterly review block

Every ~90 days. Fill in alongside the Phase-5 quarterly review.

### Q ending 2026-MM-DD

- **Cumulative responses sent:**
- **Cumulative quotes landed:**
- **Hit rate (quotes / responses):** % (target: 5–10%)
- **Hit rate by platform:**
  - HARO:
  - Qwoted (free):
  - SOS:
  - MentionMatch:
  - SourceBottle:
  - #JournoRequest:
- **Hit rate by beat:**
  - meditation:
  - conscious-capital:
  - curation:
  - network-state:
  - ai-curation:
  - regenerative:
  - editorial-process:
- **Median days from response → landed quote:**
- **Outlet quality distribution:**
  - tier-1 (NYT/FT/Forbes/Atlantic/Wired/etc.):
  - tier-2 (industry / trade publications):
  - tier-3 (niche / blogs):
- **Decisions for next quarter:**
  - Continue / deprioritise / drop platform:
  - Upgrade to Qwoted Pro? (only if free tier shows ≥ 1 in-beat query/day claimed before delay clears + evidence of replies):
  - Template revisions:
  - New beat added / removed:

---

## Aggregate counters (manually updated)

- **Total responses sent (lifetime):**
- **Total quotes landed (lifetime):**
- **First landed quote date:** —
- **Most recent landed quote date:** —
- **Best-performing beat:** —
- **Best-performing platform:** —

---

## Honest baselines (do not adjust)

- Expected hit rate: **5–10%** of substantive responses land a quote. Anything above 10% is exceptional; below 5% means template revision, not volume increase.
- Expected ETA to first landed quote: **30–60 days** from start of the pipeline.
- Expected steady-state cadence: **1–3 responses per week** sent.
- Expected weekly time investment: **~25 min/week** (5 days × 5 min skim + 1–2 × 5 min response + Monday 5 min review).

If the first 90 days produces zero quotes despite ≥ 30 substantive responses, the response templates need revision — not the volume.
