# Welcome sequence v1 — the mail that actually sends

> Written 2026-08-02, the day Resend went live. Email 1 is **already in the code** (`functions/api/subscribe.js`) and deploys on the next push. Emails 2 and 3 are drafted here and not yet wired — they need a sender (Resend Broadcasts or a scheduled Worker) before they can go out.

## What changed and why this doc exists

Until today every welcome email was silently skipped — `subscribe.js` gates on `env.RESEND_API_KEY` and the key did not exist. The moment the key landed, the old template started going to real people. That template opened with **"You are love and light."** as a direct self-description, which the voice playbook lists as a banished phrase (§ Never-Use Terms: the full form is kept as *concept*, never as public self-description). It also delivered nothing — no audio, no link, no reason to have signed up.

So email 1 was rewritten around one job: **hand over what was promised, in the first screen, with no hoops.**

## The lead magnet

`https://freeyourwish.kevintrudeau.com/?ref=2b9q35`

It is a **link, not a file** — nothing to host, nothing to keep in Drive. It is also an **affiliate link**, which means two standing rules:

1. **Disclosure travels with the link.** Every email and every page carrying it states plainly that it is an affiliate link and that FRQNCY earns a share. Never in small print at the bottom of a different page.
2. **No income or outcome claims.** The course is described by what it *is* (recordings on how wanting works), never by what it will *do* for someone's money, health, or life. This is the KT compliance spine — "supports / promotes," never "cures / guarantees."

The disclosure line, used verbatim everywhere:

> The audio course link is an affiliate link. If you later buy something through it, FRQNCY earns a share. It costs you nothing extra, and we would send you the course either way.

That last clause is the abundance frame doing real work. It is also true, which is why it can be said.

## Email 1 — the handover (LIVE in code)

**Subject:** Your free audio course
**Sends:** immediately on signup, to new addresses only (`isNew` gate)

**Shape:** logo → headline "Here is the audio course." → sub "You asked for it. No hoops." → the button, above the fold → three short paragraphs → the four doors → the abundance close → disclosure.

The button sits before the explanation on purpose. Someone who signed up for a thing should get the thing before they get our philosophy. The paragraphs are there for the people who scroll, not as a toll gate for the people who don't.

**Body copy** (present tense, triads, no hedging):

> It is Kevin Trudeau on how wanting actually works. Put it on in the car, on a walk, anywhere you would otherwise be scrolling.
>
> We hand it over first because it treats desire as a compass rather than a problem. That is the same place FRQNCY starts.
>
> FRQNCY is a network of people building their dream life. 146 maps of how money, energy, mind and matter work. All of it free to read. The thesis is never behind a wall.

**Close:**

> We write when there is something worth opening. If this is not for you, unsubscribe below and we will not find you again.

Lifted in spirit from the Substack re-engagement email, which the playbook names as the cleanest live copy FRQNCY has.

## Email 2 — one teaching (drafted, not wired)

**Send:** day 3
**Subject:** The oldest money rule still holds
**Job:** prove the free layer is real. Deliver a complete idea that costs nothing and asks for nothing.

> Four thousand years ago a clay tablet in Babylon carried one instruction: keep a tenth of what you earn before anyone else touches it.
>
> Not invest a tenth. Not budget a tenth. Keep it. The order matters — everything else in the tablet follows from paying yourself first.
>
> It survives because it is not really about money. It is a rule about who gets to decide where your energy goes.
>
> Try it for one month. One tenth, moved the day it arrives, before any other line. Then tell us what changed — reply to this mail, we read them.
>
> More of this: frqncy.network/money

No sell. One idea, one experiment, one door. The reply request is the cheapest relationship-building instrument we have and it costs nothing to honour.

**Door-aware variants** (use `source` on the subscriber row): spirituality → Neville on assumption · books → the one-line-per-book format · breathwork → a 90-second practice. Same structure, same length, different door.

## Email 3 — the soft ask (drafted, not wired)

**Send:** day 7
**Subject:** What we are actually building
**Job:** name the project, invite the ones who want closer, release the ones who don't.

