# VBRTN — native iOS app

The chat-first companion, native SwiftUI. Strategy: `proposals/VBRTN-IOS-NATIVE-STRATEGY-2026-08-20.md`
(sibling of `VBRTN-APP-STRATEGY-2026-08-20.md`, which owns the shared backend layers).

## What this is

A thin native client over the shared VBRTN runtime:

- **Thread home** — streaming chat against `/api/companion` v2 (SSE). Signed-in
  callers get server-canonical memory; anonymous callers get the v1 slim-profile contract.
- **Intake-in-thread** — the shared 24-question bank, ported verbatim (same ids,
  field paths, reflections). A profile begun on any surface continues here.
- **Chart engine** — the exact same `hd-engine.js` + `vsop87-data.js` +
  `gene-keys.js` as web/Android, run in JavaScriptCore (`ChartEngine.swift`).
  One source of truth for charts; re-copy from `my-frqncy/charts/` when those
  change (`cp ../../my-frqncy/charts/{hd-engine,vsop87-data,gene-keys}.js
  VBRTNKit/Sources/VBRTNCore/Resources/`). The module-syntax strip + classic-
  script evaluation is verified against Node's vm (same mode as JSCore).
- **Universal sign-in** — Supabase email+password, same project as the site.
  Session in the Keychain. Sign in with Apple lands with the paid dev account.
- **Memory transparency** — "what VBRTN knows about you", per-record delete.
- **Export / erase** — `/api/vbrtn-data`, one tap deep in the menu.
- **Morning open** — local notification at 08:00 (Phase A); server-computed
  APNs push is the Phase C upgrade.
- **Privacy floor** — negative-trigger names never leave the device
  (`ProfileShapes.cloudSafeProfile` strips; count-only upstream).

## Layout

```
project.yml              — XcodeGen manifest → VBRTN.xcodeproj
VBRTN/                   — app target (entry point, assets, Info.plist)
VBRTNKit/                — local Swift package
  Sources/VBRTNCore/     — logic: JSONValue, AuthStore, CompanionAPI, ProfileStore,
                           ChartEngine (JSCore), Intake bank+logic, MorningOpen,
                           Recovery, Signals   (+ Resources/ chart JS)
  Sources/VBRTNUI/       — SwiftUI: AppModel, RootView, ThreadView, IntakeCardView,
                           DesignSheet, MemorySheet, MenuSheet, AuthSheet, Theme
```

Composability seams: new server capability → new `FeedItem.Kind` + renderer in
`FeedItemView`; new lens data → new keys on the profile blob (no schema churn);
model/router changes are server-side only and need no app release.

## Build

Requires Xcode (App Store). Then:

```
cd app/ios-native
xcodegen generate
open VBRTN.xcodeproj
```

Select the VBRTN scheme → run on simulator, or on a device (free Apple Account
is enough for a 7-day dev install; TestFlight needs the paid program).

Headless build check:

```
xcodebuild -project VBRTN.xcodeproj -scheme VBRTN -destination 'generic/platform=iOS Simulator' build
```

## Status

Written 2026-08-20 against the live production API; verified with `swiftc -parse`
(syntax) only — **not yet compiled against the iOS SDK** (Xcode was not installed
on the build machine). Expect a first-compile pass of small type fixes.
