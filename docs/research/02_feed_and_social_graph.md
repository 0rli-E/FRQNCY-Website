---
section: "Feed Ranking and Social Graph"
author: research-agent-2
date: 2026-04-18
---

# Feed Ranking, Social Graph, and What Makes People Come Back

## 1. What Actually Makes Social Networks Retain Users

Retention in social products is not, despite a decade of executive cant, a function of "engagement." It is a function of perceived signal-to-noise on each return visit. The user opens the app, samples the first three to seven items, and makes a sub-second decision about whether the session was worth it. Every major platform's ranking history is a record of trying to maximize the probability that those first items feel non-random and non-stale.

**Twitter / X.** The "For You" timeline, partially open-sourced in March 2023, runs a three-stage funnel: candidate sourcing reduces ~500M daily tweets to ~1,500 per user, the Heavy Ranker (a 48M-parameter parallel MaskNet) scores those candidates, and a heuristics layer filters and diversifies before presentation [source: https://blog.x.com/engineering/en_us/topics/open-source/2023/twitter-recommendation-algorithm]. The Heavy Ranker outputs probabilities for ~10 engagement events; the published weights are revealing — `reply` is weighted 13.5, `reply_engaged_by_author` 75.0, `like` 0.5, and `report` -369.0 [source: https://github.com/twitter/the-algorithm-ml/blob/main/projects/home/recap/README.md]. The system is explicitly biased toward conversation and away from passive consumption. Where it fails: the candidate-source split (about 50% in-network, 50% out-of-network) regularly surfaces strangers' posts that have nothing to do with the user's social graph, producing the now-canonical "why am I seeing this" complaint [source: https://solomonmg.github.io/post/twitter-the-algorithm/]. The Following timeline still exists but is hidden behind a tab; usage data Twitter will not publish strongly suggests it is a minority experience.

**Facebook EdgeRank and after.** The original EdgeRank (2010) scored each "edge" (post) as `affinity * weight * time_decay` — three terms, easy to reason about [source: https://en.wikipedia.org/wiki/EdgeRank]. By 2013 Facebook was using >100,000 features, and the algorithm became a black box [source: https://markinuity.com/uncategorized/the-evolution-of-the-facebook-algorithm/]. The 2018 "Meaningful Social Interactions" pivot weighted comments and shares from friends and family far above passive likes and Page content. Internal documents later leaked via the Facebook Files showed this change measurably increased outrage content because comments-per-impression was highest on divisive posts — a textbook Goodhart failure. The lesson FRQNCY must internalize: any single-objective ranking signal will be gamed, and "comments" is the most dangerous of all because it correlates with controversy.

**TikTok / Monolith.** TikTok's recommender (Monolith, ByteDance, 2022) is an interest-graph system, not a follow-graph system. It uses collisionless Cuckoo-hash embedding tables and online training that updates on user feedback within seconds [source: https://arxiv.org/pdf/2209.07663]. The follow graph is almost decorative. This works because TikTok has billions of (user, video) interactions per day; the embedding table can densely cover interest space. It does not work for a network of 1,000 people. Retention here comes from raw novelty velocity, not social meaning, and the well-documented attentional cost is the entire reason FRQNCY's positioning exists.

**Reddit.** Reddit ships three sorts that each solve a different problem. *Hot* uses `score = log10(max(|U-D|,1)) * sign(U-D) + (T - 1134028003) / 45000`, where the log of net votes is added to a linear time term — old posts decay because the time term keeps shrinking relative to new posts [source: https://medium.com/hacking-and-gonzo/how-hacker-news-ranking-algorithm-works-1d9b0cf2c08d]. *Best* (for comments) uses the Wilson lower-bound on the upvote ratio, which correctly penalizes small samples: a comment with 3/3 upvotes ranks below one with 280/300 because we are uncertain about the true rate [source: https://www.evanmiller.org/how-not-to-sort-by-average-rating.html]. *Top* is the trivial baseline. The genius of Reddit is offering all three with a visible toggle — algorithmic choice avoided by every ad-funded platform.

**Hacker News.** `score = (P - 1) / (T + 2)^G`, gravity G = 1.8 [source: http://www.righto.com/2013/11/how-hacker-news-ranking-really-works.html]. Because votes are linear and time is super-linear, every post eventually reaches zero. This is a feature: HN's front page turns over completely in ~24 hours, which is exactly what makes it worth re-checking.

**Instagram.** The 2022 Reels pivot — explicitly a competitive response to TikTok — caused a 50% reach decline for non-Reels posts in 2023 and provoked the "Make Instagram Instagram Again" backlash from Kardashian and others [source: https://www.v9digital.com/insights/engagement-wars-tiktok-loses-ground-as-instagram-reels-gain-momentum/]. The platform now weights `sends-via-DM` as the heaviest distribution signal — a private-share signal as proxy for genuine value. The lesson: bookmark and DM-share are stronger quality signals than likes.

**Mastodon.** Strict reverse chronological. The 2025 CSCW study of Mastodon users (Liu et al.) found that 8 of 11 participants liked chronological order for transparency but most also wanted "lightweight, transparent" algorithmic surfacing of missed posts — the absence of any ranking is itself a usability failure once a user follows >100 accounts [source: https://arxiv.org/html/2504.18817]. Mastodon's flat retention curve outside the Twitter-exodus spikes is the empirical proof.

**Bluesky.** The most useful precedent for FRQNCY. Built on AT Protocol, Bluesky separates identity, data, and ranking into independent layers and exposes a marketplace of "custom feeds" — community-built algorithms users can install [source: https://bsky.social/about/blog/7-27-2023-custom-feeds]. By 2026 the platform reached >25M users with no algorithmic lock-in and is now experimenting with AI-generated personal feeds via Attie [source: https://techcrunch.com/2026/03/28/bluesky-leans-into-ai-with-attie-an-app-for-building-custom-feeds/]. Algorithmic *choice*, not algorithmic *absence*, is the actual answer.

## 2. The Tradeoff Matrix and Where FRQNCY Should Live

Three orthogonal axes:

1. **Chronological ↔ Algorithmic.** Pure chronological breaks above ~100 follows. Pure algorithmic destroys author–reader relationships and makes the network feel like a TV channel.
2. **Follower-graph ↔ Interest-graph.** Follower graphs scale poorly for discovery and reward early-mover network effects. Interest graphs require dense interaction data FRQNCY will not have for years.
3. **Engagement-optimized ↔ Time-well-spent.** Optimizing comments-per-impression breeds outrage (Facebook 2018). Optimizing dwell time breeds infinite-scroll dissociation (TikTok). Optimizing for *return visits with positive recall* is harder to instrument but is the only objective that aligns with FRQNCY's brand.

Given FRQNCY's positioning — a small, conscious-living + crypto-projects community of likely <10K users in year one — the answer is: **lean chronological, follow-graph primary, with a thin algorithmic layer for re-ranking and a separate "Discover" surface for interest-graph exploration.** Concretely, the home feed should be a re-ranked recency-weighted follow feed with conviction-quality and novelty boosts; the Discover tab should run a lighter interest-match scorer over the project tag space. This mirrors Bluesky's split (Following + Discover + custom feeds) which is the only architecture that has demonstrably scaled small-community social without collapsing into either spam or quietude.

## 3. A Concrete Feed Ranking Scheme for FRQNCY MVP

Given the existing schema (`posts`, `follows`, `likes`, `bookmarks`, `comments`, `project_tag`, `project_tier`, `karma`), here is the proposed score for each candidate post `p` for viewer `u`:

```
Score(u, p) = w_R · R(p) + w_G · G(u, p) + w_Q · Q(p) + w_C · C(p, author) + w_I · I(u, p) - Penalties(p)
```

Each term defined:

**Recency** `R(p) = 1 / (1 + (T_now - T_post)/τ)^g`. This is the Hacker News form with τ = 6 hours and g = 1.5. After 6 hours score is halved; after 24 hours it is ~0.18. Tunable per surface (Discover gets τ = 48h).

**Graph proximity** `G(u, p) = α · 1[u follows author] + β · mutuals(u, author)/k + γ · co_engagement(u, author)`. With α = 1.0, β = 0.3, γ = 0.2, k = 5 (mutual follow count saturates at 5). `co_engagement` is the Jaccard similarity of which posts u and the author have both liked or bookmarked over the last 30 days — a cheap second-order signal.

**Quality** `Q(p) = log10(max(L(p) + 3·B(p) + 5·C(p), 1)) · WilsonLB(positive_signals, total_views, 0.95)`. We weight bookmarks 3x likes and comments 5x likes — bookmarks are the strongest implicit-value signal (Instagram's own data agrees), and comments are the strongest explicit-engagement signal but must be capped by the Wilson lower bound to avoid rewarding controversy. Until we have view counts, fall back to `total_signals = L + B + C` as the denominator proxy.

**Conviction-accuracy boost** `C(p, author)` — the FRQNCY-specific term. Defined only when the post has a `project_tag` and the author has a non-empty conviction history:
```
C(p, author) = κ(author, project_tier) · log(1 + n_author_calls)
```
where `κ(author, tier)` is the author's calibrated accuracy on prior calls within that project tier (definition in §4). The `log` factor prevents prolific-but-wrong posters from dominating. **Critical degradation rule:** if `n_author_calls < 3`, set `C = 0` and rely on the other terms. Conviction is a re-ranking *bonus*, never a gate.

**Interest match** `I(u, p) = cos(v_u, v_p)` where `v_u` is the user's project-tag affinity vector (built from their likes, bookmarks, follows, and the projects they have themselves posted about) and `v_p` is a one-hot or TF-IDF vector over the post's tags. Until embeddings are worth building, this can literally be the count of project tags the user has previously interacted with that also appear on `p`, normalized to [0,1].

**Penalties.** Self-vote subtraction (already in HN form). `-50` for any post the user has already seen (decays after 6h so re-surfacing is possible). `-10 · n_recent_posts_by_author_in_feed` to enforce author diversity. `-∞` for posts the user has muted, hidden, or whose author they have blocked.

**Suggested weights for MVP** (will be tuned via offline replay once we have ~10K interactions):
`w_R = 1.0, w_G = 1.5, w_Q = 0.8, w_C = 0.6, w_I = 0.4`. Graph dominates; recency anchors; quality and conviction are tilts; interest is a tiebreaker.

**Graceful degradation.** When `n_users < 100`, set `w_G = 0.5` (most users won't follow many others yet) and `w_R = 2.0` (recency carries the feed). When conviction data is sparse (vast majority of posts have no `project_tag`), the `w_C` term simply contributes 0 and the other four terms span the full ranking. When the user is brand new (no follows, no likes), `G` and `I` collapse to 0 and we serve the global Wilson-Best feed scoped to high-tier projects — Reddit's r/all but quality-gated.

## 4. The Differentiators FRQNCY Must Own

The three things no other platform does well: **project-anchored posts**, **conviction tracking**, **thesis debates**. The reputation system must reward calibrated calls and good-faith disagreement, not volume.

**Extending karma into a calibrated reputation vector.** Replace the scalar `karma` field with a struct stored alongside (kept as derived materialized view, refreshed nightly):

```
profile.karma_v2 = {
  social: float,        // legacy karma (likes + comments received)
  conviction: float,    // calibration score on project calls
  debate: float,        // good-faith debate score
  n_calls_resolved: int,
  brier: float          // mean Brier score across resolved calls
}
```

**Conviction score.** When a user posts about a project with an explicit directional claim (`bullish` / `bearish` with a probability `q ∈ [0,1]` and a horizon `h`), record it. When the horizon resolves, score the call with the **Brier score** `BS = (q - o)^2` where `o ∈ {0, 1}` is the realized outcome. Lower is better; perfect call is 0, max-wrong is 1, uninformed `q = 0.5` gives 0.25 [source: https://en.wikipedia.org/wiki/Brier_score]. The user's `conviction` score is:
```
conviction(u) = (1 - mean_Brier(u)) · log(1 + n_calls_resolved(u))
```
The `log` prevents grinding; the `(1 - BS)` mapping puts an uninformed forecaster at 0.75 baseline and a perfect forecaster at 1.0. For comparison: Metaculus reports an aggregate community Brier of 0.111 [source: https://predictionmarketsreviews.com/reviews/metaculus]; Polymarket sits at 0.187 [source: https://fensory.com/intelligence/predict/polymarket-accuracy-analysis-track-record-2026]. A FRQNCY user with mean Brier 0.20 and 25 resolved calls earns conviction = (0.80) · log(26) ≈ 2.6; a user with 5 calls at the same accuracy earns 1.4. The differential is real but not crushing.

**Debate score.** Reward the rare and underprovided behavior of good-faith disagreement. For any reply that (a) replies to a post tagged with the *opposite* directional claim, (b) cites a source URL or links a counter-thesis, and (c) is itself liked or bookmarked by users *who agree with the original poster's direction*, increment debate score. The third condition is the key — it requires cross-tribe upvoting, which is the closest behavioral proxy for "this changed my mind." A simple form:
```
debate(u) = Σ_replies r in u's_history { 1[has_source(r)] · (likes_from_opposite_camp(r) / max(total_likes(r), 1)) }
```

**Composite display.** The user's profile shows three orbs, not one number: Social, Conviction (with n and Brier), Debate. Feed ranking can use any weighted combination; my suggestion is `w_C` in the feed formula equals `conviction(author) / 10`, capped at 1.0.

**Anti-gaming.** Two bright lines. (1) Calls cannot be edited or deleted after timestamp + 1 hour; the call ledger is immutable thereafter. (2) Self-resolved calls (where the author also creates the resolution) require a second user to confirm. These are the minimum integrity guarantees; without them the conviction system is theater.

## 5. Cold Start

**With 3 users.** There is no feed to rank; there is a chat. Build a single shared room called something like "The Core" for the founding members, ship a /now page that shows the last 20 posts globally in pure reverse chrono, and abandon all ranking. The product at n=3 is a group chat with profiles. Andrew Chen's classic observation applies: the only way to solve the cold start for social products at this scale is to identify a hyper-connected pre-existing network and convert it wholesale [source: https://andrewchen.com/how-to-solve-the-cold-start-problem-for-social-products/]. For FRQNCY that network is the existing 133-topic / 604-resource readership and the founder's direct contacts in the conscious-crypto space.

**With 10 users.** Still no algorithmic feed. Introduce three seeded "rooms" anchored to the highest-tier projects in the existing 630-project database. Each room shows reverse-chrono posts plus the project's resource sidebar. The feed formula's `w_G` and `w_C` are zero; only `R` and `I` (where `I` here means "is this room's tag in the post") matter. Use editorial seeding aggressively — the founder posts a daily thesis to give other users something to react to. This is how Reddit (Steve Huffman's sockpuppets), Quora (Adam D'Angelo's hand-recruited experts), and Product Hunt (Ryan Hoover's email blast) all began.

**With 100 users.** The full formula activates with the small-network weighting (`w_G = 0.5, w_R = 2.0`). Conviction tracking turns on for project-tagged posts but `w_C` stays at 0.3 until ~50 calls have resolved. Add a "What you missed" daily-digest email — a conscious-network analog of Hacker News' Best-of-Week — that uses the `Q(p)` term over a 7-day window, scoped to the user's followed authors and tag overlap. Email digests are the most underrated retention mechanic for small communities; they convert the network's quietness from a bug into a calmness signal.

The deepest cold-start lesson is that, at small scale, *editorial* and *ritual* outperform any algorithm. A weekly pinned thesis-debate prompt, a Friday "calls coming due" digest, and a quarterly conviction leaderboard generate more meaningful return visits than any reweighting of `w_G`. The algorithm exists to keep working when ritual stops scaling — not to substitute for it.

## Recommendation Summary

FRQNCY should ship a **chronological-anchored, follow-graph-primary feed** with a transparent re-ranker that adds quality, conviction, and interest tilts; keep a separate **Discover** surface for interest-graph exploration; expose a **chronological toggle** as a first-class option (Mastodon's mistake was to make this the only choice; Twitter's was to hide it); and treat **conviction calibration via Brier scoring** as the single biggest product differentiator no incumbent can copy without rebuilding around project-anchored content. The reputation system must be a vector, not a scalar, and must reward calibrated disagreement — that is the mechanism that distinguishes a conscious community from a content farm.

---

**Sources cited inline.** Primary references: Twitter Engineering blog and the-algorithm-ml repo (2023); Monolith paper (Liu et al., arXiv:2209.07663); Bluesky custom feeds documentation and AT Protocol design notes; Evan Miller, "How Not to Sort by Average Rating"; Hacker News `news.arc` source via righto.com; Liu et al., "Understanding Decentralized Social Feed Curation on Mastodon" (arXiv:2504.18817); Brier (1950) via Wikipedia; Metaculus and Polymarket public Brier benchmarks; Andrew Chen, "How to solve the cold-start problem for social products."
