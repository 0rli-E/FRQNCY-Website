# VBRTN iOS — the native companion app

**Date:** 2026-08-20 · **Status:** decisions locked 2026-08-20 (Orlando) — ready to scaffold
**Sibling doc:** `VBRTN-APP-STRATEGY-2026-08-20.md` (the shared build shape — Layers 1–4 and the Android/Capacitor client). This doc is the **iOS client**.
**Parent doc:** `MY-FRQNCY-VBRTN-COMPANION-2026-05-22.md` (the cause).

## Amendment to the morning's decision #3

The sibling doc locked "Shell: Capacitor, local bundle — iOS inherits the same bundle once
the Xcode build lands." Orlando amended this on 2026-08-20 (afternoon session): **iOS gets a
native SwiftUI app, not the Capacitor bundle.** Android keeps Capacitor; the backend layers
are untouched. Rationale: "a real app, not a wrapper" — the chat thread is the product, and
on iOS the native feel (streaming, keyboard, haptics, push, widgets, App Store posture) is
the product's first impression. The Capacitor iOS shell (`app/ios/`, first-build fixes of
2026-08-19) is parked, not deleted — it stays as a reference and a fallback.

## The one-line goal

A native SwiftUI app whose home screen is the VBRTN thread: signed in with the universal
account, streaming against the shared companion runtime, holding the person's Human Design,
Gene Keys, astrology, meta-programs and intake answers as living, private, per-login memory.

## What iOS shares vs. owns

Everything intelligent lives server-side and is shared with Android and the web. The iOS
app is deliberately thin.

| Layer | Where it lives | iOS's job |
|---|---|---|
| 1. Identity | Supabase auth + RLS | Native Sign in with Apple + email link, via `supabase-swift` |
| 2. Memory (L0–L4) | Supabase (`charts` row + `vbrtn_messages`) | Local cache for offline reads; never the canon |
| 3. Companion runtime | `/api/companion` v2 (lens plugins, model router, extractor) | Call it, stream it, render it |
| 4. Message types | Server emits `{type, payload}` | Native renderers per type; unknown → text |
| 5. Surface | **This app** | Thread UI, intake-as-conversation, design drawer, morning open, settings |

The `{type, payload}` typed-message contract is the composability seam on the client: a new
server capability (recovery card, chart reveal, practice offer, mindmovie) becomes a new
SwiftUI block renderer — no new screens, no app-store-release coupling for server-only
changes.

## App architecture — SwiftUI, local Swift packages

New Xcode project at `app/ios-native/` (workspace `VBRTN.xcodeproj`), iOS 17+, structured
as local SPM packages so pieces stay swappable:

- **VBRTNCore** — API client, SSE streaming (`URLSession.bytes`), typed message models,
  auth session. No UI.
- **VBRTNChat** — the thread: message list, composer, streaming bubble, typed block
  renderers (text · recovery-card · chart-card · practice · intake-question). The home
  screen.
- **VBRTNIntake** — intake-as-conversation flow driver (the 25 questions arrive as typed
  messages from the server; this package owns answer capture UI: single-tap choosers,
  sliders, free-text) + the Cormorant insight rendering.
- **VBRTNDesign** — the design drawer: HD bodygraph, GK spheres, natal wheel. Read-only
  views over L0.
- **VBRTNMemoryUI** — "what VBRTN knows about you": the L4 transparency screen with
  per-record delete. A FRQNCY-values feature, in v1.
- **App target** — composition root, deep links, push handling, settings (account, export,
  delete account).

Design language: the FRQNCY register translated to native — Cormorant italic for the hero
lines (bundled font), gold accent reserved for invitation/acknowledgment/current state,
dark-first. No tab bar in v1: the thread is home; drawer and settings hang off it.

## Platform-native pieces (why native was worth it)

- **Streaming chat** that feels like Messages: interruptible, scroll-anchored, haptic on
  the morning line landing.
