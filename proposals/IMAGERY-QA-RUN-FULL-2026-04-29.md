# Imagery QA — auto-run

Generated: 2026-04-29 20:11  ·  Model: `anthropic/claude-opus-4.1`
Topics scored: 141

**Summary:** 10 approved · 5 watchlist · 20 flagged · 106 errors

## ✗ Flagged — recommend swap

| slug | hero subject (C1/C4) | closing subject (C1/C4) | rules | reason |
|---|---|---|---|---|
| `ar-vr` | VR headset user (5/4) | VR headset user (5/2) |  | Oversaturated neon orange clashes with navy filter and FRQNCY aesthetic. |
| `biodiversity` | misty rainforest (3/4) | foggy forest river (2/3) | R8 | Reads as generic 'forest' rather than distinctly 'biodiversity'. |
| `biology` | laboratory pipetting (5/5) | cosmic nebula (1/2) |  | Space imagery reads as astronomy/physics, not biology. |
| `biomimicry` | bookshelf (1/3) | craft supplies (2/3) | R1,R2 | Generic bookshelf image fails to communicate biomimicry concept. |
| `biotechnology` | circuit board (1/4) | Earth from space (1/5) | R1,R6 | Circuit board contradicts biotechnology's biological focus. |
| `blockchain` | Blockchain screen interface (5/2) | Blockchain screen interface (5/2) | R5 | Too literal with branded interface, lacks editorial sophistication. |
| `breathwork` | pranayama breathing (5/4) | chest-belly breathing (4/3) | R12 | Face cropped out violates R12 for human-presence imagery. |
| `cards` | man with phone (2/2) | woman writing (1/3) | R1,R2 | Phone payment gesture is too ambiguous to read as cards topic. |
| `chemistry` | laboratory pipetting (5/5) | nebula (1/4) | R1,R2 | Space imagery reads as astronomy/physics, not chemistry. |
| `christianity` | Asian pagoda (1/2) | mountain clouds (1/4) | R10,R4 | Buddhist/Asian pagoda completely misrepresents Christianity. |
| `circular-economy` | corporate skyscrapers (2/5) | cafe patron (3/2) |  | Generic business architecture doesn't communicate circular economy. |
| `co-creation` | bookshelf selection (2/4) | craft supplies (3/4) | R1,R4 | Solo book selection doesn't convey collective creation. |
| `coffee-tea` | sunset beach figure (1/2) | city skyline (1/2) | R1,R2 | No coffee or tea elements visible whatsoever. |
| `collective-intelligence` | green snake (2/3) | city skyline (4/4) | R1,R4 | Snake imagery doesn't read as collective intelligence within 1 second. |
| `community` | student assembly (5/2) | university lecture (4/3) |  | Conference/school assembly aesthetic doesn't align with FRQNCY's editorial standard. |
| `conscious-capital` | man in cafe (2/2) | woman studying (2/3) | R1,R4 | Generic lifestyle shot that doesn't read as finance or investment. |
| `cookware` | sunset silhouette (1/2) | city skyline (1/2) | R1,R6 | Complete subject mismatch - shows sunset/beach instead of cookware. |
| `cuisine` | Asian bowls with chopsticks (3/3) | Breakfast bowl (2/3) |  | Shows food culture through chopsticks but reads more as healthy eating than cuisine traditions. |
| `dao` | interlocking cubes (3/5) | Bitcoin trading chart (2/2) | R4 | Abstract geometric shapes don't convey DAOs specifically enough. |
| `decentralized-networks` | circuit board (2/4) | Earth network lights (4/5) | R1,R2 | Circuit board is too generic for decentralized networks topic. |

## ⚪ Watchlist — passable, not great

| slug | hero | closing | reason |
|---|---|---|---|
| `akashic-records` | ancient manuscript | handwritten journal | Ancient manuscript pages strongly evoke records and universal knowledge. |
| `artificial-intelligence` | humanoid robot | android face | Robot is canonical for AI but aesthetic leans tech-demo over editorial. |
| `broadcasting` | vinyl records | record collection | Vinyl records suggest analog broadcasting but aren't immediately readable as 'broadcasting' itself. |
| `cybersecurity` | hacker at terminal | matrix code | Perfect cybersecurity readability with moody editorial composition. |
| `decentralised-ai` | circuit board | Earth network lights | Circuit board reads as generic tech/computing rather than specifically decentralized AI. |

