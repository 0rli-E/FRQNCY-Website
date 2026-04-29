# Stream 6 — Wake/Sleep UX Roadmap for FRQNCY Mobile

## TL;DR

The wellness-tech field in 2025-2026 has split into two camps: hardware-led trackers (Oura, Whoop, Garmin) doubling down on scores and stages despite mounting "orthosomnia" criticism, and a quieter movement toward un-gamified, gesture-led, narration-led wake/sleep design (Loftie, Apollo Neuro, Endel, SilverCloud-style mental-health apps). FRQNCY's breath-hold dismiss and un-engaging sleep flow are already aligned with where the credible literature is pointing — the April 2025 World Sleep Society consensus explicitly warns clinicians against over-interpreting nightly sleep scores, which is the exact pattern FRQNCY rejects. The work for this roadmap is mostly defensive: integrate read-only with HealthKit and Health Connect without re-introducing scores, ship a non-breath accessibility fallback, and tell the OEM-reliability truth on first run instead of hiding behind marketing.

## Patterns from leading apps — keep / reject

| App | Pattern | Decision for FRQNCY |
|---|---|---|
| Alarmy | Photo / math / shake / barcode "missions" to dismiss | Reject. Punitive, wakes by stress. Our breath-hold is the antithesis. |
| Alarmy v2.1.8 (Sep 2025) | Louder alarms, snooze tuning, OEM reliability fixes | Borrow the OEM reliability work, not the loudness escalation. |
| Sleep Cycle | Smart wake window via accelerometer + mic | Borrow as optional, never display the inferred stage back. |
| Loftie | Two-phase alarm: gentle 30s then louder 9 min later | Borrow. Our "gentle pre-wake" toggle is similar; codify the timing. |
| Loftie | Hardware-only, no phone in bedroom narrative | Borrow the *story*: position FRQNCY as "phone face-down, app does the rest." |
| Calm / Headspace | Celebrity / artist-narrated sleep stories | Reject as product. Use unbranded human voice; no "voice of X." |
| Endel | Generative soundscapes adapting to time/weather/HR | Borrow for "let me drift." Procedural, no track-end discontinuity. |
| Brain.fm | Functional audio with entrainment claims | Borrow the un-narrated "audio-only" mode; skip the neuroscience claims. |
| Oura / Whoop | Sleep score, readiness score, sleep debt | Reject. These are the orthosomnia driver per April 2025 WSS consensus. |
| Whoop Sleep Coach | "Optimal bedtime" recommendation | Reject. Prescriptive. Our framing is invitational. |
| Apollo Neuro | Tracks nothing, intervenes via vibration | Borrow the philosophy: act gently, don't measure to a score. |
| Garmin Smart Wake | 30-min light-sleep window via HR + motion | Borrow as opt-in; the AndroidAuthority test shows it fires at the window's end most nights anyway, so frame it humbly. |
| Loona | Visual "sleepscapes" — coloring-in on phone | Reject for our context. Engagement-positive, opposite of un-engaging. |
| Insight Timer | Community-driven library, no streaks | Borrow the no-streaks stance. We already do this. |
| SilverCloud (mental health) | Minimal progress feedback, no user stats | Borrow wholesale. This is FRQNCY's editorial position made operational. |
| Othership | In-person breathwork extending to app | Borrow the "session has a clear arc and ends" pattern. |
| Sleep Cycle / Calm | "Honesty as marketing" — none seen | Opportunity. Be the app that says "iOS/Android may kill your alarm; here's what to do." |

## Recommended wake-screen experience