> FRQNCY is a network of people building their dream life. 146 topic maps, a growing library, and a group of people who would rather compare notes than compete.
>
> Everything public stays public. No ads, no paywall on the thesis, ever.
>
> If you want to be closer than a mailing list, the door is here: [membership / app link]
>
> And if the audio course was all you came for, that is a complete transaction. Keep it, we are glad you have it.

Last line is not decoration. It is the "no transaction produces a loser" rule applied to a funnel, and it is the difference between this sequence and every other one in the niche.

## Where this goes next — the app

Once the FRQNCY app is on a store, **email 3 becomes the download-and-test mail** rather than a generic membership ask:

> The app is on your phone in a minute. Wake, practice, reflect — the same maps, in your pocket.
> [App Store] [Play Store]
> Tell us what breaks. You are early, and early is the point.

That framing — *you are early, and early is the point* — recruits testers without positioning them as unpaid labour, and it is honest about the state of the thing. Hold this until there is a build worth installing (`app/docs/SHIPPING-2026-04-29.md` for state).

## Open, and honestly open

- **Nobody has read email 1 rendered.** It was written and shipped to code in one pass. Send yourself one before the doors go live.
- **Emails 2 and 3 have no sender.** Resend Broadcasts is the cheap path; a scheduled Worker is the controllable one. Undecided.
- ~~No unsubscribe link exists yet.~~ **Built 2026-08-02** — see below.
- **The doors do not capture email yet.** `/money`, `/spirituality`, `/books`, `/breathwork` exist as pages but none of them call `/api/subscribe`. The sequence has nothing feeding it until that lands.

---

# Unsubscribe — built 2026-08-02

`functions/api/unsubscribe.js`. Not a nicety: CAN-SPAM §5 requires a working opt-out, GDPR art. 21 requires the right to object, and since February 2024 Gmail and Yahoo require **RFC 8058 one-click** from anyone sending in volume — without it, bulk mail gets throttled or binned regardless of how good the DKIM setup is.

## How it works

**The token is the address, encrypted.** AES-GCM, key derived by SHA-256 from `UNSUBSCRIBE_SECRET` (falling back to the service key). The email never appears in a URL, a query string, a referrer header or a server log. Tamper with a single character and it decrypts to nothing — verified: forged tokens minted under a different secret are rejected with 400.

**GET never unsubscribes.** It renders a page with a button that POSTs. This matters more than it sounds: mail clients and corporate security scanners prefetch every link in an email, so a mutating GET would silently unsubscribe people who never clicked. One-click is POST by specification for that exact reason.

**Two entry points, one behaviour:**

| Path | Who uses it | Result |
|---|---|---|
| `List-Unsubscribe` header + `List-Unsubscribe-Post` | Gmail/Apple Mail's native "Unsubscribe" button | POST, done in one press |
| Visible link in the body and the footer | Everyone else | Confirmation page → button → done |

**On success** it sets `unsubscribed_at` and flips `confirmed` to false. The column already existed in migration 003, so no schema change was needed.

**On failure it does not lie.** If Supabase errors, the page says *"You are not unsubscribed yet"* and offers a reply-to-a-human path, rather than showing a friendly confirmation for something that did not happen. Verified against a stubbed 500.

## Verified

Seven cases, run locally against the real module: token round-trip · address does not appear in the token · valid GET renders the masked address and a POST form · tampered token → 400 · token forged under a different secret → 400 · one-click POST issues the correct `PATCH .../subscribers?email=eq.…` with the right payload · database failure → 502 and an honest message.

**Not verified:** nothing has run on Cloudflare yet, and no real mail client has rendered the header. Both need a deploy.

## Still to do

- **Set `UNSUBSCRIBE_SECRET`** as its own Cloudflare secret. It works today off the service key — HMAC/AES never expose the key — but tying the two together means rotating the database credential silently invalidates every unsubscribe link in every inbox.
- **Emails 2 and 3 must filter `unsubscribed_at IS NULL`** when the sender is built. The welcome mail is safe because it only fires on new rows, but a broadcast that ignores this column would mail people who already left, which is precisely the violation this route exists to prevent.
- **Send yourself one and press it**, before the doors go live.
