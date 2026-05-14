# 03 — IA + content review

reviewed at 390×844 against http://localhost:5173/ on 2026-05-14. paths cited are absolute, in `app/src/`. labels are quoted verbatim.

---

## 1. [P0] same surface, three names — sanctuary vs. my frqncy vs. membership reads as a mystery riddle

**location** explore tab, "your space" section (`app/src/index.html:390-407`)

**as written**

> sanctuary — your private dashboard — practice log, mood charts, your daily path. local-first, only visible to you.
>
> my frqncy — birth data + your design — human design chart, gates, alignment with FRQNCY's topic graph.
>
> membership — network access — support FRQNCY, unlock the deeper layers, your referral code.

three cards. each is some flavor of "your private place inside FRQNCY". a first-time user has to read all three twice to figure out the actual distinctions: sanctuary is a log, my frqncy is a chart, membership is a paywall + referral. but the labels don't say that — they say "your private dashboard", "birth data + your design", "network access". titles are doing none of the disambiguating work.

worse: `sanctuary` (eyebrow) and the cta on home — "open my sanctuary" — together imply sanctuary is THE personal layer, but then "my frqncy" and "membership" appear next to it as siblings. mental model collapses.

**proposed rewrite**

merge the cards under one section, rename for distinctness:

```
your space
  practice log       — sanctuary
  daily path, mood, what you've sat with
  
  your chart         — my frqncy
  birth data, human design, where you align
  
  member tier        — support frqncy
  unlock the deeper layers + your referral code
```

(eyebrows describe the *thing*, titles describe the *category*. that flip alone removes ~80% of the confusion.) the "sanctuary" CTA on home should drop to "open my practice log" or go away entirely until home is itself a private surface.

---

## 2. [P0] home cta "open my sanctuary" + home card "sanctuary / your private dashboard" + explore card "sanctuary / your private dashboard" = three buttons to the same URL

**location** `app/src/index.html:353, 362, 392` — all three resolve to `https://frqncy.network/my-frqncy/dashboard/`

three different chrome surfaces (the primary CTA stack, the home cards, the explore cards) each carry an entry to the same destination. only the explore one adds "mood charts" to the desc; otherwise the cards are near-duplicates of each other.

this is the classic "every menu item appears in every menu" antipattern. it telegraphs editorial uncertainty about what home is *for*. if home is "your wake practice + a launcher", drop the duplicate sanctuary card — leave the CTA. if home is "everything", drop the duplication from explore.

**proposed restructure**

home = ONE primary CTA (`set up my wake-up`), zero secondary CTA, three discovery cards (`tonight`, `social`, `explore`). sanctuary lives only on explore, where it belongs alongside its siblings. if a user is far enough into the app to want their dashboard, they're tab-fluent enough to find it.

---

## 3. [P0] "the whole network, in here." — explore page lede contradicts itself the moment you tap

**location** explore page (`app/src/index.html:385-388`)

**as written**

> the whole network, in here.
>
> everything FRQNCY ever published, framed inside the app. nothing leaves to a browser.

every card on this page opens an `https://frqncy.network/*` URL via `openExternal()` (`app/src/main.ts:78-97`). yes, they render inside the iframe, not the system browser — but the user sees a navigation breadcrumb saying "FRQNCY / NRG", a footer, scroll dynamics that match the web. it *feels* like a browser, because it is one wrapped in chrome.

the lede oversells. "nothing leaves to a browser" is the kind of marketing claim that immediately rings false on contact with the product.

**proposed rewrite**

```
explore frqncy

every topic, every domain, every pillar — in the app.
no jumping out, no new tabs.
```

drop the "everything FRQNCY ever published" overclaim. "everything" is unverifiable and prompts the user to look for missing things.

---

## 4. [P1] "nrg" needs a sentence to explain itself; right now it has zero

**location** home + explore (`app/src/index.html:367-371, 411-415`)

**as written**

> nrg — the social layer — posts, replies, federated bluesky timeline. no rankings, no streaks.

"nrg" is a coined brand word, not an english noun. the title "the social layer" is engineering language — users don't think in layers. "federated bluesky timeline" assumes the user knows what bluesky is and what federation means. "no rankings, no streaks" is correctly value-led but it's defining a thing by its absence, which only works if the user already knew what they were missing.

