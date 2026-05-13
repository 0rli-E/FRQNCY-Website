---
description: Print the Sanctuary's state schema (DEFAULT_STATE) and the render-function map. Useful when adding fields or surfaces.
---

The Sanctuary persists a single JSON blob — locally in `localStorage`, optionally in Supabase `charts` table when logged in. The schema is defined in one place; this command surfaces it.

Run from the repo root:

```bash
echo "=== DEFAULT_STATE ===" && python3 -c "
import re
src = open('my-frqncy/dashboard/index.html').read()
m = re.search(r'const DEFAULT_STATE\s*=\s*(\{[\s\S]*?\n\});', src)
print(m.group(1) if m else '(not found)')
"
echo ""
echo "=== Render functions ===" && grep -n "^function render\|^async function render" my-frqncy/dashboard/index.html
echo ""
echo "=== Cloud-store surface (what gets synced) ===" && grep -n "getState\|setState\|patch\|sanctuaryStore\|constellationStore" assets/frqncy-supabase.js | head -20
```

When adding a new field:
1. Add it to `DEFAULT_STATE` in `my-frqncy/dashboard/index.html`.
2. Lazy-initialize on first read: `if (!state.X) state.X = ...` in any function that touches it. Existing saved JSON loads without migration that way.
3. Cloud sync is automatic — the whole state blob round-trips through one `charts` row keyed `name='Sanctuary'`. New keys ship without schema changes.

When adding a new render surface:
1. HTML placeholder with stable `id` in the relevant view container.
2. CSS in the inline `<style>` block under a `/* ── MY SURFACE ── */` comment.
3. `renderMySurface()` function near sibling renderers.
4. Call from `renderAll()`.
5. Wire input events to a debounced `persist()` (300ms is the convention).
