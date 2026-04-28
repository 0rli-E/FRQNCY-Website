# Session recap — 2026-04-28

A handoff document for whichever agent picks up next. Captures every decision, every file change, every locked phrase, and every rejected one. Read this before doing more website / voice / hero work.

---

## What this session accomplished, in plain order

1. **Triaged Orlando's nine-point UX/content feedback** on the live FRQNCY site → `proposals/WEBSITE-FEEDBACK-2026-04-28.md`.
2. **Restored the bespoke Fund page** (Vision / Echo & Legion / Domains / Roadmap / Crypto CTA / Resources) from commit `c03faa3` → merged with the live topic-page resource list at `v2/fund/index.html`.
3. **Hardened generate.js against future regen** so the bespoke Fund page (and any future bespoke pillar/domain/topic page) can't be overwritten by `node generate.js`.
4. **Generated the canonical voice playbook** from 20 source documents (4 voice docs + 8 live pages + 8 strategic docs) → `proposals/FRQNCY-VOICE-PLAYBOOK.md`. Aggregate confidence: High (0.91).
5. **Updated `CLAUDE.md`** to reference the voice playbook as the canonical contract.
6. **Iterated the home hero** through ~10 rounds of revision until it landed — Orlando rejected several drafts (including the "topic graph for consciousness" line and the "FRQNCY makes the unable able" slogan from `EDITORIAL-VALUES-V2.md`) before locking the final pair.
7. **Shipped the locked hero** to the live home page (`index.html`) — title, meta description, OG/Twitter cards, JSON-LD, visible quote section, and subscribe overlay all updated.
8. **Shipped the parallel rewrite to the About page** (`about.html`) — hero replaced, manifesto line cleaned of the offensive "unable able" phrasing.
9. **Saved memory entries** so no future agent revives the rejected slogan or rewrites copy that's now locked.

---

## The locked hero (canonical)

**H1:** A network of people, building their dream life.

**Sub:** We invite you to find yourself.

This is the live home hero as of 2026-04-28. Also lives on the About page as the H1 with an extended sub. The voice playbook was updated to reflect this as the primary value proposition.

The H1 was Orlando's own framing: *"FRQNCY is a network of people that work together to create an alternative society for people to opt into. But we cant say it that way because people will think wtf this is too esoteric. It needs to be understandable by normies."* The locked phrasing is the normie-translation that survived ~6 rejected drafts.

The sub came from Orlando's own line: *"make it more of an invitation like : We invite you to find yourself"*. He wanted the reader to feel "seen, inspired, and home" — invitation language was the mechanism that landed.

---

## Rejected ideas — keep these out of future work

- **"FRQNCY makes the unable able"** — listed as the homepage primary tagline in `proposals/EDITORIAL-VALUES-V2.md`. Orlando rejected it 2026-04-28 as offensive (positions readers as incomplete, violates abundance + remembrance frame). Don't deploy it anywhere. Update or remove the entry from `EDITORIAL-VALUES-V2.md` next time that doc is touched. Memory entry: `feedback_frqncy_slogan_rejected.md`.
- **"Getting the unable able"** — same problem, same rejection, removed from the About page manifesto.
- **"FRQNCY is a topic graph for consciousness — 146 maps of how money, energy, mind, and matter actually work."** — Earlier proposed home rewrite. Rejected as "super confusing, doesn't give any picture or understanding." Too abstract for a normie reader.
- **"Built on the Foundations of Oneness"** — Live legacy H1 on home and about. Replaced. Can survive as a footer concept or section anchor where the philosophical frame is already earned, but not as the cold-arrival headline.
- **"FRQNCY is soul food — to positively impact the whole person"** — About hero sub. Removed. Borrowed wellness register; meant nothing precise.
- **"To give humans infinite energy"** — About hero sub. Removed. Abstract to the point of saying nothing.
- **"You are love and light"** — As direct self-description in the subscribe overlay h2 and home meta description. Removed from those positions. *Preserved* in the About thesis section ("You are love and light. One consciousness…") because that paragraph establishes the philosophical frame first.

---

## File changes shipped this session

| File | Change |
|------|--------|
| `v2/fund/index.html` | Bespoke Fund page restored (Vision / Echo & Legion / Domains / Roadmap / Crypto CTA / Resources) |
| `generate.js` | Added `BESPOKE_PILLARS` / `BESPOKE_DOMAINS` / `BESPOKE_TOPICS` guards so bulk regen skips hand-shaped pages |
| `index.html` | Title, meta description, OG/Twitter, JSON-LD, quote section, subscribe overlay → locked hero |
| `about.html` | Hero rewritten (dropped soul food, infinite energy, love-and-light hero), manifesto cleaned |
| `CLAUDE.md` | Added pointer to `proposals/FRQNCY-VOICE-PLAYBOOK.md` as canonical voice contract |
| `proposals/WEBSITE-FEEDBACK-2026-04-28.md` | New — full triage of Orlando's nine pain points |
| `proposals/FRQNCY-VOICE-PLAYBOOK.md` | New — 600-line comprehensive voice playbook (resolved questions section now reflects locked hero + rejected slogan) |
| `proposals/SESSION-RECAP-2026-04-28.md` | This file |

