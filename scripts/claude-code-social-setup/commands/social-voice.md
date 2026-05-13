---
description: Run a voice-playbook review on a social-platform draft — flag deviations from FRQNCY's editorial values + voice constraints.
---

Take the file path or pasted text Orlando provides and run a voice review against `proposals/FRQNCY-VOICE-PLAYBOOK.md`. This is for user-facing copy that ships inside NRG — composer placeholders, empty states, success messages, member upsell copy, illumination prose, etc.

**Hard rules (any violation = block):**

1. **No leaderboard / ranking framing.** No "calls", "leaderboard", "compete", "rank", or follower-count chest-thumping. Conviction as self-expression is fine; ranking people is not.
2. **No banished marketing terms.** Read the banished-terms list in `FRQNCY-VOICE-PLAYBOOK.md`. Common offenders: "wellness", "level up", "unlock", "manifest" (as verb), "journey" (as life metaphor), "vibes", "vibrate higher", "high-vibe", "exclusive", "premium", "limited time", "FOMO".
3. **No scarcity framing on Membership.** Membership is "support the network" / "deeper view for members". Never "exclusive", "premium", "unlock". The non-member version of any surface must remain useful.
4. **Cooperation over competition.** Even subtle ranking is out — if a feature could be rephrased as cooperative, rephrase.
5. **British English locked.** "Colour", "behaviour", "organise", "recognised". Reject American spellings.
6. **No spiritual cliches.** No "trust the process", "everything happens for a reason", "the universe has a plan", "your truth", "raise your vibration".
7. **Practices as experiments, not prescriptions.** Never "you must", "you should". Use "you could try", "this is an invitation".

**Soft rules (warn, don't block):**

- **Triads land well in FRQNCY voice.** Three-beat shortness in the right places. But don't force it.
- **Present-tense and declarative.** Less hedging, more naming.
- **Reader is the agent.** Not a patient, not a customer.
- **Em dashes for rhythm — yes. Semicolons for compound prose — also yes.**

**Output format:**

For each deviation, show:

```
[BLOCK | WARN] <line excerpt>
  why: <which rule fired>
  fix: <specific rewrite>
```

End with a one-sentence verdict: "Ships clean" / "Needs the BLOCK fixes" / "Has WARN suggestions worth considering".

If the file is voice-clean, say "Ships clean — no deviations from the playbook" in one line and stop.

If Orlando pasted text instead of a file path, run the review on the pasted text.
