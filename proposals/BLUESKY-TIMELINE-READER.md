---
title: Bluesky Timeline Reader (NRG ↔ Bluesky read path)
date: 2026-05-02
status: shipped — v1 + v1.1 reply backflow + v1.2 reply-count surface (source-side; deploy pending the next social-src build + migrations 016 + 017)
---

# Bluesky Timeline Reader

## TL;DR

NRG can now **read** the connected user's Bluesky home timeline, not just
publish to it. The cross-post bridge stops being a one-way side-car and
becomes a federated reader-and-publisher.

A new "Federated" tab on the global feed interleaves NRG posts and Bluesky
posts in one chronological stream. Bluesky rows render in NRG's gold-on-navy
visual language with a small "via @bsky.social ↗" footer linking back to the
post on bsky.app. Likes, replies, and reposts are not surfaced as buttons —
clicking through to bsky.app is the way to interact. This is the honest
division of responsibility: NRG hosts NRG; Bluesky hosts Bluesky.

## Why read-only

NRG could plumb like / reply / repost back through `BskyAgent` and let users
interact without leaving the page. We're not doing that in v1, and the
reasons are deliberate:

1. **Spec drift.** Bluesky's like / reply / repost record shapes evolve
   with the AppView. Pinning UI to those records means re-shipping every
   time the lexicon moves. A permalink can't drift.
2. **Native moderation.** Bluesky has its own moderation lists, mute /
   block graphs, and labelers. Surfacing one-tap interactions in a
   third-party client invites users to interact with content their
   moderation settings would have hidden on bsky.app. Sending users to the
   permalink keeps moderation honest.
3. **Honest provenance.** The brand of NRG is "your network of people,
   building their dream life" — we don't want to pretend we own the
   federated content. The "via @bsky.social ↗" footer says exactly what's
   happening. Buttons in our visual language would muddy that.
4. **Lift.** Read-only is a 1-component lift. A full client is a roadmap.
   Per `EXECUTION-PLAN-90D.md` the protocol pivot is deferred to Q1–Q2
   2027 — this is a Phase 3+ federation extra, not a Phase 2 build.

If/when we ship a fuller client, the v1.1 candidates are listed below.

## Why interleave (federated UX > tabbed UX)

The naive shape would have been a sidebar widget or a separate page that
shows Bluesky timeline and call it done. Two reasons we interleaved instead:

- **The reader's question is "what's new" — not "what's new on which
  platform."** Pinning content to platform tabs forces the reader to
  context-switch to figure out the time order. Interleaving by `created_at`
  desc respects that the reader cares about recency, not source.
- **Federation is a design value, not a feature flag.** The whole point of
  ATProto is that the network is the substrate, not the silo. If NRG's
  federated tab feels like one stream that happens to include posts from
  multiple PDSes, that aligns with the protocol's premise.

The "Network" tab still exists as the default — for users who haven't
connected Bluesky, or who want a focused NRG-only view. The tab strip
itself is hidden when the user hasn't connected (no UI noise for the 90%
who haven't onboarded yet).

## Voice constraints

- Tab label is "Federated" — not "Bluesky" or "External." NRG is a
  federated client, not a publisher with a side bridge.
- Footer link is "via @bsky.social ↗" — neutral framing, not "powered by"
  or "syndicated from."
- No like / reply / repost buttons on Bluesky rows. The `webUrl` permalink
  is the interaction surface.
- Provenance is always visible. NRG posts wear the existing `◊ verified`
  signature badge; Bluesky posts wear the "via @bsky.social ↗" footer.
  No row in the merged stream is ambiguous about where it lives.

## v1 filtering rules

To keep the reader honest in its first release:

- Skip reposts (`reason.$type === 'app.bsky.feed.defs#reasonRepost`).
  We render originals only; surfacing reposts in NRG's visual language
  without an explicit "X reposted" badge would misattribute authorship.
- Skip orphan replies. A reply whose parent isn't shown is jarring out of
  context. The native bsky.app client deduplicates these via thread view.
- Skip embed types we don't yet render (record / record-with-media /
  video). Text-only, image, and external-link embeds pass through. The
  external-link case renders as a small `↗ <url>` hint under the body.

These filters live in `mapFeedItem` inside `lib/atproto-bridge.ts` and are
intentionally easy to relax later.

## Implementation surface

Files touched:

- `social-src/src/lib/atproto-bridge.ts` — adds `BlueskyPost` interface +
  `fetchBlueskyTimeline()`. Reuses the existing `BskyAgent` cache from
  `publishToBluesky` so a feed scroll doesn't re-login. Best-effort —
  never throws; returns `{ ok: false, reason }` on any error.
- `social-src/src/components/FederatedFeed.tsx` — standalone Bluesky
  timeline view + an exported `BlueskyPostCard` row component. The row
  component is what `Feed.tsx` reuses inline in the merged stream.
- `social-src/src/components/Feed.tsx` — adds the "Network" / "Federated"
  tab strip, persisted via `localStorage.frqncy.nrg.feed_tab`. Defaults
  to `network`. Tab strip only renders on the global feed (not on profile
  or channel feeds) AND only when the user has connected Bluesky.
- `proposals/BLUESKY-TIMELINE-READER.md` — this file.

No schema changes. No new env vars. No server-side surface — same
client-side-only contract as the publish path.

## v1.1 — Reply backflow on cross-posted NRG posts (shipped)

When a user cross-posts an NRG post to Bluesky, `publishToBluesky` returns
the AT-URI of the new Bluesky record. v1.1 persists that URI on the NRG
row (`posts.bluesky_uri`, migration 016) and uses it to surface the public
Bluesky thread inline on the NRG post detail view (`/social/post/<id>`).

Closes the federation loop into bidirectional. Anyone visiting an NRG
post's permalink — signed in or not — sees the conversation happening on
the bridge.

Implementation:

- `supabase/migrations/016_bluesky_uri_on_posts.sql` — adds nullable
  `bluesky_uri` + `bluesky_cid` columns. Idempotent. No index — we look up
  per-post via the primary key, never via a `bluesky_uri` filter.
- `social-src/src/lib/api.ts::createPost` — when `publishToBluesky`
  succeeds, fires a best-effort update to persist the URI. Failure (incl.
  the column not existing yet) is logged and swallowed; the cross-post
  itself still succeeded and the user-visible action never blocks.
- `social-src/src/lib/atproto-bridge.ts::fetchBlueskyThread(uri)` — calls
  `getPostThread({ depth: 1 })` against the **public AppView** at
  `https://api.bsky.app` first, so non-connected viewers can still see
  replies on a public NRG cross-post. Falls back to the authenticated
  agent if the public read is rate-limited or refused. Returns flattened
  direct replies sorted newest-first, capped at 50.
- `social-src/src/components/BlueskyReplies.tsx` — read-only thread
  surface. Per-reply timestamps and avatars, "Reply on Bluesky ↗"
  permalink in the header, like / repost counts shown only when nonzero.
  Self-fetches on mount; loading skeletons while in flight; gentle empty
  state ("No replies on Bluesky yet. Be the first ↗").
- `social-src/src/components/PostView.tsx` — renders
  `<BlueskyReplies>` beneath the existing PostCard whenever the loaded
  post has `bluesky_uri`. Select query falls back to the legacy column
  set if migration 016 isn't applied, so the page never breaks on stale
  schema.

Voice contract preserved:

- Section heading is "Conversations on Bluesky" — not "Engagement" or
  "Discussion". We're surfacing what's there, not chest-thumping.
- "Reply on Bluesky ↗" in the header. The interaction surface stays on
  bsky.app — same honest split as v1.
- Footer disclosure: "Public replies fetched live from bsky.social. NRG
  never holds these — interactions stay on Bluesky."
- No reply count headline number ("N replies"). The list speaks for
  itself.

## v1.2 — Reply count on the bridge hint (shipped)

The Feed bridge hint ("↗ on Bluesky") now becomes "↗ N on Bluesky" when the
post has a non-zero Bluesky reply count. The architecture is passive
nightly refresh — counts are persisted on the post row by a script wired
into the existing auto-grow workflow, so the Feed render is one DB column
away from the count instead of N+1 fetches against the public AppView.

Why nightly, not on-demand: per-feed-render fetches would hammer the
public AppView and add latency to NRG's most-rendered surface. The post
detail view (BlueskyReplies) gives users live counts when they actually
open a thread; the Feed pill just wants a "good enough" recency signal,
which matches the editorial intent — this is an acknowledgement that a
conversation exists, not a counter to optimise around.

Implementation:

- `supabase/migrations/017_bluesky_reply_count.sql` — adds nullable
  `bluesky_reply_count integer` and `bluesky_replies_synced_at
  timestamptz`. NULL on `synced_at` means "never refreshed" — used by the
  refresh script as a priority queue.