**proposed rewrite**

```
nrg — talk with the network
short posts, replies, threads. flows from bluesky too.
```

drop "federated"; drop "social layer"; drop the value-statement on the card and let the absence of rankings/streaks speak through the actual UI when they get there.

---

## 5. [P1] "the alarm fades in over 90 seconds. dismissing is one breath, held." appears on the home card AND inside the bedside welcome modal — verbatim near-duplicate

**location** home card `tonight` desc (`app/src/index.html:360`) + bedside welcome modal (`app/src/app/bedside.html:448-450`)

**as written, home card**

> set a time. the alarm fades in over 90 seconds. dismissing is one breath, held.

**as written, bedside welcome modal**

> set a time. the tone fades in over 90 seconds. dismissing the alarm is one breath, held — not a tap, not a swipe.

same content, slightly different wording ("alarm fades" vs "tone fades"; "dismissing is one breath, held" vs "dismissing the alarm is one breath, held — not a tap, not a swipe"). the second is the better version. the home card should preview the bedside experience, not re-explain it.

**proposed rewrite**

home card becomes pure orientation, no explanation:

```
tonight
arm tomorrow's wake
six minutes to set up. lasts forever.
```

the modal owns the "softer way to wake" pitch.

---

## 6. [P1] FRQNCY casing is inconsistent — all-caps in body copy, lowercase in eyebrows + cta

**location** everywhere

`welcome to FRQNCY` (h1, home), `browse FRQNCY` (eyebrow, explore), `support frqncy` (cta, settings), `frqncy.network` (links), `FRQNCY is a network of people…` (about copy), `tonight's session` (bedside), `Bedside Mode` (reliability note, title-case)

three casings co-existing: ALL CAPS, lowercase, Title Case. brand mark is FRQNCY; that's the public name. the voice playbook is lowercase across the board for body copy. settle on:

- `FRQNCY` in branded contexts (title bar, h1, signed name)
- `frqncy` in lowercase running copy ("a network of people building their dream life")
- never Title-Case (`Bedside Mode`)

**proposed**: keep `welcome to FRQNCY` (h1, branded) but kill `browse FRQNCY` (lowercase: `browse frqncy`), `support frqncy` (fine), and rewrite the about copy to lowercase: `frqncy is a network…`. `Bedside Mode` → `bedside`.

---

## 7. [P1] welcome modal in bedside fires every time the iframe reloads, not just first-launch — verified by clicking around

**location** `app/src/app/bedside.html:513-517`

**as observed**

navigating from home → bedside → another tab → back to bedside fires the welcome modal again. the localStorage gate (`WELCOME_ACK_KEY`) is set on dismiss, but in-app navigation seems to be remounting the iframe such that the dismiss state isn't sticking across the session in dev. needs verification in production capacitor build, but the symptom is severe enough to flag.

even if it does stick — gating the bedside surface with a modal at all is a low-stim violation. the user already knew what they were doing when they tapped "set up my wake-up" from the home CTA. the modal repeats the same copy they just clicked through.

**proposed**

remove the welcome modal entirely. its content (90s fade, one breath, not a tap not a swipe) belongs in either:
1. the home card description (where the user makes the decision), or
2. a single static line on the bedside page itself, above the alarm card: `set a time. the tone fades in over 90 seconds.`

---

## 8. [P1] "tonight's session" → drops you into a chooser titled "tonight" with no entry context

**location** `app/src/app/bedside.html:431` ("tonight's session" button) → `app/src/app/sleep.html:209` (chooser titled just "tonight")

**as observed**

tapping "tonight's session" from bedside loads sleep.html. the chooser has the eyebrow `tonight` and three cards (stillness / release / drift). no h1, no orientation, no "this is your wind-down". the back affordance is `← system back` only — no on-page exit.

a first-time user lands here and asks: am i still in bedside? what is this? why are there three cards? what happens if i tap one?

**proposed**

add an h1 and a lede:

```
wind-down — tonight

pick a path. all three end with the screen going dark and the audio fading to silence.

stillness
release
drift
```

also: add a back button (`← back to bedside`) so the user has an explicit exit. relying on system back here violates discoverability.

---

## 9. [P1] "drift" sits next to "stillness" and "release" but its data-moment is "evening" — mental-model leak

**location** `app/src/app/sleep.html:221-224`

