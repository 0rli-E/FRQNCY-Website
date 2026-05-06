# Book author auto-link proposals — 2026-05-05

**Books with unresolved authors:** 193
**Auto-link candidates:** 2

Review the proposed links below. Edit/delete rows in the JSON sidecar, then commit with:

```
node scripts/link_book_authors.mjs --apply audits/beds/runs/2026-05-05-author-link-proposals.json
```

| book | book id | author string | → person | confidence | strategy |
|---|---|---|---|---|---|
| Success Through A Positive Mental Attitude | `b-success-through-a-positive-mental-attitude` | Napoleon Hill & W. Clement Stone | `p-napoleon-hill` (Napoleon Hill) | high | first-author |
| The Diamond Cutter | `b-the-diamond-cutter` | Geshe Michael Roach & Lama Christie McNally | `p-geshe-michael-roach` (Geshe Michael Roach) | high | first-author |