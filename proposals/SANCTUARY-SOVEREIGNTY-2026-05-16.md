# Sanctuary Sovereignty Audit — 2026-05-16

> **Lens:** Does the user truly own their data here, and does the page tell them so honestly?
> **Scope:** `/my-frqncy/dashboard/` (`my-frqncy/dashboard/index.html`, ~3,070 lines), its storage layer (`assets/frqncy-supabase.js`, 370 lines), and the Word Illuminator endpoint (`functions/illuminator/chat.js`).
> **Methodology:** Source grep, route trace, RLS-policy read, copy diff against the live page.
> **Reviewer posture:** Privacy + sovereignty engineer (Signal-UX / Ente-Photos / Tailscale-onboarding lineage).
> **Mandate:** Propose, don't implement.

---

## Summary

The Sanctuary is **honestly local-first when logged out** and **honestly server-mirrored when logged in** — the bones are good. But the page only ever shows the logged-out half of the story, the "Sign in to sync" affordance is silent about what changes (server can read your Dream in plaintext), and the Word Illuminator's "your conversation stays on your device" copy is technically true about *storage* and *false about transmission*. Export works and produces a re-importable JSON. There is no "Delete everything" path on either local or cloud. Five things to fix in copy, two in product, none structural.

---

## 1. Local-first audit — what the tagline claims vs. what the code does

**Page claims (live, line 1088):**

> 🔒 Lives privately on this device. **Sign in** to sync across devices.

**Findings:**

1.1 **[TRUE — logged out]** `LocalStore` (index.html L1390–1449) writes the full state blob to `localStorage` under key `frqncy.sanctuary.v1`, and Vision Board images to `IndexedDB` (`frqncy_sanctuary` / `images`). Logged out, nothing leaves the browser. No analytics ping, no Sentry, no telemetry — grepping the file confirms the only outbound `fetch()` is the Illuminator (see §5).

1.2 **[OVERCLAIM — logged in]** The instant a user signs in, `attachCloudStore()` (L1462) swaps `store = cloud`, and every subsequent `persist()` call writes the **full state blob** (Dream, Chief Aims, intentions, reflections, habits, habit logs, daily intentions) to a single Supabase row (`charts` table, `name='Sanctuary'`) as plaintext JSONB. The privacy banner re-renders to `Synced across devices as @handle. Local backup kept on this device.` (L1593) — but the tagline never tells the user that "synced" means "FRQNCY operators with database access can read it." Severity: **high** — this is the central honesty gap.