Keep the breath-hold as canonical. The current 6-second hold with the SVG ring is well-calibrated — physiologically a 6-second exhale lands you in parasympathetic territory, which is exactly the state you want a person to *arrive* into rather than be jolted out of. Keep one optional Loftie-style two-phase pre-wake (soft tone fading at 20 minutes before set time, room-fill tone at the set time itself). The post-dismiss reflection prompt should rotate from a small pool (~30 prompts) rather than be AI-generated per-day; AI-generated prompts in 2026 carry brand risk (hallucinated framings, inconsistent voice) and the editorial-values playbook calls for human-curated voice. The "move with me (3 min)" optional should be voice-only by default, not video — video locks the user to the screen, voice lets them move with eyes closed. Crucially, do not show any inference back: if the smart-wake window decides to fire 4 minutes early because of motion data, the user just experiences a slightly earlier wake. They never see "we woke you in light sleep." That sentence is exactly the orthosomnia loop we're refusing. Add a one-tap "snooze 9 min" because removing it causes anxiety on day-one trial, but cap snoozes at two and replace the third with the same breath-hold so the dismiss gesture still gets the final word.

## Recommended sleep-screen experience

The three soft-target structure (Stillness, Release the Day, Let Me Drift) is the right shape — it parallels Othership's session-arc model without copying it. Strengthen "Let Me Drift" with a procedural-audio layer: instead of looped tracks, generate a slowly-evolving soundbed (drone + sparse bell tones + optional rain) that decays in spectral content — not just volume — across the 45-minute window. This avoids the "track ends, brain wakes" failure mode that loops cause. The current volume curve (100→40 by min 22, silence by min 45) is right; add a frequency-roll-off curve so the high-frequency content drops out by min 30, keeping only sub-200Hz drone in the final stretch. Spoken prompts at 0s/180s/420s should stay sparse and never re-introduce after the user has gone quiet — once a phone has been still for 4 minutes, no more voice ever, even if the session restarts. For the "Release the Day" track, the prompt copy should follow the Voice Playbook's banished-terms list: no "let go of stress," no "drift away on a cloud," no second-person commands. Frame each prompt as an invitation the user can decline silently. End-of-session is implicit: the audio fades and the screen blanks. No "session complete" celebration, no minutes-meditated count, no streak update. Sleep ends by becoming sleep.

## HealthKit / Health Connect read-only integration spec

**iOS (HealthKit):** Request `HKCategoryTypeIdentifier.sleepAnalysis` with read-only authorization. Read `HKCategoryValueSleepAnalysis.allAsleepValues` (covers `.asleepCore`, `.asleepDeep`, `.asleepREM`, `.asleepUnspecified`). Use the new sleep-stage predicate added in iOS 16. Never request write access — no FRQNCY-authored sleep samples touch Health. Use the latest in-bed and asleep windows from the previous 24h to (a) seed the bedside arming UI's expected wake time, and (b) feed the optional smart-wake window. Do **not** read heart-rate, HRV, or respiratory-rate data; we don't need to, and not requesting them is a privacy posture worth advertising.

**Android (Health Connect):** Request `SleepSessionRecord` read permission only. Health Connect on Android 14+ replaced Google Fit's sleep API in 2024; do not fall back to Google Fit. Sleep stages map to `STAGE_TYPE_LIGHT`, `STAGE_TYPE_DEEP`, `STAGE_TYPE_REM`, `STAGE_TYPE_AWAKE`, etc. Treat stage data as advisory only, since not every Android tracker writes stages. Same rule: never write back, never request HR/HRV.

**Internal use rule:** Sleep data is consumed silently to time the smart-wake window. It is never displayed to the user. There is no "your sleep" screen, ever, in any version. If a user wants to see their sleep data, they open Apple Health or Health Connect — those are the system-of-record, FRQNCY is not. This is also what lets us truthfully say in onboarding: "FRQNCY does not store your sleep data."

## Accessibility additions