- `scripts/auto-grow/bluesky-counts-refresh.mjs` — service-role script.
  Selects up to BSKY_BATCH_LIMIT posts with `bluesky_uri IS NOT NULL`,
  ordered by `bluesky_replies_synced_at NULLS FIRST + created_at DESC`.
  Calls `https://api.bsky.app/xrpc/app.bsky.feed.getPosts` in groups of
  25 URIs (the AppView batch cap) and writes `replyCount` back to the
  post row. Posts the AppView no longer returns are persisted with
  `count = 0` so they don't sit at the head of the queue forever. 200ms
  pacing between batches.
- `.github/workflows/auto-grow.yml` — adds the refresh step after video
  ingestion. Output `scripts/auto-grow/output/bluesky-counts.json` is a
  side-effect summary for human review; counts were already written to
  Supabase live during the step. The PR step picks up only the JSON
  summary (no source files change).
- `social-src/src/components/PostCard.tsx` — accepts
  `bluesky_reply_count?: number | null`. When > 0 the pill renders
  "↗ N on Bluesky" with a "{n} replies on Bluesky — click through to
  read" tooltip. When 0/null the pill stays as "↗ on Bluesky" — still
  click-through-useful.
- `social-src/src/components/Feed.tsx` — selects `bluesky_uri,
  bluesky_reply_count` together; the existing column-availability
  fallback widens to either column missing (so 016-without-017 still
  renders the pill, just without a count).

Voice contract preserved:

- The pill never says "engagement" or "viral". A count is a count.
- Singular "1 on Bluesky" is shown as "1 on Bluesky" — consistent with
  the rest of NRG's count surfaces. The tooltip pluralises ("1 reply" /
  "N replies") for screen-reader clarity.
- No follower-style ranking. Cross-posts compete with themselves over
  time, not with each other.

Operator gates: apply migration 017 in Supabase SQL editor; no new
secrets required (the refresh step reuses `SUPABASE_URL` +
`SUPABASE_SERVICE_ROLE_KEY` already wired for resource-suggest). First
run will populate counts for every cross-posted NRG post; subsequent runs
only refresh stale rows in priority order (NULL `synced_at` first, then
oldest).

## v1.3+ roadmap

In rough priority order:

1. **Cursor-based pagination on the Federated tab.** Today "Load more"
   only loads more NRG; Bluesky cursor follow-ups land in v1.2.
2. **Image embed rendering** in both Federated tab rows and BlueskyReplies.
   v1 detects image embeds but doesn't render the bytes. A small image
   grid (1×, 2×, 3×, 4× layouts matching bsky.app) would round out the
   reader. Keep it CSS-only — no lightbox in v1.2.
3. **External-link card preview.** Today external-link embeds render as
   a `↗ <url>` hint. v1.2 should render the full OG card. Reuses
   `LinkPreview.tsx` if the AppView returns `embed.external.thumb`.
4. **Reply count hint on Feed cards.** Once the per-post column exists,
   the global Feed could show "↗ N on Bluesky" beneath cross-posted NRG
   posts so readers know to click through to the detail view for the
   federated conversation.
5. **Nested reply rendering.** v1.1 surfaces direct replies only
   (`depth: 1`). Nested threads still route to bsky.app. v1.2 could
   render shallow threads inline (max depth 2 or 3) before falling back
   to the permalink.
6. **Repost surfacing with explicit "X reposted" badge.** Once the visual
   language for reposts in NRG is settled, drop the `reasonRepost` filter
   and render reposts with an explicit attribution row.
7. **Mute / block respect.** Pull the viewer's moderation settings from
   `getPreferences` and apply server-side filtering before render.

## What this unlocks

NRG was a publisher-with-side-bridge. v1 made it a federated
reader-and-publisher. v1.1 makes it bidirectional — every NRG cross-post
becomes a thread that lives in two places at once, and the conversation
that springs up on bsky.app shows up on the NRG permalink without the
post author having to do anything.

That's the inflection where NRG stops being "a place to publish from"
and starts being "a place to read the open social web's response to
what you publish." For the long-form, post-shaped writing the network is
built around, that's the loop that matters.

The next inflection — v1.2 image and external-card rendering — will let
NRG host a meaningful percentage of the Bluesky experience for users who
prefer FRQNCY's reading environment. That's when we can tell users they
can use NRG as their primary client without a fidelity gap.
