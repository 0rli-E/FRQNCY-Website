# VBRTN App Strategy — from wrapper to companion

**Date:** 2026-08-20 · **Status:** decisions locked 2026-08-20 (Orlando) — ready to build Phase 1
**Parent doc:** `MY-FRQNCY-VBRTN-COMPANION-2026-05-22.md` (the cause). This doc is the *build shape*.

## The one-line goal

The Android app stops being a shell around the website and becomes VBRTN itself: a
chat-first AI companion that holds the person's Human Design, Gene Keys, astrology,
meta-programs and intake answers as living memory — keyed to their login, privately
stored, growing with every exchange.

## What exists today (build on, don't rebuild)

| Piece | State |
|---|---|
| Universal login | Live. Supabase auth, one account across site + app (`assets/frqncy-auth.js`) |
| Per-user cloud storage | Live pattern. `charts` table, one RLS'd JSON-blob row per user per surface (`name='Sanctuary'/'Journey'/'Constellation'`) |
| Companion brain | Live but **stateless**. `/api/companion` — Workers-AI Qwen3 30B free lane, auto-upgrades to Claude with a Pages secret. Client sends a profile slice from localStorage each request |
| Intake | Live. 25 questions / 5 sessions → localStorage `frqncy:vbrtn:profile` |
| Charts | Stub HD, resolved GK table (`my-frqncy/charts/gene-keys.js`), sun/moon/rising strings. No real computation from birth data yet |
| Aggregate learning | Live. `vbrtn_signal` → `analytics_events` (patterns only, never content) |
| App shell | Capacitor 7, native alarm (Kotlin, verified), tabs + iframe to live site |

The gap in one sentence: **the memory lives in one browser's localStorage and the brain
forgets everything between requests.** Everything else is composition.

## Architecture — five composable layers

Each layer has one job and a plugin seam. Anything below can be swapped without
touching what's above.

```
┌─ 5. Surfaces ─────── chat thread (primary) · morning open · alarm · intake-as-chat
├─ 4. Message types ── text · recovery-card · chart-card · practice · [mindmovie…]
├─ 3. Companion runtime  auth → load memory → compose context → model → extract → persist
│                        · Lens plugins: hd · gk · astro · meta-programs · modal-ops ·
│                          triggers · sanctuary-goals · [WDYLT · TBS · KTS · transits · GIN]
│                        · Model router: workers-ai (free) · claude (member) · haiku (one-liners)
├─ 2. Memory system ── L0 design (immutable) · L1 intake · L2 state · L3 episodic · L4 semantic
└─ 1. Identity ─────── Supabase auth · RLS · guest→account merge
```

### Layer 2 is the asset — the memory system

Five stores, all keyed to `auth.uid()`, all RLS'd:

- **L0 Design** — HD chart, GK spheres, natal astrology. Computed once from birth
  data, immutable. (Phase 4 adds real computation; until then, what intake captured.)
- **L1 Intake** — the 25 answers + baseline (TI, chief-aim distance). Append-only.
- **L2 State** — rolling: TI history, state octave, chief-aim distance, habit shape.
- **L3 Episodic** — chat messages + per-session summaries. The only append-heavy
  store → its own `vbrtn_messages` table, not a blob. Retention = open decision #2.
- **L4 Semantic** — what VBRTN has *learned*: typed memory records
  `{kind, content, source, confidence, created, lastConfirmed}` — modal-operator
  captures, wins, recurring themes, what landed / what didn't. This is "learn and
  grow". Written by the extractor (below), **readable and deletable by the user**
  (a "what VBRTN knows about you" screen — memory transparency is a FRQNCY-values
  feature, not a settings afterthought).

L0/L1/L2/L4 follow the existing pattern: one `charts` row, `name='VBRTN'`. L3 gets a
real table. New capability = new JSON keys or new memory kinds — no schema churn.

### Layer 3 — the companion runtime (the composability core)

`/api/companion` v2, same endpoint, new pipeline:

1. **Auth** — Supabase JWT from the app. Anonymous callers keep today's behavior
   (client-sent slice, nothing stored) so the free web surface stays.
2. **Load** — memory slices fetched *server-side* by uid. The client stops being
   trusted with assembling the brain's context.
3. **Compose** — each **lens is a module**: `(memory, thread, moment) → {contextLines,
   questionBank, guardrails}`. Today's `buildContext()` decomposes into eight lens
   modules; new lenses (WDYLT, TBS, transits, GIN retrieval) register without touching
   the pipeline. Per-user/per-tier lens config = the plugin registry.
4. **Model** — router keeps both lanes (free Qwen / member Claude), adds per-surface
   choice (Haiku-class for Cormorant one-liners). **Streaming (SSE)** — chat-first
   lives or dies on perceived latency.
5. **Extract** — post-turn, a cheap model pass updates L4: catch modal operators,
   log the `(state-before, intervention, landed?)` triplet to signals, update rolling
   state, write/refresh memory records. This closes the per-user learning loop.
6. **Persist** — messages to L3, memory to L4, signals to analytics.

Privacy floor carried over and hardened: negative-trigger **names never stored
server-side in plaintext** (client-held, count-only upstream — as today); aggregate
signals stay content-free; export + delete endpoints ship with Phase 2, not later.

### Layer 5 — chat-first UI (in the app bundle, no iframe)

The home screen becomes the thread. Built in the local Capacitor bundle (offline
reads, native feel, alarm untouched):

- Thread + streaming + composer, ChatGPT-shaped.
- **Everything is a message**: the recovery card, morning open, chart reveals,
  practice offers, Sanctuary proposals render as typed blocks *inside the thread*
  (server emits `{type, payload}`; unknown types fall back to text). This is how
  features plug in later without new screens.
- **Intake is the first conversation** — the 25 questions asked by VBRTN in-thread,
  Cormorant insight after each answer. Kills the form/app split; the cause doc
  already frames intake as "not a form, the first conversation".
- Design drawer (your chart), memory screen (what VBRTN knows), settings (built this
  week, incl. account row).

## Phasing — every phase ships something usable

1. **Chat-first shell** (1–2 wks). New chat home in `app/src`, streaming against the
   existing stateless `/api/companion`, native login, thread history local. The app
   *feels* like the product immediately.
2. **Server memory v1** (1–2 wks). `charts` row `name='VBRTN'` (profile sync — intake
   finally follows the login across devices), `vbrtn_messages` table, companion loads
   memory server-side. Export + delete. **This is the wrapper→real-app moment.**
3. **The extractor** (2 wks). Post-turn extraction, server-side modal-operator catch,
   memory-transparency screen, signal triplets. VBRTN now demonstrably remembers
   Tuesday on Thursday.
4. **Real charts** (2 wks). Birth-data → HD + astro computation in a Worker
   (swisseph-wasm; server-side so every device agrees), GK derived from gates.
   Replaces the stubs; L0 becomes real.
5. **Plugins** (ongoing, now cheap). Morning-open push notification, WDYLT, KTS
   scoreboard, TBS calibration, voice, mindmovies, GIN retrieval — each a lens + a
   message type.

iOS inherits all of it — same bundle, same APIs — once the Xcode build lands.

## Decisions — locked 2026-08-20 (Orlando)

1. **Memory canon: server-canonical.** Supabase per-user rows (RLS), device keeps a
   working copy. Negative-trigger names still never stored server-side in plaintext.
2. **Chat retention: full transcripts + extracted memories.** L3 keeps messages
   (RLS, encrypted at rest); export + delete ship with Phase 2.
3. **Shell: Capacitor, local bundle.** Chat UI in the existing app bundle; alarm
   Kotlin and iOS pipeline untouched.
4. **Model line: free Qwen for all, Claude for members.** The daily companion thread
   is free in perpetuity; the Claude voice, long-form readings and synthesis are
   member surfaces. Feeds the #20 membership-boundary answer.