**Breath-hold alternative:** Settings → "Wake gesture" → three options: (1) Breath hold (default, 6 sec), (2) Long-press hold (any finger pressure for 6 sec, no exhale required — for users who can't sustain controlled exhale), (3) Triple-tap (three taps within 2 sec on any part of the screen — for motor-impaired users for whom sustained press is hard). All three resolve to the same dismiss event; the breath-hold is the editorial default but is not the only legitimate path.

**VoiceOver / TalkBack:** Wake-screen has an `accessibilityLabel` of "Hold to arrive" on the ring; ring progress announces in 25% increments, not continuously (to avoid screen-reader flooding). Reflection prompt is a `header` role; "move with me" button has an explicit `Button` role and "3 minute audio practice" hint.

**Switch Access (Android):** Two-switch users get a sequenced dismiss — first switch focuses the dismiss target, second switch confirms. Skip the breath-hold entirely in Switch Access mode; treat dismiss as a single confirm.

**Large-text / Dynamic Type:** All wake/sleep copy passes Dynamic Type up to AX5 without truncating. Sleep-screen prompts are spoken aloud anyway, so visual layout breaking is acceptable; wake-screen prompts must remain readable.

**Reduced motion:** Honor `prefers-reduced-motion`. The SVG ring should fill linearly without easing, and the post-dismiss screen should fade rather than slide.

**Hearing-impaired wake:** Optional haptic-only mode — a slow rising haptic pattern over 60 seconds in place of audio. Ships day-one because deaf users have alarm needs too and most apps treat them as an afterthought.

## Top 5 citations

1. World Sleep Society / orthosomnia consensus, April 2025 — [Sleep Foundation: What is Orthosomnia](https://www.sleepfoundation.org/orthosomnia)
2. HealthKit sleep stage API — [HKCategoryValueSleepAnalysis | Apple Developer](https://developer.apple.com/documentation/healthkit/hkcategoryvaluesleepanalysis)
3. Health Connect sleep sessions — [Track sleep sessions | Android Developers](https://developer.android.com/health-and-fitness/health-connect/features/sleep-sessions)
4. SilverCloud's anti-dark-pattern stance for mental health — [Design Ethics for Mental Health: How and Why We Avoid Dark Patterns](https://www.silvercloudhealth.com/uk/blog/design-ethics-for-mental-health-why-we-avoid-dark-patterns)
5. Smart-wake real-world failure mode — [I tested Garmin's newest Smart Wake feature, and I'm just as tired as ever (Android Authority)](https://www.androidauthority.com/garmin-vivoactive-6-smart-wake-alarm-3558403/)

Supplementary: [Frontiers — "The sleep data looks way better than I feel"](https://www.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2024.1258289/full), [PMC — Multimodal smart-alarm sleep-inertia study](https://pmc.ncbi.nlm.nih.gov/articles/PMC10969141/), [PMC — Comprehensive review of home sleep monitoring](https://pmc.ncbi.nlm.nih.gov/articles/PMC11945902/).

## Open questions

1. **Smart-wake opt-in copy.** If we're committed to never showing inferred sleep data back, how do we explain *why* the alarm fired 4 minutes early without re-introducing the score concept? Candidate copy: "Sometimes FRQNCY will wake you a few minutes early if your body seems ready. You can turn this off." Needs voice-playbook review.

2. **Procedural audio licensing.** Endel's generative engine is proprietary; building our own requires a composer-led system with seed material. Is this in scope for v1, or do we license a generative engine for "Let Me Drift" mode and build our own in v2?

3. **Honesty-as-marketing onboarding.** First-run copy candidate: "Phone alarms are unreliable on Android. We'll show you the three settings that fix that." This is unique in the category. Confirm with editorial that this lands as honest rather than alarming.

4. **Reflection-prompt source.** Human-curated pool of ~30 (current proposal), or a small RAG over existing FRQNCY topic-page pull-quotes? The latter would tie the wake screen back to the main site editorially. Risk: prompts become repetitive within a week.

5. **Bedside "video field" toggle.** What is this currently — looped video of natural scenes, or live camera? If looped video, it conflicts with the un-engaging sleep ethos. Worth re-examining.

6. **Two-phase pre-wake default.** Default ON or OFF? Loftie defaults ON; users coming from Alarmy may be confused by the gentleness. Probably default ON with one-tap disable on the bedside screen.

7. **Snooze-cap policy.** Two snoozes then breath-hold required is a defensible compromise. Alternative: no snooze at all (Loftie's stance) — purer but day-one trial-killer for many users.