1.3 **[TRUE — at the database layer]** RLS on `public.charts` (migration `003_subscribers_charts_storage.sql` L87–107) blocks cross-tenant reads: `owner_id = auth.uid()` for SELECT/INSERT/UPDATE/DELETE. Another logged-in user cannot read your Sanctuary. The service-role key bypasses RLS — Orlando (and anyone with the project's service-role secret in Cloudflare Pages env) can.

1.4 **[NOT END-TO-END ENCRYPTED]** There is no client-side encryption layer. The Supabase JS SDK transmits over TLS, Supabase encrypts at rest (Postgres TDE), but the row contents are readable by anyone with database access. The voice playbook bans "bank-grade encryption" theatre; the page complies by not making the claim — but it also doesn't make the inverse honest claim ("we can read your Sanctuary if subpoenaed").

1.5 **[TRUE]** Local backup is preserved alongside cloud sync. `attachCloudStore()` migrates local → cloud one-way on first attach; subsequent edits write to cloud only (L1481 `store = cloud`). On sign-out, the page reverts to a *fresh* `LocalStore` (L1502) — meaning **logged-out state after sign-out is whatever was in `localStorage` from before sign-in, not a mirror of the cloud row**. Subtle but worth surfacing in §7.

---

## 2. The "Sign in to sync" affordance — what the click actually does

**Repro:** Click "Sign in" in the privacy banner → land on `/social/login/` → email+password (or magic link) → redirect back → `frqncy.onAuth` fires → `attachCloudStore()` runs.

**Findings:**

2.1 **[VAGUE]** The link text reads "Sign in to sync across devices." No mention of *where* the sync goes, *who hosts it*, or *what they can see*. Voice playbook calls this out as a sovereignty failure: "Custody, autonomy, self-determination" is a banner attribute (L230) — the click violates it silently.

2.2 **[OVERCLAIM by omission]** The auth path lands the user in Supabase email-auth, which means **email address and any user metadata (username, display_name) are stored in `auth.users`** — a row that exists for the lifetime of the account regardless of whether they ever fill in a Dream. The page never tells the user "by signing in, your email becomes a record on a server we operate."

2.3 **[TRUE]** The Supabase anon key in `frqncy-supabase.js` L26 is public-safe — that's the standard pattern and the comment correctly notes it (L19–21). RLS is the real gate.

2.4 **[Recommendation]** Replace the banner CTA flow with a two-line modal before the redirect:
- *"Sync means we host an encrypted-at-rest copy of your Sanctuary on a server we operate (Supabase). We can read it. Other users cannot. You can export and delete at any time."*
- *[Sign in anyway] [Stay local]*

---

## 3. Export / Import / Delete — what you actually get back

**Repro — Export (L2753):**
```js
const blob = new Blob([JSON.stringify({ state, images: imgs, exportedAt: ISO }, null, 2)]);
a.download = `frqncy-sanctuary-${todayISO()}.json`;
```

3.1 **[TRUE — full fidelity]** Export produces a single `frqncy-sanctuary-YYYY-MM-DD.json` containing the entire `state` object (Dream, Chief Aims with score history, Objectives, Goals, Habits, habitLogs, dailyIntentions, streakMilestonesSeen, settings) **plus** Vision Board images. Images are exported as `{id, dataUrl: "data:image/...;base64,..."}` from local IndexedDB. Pretty-printed, human-readable JSON.

3.2 **[CAVEAT — cloud users get cloud state]** When logged in, `store.getImages()` calls `SanctuaryCloudStore.getImages()` (frqncy-supabase.js L182), which lists files in the `chart-exports/<uid>/` storage bucket but **does not fetch the image bytes** — it returns metadata only (path, size, created). So a logged-in user's export contains the state JSON but **not the image bytes**. Severity: **medium**. A user who has only ever used the cloud, then exports, will get a JSON file that imports their Dream/Aims/Goals correctly but loses every Vision Board image. The import handler (L2790) silently skips entries without `dataUrl`.

3.3 **[TRUE — round-trips]** Import (L2765) re-parses the file, validates top-level shape, merges over `DEFAULT_STATE`, and calls `persist()` — which writes to whatever `store` is active (cloud if logged in, local if not). Same JSON format both ways.

3.4 **[MISSING — Delete-everything path]** There is no UI affordance to delete the local state, the cloud state, or both. A user who wants to leave has to:
- Open DevTools → Application → Storage → clear `localStorage` + `IndexedDB`
- Separately email Orlando to wipe the Supabase row
- There is no "Delete my Sanctuary" button anywhere on the page.

Severity: **high** for honest-sovereignty positioning. This is the single most important addition: a `Delete everything` button next to Export/Import, with a confirm modal that lists what gets cleared (local + cloud).

3.5 **[MISSING — Export format is undocumented]** The export JSON has no schema doc, no version field at the top level (just `exportedAt`), no migration path. If `DEFAULT_STATE` evolves, old exports could silently lose fields on re-import. Recommend adding `{schemaVersion: 1, ...}` at the export root and a `MIGRATIONS` table in the import handler.

---

## 4. The "I want my data back" walkthrough

Scenario: User decides to leave FRQNCY tomorrow. They have a Dream, three Chief Aims with 6 months of score history, 90 days of habit logs, 30 daily intentions, and a Vision Board with 12 images.

4.1 **[LOGGED OUT — works]** Click Export → receive a `frqncy-sanctuary-2026-05-16.json` file (typical size: 50–200KB without images, 2–20MB with). Open in any text editor — Dream is right there, plaintext, top of file. Chief Aims, score histories, intentions — all human-readable JSON. Images are base64 data URLs in the `images` array — recoverable but bulky. **Verdict:** reconstructable. A motivated user could write a 50-line Python script to render this into Markdown.

4.2 **[LOGGED IN — partially works]** Same export, but images come through as metadata only (see 3.2). The user must either (a) sign out before exporting (which switches `store` to a fresh `LocalStore` and loses everything), (b) manually download each image from the Vision Board view, or (c) request a service-role dump from Orlando. None of these are documented.

4.3 **[NEITHER PATH WORKS]** for "delete my account and forget me." The user can request via support, but there's no UI button, no `/account/delete` route, no documented data-retention policy. GDPR-style "right to be forgotten" is uncodified.

**Recommendation:** Ship a documented offboarding flow:
1. Click "Leave FRQNCY" in the privacy banner (or settings).
2. Modal: *"This downloads your full Sanctuary as JSON (including images), then deletes everything — local cache, cloud row, Vision Board bucket, auth user. Continue?"*
3. Run: full export → `clearImages()` (both local and cloud) → `setState({})` → `auth.signOut()` → `client.from('charts').delete()` → `client.auth.admin.deleteUser()` (needs a Pages Function with service-role).
4. Land on a thank-you page with the downloaded backup as the only outbound link.

---

## 5. Word Illuminator data — where the conversation actually goes

**Page claims (L1183):**

> *"Your conversation stays on your device."*

**Findings:**

5.1 **[OVERCLAIM]** The conversation **history is stored** on the device (`localStorage` key `frqncy.illuminator.conv.v1`, capped at 20 turns — index.html L2498, L2527). But **every turn is also sent over the wire** to `/illuminator/chat` (L2665), which routes to `functions/illuminator/chat.js`, which forwards the messages to Cloudflare Workers AI (`@cf/qwen/qwen3-30b-a3b-fp8`).

5.2 **[TRUE — no auth, no user binding]** The endpoint takes no auth header, no cookie, no user ID. It rate-limits by `CF-Connecting-IP` (chat.js L64). The conversation is **not associated with the user's FRQNCY account** server-side — even when logged in, the Illuminator is anonymous-by-IP.

5.3 **[NOT TRAINED ON, BUT NOT GUARANTEED]** Cloudflare Workers AI's data policy (as of 2026-05) states inference inputs are not used for model training. FRQNCY is not running its own logging on the endpoint (no `console.log(messages)` in chat.js, no D1 binding, no R2 write). But Cloudflare itself logs request metadata (timestamps, IPs, response times) at the edge for ~30 days. The page should say this, not the current line.

5.4 **[Recommendation copy]**
> *"Your conversation is stored on this device. Each question is sent to Cloudflare's AI service to generate a reply — it isn't used for training, but it does pass through their servers in transit. No FRQNCY account, no user ID — anonymous by IP."*

5.5 **[MISSING — Illuminator history is not exported]** The export bundle covers `state` and Vision Board images but ignores the Illuminator conversation. If a user wants to leave with their contemplative thread intact, they can't. Recommend adding `illuminatorHistory: loadIllumConv()` to the export bundle.

---

## 6. Copy the page should tell the user that it doesn't

Each line below replaces or augments existing copy. All comply with the voice playbook (no "bank-grade", no "love and light", no "your data is safe with us" reassurance theatre).

6.1 **Privacy banner — logged out (replaces L1088):**
> 🔒 Your Sanctuary lives on this device only. No one at FRQNCY can read it. [Export a backup] · [Sign in to sync across devices →]

6.2 **Privacy banner — logged in (replaces L1593):**
> ✦ Synced as @handle. Hosted on a server we operate — we can technically read your data; other users cannot. [Export · Delete everything · Stay local]

6.3 **Sign-in modal (new, see §2.4):**
> Sync hosts an encrypted-at-rest copy of your Sanctuary on a server we operate (Supabase). Other users cannot read it. We can. You can export or delete at any time. — [Sync] [Stay local]

6.4 **Word Illuminator card (replaces last line of L1183):**
> Your conversation stays on this device. Each question is sent anonymously through Cloudflare's AI service to generate a reply — not associated with your account, not used for training.

6.5 **Footer (replaces L1346–1347):**
> Logged out: every word stays on this device. Logged in: synced through your FRQNCY account, hosted by us, readable by us, deletable by you any time.

---

## 7. Honest-marketing audit — every privacy claim, rated

| # | Where | Claim | Rating | Correction |
|---|---|---|---|---|
| 7.1 | L1088 privacy banner | "Lives privately on this device." | **TRUE** when logged out · **OVERCLAIM** post-sync | See 6.1 + 6.2 |
| 7.2 | L1088 | "Sign in to sync across devices." | **VAGUE** — doesn't say where sync goes | See 6.3 |
| 7.3 | L1183 Illuminator card | "Your conversation stays on your device." | **OVERCLAIM** — stored on device, but transmitted on every turn | See 6.4 |
| 7.4 | L1332 Vision Board meta | "Images stay on this device. You choose what gets shared." | **TRUE** logged out · **MISLEADING** logged in (images go to `chart-exports` bucket) | "Images stay on this device when logged out. When signed in, they're uploaded to your private storage bucket." |
| 7.5 | L1337 dropzone | "stored privately in your browser" | **TRUE** logged out · **FALSE** logged in | Same fix as 7.4 |
| 7.6 | L1346 footer | "Held privately. Built for the long game." | **VAGUE** — what does "privately" mean? | See 6.5 |
| 7.7 | L1347 footer | "When signed in, your Sanctuary syncs across devices via your FRQNCY account. Logged out, it stays on this device." | **TRUE but incomplete** — doesn't say FRQNCY can read it | Append "We can read your synced data; other users cannot." |
| 7.8 | banner save indicator | "Saving locally…" / "Synced" | **TRUE** — accurately distinguishes modes | Keep as-is. Good pattern. |

---

## 8. Prioritised recommendation list

In order of severity × cheapness:

1. **[High · cheap]** Fix Illuminator overclaim — replace L1183 line with §6.4 copy. One-line edit.
2. **[High · cheap]** Fix Vision Board logged-in copy — replace L1332 and L1337 with §7.4 copy. Two-line edit.
3. **[High · medium]** Add a "Delete everything" button next to Export/Import. Wires to `clearImages()` + `setState(DEFAULT_STATE)` + (if logged in) `client.from('charts').delete()`. ~40 lines.
4. **[High · medium]** Replace the "Sign in to sync" CTA with the §6.3 pre-flight modal. ~30 lines.
5. **[Medium · medium]** Fix the logged-in export bug (images come through as metadata, not bytes). Either fetch bytes during export, or warn the user. ~20 lines.
6. **[Medium · cheap]** Add `schemaVersion: 1` to the export root and a migrations table in the import handler. ~15 lines.
7. **[Medium · cheap]** Include `illuminatorHistory` in the export bundle. One-line addition to L2755.
8. **[Low · cheap]** Add `frqncy.network` privacy doc at `/privacy/` and link from the footer. Source of truth for what's collected, where it goes, retention windows. ~200 words.

---

## Closing note

The Sanctuary's structural sovereignty story is genuinely better than 90% of contemplative apps — it's local-first by default, the export is full-fidelity round-trippable, and the cloud sync is gated by row-level security tied to user identity. The work is honesty in the *copy*, not crypto in the *architecture*. The page already does the right thing technically; it just doesn't tell the user the full shape of that thing. End-to-end encryption would be the next-level move (libsodium-wrap the JSONB blob before it leaves the browser, key derived from a passphrase the user holds) — that's a separate proposal, justified only if the threat model becomes "FRQNCY itself is the adversary." For 2026-Q2, the win is honest copy + a Delete button. Two afternoons.