Memory entries written:

- `project_frqncy_website_feedback_apr2026.md` — index of the triage doc
- `project_frqncy_voice_playbook.md` — index of the voice playbook
- `feedback_frqncy_slogan_rejected.md` — rejection of "FRQNCY makes the unable able"

---

## Voice rules a future agent must follow

The canonical voice contract is `proposals/FRQNCY-VOICE-PLAYBOOK.md`. Read it before writing any user-facing copy. Highlights:

- **Seven voice attributes:** remembrance over teaching, present-tense certainty, declarative shortness in triads, conviction without dogma, abundance frame, cooperation over competition, plain speech about non-plain things.
- **British English locked** as default (civilisation, decentralised, organisation, recognise, centre).
- **Banished phrases** — never deploy: wellness, self care, do the work, holistic, authentic self, vibes, abundance mindset, love-n-light (flippant form), high vibe, manifest, awakened (as status), soul food, infinite energy, disrupt, next gen, game changing, join the revolution, synergy, hustle, unlock / unleash / level up, "FRQNCY makes the unable able."
- **Love and light boundary:** OK as philosophical frame inside paragraphs that have established the remembrance / consciousness context. Never as the first substantive line a reader encounters. Never as direct self-description in hero positions or meta descriptions.
- **Never:** leaderboards, "calls" framing, ranking of people, paywalled thesis, ads on the public site, paid placement on Aligned Goods.

---

## Next steps in priority order

1. **Visual review of the live site.** Orlando opens `frqncy.network` and `frqncy.network/about`. Anywhere the new copy still feels off, he pastes the line and the next agent surgical-edits it.
2. **Subtle love-and-light placements.** Orlando wanted the phrase sprinkled subtly across the site where the philosophical frame is already established (footer? specific topic pages? newsletter sign-off?). Each placement needs the framing context written first.
3. **Topic page editorial bridges (feedback item #2).** All 146 auto-generated topic pages currently drop from the hero straight into "Curated Resources" with no FRQNCY voice. Each page needs a one-paragraph editorial bridge between the hero and the resource list — naming FRQNCY's position on the topic, what's at stake, and why these specific resources were picked. Templated for now, hand-shaped over time per the Phase 5 reframe ("FRQNCY is an artwork; each topic is an expression").
4. **`/start-here` rewrite (feedback item #3).** Orlando flagged it as giving no direction. Hasn't been touched yet. Voice playbook recommends: one arc, one CTA, no menu of CTAs.
5. **`EDITORIAL-VALUES-V2.md` cleanup.** That doc still lists "FRQNCY makes the unable able" as the canonical homepage tagline. Update or remove the entry. The other slogan in that doc — "FRQNCY empowers the empowering" — is fine and unchanged.
6. **Remaining items from `proposals/WEBSITE-FEEDBACK-2026-04-28.md`** — items #5 (books/orgs editorial weight), #6 (crypto/projects rebuild), #7 (my-frqncy redesign), #9 (community pages buildout). All bigger projects; each deserves its own session.

---

## How to pick up where this session left off

If Orlando says **"keep going on the website"**: start with item #1 (visual review) — open the live home and about, take screenshots, ask him what still feels off.

If Orlando says **"do the topic page bridges"**: that's item #3. Read `proposals/FRQNCY-VOICE-PLAYBOOK.md` for the topic-page tone-by-context guidance, then write a templated editorial bridge for the auto-generated topic page generator in `generate.js`. Each bridge ~80 words: stake of the topic + curation rationale.

If Orlando says **"fix start-here"**: that's item #4. Read the current `start-here.html`, propose one arc + one CTA. Don't menu him.

If Orlando says **"the voice still feels off in [specific place]"**: open the playbook, find the relevant tone-by-context guideline, surgical-edit the offending line. Don't generate from scratch — Orlando's feedback in this session was that fresh drafts often miss; iterating on his own phrasing tends to land.

If Orlando says **"add love and light to [specific page]"**: write the surrounding paragraph first to establish the remembrance / consciousness frame, then drop the phrase inside it. Never as the first substantive line.

---

## Open commits / pending work

The git index lock was held by Cowork's auto-commit hook for most of this session, so I couldn't manually commit. Files staged but not yet committed (Cowork's auto-commit will catch them):

- `generate.js` (BESPOKE_PILLARS guard)
- `proposals/WEBSITE-FEEDBACK-2026-04-28.md`
- `proposals/FRQNCY-VOICE-PLAYBOOK.md`
- `proposals/SESSION-RECAP-2026-04-28.md` (this file)
- `index.html` (hero shipped)
- `about.html` (hero shipped)
- `CLAUDE.md` (voice playbook reference added)

The Fund page edits (`v2/fund/index.html`) were already swept into commit `20a78f6` mid-session.

The 60+ unstaged files in `git status` are regen drift from a `node generate.js` test run earlier in the session — not from intentional editing. `git checkout v2/` resets them. They're left unstaged on purpose so they don't pollute the intentional commits.
