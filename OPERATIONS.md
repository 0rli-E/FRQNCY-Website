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
