# FRQNCY Revenue Model — Plan

Status: thinking doc. No code attached yet. Pick one surface at a time when ready.

## Principle

The website's free public layer and the revenue surfaces share the same architectural shape — the world model carries both. The gift is what makes the trust; the trust is what makes the revenue surfaces credible.

**Non-negotiables (carry from existing decisions):**
- No ads on the public site, ever.
- No paywalls on the read-this-on-FRQNCY content (life stories, profiles, summaries, topic pages).
- No leaderboards, no extraction framing.
- "No paid placement" promise on Aligned Goods is load-bearing — protect it.
- External links are footnotes, not destinations.

## Revenue surfaces

Five plausible. None require breaking the principle above.

### 1. Aligned Goods

**State:** 7 entries in `aligned-goods.json`. All currently flagged `"affiliate": false`. Wired into `entities.json`, `resources.json`, and topic pages.

**Mechanic options (cleanest first):**
- **Vetted-brand contribution** — aligned brands contribute to the Fund (or to a Sanctuary operating budget) in exchange for the FRQNCY pick. Disclosed on the Aligned page. Brand integrity is the product.
- **Direct partnership / revenue share** with full disclosure on each entry: a small "supports FRQNCY" badge, distinct from the FRQNCY pick badge.
- **Affiliate as fallback** only with a per-entry `"affiliate": true` flag and a disclosure footer on the Aligned page. Probably skip this one.

**To do later:**
- Decide which mechanic.
- Add a `revenue_relationship` field to each aligned entry (`null | "contributor" | "partner" | "affiliate"`) so disclosure renders automatically.
- Write the disclosure footer on /aligned/.

### 2. Courses

**State:** 5 courses in `courses.json` (Meditation 101, Quantum Reality, Conscious Living Foundations, Quantum Grammar, Crypto Fundamentals). Each is wired into entities.json and topic pages via `topics:[]`. Free for now.

**Mechanic options:**
- All free with optional donation.
- Free intro lesson + paid full course.
- Tiered: Curious tier free, Practicing+ paid.
- Pay-what-you-can with a suggested price.

**To do later:**
- Add a `pricing` field to each course (`{model:"free"|"paid"|"tiered"|"pwyc", suggested:9}` or similar).
- Wire a checkout flow (Stripe is the obvious starting point; Solana / crypto path possible later given the audience).
- Course completion → unlocks next course / contributes to a "path" the user is on.

### 3. Referrals

**State:** Stub. Two `referral_code: ''` fields in podcast.html and space.html subscribe forms.

**Design:**
- Every member who joins gets a personal referral link: `frqncy.network/?ref=XYZ` where XYZ is a short code derived from their member ID.
- The code is captured at subscribe and stored on the new member's record.
- Referrals are public on the referrer's profile (or private if they prefer).
- Rewards are membership-shaped, not cash: refer 3 → free month of Space membership credit; refer 10 → invite to a quarterly community gathering; refer 25 → permanent founder badge.

**To do later:**
- Decide where member identity lives. Options: Supabase (already in stack), or a tiny custom system. Probably Supabase given it's already wired.
- Generate ref codes on first signup; store in the user record.
- Capture `?ref=XYZ` from URL → write to `referral_code` field on the subscribe POST.
- Build a /my-frqncy/referrals view for the member.
- Decide reward thresholds.

### 4. Sanctuary / FRQNCY Spaces (plural, worldwide)

**State:** /space/ landing page exists. TBA tier placeholders removed. The long arc is not one Space — it's a network of FRQNCY Spaces around the world: physical sanctuaries the network operates in major cities and contemplative locations. Each one is a node of the Sanctuary pillar, the same way Intaaya is a node today.

**Mechanic:**
- Each Space is membership-based. Members of one Space have access (or reciprocal-rate access) to every other Space in the network — the network-state premium that makes membership worth paying for.
- Tier shape (rough sketch — refine when first Space has a date):
  - **Drop-in** — pay-per-visit access for non-members.
  - **Local member** — monthly subscription to a single Space.
  - **Network member** — monthly subscription with reciprocal access to all FRQNCY Spaces worldwide.
  - **Founding member** — limited cohort at each new Space, lifetime rate, founder badge, voice in the room while the Space is being designed.