- **Morning open as push.** A Cloudflare cron Worker computes each user's design-aware line
  (HD strategy + rolling octave — backend Phase 3's extractor provides the state) and sends
  via APNs. Tapping opens the thread with the line as the latest message. Fallback until
  the cron exists: locally scheduled notification from last-known state.
- **Widgets + Lock Screen** (1.1): the morning line as a WidgetKit surface.
- **Privacy posture**: profile cache in the Keychain/encrypted Core Data; negative-trigger
  names remain client-held only (same rule as Android — count-only upstream).
- **Alarm** (later): the bedside/wake surface returns in a post-1.0 release, rebuilt on
  AVAudioSession + critical alerts or AlarmKit rather than ported Kotlin. Out of v1 scope
  by decision.

## Phasing — rides the shared backend phases

The sibling doc's backend phases (server memory → extractor → real charts) serve both
clients; iOS work interleaves so neither blocks the other.

- **A. Scaffold + thread (1–2 wks).** Project, auth (Sign in with Apple + email link),
  streaming chat against today's stateless `/api/companion`, local thread history,
  TestFlight to Orlando + Norman. The app feels like the product at the end of week two.
- **B. Memory + intake (1–2 wks, after backend Phase 2).** Server-side memory loads by
  login; intake-as-conversation with Cormorant insights (Haiku lane); profile follows the
  account across devices. **The wrapper→real-app moment on iOS.**
- **C. Design + growth (2 wks, rides backend Phases 3–4).** Design drawer with real
  computed charts, memory-transparency screen, morning-open push, export + delete.
- **D. App Store (1 wk).** Privacy nutrition labels, account-deletion flow (required),
  encryption export compliance (standard exemption), review positioning — VBRTN is a
  reflection/journaling companion, never therapy/medical language in store copy; age
  rating per AI-generated-content guidance. Submit.

Roughly six to seven working weeks to a submitted 1.0, assuming the backend phases land on
the sibling doc's schedule.

## App Store realities (decide early, cheap now, expensive later)

- **Apple Developer Program** — $99/yr, needs enrolling if not already (open question).
- **Sign in with Apple is mandatory** the moment any third-party login is offered.
  `supabase-swift` supports it natively; wire it first, email link second.
- **Bundle identity** — the Capacitor iOS app never shipped, so the namespace is free.
  Proposal: `network.frqncy.vbrtn`, display name **VBRTN** (store listing carries the
  "by FRQNCY" line). Open question below.
- **Account deletion in-app** is a hard requirement; it ships in Phase C with export.
- **Guideline 4.2 (minimum functionality)** — a native chat app with real per-user
  intelligence passes comfortably; the old iframe shell would not have.

## Cost shape

Unchanged from the locked model line: free Qwen lane for all, Claude for members, Haiku
for one-liners. iOS adds only APNs (free) and the developer program fee. At Sonnet-class
usage for members, budget roughly $0.50–2/active member/month — the membership boundary
(Notion #20) already absorbs this.

## What this doc does NOT reopen

Memory canon (server-canonical, Supabase RLS), chat retention (full transcripts + L4),
model line (free/member split), the lens-plugin runtime, the privacy floor, the typed
message contract — all locked in the sibling doc and consumed here as-is.

## Open questions for Orlando

1. **Apple Developer account** — enrolled? Under which entity (personal vs. FRQNCY org)?
   Org enrollment needs a D-U-N-S number and takes days-to-weeks — start now if not done.
2. **Store identity** — ship as "VBRTN" (distinct brand, cleaner) or "FRQNCY" (network
   brand, one app forever)? Affects bundle id, marketing, and whether the alarm/bedside
   surfaces ever justify their own app.
3. **Localization** — English-only 1.0, or German at launch? The Milton-Model voice needs
   real per-language work, not translation; English-only 1.0 is the honest default.
4. **Morning-open delivery** — server-computed push (needs the cron Worker + APNs keys,
   design-aware, correct) vs. local notification (ships in Phase A, dumber). Proposal:
   local in Phase A, server push in Phase C.