## ✓ Approved

- `aliens` — UFO structure + UAP streak
- `aquaculture` — fish farm pens + offshore fish cages
- `architecture` — architectural window detail + temple roofline
- `astrology` — astrology chart & calendars + birth chart & tools
- `astrophysics` — spiral galaxy + Andromeda galaxy
- `audio` — vinyl records + 45rpm singles
- `climate` — melting glacier + storm system
- `cosmos` — Milky Way + starfield
- `dance` — ballet dancer + dancer leap
- `defi` — Bitcoin trading app + Bitcoin mining spreadsheet

## ⚠ Errors

- `bioenergy` — hero HEAD failed: https://images.unsplash.com/photo-1497292207894-95884b04e30e?auto=format&fit=crop&q=85&w=3840
- `body-care` — BadRequestError: Error code: 400 - {'error': {'message': 'Provider returned error', 'code': 400, 'metadata': {'raw': '{"type":"error","error":{"type":"invalid_request_error","message":"messages.0.content.4.image.source.base64.media_type: Input should be \'image/jpeg\', \'image/png\', \'image/gif\' or \'image/webp\'"},"request_id":"req_011CaY2fmXitgiUZMPxRcxnu"}', 'provider_name': 'Anthropic', 'is_byok': False}}, 'user_id': 'user_3AkHhyMBSPsUY8cOZJ3KeHM4iDd'}
- `detox` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `dialogue` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `diaspora` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `dimensions` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `ecology` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `education-systems` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `eft-tapping` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `emergence` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `energy-fields` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `energy-healing` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `energy-policy` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `energy-storage` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `esports` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `fashion` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `fermentation` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `festivals` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `film` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `food-sovereignty` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `food-systems` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `forests` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `future-cities` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `future-tech` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `gaming` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `genetics` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `geothermal` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `governance` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `grid-technology` — hero HEAD failed: https://images.unsplash.com/photo-1497292207894-95884b04e30e?auto=format&fit=crop&q=85&w=3840
- `history` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `human-design` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `humor` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `impact-investing` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `indigenous-wisdom` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `journalism` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `kriya-yoga` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `language` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `leisure` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `manifestation` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `mathematics` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `medicine` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `meditation` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `mental-health` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `merkaba` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `minimalism` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `movement` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `mythology` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `natural-cycles` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `near-death-experiences` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `neuroscience` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `nonviolent-communication` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `nutrition` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `oceans` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `oneness` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `open-source` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `outdoor-adventure` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `peace` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `permaculture` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `personal-development` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `photography` — closing HEAD failed: https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?auto=format&fit=crop&q=85&w=3840
- `plant-medicine` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `play-creativity` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `poetry` — closing HEAD failed: https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?auto=format&fit=crop&q=85&w=3840
- `privacy` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `product-design` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `prosperity-mindset` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `prototyping` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `psychology` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `public-speaking` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `quantum` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `quantum-computing` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `quantum-grammar` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `regenerative-business` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `regenerative-farming` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `remote-viewing` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `renewable-energy` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `robert-jay-gould` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `robotics` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `sacred-geometry` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `sacred-law` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `siddha-yoga` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `sleep` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `social-enterprise` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `social-media` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `social-movements` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `solar` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `somatic-therapy` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `soul` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `sound-healing` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `source` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `sports` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `storytelling` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `supplements` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `sustainable-living` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `synchronicity` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `systems-thinking` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `taoism` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `theater` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `tools-carry` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `translation` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `urban-farming` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `vibration` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `visual-art` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `web3` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `wind-energy` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}
- `yoga` — PermissionDeniedError: Error code: 403 - {'error': {'message': 'Key limit exceeded (total limit). Manage it using https://openrouter.ai/settings/keys', 'code': 403}}