**as written**

```html
<div class="option" data-moment="evening" data-duration="45">
  <div class="option-name">drift</div>
```

the audio file picker maps "drift" → "evening" tag. that's a backend concept. but the user sees "stillness / release / drift" as a clean trio. why isn't the third one called "evening"? or why aren't the first two called "morning" and "midday"? the categories are arbitrary — they don't form a coherent set.

**proposed**

either:
- rename internally: data-moment becomes `drift` (matching the label), and the resource picker tag is renamed too, or
- pick three labels that form an obvious trio: `sit / release / drift`, or `arrive / let go / sleep`. anything where the three nouns clearly belong to one taxonomy.

---

## 10. [P1] settle-eyebrow says one thing, settle-title says another — and they disagree

**location** `app/src/app/sleep.html:233-234, 535-537`

**as observed**

tap `release` → modal eyebrow reads `release the day`. title reads `settle in.`

tap `stillness` → eyebrow reads `stillness`. title reads `settle in.`

tap `drift` → eyebrow reads `let me drift`. title reads `settle in.`

three different eyebrow phrasings ("release the day", "stillness", "let me drift") with one shared title. one is a verb phrase, one is a noun, one is a first-person aspiration. the inconsistency reads like three writers were each given one card.

**proposed**

unify the eyebrow voice. all three should be the same grammatical form. e.g., noun-only: `release` / `stillness` / `drift`. or verb-only: `release the day` / `sit with what's here` / `fall asleep`. then make the title earn its place — `settle in.` is okay but generic. `take your time.` or just dropping the title in favor of a longer lede would feel more deliberate.

---

## 11. [P1] "settle in." → "no rush. when you're ready, tap." — but the button below says "begin", not "tap"

**location** `app/src/app/sleep.html:233-236`

**as written**

> settle in.
>
> no rush. when you're ready, tap.
>
> [ begin ]

the copy says `tap`, the button says `begin`. tiny but it forces a micro-translation. either say `tap when ready` and the button says `tap`, or the copy says `when you're ready, begin` and the button says `begin`. consistency is the gesture.

**proposed**

```
take your time.
when you're ready, begin.

[ begin ]
```

---

## 12. [P1] "tonight's session" is a button label, not a destination name. the destination has no name.

**location** `app/src/app/bedside.html:431`, the link from bedside

**as observed**

the button reads `tonight's session`. the page it goes to is `sleep.html` with a chooser titled `tonight`. neither says "wind-down" or "evening practice" or any name that survives the tap. there is no surface in the app named "sleep" that a user can refer to.

**proposed**

call the surface what it is. options:
- `wind-down` (matches what the audio actually does — fades over 45 min)
- `tonight's practice` (parallel to "tomorrow's wake")

pick one and use it in both the button (`tonight's practice →`) and the destination h1 (`tonight's practice`). right now the destination is anonymous.

---

## 13. [P1] "arm for tonight" is industrial language for a meditation app

**location** `app/src/app/bedside.html:426`

**as written**

> arm for tonight

"arm" is bomb-disposal language. it's also alarm-clock-app convention (sleep cycle, alarmy). but FRQNCY's voice rejects convention — that's the whole point. "arm" makes the breath-as-gesture work harder to overcome the surrounding militancy of the cta verb.

**proposed**

```
set for tomorrow morning
```

or:

```
ready tomorrow's wake
```

both keep the temporal frame ("tomorrow morning" is more specific than "tonight" anyway — tonight is when you set it; the alarm fires tomorrow). when armed, the button becomes `set · tap to clear` instead of `armed · tap to disarm`.

---

## 14. [P2] "practice the dismiss gesture →" with a right-arrow suggests a settings page; it's actually the full alarm screen in preview mode

**location** `app/src/app/bedside.html:427`

**as written**

> practice the dismiss gesture →

the arrow + the small font (`.practice-link`) reads like a "learn more" link. tapping it loads the full alarm.html in preview mode — a fullscreen takeover with a 6-second breath hold and almost no escape affordance (close-dot? back button only). the affordance promised something lightweight; the destination is heavy.

**proposed**

```
[ rehearse the wake gesture ]
```

— a button, styled secondary, with explicit framing. and in alarm.html?preview=1 add a visible `← back to bedside` button so the user can leave without committing the full ritual.

