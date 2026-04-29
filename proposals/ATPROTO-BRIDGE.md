---
title: NRG ↔ Bluesky Cross-Post Bridge (ATProto v1)
date: 2026-04-29
status: shipped — v1
---

# ATProto Bridge

## TL;DR

NRG posts now mirror to Bluesky. Users connect their `@handle.bsky.social`
plus an app password on `/social/profile/connections/`; from then on, every
NRG post is published to their Bluesky PDS as well, with a small "via FRQNCY
NRG" footer linking back to the NRG copy. The app password lives in browser
localStorage only — FRQNCY's server never sees it. Cross-post is opt-out
per-post via a checkbox on the composer. One-way for v1: replies and likes
on Bluesky don't backflow to NRG.

## Why Bluesky and not Farcaster

Per `proposals/PROTOCOL-LESSONS-2026-04.md`: Bluesky has roughly 30M users
versus Farcaster's ~1M, with a more general-purpose social graph that fits
NRG's brand of long-form, post-shaped writing. Farcaster is structurally a
crypto-Twitter and the audience overlap is narrower than the surface
suggests. ATProto is also closer to a "boring federation" mental model — a
PDS, an AppView, a relay — which makes the bridge a 1-file lift instead of
a Hub-running operation.

## App password vs OAuth

Chose app password for v1 because:

1. **Implementation is one file**: a single `BskyAgent` from `@atproto/api`
   with `agent.login({ identifier, password })`. OAuth + DPoP would be
   five files (callback URL, PAR, DPoP keypair, refresh handling, key
   rotation).
2. **Bluesky users already understand app passwords**: every third-party
   Bluesky client (Graysky, deck.blue, etc.) uses them. Users know to
   generate one at `bsky.app/settings/app-passwords` and that they can
   revoke it without touching their main account.
3. **No callback infrastructure**: nothing for FRQNCY to host or rotate.
   The app password is opaque from our side; we just pass it through.

v2 should swap to ATProto OAuth 2.0 + DPoP per Bluesky's recommended path
once the spec stabilizes in `@atproto/api`. App passwords are revocable
per-connection, so the migration story for users is: connect once with OAuth
when v2 ships, then revoke the v1 app password from the Bluesky settings
page. No data loss.

## Threat model

| Risk | Where it lives | Mitigation |
| --- | --- | --- |
| App password leaked from FRQNCY DB | N/A — never stored server-side | Architectural: server never sees it |
| App password leaked from localStorage | User's browser | Bluesky's app-password rotation UX (one click revoke) |
| User clears localStorage | Bridge stops working | User reconnects on `/social/profile/connections` — handle auto-fills from `profiles.bluesky_handle` |
| Bluesky outage / rate limit | Cross-post fails | Fire-and-forget — local NRG post still succeeds; warning logged |
| Browser compromise (keystroke logger) | User's machine | Not mitigated — same risk surface as any other web auth |
| Stolen device / unlocked browser | User's machine | App password is scoped — attacker can post + read DMs as the user, but cannot change the user's main password or delete the account |

## What gets cross-posted

- **Text content**: the NRG post body, truncated to fit Bluesky's 300-grapheme
  limit including footer.
- **Footer**: `\n\n— via FRQNCY NRG ↗\nhttps://frqncy.network/social/posts/<id>`.
  Counts toward the 300-grapheme budget; body is truncated to make room.

What does NOT cross-post in v1:

- **Media attachments**. Already public on FRQNCY; cross-posting media is a
  separate v2 lift (Bluesky requires uploading a blob to the PDS first, then
  embedding the CID in the post — three extra round-trips).
- **Conviction tags**. Bluesky has no equivalent primitive; it'd just be
  noise as a `#conviction:high` hashtag.
- **Project tags**. Same reason — they're an NRG-internal taxonomy.
- **Comments and replies**. NRG comments stay on NRG. Bluesky replies on the
  mirrored post stay on Bluesky.

## Migration path to OAuth

The bridge is intentionally shaped so OAuth swap-in doesn't require
touching `publishToBluesky`'s callers:

```
publishToBluesky({ text, nrgPostId, appendFooter? })
  → resolves credentials internally (currently localStorage app password)
  → posts via BskyAgent
```

In v2, only the credential-resolution step changes (OAuth tokens with DPoP
proof, refreshed via the OAuth client). `connectBluesky()` becomes a redirect
to the OAuth authorization endpoint instead of a direct login call. The
`PostComposer` toggle, the `ConnectionsPanel` UI, the `crosspostToBluesky`
flag in `createPost` — all stay identical.

## What this gives us

- **Reach**: ~30M Bluesky accounts now have a one-click way to find FRQNCY
  posts. Each cross-post carries a link back to NRG.
- **Federation in practice**: the "we have a hybrid signed mirror but no
  destination" critique from the onchain pivot proposal is half-answered.
  The export endpoint stops being theoretical.
- **Cheap option value**: if Bluesky stalls, the bridge code is ~250 lines
  and a single localStorage key. We can rip it out without leaving a scar.

## What this doesn't give us

- **Two-way sync**. Bluesky comments don't backflow to NRG. Likes and
  reposts on the Bluesky copy aren't surfaced on the NRG copy.
- **Identity unification**. The user's Bluesky DID is not stored on FRQNCY
  (only the public handle is). If we want a "verified identity across
  networks" surface in v2, we'd add a DID column.
- **Bidirectional moderation**. If a user deletes the NRG post, the Bluesky
  copy stays unless they delete it from a Bluesky client too.
- **Threading**. Replies on NRG don't become a Bluesky thread.

These are all v2 territory. v1 is a one-way reach amplifier and a federation
proof-of-life.
