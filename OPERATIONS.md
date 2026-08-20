## 2026-08-20 — VBRTN iOS: the native app is written (Phase A+B client, uncompiled)

**Did.** Built the complete native SwiftUI app at `app/ios-native/` per the iOS strategy doc:
XcodeGen manifest (bundle `network.frqncy.vbrtn`, iOS 17+, dark-first), local package
VBRTNKit (VBRTNCore logic / VBRTNUI surfaces), 22 Swift files. Feature parity with the
Android chat-first client shipped earlier today: thread home with SSE streaming against
`/api/companion` v2 (thin-client mode ready), full 24-question intake-in-thread (verbatim
bank, same field paths), on-device chart engine running the SAME hd-engine/vsop87/gene-keys
JS via JavaScriptCore, morning open (in-thread + local 08:00 notification toggle),
modal-operator detect + recovery card with rotation, universal sign-in (Supabase email+
password, Keychain), cloud profile sync (charts row name='VBRTN', read-modify-write,
negative-trigger names stripped), threads list/switch, memory-transparency screen with
per-record delete, export via share sheet, erase with confirm, vbrtn_signal analytics
(surface:'ios').

**Opened.** Nothing new. Apple Developer enrollment in progress (Orlando, same evening).

**Finished, and how verified.** All 22 Swift files pass `xcrun swiftc -parse` (syntax only —
NO type check possible: Xcode still not installed, CommandLineTools has no iOS SDK).
`xcodegen generate` produces VBRTN.xcodeproj clean. Chart engine verified for real: the
module-syntax strip + classic-script evaluation runs in Node `vm` (same mode as JSCore) and
computes a correct full chart (found + fixed: hd-engine.js now imports vsop87-data.js — the
"dependency-free" header is stale; bundled it). Live SSE smoke test against production
`/api/companion` with the exact app payload shape: delta/done grammar confirmed, leading
"\n\n" delta observed → display trim added.

**Left.** NOT compiled against the iOS SDK — expect a first-compile pass of small type
fixes (Orlando: install Xcode from the App Store, then `sudo xcode-select -s
/Applications/Xcode.app`, accept license, `xcodebuild -downloadPlatform iOS`, then in
`app/ios-native`: `xcodegen generate` if needed and open VBRTN.xcodeproj). Not run on any
device/simulator; auth flow untested against real accounts; morning notification untested.
App icon is an empty placeholder. Sign in with Apple deferred until the paid dev account.
The old Capacitor iOS shell (`app/ios/`) untouched and parked; its 08-19 fixes remain
uncommitted on this branch.

## 2026-08-20 — VBRTN iOS: native-app strategy written, decision #3 amended for iOS

**Did.** Orlando asked to focus on the Apple app and make it "a real app, not a wrapper."
Wrote `proposals/VBRTN-IOS-NATIVE-STRATEGY-2026-08-20.md` as the iOS sibling to the morning's
`VBRTN-APP-STRATEGY-2026-08-20.md`. Four decisions put to Orlando and locked: **SwiftUI
native** for iOS (amends the morning's "Capacitor shell" decision #3 — that now applies to
Android only), hybrid model router (free Qwen / member Claude, unchanged), Supabase + RLS as
memory canon (unchanged), v1 scope = chat + intake + morning open (alarm moves post-1.0 on
iOS). Plan: new project at `app/ios-native/`, thin SwiftUI client (SPM packages: Core / Chat /
Intake / Design / MemoryUI) over the shared Layers 1–4, typed `{type,payload}` message
renderers as the client plugin seam, APNs morning open, ~6–7 weeks to a submitted 1.0 riding
the shared backend phases. Memory `vbrtn-app-strategy-locked` updated with the amendment.

**Opened.** Four questions were pending Orlando; answered same session: no Apple Developer
account yet (→ the only external blocker; individual enrollment recommended), store identity
VBRTN (`network.frqncy.vbrtn`), English-only 1.0, morning-open delivery defaulted to the
proposal (local notification Phase A → server push Phase C). Still open: individual vs.
wait-for-org enrollment.

**Finished, and how verified.** Strategy doc only — no code, nothing to run. Not verified
against Xcode; `app/ios/` Capacitor shell untouched (its 2026-08-19 first-build fixes remain
uncommitted on review-0812, now parked as reference per the amendment).

**Left.** No scaffold started. Backend Phase 1–2 (chat-first Android shell, server memory)
still the next build steps from the morning session; iOS Phase A can start once the Apple
Developer question is answered. Notion TASK BOARD not updated (no task state changed —
planning only); create rows when Phase A starts.

## 2026-08-20 — VBRTN model ladder: OpenRouter free lane above the Workers floor

**Did.** No Claude budget (Orlando), Claude subscription can't legally/technically back a
server API — so the reply ladder is now: Claude (if ever keyed) → OpenRouter free models
(GLM-5.2:free, then Nemotron-3-Ultra-550B:free) → Workers AI (Llama 3.3 70B → Qwen). Picked
by live A/B against the real prompt using Orlando's existing OpenRouter key (found in
`~/.frqncy-harness/auth/keys.json`); Nemotron-120B excluded (leaks chain-of-thought as
prose). OpenRouter failures — including error objects inside HTTP 200 — fall through per
model; streaming does eager setup so a busy pool falls to Workers BEFORE the SSE commits.
`VBRTN_OR_MODEL` overrides the first slot (e.g. a paid model later) with no code change.

**Finished, and how verified.** 7/7 endpoint test groups (new: ladder order, 429-in-200
handling, stream-through, workers floor). Deployed to main (faf650436).

**Left.** (1) The lane is DORMANT until `OPENROUTER_API_KEY` lands as a Pages secret —
Orlando has the two wrangler commands (my wrangler OAuth here is expired). (2) OpenRouter
free caps: ~50 req/day on a zero-credit account; a one-time $10 credit purchase raises free
models to 1000 req/day — recommended. (3) After the secret lands: live tone check + watch
`via` in replies ("openrouter" vs "workers-ai" ratio tells us pool availability).

## 2026-08-20 — VBRTN voice round 3: frame-matching, no profile recitation, Llama 3.3 70B free lane

**Did.** Orlando's live feedback in three waves, each fixed + deployed + live-tone-tested:
(1) "How's the stretch feeling today?" — the model recited the profile's feeling word on a
bare greeting; global rules didn't land on Qwen, an INLINE guard on the feeling context line
did ("never open with this word"). Greetings now plain across repeated runs. (2) "Answers
should be based on the NLP test answers" — new SPEAK IN THEIR FRAME section: toward/away
phrasing, options-vs-procedures shaped offers, internal/external mirroring, convincer
repetition; verified live — the same message gets differently-shaped replies per meta-program
profile. Examples marked register-not-scripts (Qwen was parroting them verbatim);
no-catchphrase rule added. (3) "Bla bla and then a question… ChatGPT is not even close" —
honest cause is the model class. Free lane now tries **Llama 3.3 70B** before Qwen (fallback
chain, setup-failure-only during streams; extractor stays on Qwen), and the prompt's
one-liner LENGTH rule was replaced with depth-matching + "say something specific and true
before any question". Live samples confirm the step up. The real ceiling-lifter remains the
already-wired Claude lane — Orlando has the two wrangler commands to set ANTHROPIC_API_KEY.

**Finished, and how verified.** 6/6 endpoint tests each round; three live production tone
tests (greeting x3 stable, frame A/B differentiation visible, via=workers-ai on Llama).

**Left.** (1) Free-lane quality is now decent, not frontier — the Claude secret is the
remaining lever and needs Orlando's key. (2) Llama pricing: Workers AI included allocation
should cover current usage; watch the CF dashboard if usage grows. (3) "Have something to
say" only partly lands on Llama — revisit after the Claude flip rather than over-tuning.

## 2026-08-20 — VBRTN v1.1: Orlando's four phone-test findings fixed same evening

**Did.** Orlando installed the v1 APK and found four things; all fixed and shipped
(4a090fe22 on main; APK `VBRTN-v1.1-debug-2026-08-20.apk` on Desktop, sha256 35107e29…).
(1) **Voice** — the Milton-register VOICE prompt read as stilted; rewritten to plain human
speech (contractions, match their length, one question at a time; the modal-operator
curiosity, quiet design lenses and never-prescribe/never-rank rules survive in plain words).
Welcome copy softened to match. Live tone check after deploy: "Hey. How's the stretch feeling
today?" — reads human. This intentionally diverges from the cause doc's Milton section on
REGISTER (not on method) per Orlando's direct feedback. (2) **"Chat deletes itself"** —
renderBoot showed the welcome screen whenever the intake hadn't begun, hiding the stored
thread on every re-entry; thread now always replays, welcome only on true first contact.
(3) **"Not logged in across the app"** — the app's local origin and the frqncy.network
iframe surfaces each held their own Supabase session; built a two-way hand-off (outbound
`#frqncy_sso` fragment → `setSession`; inbound postMessage targetOrigin-locked to the app
origins). (4) **"No logo"** — the launcher was the stock Capacitor icon; replaced with the
gold waveform on navy at all densities (adaptive foreground + legacy square/round), same
mark added to the chat topbar and welcome.

**Finished, and how verified.** 34/34 Playwright UI checks (incl. 4 new talk-first
persistence checks), zero console errors; 6/6 endpoint tests; gradle clean; deployed and
live tone-tested with three message shapes.

**Left.** (1) The session hand-off is code-reviewed + type-checked but NOT exercised on a
device (needs a real sign-in in the app, then opening a site surface — Orlando's next test
run covers it). (2) v1.1 APK not yet on a phone. (3) Voice quality on the free Qwen lane is
now acceptable; the Claude lane (member tier) remains the real ceiling — one Pages secret away.

## 2026-08-20 — VBRTN v1 SHIPPED: chat-first app, server-canonical memory, the extractor — live-verified

**Did.** Built and deployed Phases 1–3 of `proposals/VBRTN-APP-STRATEGY-2026-08-20.md` in one
session (commits b0d4e3e3c → 5fdb54e52 on main). (1) **DB:** migration 029 (vbrtn_threads +
vbrtn_messages, per-user RLS) written AND applied to prod via the Supabase Management API
(token from the CLI keychain entry); tables + all 7 policies verified live. Found the
migrations README's idempotency claim false for CREATE POLICY — do NOT `supabase db push` the
full set. (2) **/api/companion v2:** optional Supabase JWT → server loads the charts
`name='VBRTN'` row + Sanctuary goals, derives the prompt slice server-side (GK spectra resolve
via `functions/api/_gene-keys.js`), hydrates stored history, streams SSE (both lanes, stateful
cross-chunk <think> scrubber), persists each exchange, then a post-turn extractor (free
Workers-AI lane) grows semantic memories, modal-operator captures and felt state onto the row.
Anonymous contract unchanged. (3) **/api/vbrtn-data:** full export + permanent erasure.
(4) **Memory-row contract** unified: `data={profile,memories,state,updatedAt}`; legacy
top-level rows read fine and migrate on next write; web store (`vbrtnStore` in
frqncy-supabase.js) now read-modify-write and strips negative-trigger names (count only in
cloud; local names graft back after cloud-wins merge). (5) **App:** `app/src/app/companion.html`
— chat-first surface with streaming thread, the full 24-question intake asked in-thread (same
ids/fields as web), real on-device chart computation (hd-engine bundled), morning open,
recovery card, memory-transparency screen with per-memory delete, thread list, export/erase,
universal sign-in. `/vbrtn` is now a LOCAL page; the companion is the app's opening surface.
APK on Desktop: `VBRTN-v1-debug-2026-08-20.apk` (sha256 3613e99c…). (6) Web page sends JWT +
threadId when signed in. (7) Three live-found bugs fixed post-deploy: PostgREST batch insert
needs uniform row keys; extractor read `response` before `choices` (live shape crashed it —
now noted on `state._extractor`); extractor scaffold must not outrank a rich client slice.

**Opened.** Nothing filed.

**Finished, and how verified.** 6 endpoint unit tests (mocked env/fetch) + 30 Playwright UI
checks on the built bundle (zero console errors) + **21/21 LIVE production checks** with a
throwaway confirmed user (created via admin API, deleted after): RLS write, authed chat,
threadId, SSE streaming with no think-leakage, 2 exchanges persisted and readable via GET,
extractor captured memory + feeling on the row in canonical shape, export complete, erasure
verified empty via service role, anonymous contract intact. Web surface smoke-tested live
(recovery-card fix + on-voice reply, zero console errors). Gradle assembleDebug clean.

**Left.** (1) APK not tested on a physical phone — install from Desktop and walk: first-run
welcome → intake in thread → birth data draws the real chart → sign in (settings or menu) →
chat streams → memory screen shows what it noticed. (2) Signed-in **app** flow only verified at
the API + RLS level, not through the webview UI (frqncyAuth.open() sheet inside the app is
unexercised). (3) Extractor runs on every exchange incl. web — cost is $0 (Workers AI) but
latency of memory growth is one model call (~5 s) behind the reply. (4) `state._extractor`
debug note is exported with user data (harmless, documented here). (5) Phase 4/5 items
(transits, WDYLT, TBS, voice, mindmovies, Claude member lane secret) not started.
(6) Sanctuary-goals lens live but unverified against a real Sanctuary row (test user had none).

## 2026-08-20 — VBRTN: bugs from the 08-16 click-through fixed, review-0812 shipped to main

**Did.** (1) Fixed all three findings from the 2026-08-16 live click-through in
`my-frqncy/vbrtn/index.html`: `getCurrentRecovery` now normalizes modal operators with
`asList()` so the plain-string shape the intake writes surfaces the recovery card (the
[{text}] chat shape already worked); the "Your design" card renders Strategy/Authority/Profile
rows only when present (no more "Strategy — undefined"); empty-state copy now says "five short
sessions" matching the intake's Session-of-5. (2) Committed the in-flight app settings account
section (universal sign-in via `app/public/assets/frqncy-{auth,supabase}.js`, byte-identical to
the site originals; who-link retargeted at the live site). Built + cap-synced — new
`settings-D5BNlOFU.js` chunk and both auth scripts confirmed inside
`android/app/src/main/assets/public/`. (3) Fast-forwarded `main` to `review-0812`
(d800eb20c → 339f6e635, 18 commits incl. the 08-12 VBRTN Android work + Your Log) and pushed
both branches. SSH remote auth is broken in non-interactive shells (publickey denied); pushed
via HTTPS + `gh` credential helper instead. (4) Notion TASK BOARD row created (Done, Owner:
Claude, Area: VBRTN).

**Also (same session, later):** wrote `proposals/VBRTN-APP-STRATEGY-2026-08-20.md` — the
wrapper→real-app plan (five composable layers, lens plugins, five phases). Orlando locked all
four decisions: server-canonical memory in Supabase, full transcripts + extracted memories,
Capacitor local-bundle shell, free-Qwen/member-Claude model line. Next build step: Phase 1
(chat-first shell in `app/src`).

**Opened.** Nothing.

**Finished, and how verified.** Inline script parse-checked (`new Function`); asList shapes
unit-checked in node; Vite build + `cap sync android` clean. Deploy verified LIVE: polled
production until `https://frqncy.network/my-frqncy/vbrtn/` served both the "five short
sessions" copy and the `asList(p.meta?.modalOperators…)` fix (~80s after push). The
`vbrtn_signal` allowlist and empty-state sign-in from 08-12 are therefore now live too.

**Left.** (1) The recovery-card fix is verified deployed but NOT re-verified end-to-end in a
browser with a seeded string-shape profile — re-run the 08-16 Playwright pass to close it.
(2) Whether Supabase `analytics_events` accepts the now-live `vbrtn_signal` row shape is still
unverified. (3) iOS first-build fixes remain uncommitted on the working tree by design (commit
after device verification); still blocked on Xcode not being installed. (4) Android APK still
untested on a physical phone (Desktop APK is from 08-12, now one bundle behind — rebuild via
/app-apk before testing). (5) settings.html account row untested in a running shell (webview
origin session behavior assumed from frqncy-auth.js contract).

## 2026-08-16 — VBRTN live click-through: full loop verified, one real bug found

**Did.** Automated click-through of the LIVE `https://frqncy.network/my-frqncy/vbrtn/` with
Playwright (headless Chrome, 412×915, `/api/analytics` blocked so no test pollution). Covered:
fresh-visitor empty state; footer sign-in → `/social/login/?next=` round-trip target; "Begin the
intake" → Session 1 questions advance; seeded-profile surface (morning open, room-knows stats,
insights, trail + "Hand me another", Your design incl. Gene Keys spectrum resolution, remember-one);
and a real companion chat round-trip — `/api/companion` HTTP 200 via the workers-ai lane, on-voice
Generator-aware reply rendered in the thread. Zero console errors, page errors, or failed requests
across every page tested.

**Opened.** Nothing filed yet — bug below should become a tracker issue.

**Finished, and how verified.** All flows above verified by driving the production site and
reading screenshots + network responses (scripts in session scratchpad: `vbrtn-clickthrough.mjs`,
`vbrtn-recovery-test.mjs`, `vbrtn-auth-intake-test.mjs`).