---

## 15. [P2] "For best reliability:" is sentence-case in a lowercase universe

**location** `app/src/app/bedside.html:435`

**as written**

> **For best reliability:** plug your phone in and leave FRQNCY open in Bedside Mode.

three casing breaks in one sentence: `For` (sentence-case), `FRQNCY` (allcaps), `Bedside Mode` (Title Case). everything else on the page is lowercase. this reads like microsoft windows boilerplate dropped into a calm meditation app.

**proposed**

```
for reliable wake: plug in your phone, leave frqncy open in bedside mode overnight.
```

---

## 16. [P2] "gentle pre-wake / a soft tone room-fills 15 min before wake" — "room-fills" is being used as a verb and it lands wrong

**location** `app/src/app/bedside.html:407`

**as written**

> a soft tone room-fills 15 min before wake

"room-fills" wants to be poetic. it forces the reader to parse `room` as a noun, then realize `fills` is the verb, then realize the hyphen is doing compound-verb work that english doesn't quite support. a beat lost.

**proposed**

```
a soft tone, fifteen minutes before. fills the room slow.
```

or simpler:

```
a soft tone begins 15 min before wake, rising slowly.
```

---

## 17. [P2] toggle copy is hyper-specific (90s fade, 15 min pre-wake, 60-second pattern) but the labels are abstract ("video field", "post-wake reflection") — the specificity is in the wrong layer

**location** `app/src/app/bedside.html:404-424`, settings `app/src/app/settings.html:124-147`

**as observed**

three toggles read as: `gentle pre-wake / a soft tone room-fills 15 min before wake`, `video field / a faint golden gradient on the wake screen`, `post-wake reflection / one question after arriving — no answer needed`.

the labels are mystery nouns ("video field"?), the sub-copy explains the mystery. user has to read both halves of each row to make a yes/no decision.

**proposed**

labels become plain. sub-copy stays.

```
soft tone before wake — fifteen minutes early, rising slow
warm screen on wake — faint gold gradient, dim by default
one question after — no answer needed, no save
```

now the label is the decision. the sub-copy is the proof.

---

## 18. [P2] settings page about-paragraph drifts prose-y; voice says "lean"

**location** `app/src/app/settings.html:178-187`

**as written**

> FRQNCY is a network of people building their dream life. this app is the bedside companion — a wake and sleep practice that treats your mornings as arrivals and your evenings as arcs that end.
>
> cooperation over competition. presence over metrics. the gesture is the arrival.

two paragraphs that try to do everything: brand definition, app role, philosophy. "treats your mornings as arrivals and your evenings as arcs that end" is the kind of sentence that sounded great in a draft but doesn't survive being read in a settings screen.

**proposed**

```
frqncy is a network of people building their dream life.

this app is the bedside part. wake softer, sleep slower.
cooperation over competition. presence over metrics.
```

three lines, three ideas. the "gesture is the arrival" line gets retired — it's a moment from the alarm screen, not a tagline for the about box.

---

## 19. [P2] "delete your data" and "privacy notes" are styled as gold action links, sit next to "version" and "device" which are gray meta-rows — they read with equal visual weight

**location** `app/src/app/settings.html:189-193`

**as written**

```
version       0.1.0
device        web
frqncy.network ↗
delete your data
privacy notes
```

the legal/destructive actions (`delete your data`) are visually identical to "frqncy.network" the marketing link. a user looking to delete their data has to read the labels carefully — the affordances don't differentiate.

**proposed**

split into two row groups:

```
about
  version     0.1.0
  device      web

links
  frqncy.network ↗

your data
  privacy notes ↗
  delete everything ↗
```