- Spaces also generate revenue from events: breathwork sessions, dinners, retreats, speaker nights, sound baths.
- Long-term: Spaces own real estate (or long-lease) and the property itself becomes a Sanctuary asset.

**Worldwide expansion shape:**
- First Space — opens with a manual founding cohort, tested live before any tier system goes public.
- Each subsequent Space — copies the operating playbook, has its own local manager, joins the reciprocal network on launch day.
- Listed in the world model: each Space is an entry in `places.json` with location, founding date, teachers in residence, and a /places/[city]/ profile page. The Sanctuary pillar page becomes the live map of the network.
- The Space landing page (/space/) flips from "this Space" to "the Spaces" as soon as #2 opens.

**To do later:**
- Define tier pricing once first Space has a location and date.
- When a Space opens, add it to `places.json` (location, hero text, picked_in: network-state). World model handles the rest — profile page, topic-page presence, search, sitemap.
- Build a /spaces/ index hub (separate from /places/) once there are 2+ FRQNCY-operated Spaces, distinguishing FRQNCY Spaces from network-affiliated places like Intaaya.
- Reciprocity logic — how a Berlin member checks into the Lisbon Space without friction.

**Mechanic options:**
- Donation-based founding circle (no fixed price; suggested ranges).
- Fixed tiers (Drop-in / Member / Founding Member) with monthly pricing.
- Hybrid: drop-in pay-per-visit + monthly resident membership.

**To do later:**
- Decide tier structure when the physical Space exists or has a date.
- Reinstate tier cards on /space/ with real pricing.
- Wire a real signup flow (Stripe subscription or one-off).
- Integrate Luma for the events calendar (placeholder comment is in place).

### 5. Fund pillar

**State:** Conceptual. /v2/fund/ page exists. No deal flow tracking yet.

**Mechanic:**
- A small fund vehicle (LLC or DAO) invests in conscious-business companies the network surfaces.
- Carry from successful exits is the long-tail revenue stream.
- The fund underwrites the free public layer permanently — the cleanest version of network-state economics.
- Limited partners are FRQNCY members at a higher tier, the public capable of investing, and aligned institutional capital.

**To do later:**
- This is a separate workstream. Document the thesis publicly. Track deal flow privately.
- Make sure the Fund and the Aligned Goods don't conflict (Aligned brands cannot also be Fund portfolio companies without disclosure).

## The architectural lever

Everything above scales because of the world model itself.

- One curated entry → reaches everyone, forever, at zero marginal cost.
- One person added to `people.json` → life story, books, topic-page presence, search index, my-frqncy recommendation, all from one edit.
- One course built → infinite delivery.
- One affiliate / partnership / pick decision → propagates everywhere automatically.

This is the leverage that the substack-and-tip-jar model never gets.

## Editorial standards (precondition)

The integrity of every revenue surface depends on the curation staying credible. Before scaling any of the above:

- Define **what makes something a FRQNCY pick** (`picked_in`) versus just appearing on a topic. Today this is set by hand at small scale, which is fine. At 50+ contributors, it needs a principle.
- Define **conflict-of-interest disclosure** for picks where money is involved (Aligned, Fund portfolio, sponsored courses).
- Define **who can mark a pick** as the team grows.

A short standards doc — even one page — protects the network's most valuable asset (the trust) before any of the above goes live.

## Suggested order of execution

1. **Editorial standards doc** (precondition; cheap; high leverage).
2. **Courses** — closest revenue without changing brand promise. Pick one course, set a price, wire Stripe, see if anyone buys. Smallest experiment with the highest learning.
3. **Referrals** — the social-graph asset. Build it before scale, not after.
4. **Aligned Goods relationship structure** — choose the mechanic, add the disclosure field, add the footer. Holds even if no money flows yet.
5. **Sanctuary / Space tiers** — once the physical space has a date.
6. **Fund** — separate, longer-horizon workstream.

---

*Captured 2026-04-25 from a conversation. None of this is wired yet. Edit this doc as the picture clarifies.*