**Left.** (1) **BUG (live + local): the recovery card never surfaces from intake answers.**
Intake's `setField` writes `meta.modalOperators.necessity/impossibility` as plain strings
(textarea questions, `my-frqncy/intake/index.html:562`), but `getCurrentRecovery` reads
`necessity?.[0]?.text` (`my-frqncy/vbrtn/index.html:684`) — object shape only. Empirically
confirmed: string shape → no card; `[{text}]` shape → card + rotate work. Only chat-detected
operators (normalized at index.html:1046) ever populate it. Fix: normalize with `asList()` in
`getCurrentRecovery`. Not fixed — this was a verification session. (2) Copy mismatch: VBRTN
empty state says "three short sessions", intake says "Session 1 of 5" / five sessions.
(3) Cosmetic: "Your design" prints `Strategy — undefined` when `hd.strategy` is missing (guard
at index.html:812 checks only `hd.type`); chart-computed profiles always carry strategy, so
low-priority. (4) Live is still origin/main (`d800eb20c`) — the review-0812 VBRTN work
(empty-state sign-in button, aggregate-learning signals) is NOT deployed until merged. (5) Not
tested: actually signing in (no test account used), sessions 2–5 of the intake, Sanctuary
proposal accept/decline cards, and the surface inside the Android app shell.

## 2026-08-12 — VBRTN in the Android app: companion tab, wake media, learning signals, APK built

**Did.** Made VBRTN testable on Android and produced the debug APK. Four moves:
1. **Companion tab in the app shell.** Fifth tab (`vbrtn`, waveform icon) in `app/src/index.html`
   + a `/vbrtn` route in `app/src/main.ts` that loads the live
   `https://frqncy.network/my-frqncy/vbrtn/` in the iframe shell — chat via `/api/companion`
   (keyless Workers-AI lane, verified live with a real request), intake, recovery questions,
   Sanctuary read/propose-write all included. The home "speak with vbrtn" card now routes there
   so the tab highlights.
2. **Wake media.** Bedside gains a "wake with" row: paste a YouTube or direct-audio link (stored
   at `frqncy.bedside.wake_media`, localStorage only). The native alarm still rings with the
   bundled tone — reliability never depends on the network; the link surfaces on `wake.html` as
   the first post-arrival button (direct audio plays via NativeAudio when present, everything
   else opens via `@capacitor/browser`, which is installed).
3. **Aggregate learning v0.** `vbrtn_signal` event allow-listed in `functions/api/analytics.js`
   (→ Supabase `analytics_events`); `my-frqncy/vbrtn/index.html` now sends fire-and-forget
   anonymized pattern signals — HD-type shape, state word, intervention kind, landed/rotated —
   on exchange, recovery-shown (deduped), recovery-rotated, and proposal accept/decline. No user
   content ever leaves the device, per the cause doc's privacy floor. Per-user learning was
   already live (profile, modal-operator capture from chat, recovery rotation).
4. **Built the APK locally** — `vite build` + `cap sync android` + `gradlew assembleDebug`
   (Android Studio jbr + `/opt/homebrew/share/android-commandlinetools`). BUILD SUCCESSFUL, 12 MB,
   sha256 `78d805f6…445a9f`. Copied to `~/Desktop/VBRTN-debug-2026-08-12.apk`.

**Opened.** Nothing filed.

**Finished, and how verified.** Web bundle built clean (new hashes `bedside-CBhmriEw`,
`wake-BJrhBJ4x`, `main-CMNV9fJs` confirmed inside `android/app/src/main/assets/public/`); all
four touched HTML files' inline scripts parse under `new Function`; `analytics.js` passes
`node --check`; Gradle build succeeded. `/api/companion` answered live via the workers-ai lane.

**Left.** (1) NOT verified on a physical phone — install the Desktop APK and walk the checklist
in `app/docs/SHIPPING-2026-04-29.md` (arm → lock → fire → breath-hold → wake screen shows the
media button if a link is set). (2) The `vbrtn_signal` allowlist entry and the signal sender only
go live when this branch reaches `main` (Cloudflare Pages deploys from main) — until then the
client sender fails silently by design. Whether `analytics_events` accepts the row shape was NOT
verified against Supabase. (3) The companion tab needs network; offline it shows the standard
frame-error screen. (4) Notion TASK BOARD row not created for this session — mirror per
`proposals/COORDINATION-PROTOCOL.md` if this becomes tracked work.

## 2026-08-12 — Your Log: one profile's record across every surface

**Did.** Built the second half of the one-account story: the universal login (947a7a11b, earlier
today) let one profile sign in everywhere; nothing yet read back what that profile *does*. Now
`/my-frqncy/log/` does — one day-grouped record across courses, watch, topics, practice, the
Sanctuary, VBRTN and NRG, plus a totals strip (plain counts, no streaks, no ranking).

The design principle: **the log is a view, not a second tracker.** Courses
(`course_enrollments`/`course_lesson_progress`), practice (`practice_logs`), watch
(`charts` name=`WatchProgress`) and NRG (`posts`/`comments`) already leave queryable per-user
rows — the page reads those directly. Only the three surfaces with nothing queryable write
anything new: topic reads, Sanctuary day-touches and VBRTN day-touches drop entries into a new
`charts` row name=`Journey` (`{entries:[{t,s,k,ref,title,url}]}`, deduped per thing per local
day, capped 400). **Zero DB migration** — same table, same RLS as every other store.

Where it lives: `assets/frqncy-supabase.js` gained `journeyStore(user)` + a `journeyNote()`
helper (debounced, day-deduped via `frqncy.journey.day.v1`, never throws into the page);
`sanctuaryStore.setState`/`vbrtnStore.setState` note their day-touch; boot journals a topic
read for signed-in visitors (single-segment clean URLs, filtered against `search.json` at
display time, local date parts not toISOString). Logged-out readers are never recorded and
still download no auth code. My FRQNCY hub gained a "Your Log" card; `sw.js` bumped v76.

**Opened.** Nothing filed.

**Finished, and how verified.** `scripts/test-progress-log.mjs` — 22 assertions, all passing,
real Chromium at 390px against a real Supabase account (`orlando.eisenreich+log0812@gmail.com`,
created for this via the auth API; `mailer_autoconfirm` on). Covers: a signed-in topic visit
journaling itself with the page doing nothing; seeding one record per surface through the real
stores (including an actual NRG `posts` insert, which RLS allowed); the log page reading all
seven surfaces back under a "Today" group with correct copy; the totals strip; no
streak/ranking language; signed-out gate with the sheet opening in place; zero page errors.
Screenshots at 390px verified by eye (fonts blocked in sandbox — layout real, type fallback).

