# Sanctuary — Daily Use, Re-engagement, and the Graceful Exit

> No shame. No streak alarms. No comparison. Return is a ritual, not a recovery.
> Companion to `proposals/SANCTUARY-ROADMAP.md`. Voice: `proposals/FRQNCY-VOICE-PLAYBOOK.md`.

- Created: 2026-05-16
- Scope: `/my-frqncy/dashboard/` + the email/notification surface that feeds it
- Status: Proposal — five-to-seven concrete asks at the end

---

## The problem we are not solving

The whole industry of re-engagement has converged on one trick: manufacture a small loss, then offer the user the chance to recover from it. Duolingo's owl. The fitness app guilt push. The "your streak is in danger" red badge. It works in the short term — Duolingo's own internal data showed guilt notifications were 5–8% more effective at the day-7 cohort — and it produces the longer arc we now have evidence for: users who delete their accounts the moment they pause, public backlash when the brand picks any second fight (Duolingo's AI announcement landed on a base already exhausted by the owl), and a permanent association between the product and a feeling of being managed.

Sanctuary cannot use any of that. It is the wrong tool aimed at the wrong people. Sanctuary's users are arriving for the opposite of pressure. CLAUDE.md is explicit: no gamification, no comparison, no algorithmic recommendation, no penalty surfaces, no red for "you missed". The dashboard treats streaks as quietly observed and never broken. The question is what to do *instead* when someone has been gone for eight days, eight weeks, or eight months.

This proposal answers that with three patterns and a cadence.

---

## 1. The eight-days-gone return — what to show first

When a Sanctuary user opens `/my-frqncy/dashboard/` after a gap of seven or more days, do not put them back into the dashboard they left. The dashboard's chief-aims grid, habits, scoreboard, and pyramid presume continuity. A returning user reading it cold sees a list of unfinished things and feels the absence as a deficit. That is the exact emotion we are designing against.

Show them a **Return panel** instead — a single full-width card above the tabs, surfaced once, dismissable, with three elements in this order:

**One line of recognition.** Cormorant italic, gold accent, present tense.

> *You're back. The room kept itself.*

No reference to how long they were gone. No "we missed you." No counter. The line names the fact of return without measuring the absence.

**One observation, drawn from their own state.** This is a Return Recap in the UX-research sense — a curated diff, not an activity log. Pulled deterministically from the dashboard's existing data (no algorithm, no recommendation). Examples:

> Three habits sit in your practice. Meditation is the oldest. It has been logged 47 times.
>
> Your chief aim is *to live from wholeness*. You wrote that on March 4.
>
> Your dream line reads: *a small house, two children, a garden that feeds them.* It is still here.

The point of the recap is not to remind them what to do. The point is to demonstrate that the room held its shape while they were gone — that nothing was lost, that the work they did before is still legible, that returning costs nothing.

**One invitation, single CTA.** Not a list of next steps. One.

> *Sit with today's date for a moment. Then begin where it feels honest.*

Below it, a single button: `Open today`. No badges. No "complete your profile." No "you have 3 unfinished goals." If they want to navigate to the pyramid or vision board they can — the tabs are still there — but the default path is one breath, one date, one entry.

The Return panel is shown once per return-after-gap. After that the regular dashboard re-emerges. Storing this is trivial — a `lastSeenAt` timestamp in state, compared on init.

---

## 2. Email and notification cadence

The first question is whether Sanctuary should email at all. The answer is: yes, but rarely, and never for retention.

### What we have learned from the research

The 2025 newsletter data is clear that consistency matters more than frequency: the unsubscribe rate is 125% higher for irregular senders than for any regular rhythm, daily or weekly. Daily emails earn the highest CTR (5.3%) but lose open rate. Weekly remains the popular default (54% of newsletters). The Calm and Headspace product teams describe their notifications explicitly as "interventions, not engagement tactics" — reminders of the user's own intention, not pulls back into the app. The Center for Humane Technology's guidance reduces to one rule: respect the user's time, don't notify unless it's important.

Sanctuary's audience is closer to the meditation-app audience than the newsletter audience. So the cadence is asymmetric:

### Proposed cadence

**The Monthly Letter.** One email per month, written by Orlando, in the voice of the Substack re-engagement email already on file. Not a digest. Not a recap. A short piece of writing — 300–600 words — that lands like a letter from someone who is also doing the work. Sent on the first Sunday of each month. Subject lines are declarative, not curious: "Money is a frequency, not a number" not "Have you thought about money lately?"

**Optional weekly intention prompt.** Off by default. A user can toggle it on inside the Sanctuary. Sends a single line every Sunday morning: "*What did this week serve?*" with a link directly to the daily-intentions field. No content beyond the prompt. No images. No tracking pixel beyond what Substack/ConvertKit attaches by default — and the system should send through a transactional provider where pixels can be disabled if the user requests it.

**The Quiet Return note.** Sent once, only once, only if the user has been away for 30+ days *and* has email notifications on. One paragraph. No subject-line urgency. Suggested copy:

> Subject: The room is still here
>
> You signed up for Sanctuary. You may have stepped away. That is allowed.
>
> Nothing in here measures absence. Your habits, your aims, your dream line — they are where you left them. If you want to return, the door is at frqncy.network/my-frqncy/dashboard. If you do not, no hard feelings. Unsubscribe below and we will not find you again.
>
> — The FRQNCY Team

That is the entire re-engagement program. There is no day-3 nudge, no day-7 streak-loss alarm, no day-30 win-back sequence. The trade we are making is explicit: we accept lower 90-day retention numbers in exchange for the brand never being the thing that interrupted someone's silence to ask why they had not opened an app.

### What we never send

- "You're losing your streak."
- "X people have already started today."
- "We noticed you haven't logged in."
- Any subject line that opens with the user's name as bait.
- Any push notification that includes a counter, a percentage, or a comparison.
- Daily email under any circumstance.

---

## 3. The graceful exit — "I'm not coming back"

When a user wants to leave, the goal is not to convert the unsubscribe into a downgrade-to-monthly. That move — "would you like to receive emails less often instead?" — is the polite version of the dark pattern. It treats the user's stated decision as an opening position to be negotiated. Sanctuary's exit pattern instead matches the voice of the Substack opt-out close, which is the cleanest line we have already shipped: *If it does not, no hard feelings. Unsubscribe below and we will not find you again.*

**At the email layer.** One-click unsubscribe from any footer. No mandatory survey. No "tell us why you're leaving" gate. A single optional textarea after the unsubscribe is confirmed — labelled "*Anything you want to leave behind?*" — that posts to an inbox Orlando reads. Empty submissions are fine. The unsubscribe is already complete by the time they see this field; it is not a hurdle.

**At the Sanctuary layer.** A "Close the room" button inside Settings. Two states:

- *Pause* — keeps the data, signs the user out, removes all notifications. Default. The room sits as they left it. Returning is one login.
- *Close fully* — deletes the cloud row, offers a one-click JSON export beforehand, ends the session. The local copy in IndexedDB is also cleared if they consent. The confirmation copy is plain:

> *You have a copy of everything. Take it with you. The room dissolves on this side.*

No "are you sure?" loops. No "we'll miss you." No retention modal. The closing line at the end:

> *You are still welcome. The door does not lock behind you.*

That sentence is the entire exit-experience payload. It refuses the manipulative architecture without performing humility about it.

---

## 4. Concrete proposals

1. **Build the Return panel.** Add `lastSeenAt` to state. If `now - lastSeenAt > 7 days`, render the Return panel above the tabs on next load. Recognition line + deterministic recap + single CTA. Dismissable, surfaced once per gap. Voice: present tense, italic Cormorant, gold accent.

2. **Lock the email cadence at "rare and asymmetric."** One Monthly Letter (mandatory subscription default). One opt-in Weekly Intention Prompt (off by default). One Quiet Return note at 30+ days of absence (only if email is on). No other automated sequences. Document this in `proposals/SANCTUARY-ROADMAP.md` as a hard cap.

3. **Ship the "Close the room" surface.** Two-button Settings panel: Pause (default, reversible) and Close fully (with JSON export gate). Plain confirmation copy, no retention modals, no "are you sure?" loops. Closing line is *You are still welcome. The door does not lock behind you.*

4. **Remove every red-state notification from the dashboard.** Audit `index.html` for any colour, badge, or string that signals "you missed", "streak in danger", "incomplete", or numbered comparison. Replace with quietly-observed continuity language per the existing CLAUDE.md rule. Already mostly clean; this is a sweep.

5. **Add a `notifications` field to state** with the shape `{monthly: true, weeklyPrompt: false, returnNote: true}`. All three default to user-controllable. The monthly letter defaults on because that is the canonical Substack subscription the user already opted into. The weekly prompt is the only true engagement nudge in the entire system and must default off.

6. **Write the Quiet Return note** and stage it in `functions/email/` (or wherever the transactional template lives). Subject "The room is still here." Body as above. Trigger condition: 30 consecutive days without a dashboard open, email-notifications-on. Sent exactly once per absence-cycle. Resets when the user returns.

7. **Publish a one-page "How Sanctuary handles your attention" note** on `/my-frqncy/dashboard/` itself, linked from the privacy banner. Three paragraphs. Says exactly what is in this proposal in user-facing language: we will not chase you, the streak counter is for your reference and never for our retention, you can close the room any time and we will not find you again. Treat it as a load-bearing trust artifact the way the Aligned Goods "no paid placement" promise is load-bearing.

---

## What we are accepting

This program will produce lower 90-day active-user numbers than any standard re-engagement playbook. That is the trade. The compounding benefit is that the people who do return, return because they want to — not because we manufactured a small loss for them to recover from. Sanctuary is the room where that distinction is the entire product.

— The FRQNCY Team
