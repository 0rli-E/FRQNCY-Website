# Author-creation proposals — 2026-05-09

**Books with unresolved authors:** 191
**Net-new people:** 207

Review the JSON sidecar; remove rows you don't want, then run:
```
node scripts/create_authors_from_books.mjs --apply audits/beds/runs/2026-05-09-author-create-proposals.json
```

## Multi-author books (schema becomes `author: [...]`)

| book | author string | → person IDs |
|---|---|---|
| Becoming Rich | Doug Wead & Dexter Yager | `p-doug-wead`, `p-dexter-yager` |
| Cradle to Cradle | McDonough & Braungart | `p-william-mcdonough`, `p-michael-braungart` |
| Designing Your Life | Bill Burnett & Dave Evans | `p-bill-burnett`, `p-dave-evans` |
| Ikigai | Héctor García & Francesc Miralles | `p-hector-garcia`, `p-francesc-miralles` |
| Noma Guide to Fermentation | René Redzepi & David Zilber | `p-rene-redzepi`, `p-david-zilber` |
| Plants of the Gods | Schultes & Hofmann | `p-richard-evans-schultes`, `p-albert-hofmann` |
| Reality Media | Jay David Bolter & Maria Engberg | `p-jay-david-bolter`, `p-maria-engberg` |
| The Art of Possibility | Zander & Zander | `p-benjamin-zander`, `p-rosamund-stone-zander` |
| The Biogas Handbook | Wellinger, Murphy & Baxter | `p-arthur-wellinger`, `p-jerry-murphy`, `p-david-baxter` |
| The Dawn of Everything | Graeber & Wengrow | `p-david-graeber`, `p-david-wengrow` |
| The Definitive Book of Human Design | Lynda Bunnell & Ra Uru Hu | `p-lynda-bunnell`, `p-ra-uru-hu` |
| The Elements of Journalism | Kovach & Rosenstiel | `p-bill-kovach`, `p-tom-rosenstiel` |
| The New Fire | Joshua Goldstein & Staffan Qvist | `p-joshua-goldstein`, `p-staffan-qvist` |
| The Sovereign Individual | Davidson & Rees-Mogg | `p-james-dale-davidson`, `p-william-rees-mogg` |
| The Spirit Level | Wilkinson & Pickett | `p-richard-wilkinson`, `p-kate-pickett` |
| This Is An Uprising | Engler & Engler | `p-mark-engler`, `p-paul-engler` |

## Editor / honorific-stripped (sample)

| book | raw | parsed |
|---|---|---|
| Alive in Shape and Color | Lawrence Block (ed.) | Lawrence Block (editor) |
| Clean | Dr. Alejandro Junger | Alejandro Junger |
| Drawdown | Paul Hawken (ed.) | Paul Hawken (editor) |