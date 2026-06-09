# Ethos Integration v0 — spike result + path forward

Track 3, Week 3. Question the spike was meant to answer: **does FRQNCY's
existing Privy app token authenticate against Ethos's API, or do we need to
register separately?**

Spike done 2026-06-09 against the live OpenAPI
(`https://api.ethos.network/docs/openapi.json`, 852 KB, fetched with the
required `X-Ethos-Client` header). Code staged in
`social-src/src/lib/ethos-bridge.ts`.

## The answer (high confidence, one live test pending)

**The read-only surface needs no auth at all — so the Privy-token question
doesn't gate it.** Every endpoint we need is public:

| What we want | Endpoint (base `https://api.ethos.network/api/v2`) | Auth |
|---|---|---|
| Profile by wallet | `GET /user/by/address/{address}` | public |
| Profile by X handle | `GET /user/by/x/{accountIdOrUsername}` | public |
| Profile by Ethos id | `GET /user/by/profile-id/{profileId}` | public |
| Vouches received | on the user object → `stats.vouch.received` | public |
| Score (we DO NOT use) | `GET /score/address` etc. | public |

The **only** endpoints requiring `Authorization: Bearer` are **writes** and
personalized `me` reads: `/wallets/privy/post/review`, `/wallets/privy/vouches`,
`/wallets/privy/invite/*`, `/users/refresh/twitter`, `/users/me/*`.

**On the auth token specifically:** Ethos verifies Privy tokens issued by
*their* Privy app (the `privy-token` cookie lives under `app.ethos.network`,
~1h TTL). A token minted by FRQNCY's Privy app has a different app id /
audience, so it will almost certainly be **rejected** by Ethos's authenticated
endpoints. That's the expected and acceptable outcome — we don't need it.

### One test left to run (the literal spike)

`probeEthosAuth(privyAccessToken)` in `ethos-bridge.ts` confirms the above
empirically. Run it once from a logged-in session:

1. In `PrivyLoginButton.tsx`, inside the component under `<PrivyProvider>`,
   add `getAccessToken` to the `usePrivy()` destructure.
2. `const token = await getAccessToken();`
3. `console.log(await probeEthosAuth(token));`

Expected: `{ verdict: 'rejected', status: 401|403 }` → confirms separate
registration is needed for writes. If `accepted` (surprise — shared Privy
audience), authenticated actions are open to us with no extra registration.
Either way the read-only surface ships.

## What this unblocks

**The Ethos read-only surface (planned Weeks 4–5) is NOT blocked by the auth
question and can proceed.** The staged `fetchEthosProfile()` already returns
`{ exists, vouchesReceived, invitedBy, profileUrl, displayName, username }` from
the public API, with `score` deliberately excluded (cooperation over
competition — we don't import a people-ranking number).

Remaining for the EthosPanel v0 build:
- `EthosPanel.tsx` — render the bridge output on a profile (vouches received +
  "View on Ethos ↗"; no score, no leaderboard).
- Migration adding `profiles.ethos_profile_id` (the roadmap calls this 018b;
  `DEPLOY-WEEK-1.md` notes `ethos_profile_id` is already anticipated).
- Resolve `invitedBy`: it is **not** on the v2 user object. `/invitations/*`
  endpoints expose the *downward* tree (who a profile invited), not the inviter.
  Decide during the build whether to derive it or drop the field from v0.

## What needs separate registration (deferred)

Any **write** on a user's behalf (post a review, vouch, send an invite)
requires an Ethos-recognized credential:
- the user authenticating through **Ethos's own Privy app**, or
- a **programmatic API key** minted via SIWE (per Ethos's "API Keys" docs).

This is out of scope for the read-only surface and slides to Q3 unless we
decide to let FRQNCY members act on Ethos from inside NRG.

## Facts worth keeping

- Base URL: `https://api.ethos.network/api/v2`
- **Mandatory header on every request:** `X-Ethos-Client: <app>@<version>`
  (we send `frqncy-nrg@0.1.0`). Without it: 403 / rate-limited.
- OpenAPI: `https://api.ethos.network/docs/openapi.json` (needs the client header).
- Userkey formats: `address:<addr>`, `service:x.com:username:<u>`,
  `profileId:<id>`, plus discord/farcaster/telegram.
- Public profile URL: `https://app.ethos.network/profile/x/<username>`.

Sources: [Ethos Developers](https://developers.ethos.network/), live OpenAPI spec.