destructive action lives in its own labeled group. "delete your data" → "delete everything" makes the scope explicit (FRQNCY can't delete your phone, only the data it holds).

---

## 20. [P2] tab labels are Title-Case ("Home", "Explore", "Bedside", "You") in an all-lowercase brand

**location** `app/src/index.html:459-474`

**as written**

```
◎ Home    ◈ Explore    ☾ Bedside    ◇ You
```

every other label in the app is lowercase. the tab bar is the most-seen chrome in the app and it's the only place that capitalises. probably done because mobile tab bars usually capitalize — but that's the convention the brand explicitly rejects elsewhere.

**proposed**

`home / explore / bedside / you` — lowercase, matches everything else.

---

## 21. [P3] tab icons are geometric shapes (◎ ◈ ☾ ◇) — three of the four are diamonds with subtle variation; only the moon for bedside reads at a glance

**location** `app/src/index.html:459-474`

three of the four glyphs (`◎`, `◈`, `◇`) are circle-in-circle, diamond-with-dot, diamond — visually similar at 20px. only `☾` (moon) carries semantic meaning. the home and you icons are basically the same shape.

this is a P3 because users learn tab positions quickly — but the icons aren't doing work. either commit to four distinct symbols, or use lucide/feather icons (home / compass / moon / user) and let the geometry rest.

---

## 22. [P3] "support frqncy ◇" — diamond glyph appended for no semantic reason

**location** `app/src/app/settings.html:197`

the diamond `◇` here is decorative. it isn't a brand mark (frqncy's mark is the breathing circle). it isn't a category indicator. it's just there.

**proposed**

drop the glyph. `support frqncy` reads cleaner.

---

## 23. [P3] reflection note on wake.html: "private. saved on this device. never shown back to you." — three short fragments without subjects, all caps-shy

**location** `app/src/app/wake.html:218`

**as written**

> private. saved on this device. never shown back to you.

three sentence fragments. the rhythm is choppy. "never shown back to you" is also slightly unsettling — saved but never shown? what is it for? is it analytics?

**proposed**

```
private. stored on this phone only. you can read it back from the practice log, or never.
```

— gives the user a reason for the save (revisit from practice log), and connects the action to "sanctuary" (the practice log). also resolves the mystery of "why save if never shown".

---

## 24. [P3] explore section labels "your space" + "the network" — second one is undefined

**location** `app/src/index.html:390, 409`

`your space` is intuitive (private). `the network` follows but it's never defined what makes "watch" or "music" or "aligned goods" part of "the network" versus part of "your space". why is "music" in "the network"? music feels personal, not networked.

**proposed**

rename for content type:

```
your space      — sanctuary, my frqncy, member tier
explore frqncy  — topics, watch, courses, music, aligned, people
talk            — nrg
```

three categories, each with a clear definition.

---

## 25. [P3] "the best of everything, curated" sounds salesy in a brand that says "no calls framing"

**location** `app/src/index.html:438`

**as written**

> aligned goods — the best of everything, curated — tools, books, gear, supplements — what's actually worth using.

"the best of everything" is amazon copy. "what's actually worth using" is the better line, more in voice. lead with that.

**proposed**

```
aligned — things worth owning
books, tools, supplements, gear. the short list, not the long one.
```

drop "curated" (overused), drop "best of everything" (unverifiable superlative), drop "goods" (commerce-speak).

---

# summary for orlando

top three findings, in priority order:

1. **the "your space" trio (sanctuary / my frqncy / membership) doesn't form a coherent mental model.** three cards point to three different private-ish surfaces with overlapping labels — "your private dashboard" vs "birth data + your design" vs "network access". a brand-new user spends real seconds parsing the difference. the eyebrows and titles need to swap roles (eyebrow = thing, title = category), and "sanctuary" needs to stop appearing on home as a primary CTA when it duplicates a card directly below.

2. **the home screen has three buttons to the same destination (sanctuary dashboard).** the primary "open my sanctuary" CTA, the "sanctuary / your private dashboard" home card, and the explore-tab "sanctuary" card all resolve to `frqncy.network/my-frqncy/dashboard/`. it telegraphs editorial uncertainty about what home is *for* and dilutes the wake-practice focus the home copy claims ("start with how you wake"). drop the duplicates; let each surface own one job.

3. **"the whole network, in here. — nothing leaves to a browser." overpromises and gets caught.** every card on explore opens an `https://frqncy.network/*` URL inside an iframe — that's a browser wrapped in chrome, and the user sees breadcrumbs and footers that betray it. the lede is a marketing claim that immediately rings false on contact with the actual UI. tighten to what's true: "every topic, every domain — without jumping out."

15 more findings below cover the welcome-modal echo on bedside (P0 if it really fires on every visit), the "arm for tonight" / "tonight's session" / "stillness vs evening" mental-model fractures, the inconsistent FRQNCY casing across surfaces, and the smaller copy rhythm problems on toggles, settings, and reflection prompts.
