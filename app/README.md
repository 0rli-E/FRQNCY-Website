# FRQNCY App

Mobile app (iOS + Android) built with Capacitor 7. Delivers frqncy.network natively plus a native wake/sleep alarm feature.

**Spec:** [`docs/SPEC.md`](docs/SPEC.md) — read this first.

## Quick start

```bash
cd "FRQNCY WEBSITE/app"
npm install
npm run build
npx cap add android
npx cap add ios
npm run cap:android        # opens Android Studio
npm run cap:ios            # opens Xcode
```

## Architecture in one sentence

WebView shell loads frqncy.network (auto content sync), local HTML bundle serves the wake/sleep/alarm/bedside screens, custom `FrqncyAlarm` plugin handles the native alarm logic on both platforms.

## Key commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server for local screens |
| `npm run build` | Build local bundle + generate content-version.json |
| `npm run tag:moments` | Tag resources.json with morning/evening/stillness/release |
| `npm run cap:sync` | Build + sync into native projects |
| `npm run cap:android` / `cap:ios` | Open native IDE |

## Content sync

The app polls `https://frqncy.network/content-version.json` on launch and resume. If the hash changed, it conditionally fetches the updated JSON with `If-None-Match` (free 304s). Media files live on Cloudflare R2 (audio) and Stream (video).

**Website update → app update flow:**
1. You edit content in `search.json` / `resources.json` on the website.
2. Website deploy regenerates `content-version.json` with new hashes.
3. Next time the app opens, it sees the new hash and pulls the changed files.
4. No App Store release needed.

Native changes (alarm logic, plugin updates) require a store release.
