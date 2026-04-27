# Chart-v2 — Fixture Collection Guide

The HD engine in `hd-engine.js` needs **≥5 verified Jovian Archive fixtures** to lock the wheel offset. Right now `fixtures.json` only has Orli's chart. We need 4 more.

## What a fixture is

A "fixture" is one known-good chart used as ground truth. The calibration harness in `calibration.html` runs `computeChart()` for each fixture and diffs every gate/line against expected values. When all fixtures pass at a single `WHEEL_OFFSET`, the engine is calibrated and ready to ship.

## What you need for each fixture

1. **Birth data:** date (Y/M/D), local time (H:M), city, IANA timezone (e.g. `Europe/Berlin`).
2. **Jovian Archive chart printout:** the full chart from <https://www.jovianarchive.com/Get_Your_Chart>.
3. **All 26 activations** read off the chart: 13 bodies (Sun, Earth, Moon, North Node, South Node, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto) × 2 sides (Personality + Design), each as `gate.line`.
4. **Type / Profile / Authority** (these come straight off the Jovian printout).

## Sources of birth data

Three good options:

- **People you know personally** with verified birth times (parent's certificate, hospital record).
- **Public AA-rated charts** from Astro-Databank — these have verified birth times. Examples: Albert Einstein (3:14 LMT, Ulm, 14 Mar 1879), Marilyn Monroe (9:30, Los Angeles, 1 Jun 1926), John Lennon (18:30 GMT, Liverpool, 9 Oct 1940).
- **Anyone who already knows their HD chart well** (Norman? FRQNCY collaborators?) and can pull up their Jovian page.

## How to add a fixture

1. Get the Jovian Archive chart for the birth.
2. Read off all 26 activations.
3. Copy the existing fixture in `fixtures.json` (Orli's) as a template.
4. Replace `id`, `label`, `birth`, `zone`, and the activations.
5. Save.
6. Open `calibration.html` in a browser → click **Run calibration**. The new fixture should appear in the diff table.

## Schema (one fixture)

```json
{
  "id": "short-id",
  "label": "Name — City, D Mon YYYY HH:MM local",
  "birth": { "y": 1990, "mo": 6, "d": 15, "h": 14, "mi": 30 },
  "zone": "America/Los_Angeles",
  "expected": {
    "type": "Generator",
    "profile": "5/1",
    "authority": "Sacral",
    "personality": {
      "Sun":       { "gate": 25, "line": 3 },
      "Earth":     { "gate": 46, "line": 3 },
      "Moon":      { "gate": 12, "line": 1 },
      "NorthNode": { "gate": 38, "line": 4 },
      "SouthNode": { "gate": 39, "line": 4 },
      "Mercury":   { "gate": 17, "line": 2 },
      "Venus":     { "gate": 51, "line": 5 },
      "Mars":      { "gate": 32, "line": 6 },
      "Jupiter":   { "gate": 41, "line": 1 },
      "Saturn":    { "gate": 13, "line": 4 },
      "Uranus":    { "gate": 28, "line": 2 },
      "Neptune":   { "gate": 22, "line": 3 },
      "Pluto":     { "gate": 47, "line": 5 }
    },
    "design": {
      "Sun":       { "gate": 17, "line": 5 },
      "Earth":     { "gate": 18, "line": 5 },
      "Moon":      { "gate": 26, "line": 4 },
      "NorthNode": { "gate": 30, "line": 1 },
      "SouthNode": { "gate": 29, "line": 1 },
      "Mercury":   { "gate": 21, "line": 2 },
      "Venus":     { "gate": 36, "line": 3 },
      "Mars":      { "gate": 25, "line": 1 },
      "Jupiter":   { "gate": 14, "line": 6 },
      "Saturn":    { "gate": 30, "line": 5 },
      "Uranus":    { "gate": 23, "line": 1 },
      "Neptune":   { "gate": 7,  "line": 4 },
      "Pluto":     { "gate": 38, "line": 2 }
    }
  }
}
```

## Calibration target

When all 5 fixtures pass at a single `WHEEL_OFFSET`:

1. Bake that value into `hd-engine.js` (replace the default).
2. Replace the Jovian Archive handoff in `chart.html` with a call to `computeChart()`.
3. Ship.

If different fixtures need different offsets, there's a deeper bug in the engine (node convention — mean vs true; design offset — 88.0° vs 88.3°; wheel sequence). Investigate before tuning.

## Harness-assisted collection (optional)

If you want to run a harness agent to draft fixture entries from public birth data and a known-good HD calculator API:

```
frqncy-harness agent "For each of these 4 birth datasets, look up the Human Design chart from a reputable source (jovianarchive.com or a verified mirror) and output a fixture entry following the schema in chart-v2/FIXTURE-COLLECTION.md. Verify activations against TWO independent sources before committing.

1. Albert Einstein, Ulm Germany, 14 Mar 1879, 11:30 LMT (Astro-Databank AA)
2. Marilyn Monroe, Los Angeles CA, 1 Jun 1926, 09:30 PST (Astro-Databank AA)
3. John Lennon, Liverpool UK, 9 Oct 1940, 18:30 GMT (Astro-Databank AA)
4. Steve Jobs, San Francisco CA, 24 Feb 1955, 19:15 PST (Astro-Databank A)

Output: a JSON array of 4 fixture objects. Do not write to fixtures.json directly — output to stdout for review." --model openrouter/google/gemini-2.5-flash --yolo
```

Manual review before merging into `fixtures.json` — automated fixture data must be human-verified before it becomes ground truth.