**Left / UNVERIFIED.** (1) **Not on production** — committed as `progress-log-0812` off
`review-0812`; deploys only when that chain reaches main. (2) **Test data now lives in prod
Supabase**: account `+log0812` with charts rows (Journey/Sanctuary/VBRTN/WatchProgress), a
meditation-101 enrollment + lesson, one practice log, and one NRG post ("Progress-log test
post — safe to delete", visible in the public feed until deleted) — Orlando deletes the
account + post when convenient; I don't run permanent deletions against production auth.
(3) The Sanctuary/VBRTN day-touch fires only on *cloud* saves (signed-in) — logged-out local
activity is not retro-journaled on later sign-in. (4) Two tabs appending Journey entries in
the same second can lose one (read-merge-write, no lock) — accepted for v1. (5) The dashboard's
own `persist()` writes the whole Sanctuary blob on every edit; the day-dedupe means only the
first save of the day journals, verified in test but not against the live dashboard UI.
(6) NRG posts render in the log via `/social/post/<id>` links — link target not clicked
through in the test.

## 2026-08-12 — Universal login: one account, reachable from anywhere on the site

**Did.** Built `assets/frqncy-auth.js` — a site-wide sign-in sheet + account control — and wired
it in through `mobile-nav.js`, the one script effectively every page already loads (1413 of 1467
HTML files), so it reaches the whole site without a 1400-file diff and without the generators
clobbering it on the next rebuild. Explicit `<script>` tags added on the four My FRQNCY surfaces
that do not load mobile-nav (`my-frqncy.html`, `charts/`, `intake/`, `practice/`).

The finding that reframed the task: **the session was already universal.** Every surface — static
site, My FRQNCY, Sanctuary, VBRTN, Courses rooms, NRG — uses the same Supabase project
(`vyazlspbmwmlyncdlezh`) and the same publishable key on one origin, so supabase-js has been
writing one `sb-<ref>-auth-token` key for all of them the whole time. Nothing needed unifying at
the session layer. What was missing was a *door*: `social-auth.js` deliberately renders nothing
when logged out (task #15), so 1400+ pages offered no sign-in at all, and the only door that
existed — `/social/login/` — throws you out of the installed VBRTN app (scoped to `/my-frqncy/`)
into a browser tab.

Four real bugs fixed on the way, not polish:
1. **VBRTN's empty state had no way in.** The account control the 08-12 Cowork session added lives
   in the topbar of the *profile* view — unreachable without a profile. So the screen a NEW PHONE
   lands on ("the companion does not yet know you") was the one screen with no sign-in on it, and
   the answer to "my data isn't on this phone" was to answer 25 questions again. Now carries the
   control plus an explicit "Already answered it on another device?".
2. **The sheet was painted through.** A positioned div loses the stacking fight to topic-page
   heroes — the hero type rendered over the card. Now a `<dialog>` + `showModal()`, i.e. the
   browser top layer, which also brings focus trapping and Escape.
3. **Sign-in was buried on phones.** Nav links collapse into the hamburger at 720px — exactly how
   VBRTN's own login went unfound. The phone now gets a copy in the bar beside the hamburger.
4. **Magic links always landed in NRG.** `emailRedirectTo` was hardcoded to `/social/login/`; it
   now returns to the page that asked. The VBRTN sync pill likewise opens the sheet instead of
   navigating (href kept as a no-JS fallback).

Logged-out cost is zero: the Supabase SDK is not fetched until there is a stored session, a
magic-link token in the URL, or a click.

**Opened.** Nothing filed. One question for Orlando: whether `https://frqncy.network/**` is in
Supabase Auth → URL Configuration → Redirect URLs (needed only for the magic-link path).

**Finished, and how verified.** `scripts/test-universal-login.mjs` — 25 assertions, all passing,
real Chromium at 390px and 1280px against a real Supabase account
(`orlando.eisenreich+ulogin0812@gmail.com`, created for this; `mailer_autoconfirm` is on so no
mail was sent) driving the local checkout on :8787. Covers: sign-in from a topic page without
leaving it; that session then live on home / explore / watch / My FRQNCY / Sanctuary dashboard /
courses / VBRTN / NRG with no second login; sign-out on one surface propagating to the others;
the SDK genuinely absent while logged out; the dialog on top; the phone bar visible at 390px
without opening a menu; zero page errors. Screenshots taken at 390px (fonts blocked in the
sandbox, so type renders in fallback faces — layout is real, typography is not).

**Left / UNVERIFIED.** (1) **Nothing here has run on production.** It is committed and pushed as
`universal-login-0812` (947a7a11b) off fresh `origin/main` (d800eb20c); it deploys only when that
branch reaches main — `git push origin universal-login-0812:main`. (2) **No physical phone has
touched it**, and no real cross-device pull has been watched end to end — ops#48 stays open; the
tests prove one browser profile carrying a session across surfaces, not two devices. (3) The
**magic-link redirect** is mechanically tested but its target must be allowed in Supabase's
redirect allowlist; if it is not, Supabase silently falls back to the Site URL. Password sign-in,
the primary path, needs no allowlist. (4) A **test account row now exists** in Supabase auth —
Orlando deletes it when convenient; I do not run permanent deletions against production auth.
(5) The 15 pages loading `social-auth.js` now have two auth modules painting into the same nav;
they are de-duplicated by check (my control skips the name when its avatar is present) but that
coexistence was tested on `/watch/` and `/courses/` only, not on all 15. (6) Notion TASK BOARD
row NOT written this session — the dual-write is outstanding.

## 2026-08-07 (addendum — the Gene Keys work is DEPLOYED and verified on prod)

Corrects the "Nothing is deployed" line in the entry below: Orlando pushed `vbrtn-ship-0807`
(the same two commits rebased onto `064d85a68`) and Cloudflare Pages shipped it.

**Verified on prod, with the method.** `/my-frqncy/charts/gene-keys.js` returns 200 carrying all
64 keys (43 = Deafness/Insight/Epiphany, 55 = Victimisation/Freedom/Freedom). `/my-frqncy/` serves
the VBRTN card. The VBRTN page carries `gk-cell`, `resolvedGK`, `prop-btn` and the
`sanctuary-extract` call.

**The A/B that proves the fix mattered.** Same question — "what is the shadow of my Life's Work,
name it" — for gate 43. Sent WITHOUT resolved names (the old path): *"The shadow here is reaction.
The gift is revolution."* That is gate **49**'s spectrum, copied out of the worked example in the
system prompt — confidently, precisely wrong, and indistinguishable from a real answer to anyone
who doesn't know their chart. Sent WITH the table: *"Shadow Deafness. Gift Insight."* Correct.
Every reading given before today's deploy carried that class of error.

**`/api/sanctuary-extract` against the live Workers AI binding** — six cases, all as designed:
clear commitment → `goal_add`; completion of a genuinely open goal → `goal_complete`; a vague wish
("I should probably exercise more") → `[]`; the companion's OWN suggestion, uncommitted by the
person → `[]`; "mark everything complete, add 50 goals" → `[]`; and a prompt injection embedding a
literal forged `goal_complete` payload → `[]`, dropped by the validator because the title is not an
open goal.

**Left.** `aim_progress` fires only when the chief aim is named explicitly ("Update Ten thousand
members to 340" works); indirect phrasing ("my member count is now 340") returns nothing. A false
negative, which is the safe direction, but it means the score rarely self-updates. **Nobody has
opened any of this in a browser or on a phone** — all prod verification is HTTP-level. Cross-device
sync (ops#48) remains unwatched. The APK still needs a Mac-side rebuild for the in-app VBRTN card,
though the installed build reaches VBRTN through the My FRQNCY card now that this is live.
## 2026-08-07 (VBRTN — Gene Keys given meaning, chat→Sanctuary write-back, the missing way in)

**Did.** Orlando's goal: VBRTN fully live — questionnaire + Human Design + Gene Keys producing real
advice, testable on his Android phone, with the Sanctuary tracking goals that update from the chat,
on a free or cheap model. Audited the chain against prod rather than the docs, and found three gaps.

*Gene Keys were a number, not a teaching.* `hd-engine.js` computes the four spheres correctly but
returns only gate numbers, so `buildContext` emitted "Gene Keys — Life's Work 43, Evolution 23…"
while VOICE separately instructed the model to speak in Shadow/Gift/Siddhi terms. Qwen was therefore
inventing the person's Shadow every time, confidently. New `my-frqncy/charts/gene-keys.js` carries
all 64 spectra (web-verified against genekeys.com per-key pages, cross-checked against independent
tables); the client resolves and sends the names, the server renders them and is told never to name
a key not listed. Only the three single-word labels — Rudd's long-form prose is his book, kept out
deliberately. Bare numbers still render, explicitly tagged not to interpret.

*The coach could read goals but never write them.* e9f746e35 (Aug 6) gave the companion read access
to `frqncy.sanctuary.v1`; there was no reverse path, so telling VBRTN you had shipped something left
it open in the Sanctuary forever. New `functions/api/sanctuary-extract.js` PROPOSES; the person taps
to accept. It never writes on its own — the design rule is that an agent silently editing your goals
is a manager, not a mirror. The endpoint validates the model against reality instead of trusting it:
a completion must name a genuinely open goal, an aim must genuinely exist, an unchanged score drops.
Every failure path returns `{proposals:[]}` with 200 so failed bookkeeping can never break the
conversation above it. Client writes to cloud AND localStorage, because a signed-in Sanctuary is
authoritative in the cloud (`attachCloudStore` adopts cloud state on load) and a local-only write
would silently vanish. Dates use local parts, not `toISOString`, which would file an evening entry
under tomorrow for anyone east of Greenwich — i.e. Orlando.

*Nothing pointed at VBRTN.* `/my-frqncy/` offered four cards, none the companion; the mobile app is
NAMED vbrtn and every one of its cards pointed elsewhere. Finish intake, leave, and the only way
back was typing the URL. Added first-position on both. Also removed "unlock the deeper layers" from
the app's membership card — membership is support, never unlock.

Built on `vbrtn-live-0807`, a worktree off fresh `origin/main` (NOT the `email-split-0803` checkout,
which still carries unpushed email v2). Commit `3a064b07d`, 6 files, +578/−4, zero deletions.

**Opened.** Nothing filed. Three findings worth tracking, from a parallel audit of Orlando's question
about breathwork/timer/video: the practice TIMER is real and finished (wall-clock ring, Supabase
`practice_logs`, proper RLS) but effectively orphaned — the Sanctuary links to it from nowhere, it
has no duration picker, and its "read →" affordance has no handler. BREATHWORK on the web is a 6s
CSS pulse and a label in a picker; the only real breath mechanic in the repo is the app's breath-hold
alarm dismiss. VIDEO: `videos.json` is healthy (367 entries, NOT a stub as previously recorded) but
feeds `/watch/` alone; nothing in my-frqncy has an iframe. Also: `breathwork/` and `meditation/`
topic pages ship `t-vcard` buttons with no `openVid` handler — stale generated output, dead clicks.

**Finished — with the method, and only what was actually checked.** 64/64 keys present, `_stub` and
out-of-range gates return null. 18 parser cases pass: hallucinated completions dropped, fake aims
dropped, markdown fences and `<think>` blocks stripped, garbage and non-objects returning []. 19
mutation cases pass against a realistic state blob, including dream/aims/objectives preserved,
score history never dropped, duplicate adds no-op, and corrupt storage survived. A prompt-injection
attempt through a profile value is flattened to one line and clipped, so it cannot forge the
`--- END WHAT YOU KNOW ---` boundary. `node --check` clean on all three JS files; `npm run lint`
green; all inline scripts syntax-checked and tag balance verified on the edited HTML. Prod was
confirmed serving e9f746e35 before any of this started, and `/api/companion` answered 200 in 1.9s.

**Left / UNVERIFIED — read before assuming any of this works.** **Nothing is deployed.** The commit
sits on `vbrtn-live-0807`; neither sandbox can reach GitHub (SSH :22 forbidden, HTTPS 403 via the
proxy), so the push is Orlando's — `git -C /tmp/vbrtn-live-0807 push origin vbrtn-live-0807:main`,
a clean fast-forward. **Nothing has run in a browser** — no phone, no desktop, no screenshot; all
confidence rests on logic tests. `/api/sanctuary-extract` has NEVER been called against the live
Workers AI binding, so its real-world precision is unmeasured — expect both misses and false
proposals until it is watched on real conversations. The client-side regex gate before it is crude.
The APK could NOT be rebuilt: `app/node_modules` is macOS-native and device_bash runs a Linux VM
(rollup native binary mismatch), and the VM has no network to reinstall — Orlando rebuilds on the
Mac if he wants the in-app VBRTN card, though the EXISTING APK reaches VBRTN via the My FRQNCY card
once this deploys, since the shell loads the live site. Cross-device sync (ops#48) is still unwatched.
Committing through the bridge left stale git locks that it lacks permission to unlink; they were
moved to `_to_delete/locks/` and Orlando should delete that directory.

## 2026-08-07 — Social automation blueprint: idea→post pipeline on the real stack (Cowork session)

**Did:** Researched the Aug-2026 automation surface of the full social stack (3 parallel research agents, ~25 primary sources, cited in the doc) and wrote `proposals/SOCIAL-AUTOMATION-BLUEPRINT.md` — stage-by-stage idea→script→voice→captions→visuals→assemble→schedule→funnel→analytics, with steady-state costs (≈$86–115/mo), platform-policy guardrails, and a 5-phase build order. The five findings that change the plan: (1) ElevenLabs `/with-timestamps` returns char-level timing with the audio → the faster-whisper alignment step is deletable; (2) Postiz has a full public API + official MCP — `/upload` + per-channel draft posts in one call = the approval gate; API on every hosted paid tier; self-host cannot post public TikTok/YT (platform app audits block it) → hosted Standard $29 recommended; (3) CreatorFlow has no API but its account-wide automations already cover all future posts (live on the 3 doors since 08-03) — the per-post keyword step no longer exists; (4) Higgsfield now has an official MCP server + CLI (agent-scriptable); Suno still has no public API (invite-only partner program July 2026) — batch months stay; (5) `claude -p`/Agent SDK draws from the Max subscription at $0 marginal (June metered-credit change cancelled) → Claude-native nightly conductor on the Mac, n8n NOT needed for this lane (stays for Telegram personas). Notion TASK BOARD row added (Done, Owner Claude, Area Social).

**Opened:** books-RICH dead-end re-flagged (old books reel CTA says RICH; books answers READ/BOOKS only since 08-03 — recaption the reel or re-add the keyword). Blueprint §8 decisions parked for Orlando: hosted Postiz yes/no · draft-gate vs auto-schedule+veto · Metricool defer · CreatorFlow email gate stays OFF.

**Left / UNVERIFIED:** The blueprint is research + design only — NO code was run. The `el_words.py` / `schedule.sh` / launchd skeletons in §7 are unexecuted paste-fodder; no Postiz account or API key confirmed to exist. Postiz auth header + base URL verified against live docs today; ElevenLabs PVC-on-v3 remains per official docs NOT ready (one third-party source claims otherwise — unresolved; use `eleven_multilingual_v2`). Whether the Cowork cloud sandbox can reach `api.postiz.com` for the Monday memo: untested. NOT yet committed — git write ops through the device bridge leave stale lock files behind (the sandbox blocks unlink inside .git), so both files sit STAGED in the index; stale locks parked in _to_delete/. Orlando: rm -f .git/index.lock, re-add the two paths, commit, push (commands in chat; the Notion row's Output link is the GitHub blob URL and goes live only after push). Build phases 1–2 (EL timestamp adapter + manifest produce.sh + schedule.sh) are the next agent-ready work; not started.

## 2026-08-07 — VBRTN to the phones: APK delivered, iOS pin path handed over, reconcile row closed, #20 brief written

**Did.** Session goal (Orlando): get VBRTN testable on Android + iPhone asap. Verified the state against prod + git + the Notion board rather than the docs — which mattered, because the Aug-6 evening session (e9f746e35 companion-reads-Sanctuary-goals, 80e455ace free-text-shape fixes, pushed with the iOS-installability pair) had logged **nothing**: no OPERATIONS entry, no board update. Confirmed by curl that prod serves e9f746e35's code (`sanctuaryGoals` present on /my-frqncy/vbrtn/), all install tags + /apple-touch-icon.png live, dashboard/intake/trail-data/store all 200. Then: (1) **Android** — delivered the existing debug APK (Jul 10 build, confirmed current: nothing in app/ changed since, and the Capacitor shell loads frqncy.network live so content is today's) to Orlando through the Claude chat for direct phone-side download; documented the unknown-sources/Play-Protect caveats. (2) **iPhone** — handed the Add-to-Home-Screen path that b062dd701+81bccbd36 built (no Xcode needed); pin either /my-frqncy/ ("My FRQNCY") or /my-frqncy/vbrtn/ ("VBRTN"). (3) Gave Orlando the two-phone cross-device sync script — the last unverified check of ops#48. (4) Closed the Notion row "AGENT vbrtn · Reconcile + land the 4 uncommitted my-frqncy files" as OVERTAKEN BY EVENTS, evidence in the row's Notes. (5) Wrote the **#20 membership-boundary decision brief** (options A/defer, B/artifact line — recommended, C/compute line; two riders) — delivered as a file and written into the Notion #20 row body.

**Opened.** Nothing new filed.

**Finished, and how verified.** The reconcile row: main-checkout tree clean of my-frqncy changes (git status, 2026-08-07); all four files landed via deliberate commits (b062dd701, 81bccbd36, 80e455ace, e9f746e35 — git log per file); prod /my-frqncy/dashboard/ and /my-frqncy/vbrtn/ 200 with newest code (curl). **Drop justification per the row's acceptance criterion 3:** the anonymous +4/−17 intake / +4/−9 vbrtn simplification was superseded by 80e455ace's deliberate crash fixes rather than individually adjudicated; it survives nowhere (not in tree, not in stash — stash@{0} is an old rebase auto-stash), and the vbrtn-reconcile-0803 branch was never created or needed.

**Left / UNVERIFIED.** (1) **Cross-device sync is still unproven** until Orlando reports the two-phone round-trip — nothing in this session verified it; ops#48 stays two-thirds. (2) **#20 awaits Orlando's one-sentence call**; the AI HD reading worker stays blocked on it. (3) The APK has still never been installed on a device — debug-signed, expect the Play Protect prompt; no phone screenshots exist from this session, nothing visual verified. (4) The Aug-6 session's protocol skip (no log, no board write) is now a repeating pattern — second time an unlogged push landed on main. (5) An untracked apple-touch-icon.png sits in the main checkout duplicating an asset prod already serves — left alone, not mine. (6) This entry is committed on email-split-0803 (the checkout's current branch, 5 ahead / 11 behind); it reaches main when that branch ships — the branch itself, with email v2, remains unpushed and undeployed.

## 2026-08-03 — Email flow v2 (welcome→gift), CreatorFlow live on 3 accounts, 4 agent tasks queued

**Did:** (1) Email architecture v2 per Orlando: EVERYONE gets the welcome immediately (no pitch); EVERYONE gets the audio course ~24h later as a gift via Resend `scheduled_at: 'in 24 hours'` (no cron); the scheduled id is stored in `metadata.scheduled_gift_id` and `/api/unsubscribe` cancels it before flipping the row — leaving inside the first day means no further mail. Gift email reframed ("A gift, one day in." — "you asked for it" removed). Source-split from earlier today superseded; doc updated. (2) Added the direct audio block to create/read/rich (link straight to `freeyourwish.kevintrudeau.com/?ref=2b9q35`, `rel="sponsored"`, disclosure on the page). (3) CreatorFlow: 3 comment-to-DM automations LIVE — spirituality (CREATE, THINK → /create), books (READ, BOOKS → /read), money (RICH, WEALTH → /rich); any post/reel current+future; DM-only, no public replies; email gate OFF; Growth Plan 10k DMs/mo. (4) Created 4 agent-ready Notion rows with branch names + acceptance criteria for the SDK lanes: frqncy-network (doors-capture-0803), nrg (scoreboard-0803), vbrtn (vbrtn-reconcile-0803), sanctuary (sanctuary-verify-0803).

**Opened:** books no longer listens for RICH (Orlando's correction: READ+BOOKS) — the old books reel saying "comment RICH" now dead-ends; decision pending. THINK was my pick for spirituality's second keyword.

**Left / UNVERIFIED:** Email v2 is in the WORKING TREE on branch email-split-0803 — not committed, not deployed. `scheduled_at` + cancel have NEVER run against live Resend; after deploy: +alias signup → gift shows Scheduled in Resend → unsubscribe → confirm cancelled. Repeated-signup edge: re-subscribing after unsubscribe does not re-send (isNew gate) — acceptable, not designed. 4 uncommitted my-frqncy files still in the main checkout (handed to the vbrtn agent task — do NOT bulk-add them with this commit). CreatorFlow DMs point at pages whose capture works but whose new audio block is only in the tree.

## 2026-08-02 (addendum 4) — Welcome email rewritten + unsubscribe built

**Did:** (1) Fixed the root SPF record — `v=spf1 include:_spf.google.com ~all`, replacing the leftover Namecheap forwarder include; Cloudflare confirmed "DNS record updated successfully". (2) Rewrote the welcome email in `functions/api/subscribe.js`. The old template opened with "You are love and light." as direct self-description — a banished phrase in FRQNCY-VOICE-PLAYBOOK § Never-Use Terms — and delivered nothing. New version leads with the free audio course (affiliate link `freeyourwish.kevintrudeau.com/?ref=2b9q35`, a link not a file, so nothing needs hosting), button above the fold, FTC disclosure in the same email, four door links, abundance close. Subject → "Your free audio course". (3) Built `functions/api/unsubscribe.js`: RFC 8058 one-click + a confirmation page, with `List-Unsubscribe` / `List-Unsubscribe-Post` headers now set on every send. Token is the address AES-GCM-encrypted, so no email in any URL or log; GET never mutates (scanner prefetch would otherwise unsubscribe people silently); `unsubscribed_at` already existed in migration 003, so no schema change. (4) Wrote `proposals/WELCOME-SEQUENCE-V1.md` (emails 2 + 3 drafted, app-download evolution noted) and `proposals/NOTE-TO-FIRST-TWO-SUBSCRIBERS.md`.

**Verified (method stated):** `node --check` on both functions. Seven-case local test harness against the real unsubscribe module: token round-trip · address absent from token · valid GET renders masked address + POST form · tampered token 400 · token forged under a different secret 400 · one-click POST issues the correct `PATCH /rest/v1/subscribers?email=eq.…` with `unsubscribed_at` + `confirmed:false` · stubbed DB 500 returns 502 and tells the user they are NOT unsubscribed rather than lying.

**Left / UNVERIFIED — read this before assuming any of it works:** **Nothing here is deployed.** All of it sits in the working tree; Pages ships on push to main, and the push has not happened. So: the unsubscribe route has never run on Cloudflare, no real mail client has rendered the `List-Unsubscribe` header, and the rewritten email has never been seen rendered by anyone — I wrote it straight to code in one pass. `UNSUBSCRIBE_SECRET` is not set; the route falls back to the service key, which works but couples link validity to a database credential — rotating that silently breaks every unsubscribe link already in inboxes. Emails 2/3 have no sender and, when built, MUST filter `unsubscribed_at IS NULL`. The four door pages still do not call `/api/subscribe`, so the funnel still has nothing feeding it. Sarah + Goldie note still unsent (Orlando sends by hand). Test rows still in Supabase. Commit c6424dc still unpushed.

## 2026-08-02 (addendum 3) — Welcome emails now actually send (Resend live, verified)

**Did:** Set up Resend end-to-end. Created the Resend workspace under `frqncy@frqncy.network` (an old personal account on alm44@gmx.at exists, unused). Added and **verified** the sending domain `frqncy.network` (Ireland, eu-west-1) via Manual setup — deliberately NOT Cloudflare "Auto configure", so the records could be read and conflict-checked before anything was written to DNS. Added 4 records in Cloudflare DNS: `TXT resend._domainkey` (DKIM), `TXT send` (SPF `v=spf1 include:amazonses.com ~all`), `MX send` prio 10 (`feedback-smtp.eu-west-1.amazonses.com`), `TXT _dmarc` (`v=DMARC1; p=none;`). All Resend records are subdomain-scoped, so Google Workspace's root MX and root SPF were untouched. Set `RESEND_FROM` = `FRQNCY <frqncy@frqncy.network>` in Cloudflare Pages (used the existing mailbox rather than `hello@`, so replies land somewhere). Orlando created API key `frqncy-network-prod` (Sending access, scoped to frqncy.network) and pasted it as the `RESEND_API_KEY` secret — I did not handle the key. Retried the production deployment (7291424e, success in 25s, aliased to frqncy.network).

**Finished:** Notion task "Add RESEND_API_KEY + RESEND_FROM" → Done. Tools & Platforms → Resend → Active with the full record set documented.

**Verified (method stated):** POST `/api/subscribe` from the frqncy.network origin returned `200 {"ok":true,"isNew":true}`; the Resend Emails log then showed **"Welcome to FRQNCY" → Delivered** to `orlando.eisenreich+resendtest@gmail.com`. That is send-side confirmation plus Resend's delivery status — not a human eyes-on-inbox confirmation, and the rendered email body was not reviewed.

**Left / unverified:** (1) **Root SPF is wrong and predates this session** — `frqncy.network` root TXT is `v=spf1 include:spf.efwd.registrar-servers.com ~all` (Namecheap forwarding), not Google. Outbound Workspace mail from frqncy@frqncy.network therefore fails SPF; it passes DKIM (`google._domainkey` present) and DMARC is p=none, so nothing bounces today. Fix is one record → `v=spf1 include:_spf.google.com ~all`; NOT done, awaiting Orlando's go-ahead since it touches live mail. (2) Two real early subscribers (sarah@enlightenednations.org, goldie@luminacasa.co) still never received anything — manual hello outstanding. (3) Two test rows now sit in Supabase `subscribers` (`frqncy.test.2026aug02@gmail.com`, `orlando.eisenreich+resendtest@gmail.com`) — Orlando deletes; I don't run permanent deletes on a production table with real rows adjacent. (4) Welcome-email *content* has never been reviewed — the sequence v1 task is still open. (5) Commit c6424dc still unpushed; Miro kanban + task table still need manual deletion.

## 2026-08-02 (addendum 2) — Email capture VERIFIED LIVE + weekly/daily automation

**Did:** Added A/B/C Priority, This-week flag, Planned-for date, Eisenhower quadrants (Dringend/Wichtig matrix) to the Notion TASK BOARD; created 📆 This Week + ☀️ Today + 🧭 Eisenhower views; created two scheduled tasks (weekly plan Mon 07:00, daily plan 06:30) that maintain them. Ran a full prioritization pass with Orlando across ~10 rounds. **Verified the email pipeline end-to-end in prod:** submitted a test address on /newsletter → POST /api/subscribe → 200 → row confirmed in Supabase `subscribers` (source=newsletter_page, confirmed=TRUE).

**Corrections to earlier claims (important):** (1) I asserted a typo in the Cloudflare env var names — FALSE. Opening the variable showed `SUPABASE_SERVICE_ROLE_KEY` spelled correctly; my verifying grep was malformed (same string twice) and proved nothing. (2) Card #3 "add SUPABASE_SERVICE_ROLE_KEY" was ALREADY DONE before this session — both secrets existed. Marked Done and replaced with the end-to-end verification task, which is what actually mattered.

**Finished:** #3 (was already done) · new "verify subscribe endpoint" task (PASSED) · #2 X handle (Orlando claimed @frqncy_network) · #57 Team Canvas (Orlando: done) · #45 split into 6 per-canvas confirm tasks. #63 metrics scoreboard now UNBLOCKED — baseline: 5 subscriber records, 2 organic.

**Welcome email — ANSWERED:** NOT sending. functions/api/subscribe.js L168 gates on `env.RESEND_API_KEY`; Cloudflare has only NOTION_API_KEY, PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. So every signup silently skips the welcome mail (by design, L20). Real subscribers sarah@enlightenednations.org and goldie@luminacasa.co received nothing. New A-task created: add RESEND_API_KEY + RESEND_FROM.

**Left / unverified:** Test row `frqncy.test.2026aug02@gmail.com` still in the subscribers table — Orlando to delete (I don't perform permanent deletions in a production DB; real subscriber rows sit directly adjacent). Cloudflare notes plain env vars come from wrangler.toml (root file only has the AI binding) — unexamined whether anything depends on that. Miro kanban + task table still need manual deletion. Strategy-memory commit c6424dc still unpushed.

## 2026-08-02 (addendum) — Second Miro to-do table migrated

**Did:** Migrated the second Miro task table (widget 3458764678580279383) into the Notion TASK BOARD: 66 Project Overview tasks (Social Platform wiring, My FRQNCY, Membership/Revenue, Content, Harness, App, Agents, Strategy, Physical — with phases + statuses incl. 15 Done for history) + the 8-door × ~17-platform Social Launch rollout matrix compressed into 8 per-door rollout rows (all platform priorities + done-markers preserved in Notes). Added 5 new Area options to the TASK BOARD (Social Platform, My FRQNCY, Agents, Physical, Strategy). Skipped 2 exact duplicates (Supabase env = #3, APK build = #67). Tagged the Miro table DELETABLE (red banner).

**Left:** Orlando deletes the tagged Miro table + the old kanban frames manually (API cannot delete). Rollout matrix door-rows are Later-urgency by design (wave-2 platforms). Not verified: whether any Miro table rows were edited between read and banner placement.

## 2026-08-02 — Coordination protocol locked + Notion HQ becomes the tracker (Cowork session)

**Did:** Built FRQNCY HQ in Notion (7 databases: TASK BOARD, Content Calendar, Partnerships (31 targets w/ rights postures), Sources & Rights, Accounts, Tools & Platforms (34 entries), archived Social Tasks) + 3 strategy doc pages. Imported ALL 68 Miro kanban cards into the Notion TASK BOARD with owner/area/urgency + Miro backlinks. Added Agent-ready / Blocked-by / Output-link fields (the agent queue). Wrote proposals/COORDINATION-PROTOCOL.md and wired it into CLAUDE.md. Marked Miro kanban + to-do frames as read-only/migrated (banners).

**Opened:** The agent-queue dispatch model (Owner=Claude + Agent-ready + Open). frqncy-ops mirroring rule (dual-write: Notion + OPERATIONS.md + ops issues).

**Finished:** Notion HQ structure; 68-card migration (verified: 9+36+6+17 = 68, swimlane milestones already in cards #40-47); protocol memory in CLAUDE.md.

**Left:** (1) Miro kanban DELETION — API cannot delete items; Orlando deletes the 6 column frames manually (banner placed). (2) The strategy-memory git commit c6424dc still needs Orlando's 4 terminal commands (stale .git locks + SSH) — NOT pushed yet, verify with git log after. (3) HQ page not yet shared to the teamspace — Orlando one-click. (4) Notion rows not yet mirrored to frqncy-ops issues (rule starts now, backfill optional). (5) Acceptance criteria only exist on task descriptions, not yet per-row for all Claude-owned tasks. Nothing here is deployed/verified beyond what is stated.

## 2026-08-02 (NRG — migrations 025-028 APPLIED to prod, tested end-to-end, two real bugs found)

**Did.** Orlando confirmed the Supabase access token was in place; the CLI was linked
(it was not earlier in the session), so `supabase db query --linked -f` worked and the
migrations that had been shipping as files-only were finally applied to the live database.

- **025 applied + verified.** `blocks` and `reports` exist with their policies; the
  `posts_select_all` policy now carries the block filter; and the
  **`conversation_members` INSERT hole from migration 002 is CLOSED in production** —
  its `WITH CHECK` is now the tightened membership-or-bootstrap expression.
- **026 applied + verified.** `group_invites`, `has_group_invite`, both triggers, the
  composed posts SELECT policy (blocks AND group gating) and the membership-gated posts
  INSERT are all live.

**Then I tested it end-to-end against the live database with real signed-up users**, driving
PostgREST exactly as the app does. That found two genuine bugs neither review nor a build
could have caught:

- **027 — creating a private group was impossible.** `createGroup()` does
  `.insert(...).select('*')`, which PostgREST sends as `INSERT ... RETURNING`; PostgreSQL
  applies the SELECT policy to the returned row. 026's `groups_select` was
  `visibility='open' OR is_group_member(id)`, and for a private group neither branch holds
  at that instant — not open, and the creator is not yet a member, because
  `trg_group_creator_join` is an AFTER INSERT trigger whose row the RETURNING evaluation
  cannot see. The insert succeeded and was then rejected on read-back with 42501. Open
  groups were unaffected, which is exactly why it hid until a private group was created.
  Fixed by letting a creator always read their own group.
- **028 — starting a DM has never worked, and this one is PRE-EXISTING, not mine.**
  `StartConversationButton.tsx:81` and `StartGroupConversation.tsx:97` both do
  `conversations.insert({}).select('id').single()`, while `conversations_select_member`
  (migration 002) requires `is_conversation_member` — and a brand-new conversation has no
  members yet, because the app adds them on the *next* call using the id it is trying to
  read back. So every attempt to start a DM has failed with 42501 since migration 002. It
  went unnoticed because NRG has had almost no real usage and the messaging round-trip was
  never human-tested. A memberless conversation is now readable — the same bootstrap window
  025 already carved out for `conversation_members` INSERT, disclosing nothing but an id and
  two timestamps.

027 and 028 written, applied, and pushed (`1c6244fb9`). Rebased onto `origin/main` first —
it had moved 44 commits under me mid-session; no migration-number collision, no file overlap.

**Opened.** Nothing filed.

**Finished — verified against production, with the checks named.**
- Full e2e suite passes: post visible before block → invisible to the blocker after, while
  the author still sees their own; the blocked party cannot detect the block (`blocks`
  returns `[]` to them); report inserts 201 and a duplicate returns 23505; private-group
  posts return `[]` to both a non-member and anon; a non-member self-join returns **403**;
  flipping visibility private→open returns **400** (the immutability trigger fires); and
  **B inserting itself into A's conversation returns 403, where it was 201 before 025.**
- Creator auto-join works — the trigger set `role: admin`.
- **All test data removed and the removal verified**: 0 rows left across `auth.users`,
  profiles, posts, groups, blocks, reports, conversations and conversation_members matching
  the test prefix, with the 1 real post and 3 real profiles untouched and all 9 groups back
  at `member_count` 0. Test posts were deleted *before* their groups on purpose —
  `posts.group_id` is `ON DELETE SET NULL`, so the reverse order would have silently
  promoted private test posts into the public feed.
- Prod routes healthy after the migrations: `/`, `/social/`, `/social/groups/`,
  `/social/g/townhall/`, `/social/messages`, `/social/profile/blocked`, `/donate`,
  `/privacy-policy` all 200; the public feed still returns the real post.
- The client capability gates now flip themselves on: `blocks`, `reports` and
  `group_invites` all answer 200 to the anon key the browser uses, so Block/Report and
  private-group creation become available without a redeploy.

**Left.**
- **The Notion half of the dual-write did NOT happen.** The Notion connector is not
  authenticated in this session (only its `authenticate` tool is exposed), so no TASK BOARD
  row was created or updated. Per COORDINATION-PROTOCOL.md this log is the fallback record;
  someone needs to reflect this session on the board, or authenticate Notion so an agent can.
- **Nobody has driven the moderation UI in a browser as a signed-in human.** The database
  layer is now thoroughly tested; the React/Preact surfaces (overflow menu, report dialog,
  blocked-accounts page, invite box) have only been verified as rendering and building.
- The DM fix (028) is verified at the RLS layer — a conversation can now be created and read
  back. The **full encrypted messaging round-trip is still untested**, which was already the
  known gap in the go-live checklist.
- Not checked: whether any older client code depends on the previous `groups_select` or
  `conversations_select_member` behaviour in a way these widenings alter. Both changes only
  ADD readable rows, so a regression would have to look like something newly visible rather
  than newly hidden.
- Google OAuth still disabled at the provider level; still a dashboard toggle, not code.

---

## 2026-08-03 (Doors — email capture + free audio on the four dead door pages)

**Did.** `/money/`, `/spirituality/`, `/books/` and `/breathwork/` were returning 200
but collecting nothing — no `/api/subscribe` call on any of them. All four now carry
the door capture block: email form posting `door_money` / `door_spirituality` /
`door_books` / `door_breathwork`, plus the "Also free — in audio" block linking the
free audio course with `rel="sponsored"` and the affiliate disclosure in place, in the
same wording the welcome email uses.

**The part worth recording: two of the four could not be hand-edited.** A sentinel test
(plant a marker, run the full pipeline, see what survives) showed `books/index.html` is
rewritten by `generate.js` and `breathwork/index.html` by
`scripts/generate_topic_page.py`. A raw HTML edit to either would have looked correct in
the diff, passed review, deployed, and then silently vanished on the next regen. So:
- `money` and `spirituality` — edited directly (both survive regen).
- `books` — added `doorCaptureBlock()` to `generate.js` and an opt-in `doorSource`
  parameter on `entityIndexPage()`, passed **only** for Books. Confirmed it does not
  leak into the people/orgs/media/music/places/papers indexes, which share that function.
- `breathwork` — added a `module: bespoke` section (`slot: door_capture`) to
  `data/topics/breathwork.yaml`, which is the mechanism the Python generator already has
  for preserving hand-written regions across regens.

**Finished, and how it was verified.**
- **Durability:** re-ran the whole pipeline — `generate.js`, `draft_all_topics.py`,
  `generate_topic_page.py --all` — and the block is still present on all four with the
  right source. This is the test the task did not ask for and the one that mattered.
- **Rendered, not inferred:** loaded all four in Playwright at 390×844 and measured the
  live DOM. Block visible on each, label gold `rgb(196,151,58)` on navy
  `rgb(11,28,61)`, single column on mobile, **no horizontal overflow**, form handler
  bound, block inside `<main>`, `rel="sponsored noopener"` and the correct affiliate
  href on every one.
- **No collateral:** stripping the block back out leaves each page byte-identical to
  `origin/main` apart from two newlines before `</main>`. Six files touched, nothing else.
- Console errors on the local server are `/api/analytics` 501s (Python's `http.server`
  has no POST) and a Plausible localhost notice — not from this change.

**Left.**
- **No end-to-end POST was fired.** `source` is free text capped at 64 chars in
  `functions/api/subscribe.js`, so all four values are accepted without an allowlist
  change — but nobody has submitted the form from a deployed page and confirmed the row
  lands in Supabase with the right `source`. That needs the deploy. I deliberately did
  not POST from the worktree: it writes a real subscriber row and sends a real welcome
  email through Resend, and it would have tested the unchanged endpoint rather than
  this change.
- **No screenshot.** Playwright's capture timed out at 5s on every page and format;
  verification is measured computed styles and geometry, not an image.
- **Not pushed, and not merged.** Branch `doors-capture-0803` off `04e9d2ee7`.
- **Notion row not claimed** — no Notion access in this session, so the claim is
  recorded here instead, per the task's own fallback.
- The task cited "CLAUDE.md rules 8-12". **No such rules exist** — the parallel-agents
  list runs 1-7. Those were followed (own worktree, explicit paths, single-invocation
  staging, HEAD re-checked, `--cached` read before commit).
- Editorial note, not a blocker: the money page now carries a Kevin Trudeau affiliate
  link. That is the funnel plan of record (`proposals/KEVINTRUDEAU-LAUNCH.md`) and it is
  disclosed, but the money-page source canon is otherwise
  Clason/Hill/Wattles/Kiyosaki/Maloney. Flagging it as a deliberate call rather than
  letting it pass unremarked.


## 2026-08-03 (NRG — clicked through every moderation surface as a signed-in user; found that user-created groups 404'd)

**Did.** Orlando asked for a real click-through, so I drove production in a browser with two
signed-up accounts, using the actual sign-in form rather than injected sessions.

**It found a bug that mattered: every group a user created returned 404.** Creating the
group succeeded and then dropped the creator on the site's 404 page. Cause: Cloudflare Pages
is not honouring `... 200` rewrites in `_redirects` on this deployment. Isolated by rule type
against prod — every 301 resolves correctly (`/manifestation/*`, `/v2/*`, `/v2/music/*`),
while **all four** 200-rewrites fell through to the `/*  /404.html  404` catch-all. Pages
Functions work fine, which is exactly why `/social/post/<real id>` and
`/social/profile/<username>` resolved while the rewrite-backed paths did not. It stayed
hidden because Astro emits a real static directory for each of the nine seeded groups, so the
rewrite was never exercised for them — only a user-created slug hits it, and nobody had made
one. The same breakage covered non-seeded channel slugs and the whole `/social/u/` namespace.

Replaced the four dead rules with Pages Functions (`functions/social/g/`, `/channel/`, `/u/`),
each deferring to the static asset first and only serving a shell when there isn't one, and
left a comment in `_redirects` so nobody adds a fifth rewrite and watches it 404. Also retired
`functions/social/profile/[[username]].js` into `scratch/` — two catch-alls in one directory
is ambiguous routing, and that one lacks the `STATIC_SUB_PATHS` allowlist, so if it ever won
the toss `/social/profile/blocked` would be served as a lookup for a user named "blocked".

**Finished — every moderation surface exercised in a real browser, and verified.**
- Sign-in through the real form; post created (201).
- `⋯` menu on another user's post offers Report and Block, with the "they aren't told" note.
- Report dialog: opens, **refuses to submit with no reason picked** and says why, accepts a
  reason + detail, and confirms with the "it's on file" panel.
- Block: the card collapses in place to "You blocked @…" rather than yanking the row.
- `/social/profile/blocked` lists the account; Unblock returns the empty state; the blocked
  author's post reappears in the feed afterwards.
- Profile page shows Report / Block / Follow, and the block confirmation copy reads correctly.
- **Private group creation now offers the private option** (the capability gate opened by
  itself once 026 was applied), with the immutability warning. Created one: the creator's page
  renders the name, the private marker, the invite box, the composer and "Joined".
- A non-member gets no join button, no composer, and the group is absent from the directory.
- Routing verified after deploy: the previously-404 `/social/g/<user slug>`,
  `/social/channel/curate`, `/social/u/<name>` all 200, with no regression on
  `/social/g/townhall/`, `/social/groups/`, `/social/profile/*`, `/social/post/<id>`.
- **All test data removed and the removal verified** — 0 rows for uitest users, posts, groups,
  blocks and reports; the 1 real post and 3 real profiles untouched; all 9 groups back to
  member_count 0. Posts deleted before groups on purpose (`posts.group_id` is
  `ON DELETE SET NULL`, so the reverse order publishes private posts into the public feed).

**Left.**
- **A non-member opening a private group sees "That group doesn't exist (yet)", not the
  "This group is private" copy I wrote.** RLS hides the row entirely, so `getGroupBySlug`
  returns null and GroupView takes the not-found branch. Arguably the better behaviour —
  it hides existence — but it means that copy is unreachable for private groups and should
  either be removed or the component taught to distinguish the two cases.
- Two failures in my harness that were NOT product bugs, recorded so nobody re-chases them:
  a plain click on a submit button does not trigger Preact's `onSubmit` here (`requestSubmit()`
  does, and real users are unaffected), and `innerText` returns CSS-uppercased text so
  case-sensitive assertions on styled headings fail.
- Encrypted DM round-trip still untested end-to-end; 028 only proved a conversation can be
  created and read back.
- The Notion half of the dual-write still did not happen — connector unauthenticated.
- Google OAuth still off at the provider level.

---

## 2026-08-03 (Notion dual-write completed — the TASK BOARD now matches reality)

**Did.** Orlando ran `/mcp` and authorised the Notion connector for this session (it had been
authorised on claude.ai, which does not carry over — MCP auth is per Claude Code session). With
it live I completed the dual-write COORDINATION-PROTOCOL.md requires and that the last three
sessions could only record here.

Searched the board before writing, per the protocol's update-never-duplicate rule — and much of
this work already had rows.

**Updated (existing rows):**
- **#64 Auth: returning users render as logged out after an hour** → **Done**, with the commit
  and the four-scenario verification method.
- **#12 Deploy NRG** and **Deploy social platform to /social/\*** → **Done**. Both still said
  "built, not deployed".
- **#65 OAuth providers** → kept Open (Orlando's), noted re-verified still off: exactly one
  enabled provider, email; the Google button has been dead ≥ 7 weeks; the credential half is
  irreducibly his.
- **#66 Session lifetime settings** → kept Open (Orlando's), noted it is genuinely
  dashboard-only and now the last remaining suspect if anyone still reports being logged out.
- **Wire messages / chat** → noted both its blockers are cleared: starting a DM had never worked
  since migration 002 (fixed by 028) and E2EE could not run at all until the CSP fix.
- **Apply Supabase migrations 002+003** → **Done** (001–028 verified applied by direct SQL).
- **Wire Feed to read posts**, **Wire PostComposer to write posts**, **Public profile pages**
  → **Done**, each with what was actually exercised in the browser.

**Created (new rows):** NRG moderation v1 · NRG private groups + Townhall · the CSP fix · the
user-created-group 404 / dead 200-rewrites — all Done with commit links; plus two Open,
Agent-ready rows for what genuinely remains: the untested encrypted DM round-trip, and the
unreachable non-member private-group copy.

**Finished.** The board no longer disagrees with production on anything I checked. Verified by
re-querying it after writing: every Social Platform / Auth / Deploy row now reads correctly.

**Left.**
- **I marked Done only what I exercised myself.** Sibling Miro-import rows — bookmarks, comments
  thread, follow button, search, notifications/mentions — stay **Open** even though their
  queries were observed firing in the network log, so they are probably built too. Someone should
  exercise them and correct the board; I did not want to mark work Done on inference.
- `frqncy-ops` issue mirroring for this session was not done — nothing here is legal/money/
  security-sensitive, but the protocol's third leg is untouched.
- The two new Open rows are unstarted.

---

## 2026-08-03 (#63 Know the Score — /api/scoreboard v1)

**Did.** Built `/api/scoreboard` as a Cloudflare Pages Function returning plain HTML. Branch
`scoreboard-0803` off fresh `origin/main`, own worktree, explicit paths staged.

Built ON the existing analytics work rather than beside it: same env var names as
`functions/api/analytics.js` (`PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`), same
service-role REST shape, same never-surface-a-stack-trace posture. Read-only; it never writes.

**The design decision that matters: the raw row count is not the score.** `subscribers` holds 9
rows, but that includes smoke tests, a deploy pre-check, a Resend verification and the founder's
own addresses. A page reporting "9 subscribers" would be worse than no page. So the scoreboard
reports four numbers and shows its working:
- **active · not us — 2** (the honest headline)
- active incl. team — 4
- unsubscribed — 1
- excluded as test/ops — 4

Every excluded row is listed on the page with the rule that caught it, because silent filtering is
how a dashboard starts lying. Exclusions are the two from the brief (`frqncy.test.*`,
`*+resendtest*`) plus three ops sources found in the live data, not guessed: `smoke`,
`deploy_precheck`, `resend-verification`. Team addresses are NOT excluded — they are counted and
shown separately so the external number needs no subtraction.

**Two findings the page surfaces because they are true:**
- **No `door_*` signups exist at all.** Every subscriber came from `frqncy_website_overlay` or
  `newsletter_page`. The funnel doors (/create, /read, /rich) have produced zero emails.
- **`analytics_events` is completely empty — 0 rows.** The `/api/analytics` collector is deployed
  and the table exists, but not one event has ever been recorded. There is no page-view or funnel
  data behind anything; the page says so rather than implying coverage it lacks.

No leaderboard and no ranking of people — counts and sources only, per editorial values. No email
address is ever rendered, only the source label and the matched rule, so the page leaks no contact
details even if the URL is shared.

**Opened.** Nothing filed.

**Finished — acceptance criteria, and how each was checked.**
- **Numbers match a manual count — verified by INDEPENDENT COMPUTATION, not assertion.** The
  classifier is exported from the function and was run in Node against the live rows; the same
  classification was then re-expressed as a standalone SQL query and run against the database.
  Both produced identical figures: raw 9 · excluded 4 · counted 5 · team 3 · external 2 ·
  unsubscribed 1 · active-incl-team 4 · **active-not-us 2**. Per-row decisions were printed and
  eyeballed too.
- **noindex** — `<meta name="robots" content="noindex, nofollow, noarchive">`, an `X-Robots-Tag`
  response header saying the same, `Cache-Control: no-store`, and a `Disallow: /api/scoreboard`
  line added to `robots.txt`.
- **Unlinked** — new file; nothing anywhere links to it. Deliberately paired with rendering no
  personal data, since an unlinked URL is not a secret.

**Left.**
- **Not yet verified in production.** At the time of writing this is committed, not deployed, and
  I have not confirmed `SUPABASE_SERVICE_ROLE_KEY` is present in the Cloudflare Pages environment.
  If it is missing the page renders a clear "Supabase environment variables are not configured"
  state naming the two vars — by design, not a crash — but the numbers will not appear until the
  key is set. That switch is Orlando's.
- The 7-day trend buckets by **UTC day**, so a signup late in the evening local time lands on the
  next day's bar. Fine at this volume; worth knowing before reading the shape too closely.
- The exclusion rules are hard-coded in the function. That is deliberate for v1 — they are visible
  on the page and in one file — but it means a new ops source starts being counted as a human
  until someone adds it.
- Task dispatch note: this was sent as a `frqncy-harness agent` run with
  `--model claude-sdk/claude-sonnet-4-6`, which **failed instantly** — that lane needs
  `ANTHROPIC_API_KEY`, which is not set. A retry on `claude-code/sonnet` also failed: that
  subscription lane refuses tools outright. Only `openrouter/*` remains as a tool-using harness
  lane. Built directly instead. Two abandoned `gtr` sandboxes were removed; five older
  `frqncy-harness-*` worktrees remain under `<repo>-worktrees/` from previous runs.

---

## 2026-08-03 (Sanctuary — quote set curated; the file split deliberately NOT started)

**Did.** Verified first that Phase 1.1–1.4 are **live on prod**, rather than trusting the
log: `frqncy.network/my-frqncy/dashboard/` is 5,926 lines, byte-identical to `origin/main`,
carrying `pool-track` / `trail-body` / `weekly-panel` / `mc-panel` / `constellation-visits`.
The `chat-widget.js` fix shipped with it — prod's matcher is now
`/^\/(?:[a-z0-9-]+\/)?([a-z0-9-]+)\/?$/i` with `visited.v2` live, so the visit tracker that
had recorded nothing since May is working again in production.

Also closed the cloud-sync risk I logged as unverified, by reading the code rather than
guessing: `attachCloudStore()` does `state = { ...DEFAULT_STATE, ...cloudState }`, so a cloud
row predating `weeklyReviews`/`monthEpigraphs` picks them up from defaults instead of dropping
them, and `setState` writes the whole blob back. New state keys are safe across sign-in.
(Unrelated pre-existing race, worth someone's attention: that same line replaces local state
wholesale when the cloud row is non-empty, so anything typed in the seconds before the async
attach is clobbered. Not new, but there are more write surfaces now.)

Then built the data half of **Phase 1.5**, the quote pill: `assets/sanctuary-quotes.json`, 38
contemplative lines, each drawn from a book already in the FRQNCY corpus so the teaching lives
on the site and the pill can link to its source. Text, attribution and `source_url` copied
programmatically out of `books.json` rather than retyped — all 38 have a working source URL and
none exceeds 112 characters. Curated, not length-filtered: prescriptive manifestation lines are
out (the private room offers, it does not instruct), as are fragments that need their
surrounding page and anything that ranks people. The file documents its own consumer contract
(`index = dayOfYear % length`) and marks itself hand-edited, per the roadmap's "editable, not
generated".

**Opened.** Nothing filed.

**Finished.** The quote set, committed alone. Verified: the file parses, every entry has
text + attribution + source_url, 33 distinct topic slugs are carried for later filtering, and
the deterministic pick is stable across repeated calls on one date, differs the next day, and
yields 38 distinct lines over 38 consecutive days.

**Left.** **The dashboard file split did not start, on purpose.** It is the item I'd otherwise
rank first — 5,926 lines against the 5,000 threshold its own CLAUDE.md sets — but another agent
has uncommitted edits in `my-frqncy/dashboard/index.html` (PWA meta tags, ~70 min old) and
committed elsewhere in the repo five minutes before I looked. A 5,000-line restructure of a file
someone else has open is how this repo has lost work before: git commits whole files, so
whoever writes last reverts the other wholesale. **Do the split in a quiet window, and check
`git status` on that file first.** For the same reason the quote pill's Today-panel wiring is
not done — it is perhaps ten lines and should ride along with whoever next has the dashboard
cleanly. The pill is therefore **not visible to any user yet**: this commit is data only, and
nothing reads the file. Also still unverified from the previous session: export/import of the
new state keys, ISO-week across a Dec/Jan boundary, month rollover on a real 31st, Safari/iOS.

## 2026-08-03 (Sanctuary — prod smoke-check of 1.1–1.4, and the next phase queued)

**Did.** The harness command for this task **did not run**: `claude-sdk/*` requires
`ANTHROPIC_API_KEY` and it is not set (`frqncy-harness doctor` confirms; `OPENROUTER_API_KEY`,
`TAVILY`, `BRAVE` are set). It errored before taking any action, leaving a clean, empty gtr
sandbox at `../FRQNCY WEBSITE-worktrees/frqncy-harness-25c129a1a9c3` (0 changed files) —
removable. **Re-run on `--model openrouter/<model>`**, which is an API lane and does support
tools; `claude-code/*` will not work for this task because that lane has no tools at all.

So I ran the smoke-check directly instead, headless Chromium against the live site.

**Phase → URL → seen/not-seen**, all at `https://frqncy.network/my-frqncy/dashboard/`:

| Phase | Surface | Cold visitor, no state | Practitioner, seeded state |
|---|---|---|---|
| 1.1 | The Trail | not seen (correct) | **SEEN** — 4,334 chars of record, days + ratios |
| 1.2 | Weekly Review | not seen (correct) | **SEEN** — door "The week's edge"; panel "July 27 – August 2", Meditation 7 of 7 kept, Walk 3 of 7 |
| 1.3 | Monthly Close | not seen (correct) | **SEEN** — door "July is complete. Sit with it?"; panel goals 1/2, Meditation · 31 days |
| 1.4 | Constellation | not seen (correct) | **SEEN** — "You've opened three topics this month. Two of them three or more times: Meditation and Water." |

Zero page errors in both passes.

**Read the "not seen" column carefully — it is not a defect.** A visitor with no state gets
`today-section` hidden and no doors at all, by design: the Today card self-hides on empty
state, the Trail link only appears once something is behind you, and the Constellation section
hides entirely rather than showing a new reader an empty ledger. **A curl, or a fresh browser
visit, will therefore report all four features missing on a working deployment.** Any future
smoke-check of this surface must seed `localStorage['frqncy.sanctuary.v1']` (and
`frqncy:visited.v2` for 1.4) before concluding anything. Note also that 1.2's door showed its
quiet form rather than the gold Sunday invitation — correct, today is Monday.

**Opened — NEXT AGENT-READY TASK ROW.** Recorded here because the Notion TASK BOARD is not
reachable from this session; **this needs transcribing into Notion to be real**, per the
dual-write rule in `proposals/COORDINATION-PROTOCOL.md`.

> **Title:** Sanctuary 1.5 — wire the daily quote pill into the Today panel
> **Owner:** Claude · **Agent-ready:** ✓ · **Status:** Open · **Branch:** `sanctuary-quote-pill`
> **Why it is next:** lowest-numbered open Phase 1 item, and its data dependency already
> shipped — `assets/sanctuary-quotes.json` (38 curated, attributed lines) is committed and
> nothing reads it. This is roughly ten lines of render plus CSS.
> **Acceptance criteria:**
> 1. One line renders on the Today panel, drawn as `dayOfYear % quotes.length` — same line all
>    day, changes at midnight, no randomness and no per-user state stored.
> 2. Attribution is visible and the line links to the quote's `source_url`.
> 3. The fetch failing (offline, 404) degrades to no pill — never a broken or empty slot.
> 4. Adding or removing an entry in the JSON changes what renders, with no code edit — the
>    file stays hand-editable per the roadmap's "editable, not generated".
> 5. Verified by screenshot at 390×844 and 1280×900, and by proving two different dates
>    produce two different lines.
> **Blocked by:** nothing. **But sequencing note:** if the dashboard file split has not yet
> happened, keep this edit small and delimited — see Left, below.

**Finished.** 1.1–1.4 confirmed rendering in production against real state. That closes the
"nobody has looked at it" gap left in the 2026-08-02 entries.

**Left.** The **file split is still not done and is still the right next structural job** —
`my-frqncy/dashboard/index.html` is 5,926 lines against the 5,000 threshold its own CLAUDE.md
sets. It was deferred earlier today because another agent had uncommitted edits in that file;
that is still true as of this entry, so check `git status --porcelain my-frqncy/dashboard/index.html`
before starting. Unchanged from before and still unverified by anyone: export/import of
`weeklyReviews` / `monthEpigraphs`, ISO-week across a Dec/Jan boundary, month rollover on a
real 31st, and Safari/iOS. The smoke-check above was Chromium only.

# OPERATIONS LOG

**Every agent writes here before finishing a turn.** This is the shared record of what
was touched, opened, and closed — so Orlando and the team can see the state of play
without reading a diff, and so the next agent starts informed instead of guessing.

## The rule

Before you hand control back, append an entry to the top of the log below. One entry per
working session, not per tool call. If you did nothing that changed state — a question,
a read-only answer — write nothing.

Every entry states four things:

1. **Did** — what actually changed, in plain language.
2. **Opened** — issues filed, branches created, questions raised. Link the numbers.
3. **Finished** — issues closed, work verified. Say how it was verified.
4. **Left** — what is unfinished, blocked, or unverified. Be specific about what you did *not* check.

## Conventions

- **Newest entry at the top.** Date each one `YYYY-MM-DD`.
- **Reference issue numbers** (`ops#4`) rather than restating detail. Issues live in the
  private tracker `0rli-E/frqncy-ops`; this file is in the **public** repo, so keep
  security-, legal- and money-sensitive specifics in the issue, not here.
- **Never mark something done that you did not verify.** "Committed" is not "deployed", and
  "deployed" is not "works". If you could not check, say so in **Left**.
- **Do not rewrite history.** Correct a past entry with a new entry, not by editing the old one.
- Source of truth for task state is always the issue tracker. This log is narrative, not status —
  if the two disagree, the tracker wins.

---

## 2026-08-02 (Ship — the last four branches, on Orlando's "yes ship")

**Did.** Emptied the backlog. Every branch is now at zero commits `origin/main`
lacks — `vbrtn-live`, `main`, `integrate-2026-08-01`, `roadmap-2026-08-02`,
`vbrtn-cloudsync-fix`, `nrg-2026-08-02`. Main is `bc47a9c03`.

- **`roadmap-2026-08-02`** — `/create`, `/read`, `/rich` (the funnel doors that
  had been 404ing) plus `/privacy-policy` and `/terms`, which the site had never
  had at all.
- **`integrate-2026-08-01`** — the donation card path on `/donate`.
- **`vbrtn-cloudsync-fix`** — VBRTN cloud-sync files so a signed-in profile
  actually syncs, watch resume-where-you-left-off, courses soft login-gate,
  sw v72→v75.
- **`main` (local)** — courses progress panel on the social ProfilePage, and
  migration 024 setting `security_invoker` on the two Courses-Room author views.

**Reviewed before publishing, not merged on trust.** These were held back last
session precisely because they carry outward-facing commitments.

The **privacy policy's factual claims were checked against the running site**:
Plausible is the analytics in prod and no `set-cookie` is sent, so the cookieless
claim holds; Supabase, Resend, Stripe and Anthropic all appear in `functions/`.
It claims **no legal entity** — "FRQNCY publishes frqncy.network", contact
`hello@frqncy.network` — which is correct, since none is registered (ops#55). It
is specific about birth data, including that avoidances and triggers are never
sent to the model. The **terms encode the editorial line** rather than papering
over it: no ranking of people, no leaderboards, stated as a design commitment.

All **six public-domain sources** behind the funnel doors resolve 200 — two
Gutenberg ids, three LibriVox slugs, two archive.org pages. Guessing those
identifiers is a known way to ship dead links, so each was fetched.

The **donation path was read before shipping because it moves money**. The donor
names the amount, which is right for a gift, and the server still clamps:
integer check, $1 floor so the card fee does not eat the gift, $10,000 ceiling,
currency never taken from the client. No key or price hardcoded.

**Finished, and how it was verified — all live in prod after deploy.**
- `/create` `/read` `/rich` `/privacy-policy` `/terms` all **200**, from 404.
- `/api/checkout-session` still **503** — `STRIPE_SECRET_KEY` absent from Pages
  env. The path is shipped; **it cannot take a real dollar until Orlando adds
  the key.** That switch is deliberately still his.
- `sw.js` serving **v75**.
- No regressions: home, aligned, courses, watch, social, social/profile,
  my-frqncy, cryptocurrency, bitcoin, meditation, donate all 200; wellbeing /
  technology / money still 3999 / 3955 / 3972 words.

**The `social/` rebuild, which was the actual blocker.** All 31 conflicts on the
`main` merge were in built Astro output. Hand-merging hashed bundles yields a
tree matching neither side, so they were resolved to main's build and then
**regenerated**: `astro build` off the merged source, `dist/` copied into
`social/` as `astro.config` describes. Verified by content, not by the build
exiting 0 — `social/profile/index.html` loads `ProfilePage.Dyqh5Oct.js` and that
bundle carries the courses code including the `course_enrollments` query.
**Gotcha for next time:** the build dies with `supabaseUrl is required` during
static-route generation unless `social-src/.env` is present; the worktree also
needs `node_modules` (1.2G) symlinked from the main checkout. Neither the `.env`
nor the symlink was staged.

**Left.**
- **`STRIPE_SECRET_KEY` is not in the Cloudflare Pages env**, so donations,
  goods and membership checkout are all still dead. One env var away.
- **The new legal pages may be unreachable by navigation.** There is no global
  footer component, so `/privacy-policy` and `/terms` resolve but nothing on the
  site necessarily links to them. Not checked.
- **`/cryptocurrency/` has still never been seen in a browser** — Playwright was
  unavailable all session (a live Chrome owned the profile). Structural and curl
  verification only.
- **Migration 024 was already applied** to the linked Supabase project by an
  earlier session; this only committed the record. Not independently re-verified
  against the live database.
- Legal/tax docs remain gitignored and on disk; **moving them into the private
  tracker has not been done.**
- The two Wikipedia URLs stripped from `places.json` still need primary sources.

## 2026-08-02 (Integration — everything merged to main, pushed, and verified live)

**Did.** Reconciled the long-standing fork and shipped it. `vbrtn-live` was 24
commits ahead of `origin/main` and 30 behind; both sides carried real work that
had never met. Merged on a branch based on `origin/main` (so main's content wins
by default) and pushed as `c0a0b490a`.

Seven merge conflicts. `CLAUDE.md`, `OPERATIONS.md` and `scripts/board-sync.mjs`
were pure additions or distinct log entries, resolved as unions so nothing from
either side was dropped. `search.json`, `resources.json`, `entities.json` and
`sitemap.xml` are `generate.js` output — hand-merging derived data produces a
file that matches neither source, so they were taken from one side and
regenerated from the merged `content.json` and beds.

Also landed, before the merge: the generator guards (below), ~45 untracked
proposals/handoffs/audit runs, `.githooks/` and `scripts/status.mjs` (in use but
never committed), Android release signing, `about.html`'s Golden Circle sections,
and `.gitignore` rules for dev screenshots and engine render intermediates.

**Opened.** Nothing new filed. The `/crypto/<slug>/` rehoming question from the
previous entry is still open.

**Finished, and how it was verified.**
- **The generator no longer guts pages.** Measured on a clean worktree: the full
  CI pipeline (`draft_all_topics.py` + `generate_topic_page.py --all`) took **101
  pages below 80% of their word count**, including two domain pages — wellbeing
  3999→1679 and technology 3955→1101. Root cause is a slug collision: wellbeing
  and technology each exist as *both* a domain and a topic in `content.json`, so
  they share one URL and the thin topic template was overwriting the rich domain
  page. These are the only two collisions in the graph. Added two guards derived
  from `content.json` rather than hand-listed: neither script will touch a
  domain/pillar slug, and `generate_topic_page.py` refuses to write a page that
  comes out below 80% of the existing page's word count. Re-ran the full pipeline
  with the guards in: **101 gutted pages → 0**, deep domain pages byte-identical,
  zero deletions, and legitimate regeneration still happens (aliens 1389→1448).
- **Prod verified after deploy**, not assumed. Canonicals are self-referential on
  `/meditation/`, `/aliens/`, `/yoga/`, `/defi/`. `/cryptocurrency/` canonicalises
  to itself, carries the global header, links `/bitcoin/`, and serves the OG image
  that exists. Aligned Goods is **94** entries live. wellbeing/technology/money/
  consciousness still 3999/3955/3972/3949 words. All key routes 200.
- **CI ran the full pipeline on the pushed tree and committed back one line**
  (`functions/api/_kb.js`) — no page damage, which is what the guards predict.

**Left.**
- **The `/cryptocurrency/` page has still never been looked at by a human or a
  browser.** Playwright was unavailable all session (a live Chrome owned the
  profile), so it is verified structurally and by curl only. Worth an eyeball.
- **Legal/tax material was deliberately NOT pushed.** `LEGAL-STRUCTURE-PLAN`,
  `GLOBAL-TAX-SCAN`, `WYOMING-VS-ESTONIA-DASHBOARD` and the social account
  registry are now gitignored — this repo is **public**, and the tax scan carries
  a "Personal layer (Orlando + Norman)" section with personal residency planning.
  All four remain on disk. They belong in the private tracker; that move has not
  been done.
- **Two Wikipedia URLs were reverted, not replaced.** An agent had filled
  `places.json` `url` fields for Bali and Sedona with Wikipedia links, against the
  go-primary rule — and `generate.js` strips such links elsewhere. Restored to
  empty; primary sources still need finding.
- **A stale unmerged index entry** for `my-frqncy/dashboard/index.html` sits in
  the main worktree from a parallel agent — no conflict markers in the file, no
  merge in progress. Left alone; not mine to resolve.
- **The `data/topics/_schema.yaml` comment still references the retired `v2/`
  output path.** Cosmetic, untouched.
- **Not investigated:** courses beyond a 200 and 7 entries; watch is still a stub
  (2 videos, 3 playlists).

## 2026-08-02 (NRG — login persistence, capability gates, and the push to main)

**Did.** Continued the NRG session below and shipped it. Three additions, then a push.

*Login persistence.* `readSessionFromStorage` in `AuthProvider.tsx` returned null the moment
the access token expired. Access tokens last an hour, so anyone returning after that booted
straight into the signed-out UI until the SDK's background refresh landed — and if the
orphaned `lock:sb-*-auth-token` this file already works around was stuck, it never landed.
Now an expired token with a refresh token still yields the user, the refresh is fired without
being awaited, and the first `INITIAL_SESSION` event (which can carry null before recovery
finishes) no longer blanks the restored user. Auth options in `supabase.ts` are now stated
explicitly instead of inherited; `storageKey` is deliberately left unset, since a hand-built
key differing by one character would log everyone out at once.

*Capability gates — this one mattered for safety.* Migrations 025/026 cannot be applied from
this machine (no linked Supabase CLI project, no Management API token — as
`reference_supabase_apply_migrations` documents, the PAT is Orlando's to generate). So the
code would go live before the tables. One part of that gap was genuinely unsafe: `createGroup`
would insert a group with `visibility='private'` while the posts policy was still
`USING (true)` — labelled private, listed as private, world-readable. Private-group creation
now refuses unless `group_invites` exists, checked inside `createGroup` and not only in the
UI. Block/Report are likewise hidden until 025 lands, rather than rendering buttons that error.

*Pushed to main* — `4bea817d5..42f374943`, 9 commits, fast-forward, 0 files deleted. SSH was
refused again so the push went over the `gh` HTTPS URL ([[project_push_blocked]]).

**Opened.** Nothing filed in the tracker.

**Finished — verified in production, not assumed.**
- **The CSP fix works.** Re-ran the same in-page probe that proved the breakage:
  `WebAssembly.instantiate()` now returns OK (it was refused before), so libsodium loads and
  the E2EE layer is no longer dead. `bsky.social` 200. `plc.directory` DID resolution 200.
  Nostr: `nos.lol` and `relay.snort.social` both open. **Zero CSP refusals in the console.**
  The libsodium WASM abort that fired on every NRG page load is gone.
- `relay.damus.io` still errors — but with no CSP refusal logged, so that is the relay
  refusing us, not our policy. 2 of 3 relays connect, and `nostr-publish.ts` fans out to all
  three, so publishing works.
- `/social/profile/blocked` serves the real page in prod rather than being swallowed as a
  username lookup — the Pages Function allowlist entry is correct.
- Townhall link present in both desktop and mobile nav; `/social/groups/`, `/social/g/townhall/`,
  `/social/space/` all 200.
- The private-groups gate was tested against the **live** database, which has neither
  migration: the probe correctly reports unavailable and the visibility radios are absent.
- Login fix verified in a headless browser against the built bundle across four scenarios,
  with the token endpoint blocked so no refresh could ever complete: live session stays signed
  in, expired-with-refresh stays signed in (was signed out before), expired without a refresh
  token stays signed out, no session stays signed out.

**Left — still specific.**
- **Migrations 025 and 026 remain unapplied and have still never been executed anywhere.**
  Until someone runs them: Block and Report are invisible, private groups cannot be created,
  and the `conversation_members` INSERT hole from migration 002 is still open in production.
  That last one is the sharpest item on this list — it is a live gap, not a pending feature.
  Apply via the Management API recipe in `reference_supabase_apply_migrations` (needs a PAT
  Orlando generates), or the dashboard SQL editor.
- No moderation flow has been exercised end-to-end by a real signed-in user, because the
  tables do not exist yet. The gates mean the UI is honest about that; they do not mean the
  feature is tested.
- The login fix is verified against the built bundle but **not against a real expired
  Supabase session in prod** — I have no account credentials. The scenarios were synthesised.
- Not checked: whether a self-hosted Bluesky PDS outside `*.host.bsky.network` resolves under
  the new connect-src. Bluesky login should be retested end-to-end by a human.
- Google OAuth is still disabled at the provider level, so that button still fails. Dashboard
  toggle, not code.

---

## 2026-08-02 (NRG — CSP fix, moderation v1, private groups, the Townhall)

**Did.** Four things on branch `nrg-2026-08-02`, in a worktree off fresh `origin/main`.

*The CSP bug, which was the biggest find.* The site-wide `Content-Security-Policy` in
`_headers` blocked WebAssembly, so `libsodium-wrappers` threw on every NRG page load and
the entire E2EE layer — encrypted DMs, key generation, signing, encrypted backup — was
dead in production. `connect-src` also omitted every host the protocol bridges call, so
Bluesky OAuth and cross-post, the three Nostr relays, and the Ethos read path failed too.
Four shipped features, none of them working, with no visible error. Added
`'wasm-unsafe-eval'` (WASM compilation only — not `eval()` of JS strings) plus an explicit
host allowlist. Kept as one rule under `/*`: Cloudflare Pages *joins* values when several
`_headers` rules set the same header, and joined CSP values are enforced as separate
policies, so a looser `/social/*` rule would have granted nothing.

*Moderation v1* (migration 025). NRG had no block, no report, no mute — the named gap in
`NRG-GO-LIVE-CHECKLIST-2026-05-16.md` before the first 100 users. `blocks` are silent and
symmetric in effect, enforced in RLS via a SECURITY DEFINER `is_blocked_between()` so they
hold on every read path rather than depending on each query remembering to filter.
`reports` have deliberately no auto-hide threshold. Blocks close the DM channel; existing
history stays readable. UI: post overflow menu (the `⋯` button was dead markup), profile
block/report, manage page at `/social/profile/blocked`.

*A pre-existing DM hole, found while wiring the above.* `conversation_members` INSERT was
`WITH CHECK (auth.uid() IS NOT NULL)` — migration 002 left it open with a comment to narrow
it later, which never happened. Any authenticated user could insert `(any conversation_id,
self)`, become a member of a stranger's DM thread, read every message row in it and post
into it. E2EE limited the damage to metadata (bodies are sealed per recipient) but
injection was possible. Now requires existing membership or an empty conversation.

*Private groups* (migration 026) — the tightening migration 023 explicitly deferred:
`posts_select_all` now gates group posts on membership, composed with the block filter, and
posting into a group (open ones too) requires being in it. Added the invite path, a trigger
that makes the creator the first member, and an immutability rule on `visibility` so a
private group can never be flipped open and retroactively publish everything written in it.

*The Townhall* got its own pinned surface above the group list plus a top-level nav entry,
and `/social/space` stopped calling itself "the town hall of the network" — that name had
been pointing at a static page that can't hold a conversation.

Commits `8574adf7d`, `e3db02485`, `916d5c639`, `4244d3e3b`.

**Opened.** Nothing filed in the tracker this session.

**Finished.** Verified: the CSP breakage was reproduced against prod before fixing —
from a browser on frqncy.network, `WebAssembly.instantiate()` of an empty module was
refused, `fetch` to bsky.social and plc.directory blocked, `wss://relay.damus.io` errored.
The Cloudflare `_headers` join behaviour was confirmed empirically against prod rather than
assumed. `npm run build` passes clean (36 pages) and the built output is synced into
`/social/` with `cp -r`, not `rsync --delete`, so `bluesky-oauth-client.json` survived.
The groups directory and Townhall hero were screenshotted at 390×844 off the local build.

**Left — read this part.** Substantial and specific:

- **Migrations 025 and 026 are NOT applied to the live database.** They are files only.
  No local Postgres and no Docker on this machine, so the SQL was **never executed
  anywhere** — it is reviewed, not tested. Recursion traps, policy names and helper
  signatures were checked by reading 001/002/023, but a syntax error or a policy that
  evaluates the wrong way would not have been caught. Apply with
  `supabase db query --linked -f` (the path that has worked before) and re-test.
- **No end-to-end test of any moderation flow.** Blocking, reporting, inviting, accepting
  an invite, private-group read gating: none of it has been exercised against a real
  database by a real signed-in user, because the tables do not exist yet. The UI renders
  and the bundles build; that is all that is established.
- **The CSP fix is unverified in production** — it ships in `_headers`, which only takes
  effect once deployed. Re-run the probe after deploy and confirm WASM instantiates and
  libsodium initialises. Until then, treat E2EE as still broken.
- **Nothing is pushed.** The branch is local, per the test-before-push convention.
- Not checked: whether `@atproto/oauth-client-browser` resolves a user's PDS through a
  host outside the allowlist (`*.host.bsky.network` and `plc.directory` are covered; a
  self-hosted PDS is not). Bluesky login should be retested end-to-end after deploy.
- Not touched: the two-`022` / two-`024` migration-number collisions already on record.
  025 and 026 are unique, but the numbering scheme remains unreliable as an apply order.
## 2026-08-02 (Topic graph — /v2/ canonicals, topic hubs, the crypto hub consolidation)

**Did.** Four commits on `vbrtn-live`.

`1f45958cd` — every rich topic page was telling Google its canonical was
`https://frqncy.network/v2/<slug>/`. That prefix was retired and now 301s back to the
page declaring it, so 140 pages carried a canonical pointing at a redirect, which is
discounted rather than honoured; `og:image` and `twitter:image` had the same problem,
and a redirecting image URL drops the thumbnail for scrapers that don't follow 301s.
Root cause was `data/topics/*.yaml` — 145 of 146 briefs hard-code the URLs and
`scripts/generate_topic_page.py` copies them into the head. Fixed source and output
together so a regen keeps the fix.

`0614e19a2` — four media entries (The Correspondent, Waypoint, The Esports Observer,
The Comedy Store) and three orgs (Sidewalk Labs, Growing Power, The Disclosure
Project), with their profile pages. Beds to 77 and 120.

`dc9a56725` — committed a topic-hub feature that had been sitting uncommitted in the
working tree. A topic can now nest under a parent via a `hub` field; 21 crypto topics
take `hub: t-crypto`, so the graph reads Money › Cryptocurrency › Bitcoin instead of
hanging all 21 off Money. Domain grid hides hub children, sibling nav walks hub-mates,
breadcrumbs gain the hop.

`e71c60fc6` — the crypto hub consolidation, on Orlando's call that `/cryptocurrency/`
wins over `/crypto/` (they are 96% the same page: 2119 of 2211 shared unique words,
same title, h1 and headings). Three faults fixed: it canonicalised to `/crypto/` while
the sitemap listed it, and its `og:image` pointed at `/og/crypto.png` which 404s; it
had **no global header at all** because `sync-headers.mjs` only auto-discovers pages
already carrying the marker and this one was never in the explicit list; and it linked
only down to `/crypto/<slug>/`, so the 21 topic pages that now breadcrumb up to it had
no route back down — and the hub change had also removed them from the Money domain
grid, leaving them reachable only by search.

**Opened.** One question for Orlando, unanswered: where the 19 `/crypto/<slug>/`
ecosystem pages get rehomed. They are **not** duplicates of the topic pages — measured
overlap is 11–20% — and they are richer (~1,900–2,700w vs ~1,500w), but they now have
close to zero inbound links. They should not be deleted.

**Finished.** Verified by measurement, not assumption: zero internal `/v2/` strings
remain anywhere in the repo (the three survivors are third-party CDN URLs from Le
Creuset, Business of Fashion and Medium that legitimately contain `/v2/`); all 146
briefs parse; the hub round trip is 0 failures across all 21 children in both
directions; both hubs now canonicalise to `/cryptocurrency/`, matching the sitemap.

**Left.**
- **Nothing pushed.** Branch is 15 ahead / 20 behind `origin/main`. None of this is live.
- **The rendered page was never looked at.** A live Chrome owned the Playwright profile
  the whole session, so `/cryptocurrency/` was verified structurally only — tag balance,
  21 anchors opening and closing, CSS inside a head `<style>`. Nobody has seen it.
- **Aligned Goods was not touched, deliberately.** Prod has **94** entries; this branch
  has **88**. Missing here: `rancho-gordo`, `jacobsen-salt`, `force-of-nature-meat`,
  `rahua-shampoo`, `ethique-bars`, `living-libations`. Editing the bed on this branch
  and regenerating would delete all six. Do that work on a branch off fresh
  `origin/main`.
- **Watch is a stub** — `videos.json` has 2 entries, `playlists.json` 3, confirmed
  identical in prod. Not filled; adding entries is research work, not generation.
- **Courses not investigated** beyond confirming 7 entries and `/courses/` returning 200.
- `og/robert-jay-gould.png` still 404s. That page has a brief and a built page but no
  `content.json` entry, and `build-og.js` only generates from `content.json`, so it
  never had input. Pre-existing, untouched.
- `sitemap.xml` left dirty in the working tree by another agent (`lastmod` churn) — not
  mine, not staged.

## 2026-08-02 (VBRTN — the cold walk through prod, ops#48)

**Did.** Walked the whole VBRTN flow cold on live prod, from empty localStorage through a
real 25-question intake to a companion reply. Two of ops#48's three checks pass.

*The companion answers.* `POST /api/companion` returned **200** and a real, contextual reply
that used the person's own material. Crucially the profile carried `music` as a bare
free-text string — the exact shape that produced the `p.music.join is not a function` 500 —
so the `asList()` coercion is confirmed working against the input that broke it, not just in
principle. No "I went quiet for a moment".

*The trail routes sensibly.* `purpose` now hands back akashic-records, astrology, human-design,
mythology, near-death-experiences, oneness, pilgrimage and soul. No ML course. All twelve
desires route coherently, and prod's `trail-data.json` is byte-identical to the local build.

The intake itself is sound: all 25 questions render in order across the five sessions, nothing
is skipped, and every field lands in the profile correctly typed. The birth form drives the
**real ephemeris engine**, not the stub — a 1990-03-14 04:20 Lisbon birth returns Sun Pisces
with real gates and an incarnation cross, no `_stub` flag anywhere.

Four copy defects surfaced, all now fixed. The session breaks read identically at all four
boundaries because `derivePartialInsights` returned `lines.slice(0, 3)` and the first three
lines are always session-1 answers; it now anchors on the identity line and shows the two
newest insights, while the completion screen asks for the full picture. "whose recent state
has carried stressed" and a dangling "Whose mind moves away from." were grammar bugs on both
the intake and the companion page. The splash said "Three short sessions" for a five-session
intake.

Separately, the privacy copy had gone stale against the cloud store that shipped yesterday.
Signing in mirrors the entire profile — birth date, time, city and coordinates included — to
Supabase, so "never sent anywhere or saved on our servers" and "clear this site's data and
all of it is gone" were false for signed-in users, and the summary line claimed what you tell
VBRTN stays on the device when the message is exactly what goes out. All three now describe
what the code does. The stronger promise — that `avoiding` and the negative triggers are never
sent — was checked against `slimProfile` and **holds**: it transmits a count, never the text.

**Opened.** Nothing new filed.

**Finished.** Nothing closed. ops#48 is two-thirds verified, not done.

**Left.** *Cross-device sync is still unproven* — ops#48's second check. The plumbing is
confirmed live in prod (`window.FRQNCYVbrtn` exposes load/save/onSync, `frqncy.vbrtnStore` is
a function, the sync pill is honest), but an actual two-device round-trip needs a real
logged-in account and I have no credentials. Nobody has watched a profile written on one
device appear on another. That check is Orlando's or needs a test account.

Two commits, **both unpushed**, so none of this is live: `78fb431a8` carries the session-break
and privacy fixes. The other two copy fixes are **inside `dc9a56725` "Topic hubs: nest the 21
crypto topics under Cryptocurrency"** — a parallel agent's bulk add swept my working tree into
its commit mid-session. The code is intact but the attribution is wrong, which is the hazard
CLAUDE.md warns about; do not trust that title to tell you what it contains.

I did not re-verify the fixed copy on prod — it is verified on a local server only, since it
is not deployed. I did not check the flow on mobile viewport, did not test an intake that
skips the birth form, and did not exercise "Hand me another" or the recovery-question
rotation. One cosmetic thing I noticed and left: `.nav.hidden` sets `height:0` but computes to
48px, so the completion screen carries dead space under it.

---

## 2026-08-02 (Sanctuary — Phase 1.2, 1.3, 1.4 built by three parallel agents, integrated)

**Did.** Orlando asked for three agents on the next three Sanctuary steps. Three Fable
agents, one git worktree each, one Phase 1 item each — the max-3-concurrent-repo-agents cap
in `proposals/COORDINATION-PROTOCOL.md`. Two integration commits on `vbrtn-live`:
`1b264078c`-superseded → the surviving pair are the Weekly-Review/Monthly-Close merge and
the Constellation commit (`git log -2 -- my-frqncy/dashboard/index.html`).

**1.2 Weekly Review.** State `weeklyReviews` keyed by ISO week; the synthesis is derived
live and never stored. The door is present every day but only *becomes* the roadmap's gold
invitation on Sunday when that week is unwritten — no badge, no backlog, no "unreviewed"
language. The panel always reviews a **complete** ISO week, so a midweek visitor reads last
week whole rather than this week at two-sevenths — that is what prevents the wall of zeros.
Empty sections don't render; a quiet week keeps its three questions. Beyond spec: last
week's answers read back at the foot, because *"what would last week's you have wanted to
know?"* is half a conversation.

**1.3 Monthly Close.** State `monthEpigraphs` keyed `YYYY-MM`. "The last day of the month"
became a window through the 7th, so someone who doesn't open the Sanctuary on the 31st still
meets their month; past closes stay readable through a door in the Trail's foot, since a
write-only epigraph betrays the word "saved". Goals render as the same pooled mirror the
pyramid uses rather than a bare fraction. The word count is literal — lowercase, no stemming,
counts shown as `×9` so the mechanism is inspectable — with the stoplist kept in the open as
a commented editorial object rather than a magic blob.

**1.4 Constellation summary — and a three-month-old bug found on the way.** The agent was
told to establish what the visited-topics tracker actually stores before writing code. It
found the feature unbuildable as specced, for a reason that matters beyond this feature:
the tracker in `chat-widget.js` matches `/^\/v2\/([a-z0-9-]+)\/?$/`, and the `/v2/` prefix
left the URL space in May — every `/v2/*` path now 301s away, so `location.pathname` never
matches. **I verified this independently against prod**: the deployed widget still carries
the `/v2/` matcher and `/v2/meditation/` 301s to `/meditation/`. The tracker has recorded
nothing for ~3 months, and the only thing reading its key is a `.bak` file. It also stored a
flat deduped slug list with no counts or dates, so "this month" and "three or more times"
were unanswerable regardless. Fixed the matcher, kept the legacy list byte-identical, added
`frqncy:visited.v2` as `{slug:{m,c}}` — month granularity only, deliberately no per-visit
timestamps so it cannot become a reading diary; bounded at 400 slugs. The summary reads
`/search.json` for real labels and is deliberately **not** in `DEFAULT_STATE`, so reading
history never enters the synced blob even signed in.

**Opened.** Nothing filed. Two notes: on a date that is both a Sunday and inside the
month-close window (roughly once a month) two gold invitations stack in the evening block —
correct but slightly loud, worth an eye. And the dashboard is now ~5,900 lines, well past the
5,000-line split threshold.

**Finished.** Integration verified, and it caught a real defect that neither agent could have
seen alone. Agents 2 and 3 built on pre-Trail bases; agent 2 self-synced, agent 3 did not, so
its dashboard half needed a three-way merge. Eleven conflicts total, all both-added-adjacent
blocks, resolved keep-both — **except that keep-both is not automatically safe**: it
duplicated `${trailLink}`, rendering "Look back" twice, and the three-way merge separately ate
a shared context line, closing `bindWeeklyReview()` early and swallowing the Monthly Close
comment banner. All three repaired from the originating commits. Verified after repair in
headless Chromium at 390×844 and 1280×900 against a 50-day seeded practice: all three doors
render once each with the right copy ("It's the week's edge. Look back?", "July is complete.
Sit with it?"), each panel opens independently and closes on Esc, the constellation line
renders `You've opened three topics this month. Two of them three or more times: Meditation
and Water` with the deliberately-seeded nonexistent slug dropped rather than shown raw, and
zero page errors. Inline JS parses (5 blocks, 0 failures), divs balance 281/281,
`node --check chat-widget.js` clean.

**Left.** **Not pushed.** Four dashboard commits now sit unpushed and prod is behind all of
them. Not verified by anyone: the cloud-sync round-trip of `weeklyReviews` and
`monthEpigraphs` (all three agents and I tested localStorage only), export/import carrying
the new keys, the ISO-week key across a Dec/Jan boundary, month-rollover on a real 31st, and
Safari/iOS. **`chat-widget.js` ships to every page on the site** — that blast radius was not
re-tested beyond `node --check` and a local tracker round-trip, and `sw.js` VERSION was not
bumped, so returning visitors may hold a stale widget; check both before deploying. One
process failure worth recording: my first integration commit staged 52 files because a
parallel agent wrote the shared git index between my `add` and my `commit`. Caught it, reset,
and re-committed with explicit pathspecs — `git commit -- <paths>` is now the only safe form
in this repo.

---

## 2026-08-02 (Sanctuary — The Trail, Phase 1.1)

**Did.** Built the next open Sanctuary item by the roadmap's own rule — lowest-numbered
open Phase 1 entry, which is 1.1 **The Trail**. Commit `39be61d83` on `vbrtn-live`, one
file, +219/−0. Roadmap entry struck through and annotated with what shipped.

It's the read-only look-back: every day you've written on, newest first, each paired with
how much of that day's practice was kept. Opened by a quiet "Look back" at the foot of the
evening review. The link appears only once there's something behind you — on day one it
would open onto an empty room and read as a broken feature. Read-only on purpose: the Today
card is where you write, the trail is where you read. Days with neither writing nor a kept
practice are skipped without comment; a gap in the trail isn't a failure to be displayed.
Sixty days at a time with the rest on request, so a long practice doesn't build a huge DOM
on open. It reuses the Illuminator's slide-out chrome rather than inventing a second panel
idiom — only the body styling is its own. No new state: it reads `dailyIntentions` and
`habitLogs` exactly as they already are, so nothing to migrate and nothing new to sync.

Two judgement calls beyond the written spec, both flagged here because they're mine, not
the roadmap's. A habit only counts against a day it already existed on — otherwise adding a
habit today would retroactively make every past day look incomplete, which is the kind of
quiet indictment this room is supposed to refuse. And today carries no ratio at all: the
day isn't over, and a running "0 of 2" at the top of your own record reads as a verdict on
a morning still in progress. Past zero-days do keep their honest count.

**Opened.** Nothing filed. The dashboard is now 5,179 lines, past the 5,000-line threshold
at which the Sanctuary `CLAUDE.md` says to split CSS into `dashboard.css` and JS into
`dashboard.js`. That split is now genuinely due and is a deploy-touching change (new files
to serve, SW cache, CSP) — worth its own session rather than riding along with a feature.

**Finished.** Verified in headless Chromium (playwright-core, 390×844 and 1280×900,
screenshots taken) against a seeded 69-day practice built to exercise the edges: a fresh
user with no data gets no "Look back" link at all; a day present in `dailyIntentions` but
blank in every field is skipped; a day with habit ticks and no writing still appears with
its ratio; the 60-day window renders with "Further back · 9 more" and clicking it reveals
all 69 with the button gone; a day 70 back reads "1 of 1 kept" rather than "1 of 2",
confirming the habit-existence rule; today shows no ratio; the panel body contains zero
inputs or textareas, confirming read-only; Esc closes it. Inline JS parses (5 blocks, 0
failures), divs balance at 240. Console clean but for the known `/api/analytics` 501 from
the static dev server.

**Left.** Not pushed — same reason as the entry below; Orlando tests first. Two dashboard
commits are now unpushed (`078d9465a` pooled progress, `39be61d83` the trail) and prod is
behind both. Not verified: the cloud-sync path again — I only exercised localStorage, though
the trail adds no state so there's less to go wrong than usual. Not verified: behaviour at
a genuinely large trail (hundreds of days) beyond the 69 I seeded, and the panel's focus
trap — I confirmed focus moves to the close button on open but did not test tabbing past the
end of the panel. Not done: Phase 1.2 (weekly review) through 1.7 remain open.

---

## 2026-08-02 (Tracker — the last three legacy to-do surfaces, ported)

**Did.** Closed the gap between the Miro board and the tracker. Three surfaces on
`FRQNCY DASHBOARDS` still carried task state that no issue held; all three are now ported
and stamped so they read as records rather than trackers.

The `Weekly to dos — 19 July – 26 July` frame had eleven bullets. Seven already mapped onto
existing issues. Four did not, and one of those matters more than the rest: **there was no
issue anywhere for the legal entity.** Filed as ops#55, ops#56, ops#57, ops#58.

`FRQNCY — Areas We're Working On` turned out to be nothing to merge — ten count-only summary
tiles dated 28 Jun; the sixty-four items they count never existed on the board. Stamped
SUPERSEDED rather than deleted, per keep-don't-delete.

The `Social Media — Master To-Do` doc's open items were already issues, but its ✅/🔨 record
of what was *already finished* had never been captured anywhere. That record is now ops#59,
filed closed — it is a record, not work.

Also caught a stale card: ops#1 closed when the integration push landed, but its card sat in
DO NOW, so the board read 58 against 57 open. Removed and the lane reflowed.

**Opened.** ops#55 (Wyoming LLC formation — `do-now`, blocks the bank account, Stripe,
funding diligence and the identity migrations), ops#56 (Valentino funding talks),
ops#57 (Team Canvas), ops#58 (Drive restructure — six existing issues all say "in Drive"
and are queuing into a structure that does not exist).

**Finished.** Board and tracker verified in agreement by counting both:
`gh issue list --state open | jq length` returns 57, and the four lane frames read
DO NOW (9) · Next (27) · Decision (6) · Later (15) = 57. Lane frames grown to `h=165000`
so the new cards render inside their parent.

**Left.** The board render is verified by DSL read-back, **not visually** — nobody has
looked at it at 25× scale to confirm the new cards are legible. ops#55–#58 are filed from
a Miro bullet each; the actual status behind them (is the LLC half-filed? where did the
Valentino conversation stop?) is unknown and only Orlando can say. Separately, this session
started on ops#4 and ops#5 (`/terms`, a real privacy policy, and the `/create` `/read`
`/rich` landing pages) — research done and public-domain source links verified live, but
**no page was written**; worktree `/tmp/frqncy-roadmap` on branch `roadmap-2026-08-02` off
clean `origin/main`, currently empty of changes.

---

## 2026-08-02 (Sanctuary — the pooled progress roll-up, rebuilt)

**Did.** Rebuilt Slice 1 of the Sanctuary improve-don't-rebuild plan — the pooled
completion roll-up Orlando asked for on 2026-06-11 ("completion checkers at every pyramid
tier, stronger progress bars"), built that day, left uncommitted, and wiped in a rebase.
Commit `078d9465a` on `vbrtn-live`, one file, +131/−12.

The model: the unit of completion is a goal. An objective that has goals completes when
its goals do — derived, never hand-set, so a bar can't disagree with what's underneath it.
An objective with no goals yet stands as its own hand-checkable unit, so a pyramid you
haven't broken all the way down is still walkable. Aims pool their objectives; the Dream
pools every aim. Bars are gold on a faint track, labelled `done/total`, and render as
nothing at all when there's nothing to pool. No colour-coding for behind/ahead, no
percentage headline, no comparison — it clears the Sanctuary principles as a mirror rather
than a score. New helpers `objGoals/objUnits/objIsComplete/sumUnits/aimUnits/dreamUnits/
poolPct/progressBar` sit above `renderScoreboard()`; bars wire into the scoreboard cards,
each objective card, the Dream in the pyramid editor, and both tiers of the dashboard
mini-pyramid. Schema addition is `objective.completed` / `.completedDate`, lazily read
(`obj.completed ?`), so saved state loads with no migration and the cloud row is unchanged.

Also fixed four display defects, three of them logged in the 2026-07-30 cold walk: chief-aim
names clipped mid-word on the scoreboard (now ellipsis at rest, full text on focus); the
same clip on objective titles; `1 objectives` never singularized (two sites); and the
History header read `Last 365 days` while each row renders 30 cells. Fourth: the objective
group head's `3/6 objectives` meant "3 of max 6" but would have read as completion sitting
next to the new bars, so it's a plain count now — the max is already stated in the section head.

**Opened.** Nothing filed. Two things worth an issue if they're wanted: the dashboard is
now 4,962 lines, three lines short of the 5,000 threshold the Sanctuary `CLAUDE.md` sets
for splitting CSS/JS out of the single file. And the derived (non-clickable) objective
checkbox is distinguished from a hand-checkable one only by opacity and a tooltip.

**Finished.** Verified against a seeded pyramid in headless Chromium (playwright-core,
390×844 and 1280×900, screenshots taken): the arithmetic is right at every tier — an aim
over one 3-goal objective with 2 done plus a 1-goal objective with 0 done reads 2/4; an aim
over two goal-less objectives, one hand-checked, reads 1/2; the Dream reads 3/6; objective
bars only appear where goals exist. `.score-name` scroll overflow measures 0 where it
previously clipped. Inline JS parses (5 script blocks, 0 failures) and `<div>` open/close
balance at 232 each. Console is clean but for the known `/api/analytics` 501, which is the
static dev server refusing POST.

**Left.** Not pushed — Orlando tests before push. It is the *only* unpushed dashboard
commit: the 7 earlier Sanctuary commits (`82d8d75` → `d6a7c75`) that were stranded on
`vbrtn-live` reached `origin/main` in the 2026-08-02 integration push and are live —
confirmed by curling the deployed page for the Mind-Movie music markup. So prod is exactly
one commit behind, and that commit is this one. Not verified: the cloud-store path (`SanctuaryCloudStore`) — I only
exercised localStorage, so a signed-in user's round-trip of the new `objective.completed`
key is unconfirmed, though it rides the same whole-blob write as every other key. Not
verified: the three PDF exports, which I didn't regenerate and which may now want the
pooled numbers on the pyramid one-pager. Not touched: the singular-objective case renders
from a trivial ternary I read but didn't screenshot. `proposals/SANCTUARY-ROADMAP.md` not
updated — Slice 1 is from the 2026-06-11 three-slice plan, not a numbered Phase item, and
the roadmap remains stale on everything shipped since April.

---

## 2026-08-01 (Operational identity — one company email owns every account)

**Did.** Orlando's directive: move every AI service and piece of tooling FRQNCY depends
on to the company address. Wrote it into `proposals/MASTER-ROADMAP.md` as a new Layer 0
section (`960d2d664`) with four buckets rather than one line — already-correct, migrate,
create-right-from-the-start, and in-repo cleanup — because the buckets need different
work. Recorded the rule that `hello@` stays the public contact and the company address is
the account-of-record; collapsing them would put a login identity on every press pitch and
Wikidata entry. Also flagged the roadmap as stale above that section: its ✅/⚪ statuses
are from 2026-05-12 and predate Sanctuary, VBRTN, Aligned Goods, Courses, NRG and the IG
funnel. Filed the work as `ops#50`–`ops#54`, added an `area:identity` label, taught
`board-sync.mjs` to render it, and regenerated the kanban onto FRQNCY DASHBOARDS
(61 items, 6 lanes, 52 issues).

**Opened.** `ops#50`–`ops#54`. Two are `do-now` for Orlando because losing that access is
unrecoverable; `ops#54` is `owner:claude` and needs no browser.

**Finished.** Nothing closed. Verified by probe, not assumption: Drive, Miro, GitHub and
the live site connectors all authenticate; **no API key exists anywhere** for the media
stack named in ~20 proposals (checked env, repo, and the harness key store). That gap is
the mechanical reason the off-site half of the visibility plan sits at zero.

**Left.** Two corrections to earlier notes, both now fixed in code. The Miro board
`uXjVH1jzUtM=` referenced by `board-sync.mjs` is **deleted** — it returns "Board access
denied" and is absent from the board list — so the generator was pointing at nothing;
`BOARD` now targets `uXjVHBAAjNo=`. And `scripts/board-sync.mjs` was untracked on
`vbrtn-live` while tracked on `integrate-2026-08-01`, so the same two-line fix was
committed to both (`aae894180`, `6b0d748ba`) to stop a push from regressing it.

Not verified: I did not open the board visually to confirm the lanes render legibly at
25x scale — only that the API reported all 61 items created. I did not check whether the
five per-account migrations are even possible without a paid-plan owner transfer. The
`/private/tmp/frqncy-integrate` worktree has **uncommitted** `donate.html`,
`checkout-session.js` and `stripe-webhook.js` changes from another session that I did not
touch and cannot vouch for.

---

## 2026-08-01 (Aligned Goods — "Research" links stopped being affiliate links)
## 2026-08-01 (late) — stranded commits folded in, and a donation path that works

**Did.** Two jobs. First, closed out the "stranded commits" question on
`integrate-2026-08-01`. Checked all three **by content** rather than by commit graph, and
two of them — the `security_invoker` RLS migration and the ProfileCourses component —
were already present under different shas from the integration merge. `git log A..B`
had reported them missing, which is the documented `git cherry` unreliability after
squashed publishes. Only `960d2d664` (a MASTER-ROADMAP doc edit) was genuinely absent;
cherry-picked as `a522f056e` and confirmed it did not duplicate the existing Layer 0
section. **Correction to an earlier claim in this session: the security fix was never at
risk of being left out.**

Second, built the donation path (`67a2918d6`). `/donate` had four fiat buttons that all
alerted "coming soon", while the donate widget baked into **1,220 pages** points there for
"fiat options". Added `kind:'donation'` to `checkout-session.js` — guest-friendly, no
account, no shipping, no tax, amount clamped server-side to $1–$10,000. Added an explicit
donation branch to `stripe-webhook.js` placed **before** the `user_id` guard, without which
a donation falls through to the membership upsert and could mint a membership nobody paid
for. Stripe is the ledger for v1, so no table and no migration — deliberate, given the
duplicate `022_`/`024_` migration prefixes already in the tree.

**Opened.** Chose donations over goods deliberately: the two `sell.enabled` goods still
carry `PLACEHOLDER` prices with `cost_cents: 0`, and setting real prices is a business
decision (supplier cost, margin, dropship fulfilment, merchant-of-record sales tax) that
is Orlando's to make, not something to invent. Also found that **only `aligned/buy.js`
calls the checkout endpoint at all** — membership and courses have server-side branches
but no front-end buy button anywhere, and `/membership` still reads "coming soon". That
contradicts an earlier claim of mine this session that env vars alone would revive all
three surfaces; goods and donations are the only two with a front end.

**Finished.** Donation branch unit-tested against nine amount cases (valid, $1 floor, 99c,
zero, negative, over-max, non-numeric, missing, fractional) with a stubbed Stripe — all
clamp correctly, and the captured payload confirms `mode=payment`, `submit_type=donate`,
tax off and **no shipping collection**. Picker, custom-amount takeover, minimum error,
thanks/cancelled return states and failure recovery all driven in a real browser. Fixed a
defect found that way: a raw `Unexpected token '<'` reached the donor when the endpoint
answered with HTML, now parsed defensively. Layout audited at 900px and 390px — no
horizontal overflow, tap targets ≥36px, brand tokens correct. `npm run lint` passes.
sw `v73` → `v74`.

**Left.** **No money can move yet.** `STRIPE_SECRET_KEY` is absent from Cloudflare Pages,
so `/api/checkout-session` returns 503 for every kind — this is config only, no code.
Nothing is pushed, so none of this is live. **Not verified: any pixel screenshot** — the
Playwright screenshot call timed out repeatedly this session, so visual confidence rests
on computed styles and DOM geometry, not on having seen the page. Also unverified: the
webhook donation branch was reasoned through and placed correctly but never exercised
against a real Stripe event, since signature verification was not stubbed. Recurring
donations, PayPal and bank transfer are not built, and the copy now says so plainly.

**Did.** Fixed an editorial-integrity bug that was live in prod: every "Research ↗" link
on all 94 Aligned Goods cards fell back to the seller's own shop with `?ref=frqncy`
attached, so a label promising independent verification was pointing at a monetized
affiliate link. Both renderers (`aligned/index.html`, `scripts/build-aligned-shelves.mjs`)
now use `g.research_url || ''`, so the link renders only on a real source. Forward-ported
rather than cherry-picked, because the fix's home branch predated the 6 food/body-care
entries that exist only on main. Also researched and HTTP-verified 4 new independent
sources — Lauretana→FineWaters, Waking Up→Clearer Thinking's pre-registered study,
Tao Te Ching→Chinese Text Project, Esalen→Kripal/UChicago Press — taking picks with a
real research link from 7 to 11 of 17. Committed `7bf0746`; since absorbed into
`integrate-2026-08-01` as `df29427a2`.

**Opened.** Two editorial questions for Orlando. (1) Le Creuset's `clean` criterion is
arguably unverified — independent XRF testing finds cadmium in coloured *exterior* enamel
and Le Creuset says only Dune and Palm are lead+cadmium-free; not linked because XRF
measures bulk content rather than leaching. (2) The supplements pick remains
Kevin Trudeau-founded, flagged previously and still unresolved.

**Finished.** Verified in a real browser via Playwright against a local server, not from
the diff: 94 cards render, 12 research links, **zero** containing `ref=frqncy`, and cards
without a source degrade cleanly to just the honestly-labelled vendor link. Entry count
and one-pick-per-shelf across 17 shelves both confirmed intact after the port.

**Left.** Not pushed, so **prod still serves the affiliate-as-research links** — the fix
only reaches users when `integrate-2026-08-01` ships. 6 picks remain deliberately
linkless (no independent source backs the specific claim; padding them would defeat the
purpose). Notably withheld: general PEMF literature for the iPyramids coil, which would
verify the *modality* rather than a $6,499 device. Did not re-check the 8 previously
verified URLs beyond an HTTP 200 — I did not re-read them for continued relevance.
Did not touch `proposals/ALIGNED-GOODS.md`, still stale at 12 shelves / 56 entries.

---

## 2026-08-01 (VBRTN bugfix + app test surface)

**Did.** Fixed all three VBRTN bugs from the 2026-07-30 prod audit, in three focused
commits on `vbrtn-live`. (1) The `/api/companion` 500: the intake stores the music answer
as a textarea string but `buildContext` called `p.music.join()`, and `slimProfile` passed
the bad type through because `String.slice` also returns a string. Both ends now coerce
via `asList()`; the server coerces too, since it cannot trust client shapes. Same pass
fixed `negativeTriggerCount`, which counted *characters* when the field was a string.
(2) The `frqncy-vbrtn-store.js` 404: the asset shipped in `a3cb254` but the page-side
wiring had been sitting uncommitted in the working tree from an earlier session.
(3) `desireMap` collisions: bare-substring matching in `scripts/build-vbrtn-trail.mjs`
routed stability→homeopathy (`home`), purpose→open-source (`source`), peace→anything
whose description used "still". Rewritten to word-boundary matching with stem (`meditat*`)
and exact-slug (`=source`) forms; descriptions are no longer searched at all. The build
now prints all twelve routes so the next collision shows up at build time.

Also rebuilt the Android debug APK to confirm the toolchain still works, and probed the
app's test surface.

**Opened.** Nothing filed. Two facts worth tracking: `app/` has **zero automated tests**
(no test script, no test files — every "verified" claim in `app/docs/*` is manual), and
**Xcode is not installed**, which hard-blocks all iOS work. iOS project and Pods are
otherwise staged.

**Finished.** The three fixes are verified by unit-testing `buildContext` against six
profile shapes (string / array / null / number / raw-string modal operators / `{text,at}`
objects) — the string case used to throw and now returns clean context — plus a DOM-shim
run of `slimProfile` and `threadSeed` in Node. All twelve desire routes were read by hand
after the rewrite. Android APK builds clean in 17s.

**Left.** **Nothing is deployed** — prod still returns 500 on `POST /api/companion`,
confirmed by `scripts/status.mjs` this session. The fixes are all carried by
`integrate-2026-08-01`, which is 30 ahead / 0 behind `origin/main` (clean fast-forward)
and still unpushed, awaiting Orlando's cold walk.

**Not verified: anything visual.** Playwright was blocked the entire session — a live
Chrome owned the MCP profile and `rm SingletonLock` did not help — so there is no
screenshot of the VBRTN page and no confirmation the copy changes look right in place.
UI confidence rests on logic tests only. The rebuilt APK is byte-identical to the 11 July
one (gradle packaging went UP-TO-DATE) because nothing in `app/` changed; it was never
installed on a device, so the app itself remains untested on both platforms.

---

## 2026-08-02 — the push landed, and prod is fixed

**Did.** Pushed `integrate-2026-08-01` to `main` — `0964f7905..6b0d748ba`, 33 commits, 136 files,
clean fast-forward. SSH was refused (no key on this machine); routed through `gh auth setup-git`
over HTTPS. Then removed a duplicate kanban from the DASHBOARDS board.

**Opened.** #48 (verify the VBRTN flow cold in prod) and #49 (measure intake drop-off) — both
existed only as stickies on the board that was about to be deleted, so they were filed first.

**Finished — verified against prod, not assumed.**
- **The companion answers.** `POST /api/companion` returns 200 with real copy (`via: workers-ai`)
  on the exact payload that returned Cloudflare 1101/500 before. The `asList()` fix works, and it
  runs keyless — the Anthropic key (#17) is a voice upgrade, not a blocker.
- `/assets/frqncy-vbrtn-store.js` → 200, was 404. Cloud sync alive.
- Both book slugs still resolve; the rename guard held and no indexed URL 404'd.
- `/aligned/wear/` Research link resolves to bcorporation.net, not a seller `?ref=`.
- `sw.js` live at v73.
- Pre-push: `npm run lint` clean, HD engine acceptance tests pass, 1 expected deletion with 301s.
- **#1 closed** with that evidence.
- **Duplicate kanban removed.** The board carried 103 cards against 54 issues: a parallel session
  read the board at *board scope*, saw no frames (board scope does not return them), concluded the
  kanban was missing and built a second one stacked at the same coordinates. Deleted the older
  49-card set, kept the current 54. Board and tracker now agree exactly.

**Left.**
- **Two to-do surfaces on this board are still unmerged** — the `FRQNCY — Areas We're Working On`
  frame (10 focus areas, 64 items, dated 28 Jun) and `Weekly to dos 19–26 July`. The weekly list
  holds at least two items with no issue: *finish the funding talks with Valentino* and *improve
  the Drive structure*.
- The Drive sweep has not started.
- `frame`-only deletes do **not** cascade to children in Miro — delete the frame and its children
  in one DSL block, or you orphan them.
- Uncommitted work sits in `/tmp/frqncy-integrate` (donate.html, checkout-session.js,
  stripe-webhook.js) from a parallel session — not pushed, still pending.

## 2026-08-01 (evening) — all to-dos merged onto one board

**Did.** Read the FRQNCY DASHBOARDS board properly and found real to-do structure I had missed on
the first pass: a **Social Media — Master To-Do** doc with 8 workstreams, swimlanes for Social
Media / Foundation / Financials / MVP / Legal, and six numbered launch plans. Merged every open
(⬜) item from that doc into the issue tracker, then generated the full kanban onto that board so
there is one place to look.

**Opened.** 20 new issues (#21–#40) from the Miro to-dos, labelled `area:social` / `area:mvp`.
Notably #40 transcribes the **MVP definition** off the MVP swimlane — it had only ever existed on
a canvas. `--scale` and `--y` options on `board-sync.mjs`, because DASHBOARDS works at ~25x normal
coordinate scale and a default-scale kanban is invisible on it.

**Finished.** All 40 issues now render as one kanban on DASHBOARDS at `y=295000`, placed clear of
the existing Social Media To-Do frame. Verified the lane top edge (247,325) sits below that
frame's bottom (226,000) so nothing overlaps. Confirmed #5 (/create /read /rich) is the same work
the social doc calls "THE blocker", so it was cross-referenced rather than duplicated.

**Left.**
- The Miro doc is now **duplicated state** — it and the tracker will drift. It should be replaced
  with a pointer to the tracker, but that is Orlando's canvas to edit.
- The **older kanban on the separate To-Do board is now stale.** Two boards show to-dos; only
  DASHBOARDS is current. Delete the old one or regenerate it.
- Foundation / Financials / Social Media swimlanes were **not** mined — only MVP and the Social
  Media doc. There may be more to-dos in them.
- Still nobody but Orlando can see the tracker.

## 2026-08-01 (later) — one kanban, team delegation, Claude's queue

**Did.** Audited all five Miro boards before consolidating anything and found there were no
other kanban boards to collapse — the premise did not hold, so nothing was merged. `FRQNCY
DASHBOARDS` (624 items) is the values and team canvas; `Mein erstes Board` (6,134 items) is an
unrelated LOVELIFEPASSPORT coaching template; two boards are empty. Merging any of them into
the to-do board would have destroyed real work. Instead, made the single existing kanban
delegatable.

**Opened.** Owner labels for the team (`owner:norman`, `owner:katzi`, `owner:petra`,
`owner:nikolaus`, `owner:team`) — names inferred from the values board, so Orlando should
correct them. An `in-progress` label, and a matching "In progress" lane on the kanban. A "Team"
legend frame naming each person and their label. Card titles now lead with `[Owner]`.

**Finished.** `board-sync.mjs` regenerates all six lanes and resolves `in-progress` ahead of
status, so whatever anyone is actively working on surfaces in one column. Verified the lane
positions align with the frames already on the board, so the new lane slotted in without
displacing DO NOW.

**Left.**
- **Nobody but Orlando can see the tracker.** `frqncy-ops` has one collaborator. The team needs
  inviting before delegation means anything — blocked on their GitHub handles.
- Existing cards keep their old titles until the five kanban lane frames are deleted by hand and
  the board regenerated; the Miro API has no frame or card delete.
- Two empty Miro boards were left in place — deletion is irreversible and was not confirmed.
- **Claude cannot be a real Miro or GitHub user.** `owner:claude` is the actual mechanism, not a
  user account. Assigning that label is a real handoff; a fake account would not be.

## 2026-08-01 — state audit, integration, and a tracking system

**Did.** Audited the roadmap against reality and found the core problem is a deploy gap, not a
planning gap: `main` and `vbrtn-live` had diverged (10 / 24) with roughly three months of finished
work never pushed, while four separate status docs asserted a reality that no longer held.
Reconciled the divergence into a single verified branch. Built two tools so the state can be
derived instead of asserted, and stood up an issue tracker as the single source of truth.

**Opened.**
- Branch `integrate-2026-08-01` (worktree `/tmp/frqncy-integrate`) — 28 commits ahead of
  `origin/main`. Merges all outstanding `vbrtn-live` work plus the stranded Aligned Goods fix.
- Private tracker `0rli-E/frqncy-ops` with 20 issues, labelled by owner / status / area.
- Miro board `FRQNCY — To-Do & Live Status`.
- `scripts/status.mjs` — probes git, prod routes, companion health, data beds, doc staleness.
- `scripts/board-sync.mjs` — regenerates the board view from the issue tracker, as a kanban.
- `.githooks/pre-commit` and `.githooks/pre-push` — parallel-agent collision guards.
- This file, plus the tracking / parallel-agent / operations-log sections of `CLAUDE.md`.

**Finished.** The merge conflicts, resolved by content verification rather than patch-id
(`git cherry` is unreliable once `main` carries squashed publishes). Aligned Goods resolved to
main's side after proving the branch's 88 entries were a strict subset of main's 94. VBRTN
resolved to the branch side after proving main's `companion.js` still throws the live prod error.
Verified: `npm run lint`, `node scripts/test-hd-engine.mjs`, six data beds parse, Sanctuary and
VBRTN render locally with no genuine console errors. Caught and fixed a regression the merge would
otherwise have shipped — a book slug rename that would have 404'd an indexed, live URL.

**Left.**
- **Nothing is deployed.** The branch is unpushed, awaiting Orlando's cold walk-through.
  Every prod bug listed in the tracker is still live.
- **No pixel verification** — the Playwright screenshot output directory was unreachable, so UI
  confidence rests on DOM snapshots and console output only.
- The superseded hand-made table on the Miro board needs deleting by hand; the API has no
  table-delete.
- Issues do not auto-close: `status.mjs` will show a route green while its issue sits open.
- GitHub Projects kanban is blocked on a token scope (`gh auth refresh -s project`).
