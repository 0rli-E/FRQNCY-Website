"""
Sector-iconic SVG glyphs for the 21 crypto sub-hubs.
One per slug, each rooted in real crypto iconography.
Imported by generate_crypto_subhubs.py — replaces the previous
generic family-glyph library when a sector-specific glyph exists.
"""
from __future__ import annotations

ICONIC_GLYPHS: dict[str, str] = {
    "bitcoin": '''<svg class="hero-glyph" viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="gGlow_bitcoin" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="var(--sector-accent)" stop-opacity="0.34"/>
      <stop offset="60%" stop-color="#0B1C3D" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#0B1C3D" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="0" cy="0" r="92" fill="url(#gGlow_bitcoin)"/>
  <polygon class="glyph-rotate-rev" points="0,-78 67.5,-39 67.5,39 0,78 -67.5,39 -67.5,-39"
           stroke="var(--sector-accent)" stroke-width="0.8" fill="none" opacity="0.55"/>
  <polygon points="0,-62 53.7,-31 53.7,31 0,62 -53.7,31 -53.7,-31"
           stroke="var(--sector-accent)" stroke-width="0.4" fill="var(--sector-soft)" opacity="0.8"/>
  <text x="0" y="28" text-anchor="middle" font-family="Georgia,'Times New Roman',serif"
        font-size="108" font-weight="700" font-style="italic"
        fill="var(--sector-warm)" stroke="var(--sector-accent)" stroke-width="0.6">₿</text>
  <path class="glyph-pulse-1" d="M -82,-22 L -68,-30 L -72,-12 L -58,-18 L -70,4 L -78,-6 L -72,-14 Z"
        fill="var(--sector-warm)" opacity="0.85"/>
  <path class="glyph-pulse-2" d="M 82,22 L 68,30 L 72,12 L 58,18 L 70,-4 L 78,6 L 72,14 Z"
        fill="var(--sector-warm)" opacity="0.85"/>
  <path class="glyph-pulse-2" d="M -8,-86 L 4,-78 L -4,-72 L 8,-64"
        stroke="var(--sector-accent)" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path class="glyph-pulse-1" d="M 8,86 L -4,78 L 4,72 L -8,64"
        stroke="var(--sector-accent)" stroke-width="2" fill="none" stroke-linecap="round"/>
  <circle cx="-66" cy="-46" r="1.6" fill="var(--sector-warm)" class="glyph-pulse-1"/>
  <circle cx="66" cy="46" r="1.6" fill="var(--sector-warm)" class="glyph-pulse-2"/>
</svg>''',

    "sov": '''<svg class="hero-glyph" viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="gGlow_sov" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="var(--sector-accent)" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#0B1C3D" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gBar_sov" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="var(--sector-warm)" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="var(--sector-accent)" stop-opacity="0.25"/>
    </linearGradient>
  </defs>
  <circle cx="0" cy="0" r="92" fill="url(#gGlow_sov)"/>
  <g stroke="var(--sector-accent)" stroke-width="0.3" opacity="0.18">
    <line x1="-70" y1="-50" x2="70" y2="-50"/><line x1="-70" y1="-30" x2="70" y2="-30"/>
    <line x1="-70" y1="-10" x2="70" y2="-10"/><line x1="-70" y1="10"  x2="70" y2="10"/>
    <line x1="-70" y1="30"  x2="70" y2="30"/><line x1="-70" y1="50"  x2="70" y2="50"/>
  </g>
  <g class="glyph-pulse-2">
    <path d="M -10,-66 Q -10,-78 0,-78 Q 10,-78 10,-66 L 10,-58"
          stroke="var(--sector-warm)" stroke-width="2" fill="none"/>
    <rect x="-14" y="-58" width="28" height="22" rx="2"
          fill="var(--sector-soft)" stroke="var(--sector-warm)" stroke-width="1.2"/>
    <circle cx="0" cy="-48" r="2.5" fill="var(--sector-warm)"/>
    <line x1="0" y1="-48" x2="0" y2="-42" stroke="var(--sector-warm)" stroke-width="1.5"/>
  </g>
  <g class="glyph-pulse-1">
    <polygon points="-44,-26 44,-26 52,-18 -52,-18" fill="url(#gBar_sov)"
             stroke="var(--sector-accent)" stroke-width="0.8"/>
    <rect x="-52" y="-18" width="104" height="14" fill="var(--sector-soft)"
          stroke="var(--sector-accent)" stroke-width="0.6"/>
  </g>
  <polygon points="-50,0 50,0 58,8 -58,8" fill="url(#gBar_sov)"
           stroke="var(--sector-accent)" stroke-width="0.8"/>
  <rect x="-58" y="8" width="116" height="14" fill="var(--sector-soft)"
        stroke="var(--sector-accent)" stroke-width="0.6"/>
  <polygon points="-56,26 56,26 64,34 -64,34" fill="url(#gBar_sov)"
           stroke="var(--sector-accent)" stroke-width="0.8"/>
  <rect x="-64" y="34" width="128" height="16" fill="var(--sector-soft)"
        stroke="var(--sector-accent)" stroke-width="0.6"/>
  <text x="0" y="68" text-anchor="middle" font-family="Georgia,serif"
        font-size="11" letter-spacing="3" fill="var(--sector-warm)" opacity="0.7">21M</text>
</svg>''',

    "l1": '''<svg class="hero-glyph" viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="gGlow_l1" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="var(--sector-accent)" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#0B1C3D" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="0" cy="0" r="92" fill="url(#gGlow_l1)"/>
  <g class="glyph-rotate">
    <circle cx="0" cy="0" r="82" stroke="var(--sector-accent)" stroke-width="0.4"
            fill="none" stroke-dasharray="2 6" opacity="0.5"/>
    <circle cx="0"   cy="-82" r="3.2" fill="var(--sector-warm)"/>
    <circle cx="58"  cy="-58" r="2.4" fill="var(--sector-accent)"/>
    <circle cx="82"  cy="0"   r="3.2" fill="var(--sector-warm)"/>
    <circle cx="58"  cy="58"  r="2.4" fill="var(--sector-accent)"/>
    <circle cx="0"   cy="82"  r="3.2" fill="var(--sector-warm)"/>
    <circle cx="-58" cy="58"  r="2.4" fill="var(--sector-accent)"/>
    <circle cx="-82" cy="0"   r="3.2" fill="var(--sector-warm)"/>
    <circle cx="-58" cy="-58" r="2.4" fill="var(--sector-accent)"/>
  </g>
  <polygon points="0,-58 -32,-2 0,-18" fill="var(--sector-soft)"
           stroke="var(--sector-accent)" stroke-width="0.8" opacity="0.85"/>
  <polygon points="0,-58 32,-2 0,-18" fill="var(--sector-accent)"
           stroke="var(--sector-accent)" stroke-width="0.8" opacity="0.55"/>
  <polygon points="0,58 -32,8 0,-8" fill="var(--sector-soft)"
           stroke="var(--sector-accent)" stroke-width="0.8" opacity="0.95"/>
  <polygon points="0,58 32,8 0,-8" fill="var(--sector-warm)"
           stroke="var(--sector-accent)" stroke-width="0.8" opacity="0.6"/>
  <line x1="-32" y1="-2" x2="32" y2="-2" stroke="var(--sector-warm)"
        stroke-width="0.8" opacity="0.7" class="glyph-pulse-1"/>
</svg>''',

    "l2": '''<svg class="hero-glyph" viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="gGlow_l2" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="var(--sector-accent)" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#0B1C3D" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="0" cy="0" r="92" fill="url(#gGlow_l2)"/>
  <g class="glyph-pulse-1">
    <rect x="-72" y="-78" width="20" height="6" fill="var(--sector-soft)" stroke="var(--sector-accent)" stroke-width="0.5"/>
    <rect x="-48" y="-78" width="20" height="6" fill="var(--sector-soft)" stroke="var(--sector-accent)" stroke-width="0.5"/>
    <rect x="-24" y="-78" width="20" height="6" fill="var(--sector-soft)" stroke="var(--sector-accent)" stroke-width="0.5"/>
    <rect x="0"   y="-78" width="20" height="6" fill="var(--sector-soft)" stroke="var(--sector-accent)" stroke-width="0.5"/>
    <rect x="24"  y="-78" width="20" height="6" fill="var(--sector-soft)" stroke="var(--sector-accent)" stroke-width="0.5"/>
    <rect x="48"  y="-78" width="20" height="6" fill="var(--sector-soft)" stroke="var(--sector-accent)" stroke-width="0.5"/>
  </g>
  <g stroke="var(--sector-accent)" stroke-width="0.4" opacity="0.4">
    <line x1="-62" y1="-70" x2="-44" y2="-50"/><line x1="-38" y1="-70" x2="-22" y2="-50"/>
    <line x1="-14" y1="-70" x2="0" y2="-50"/><line x1="10"  y1="-70" x2="22" y2="-50"/>
    <line x1="34"  y1="-70" x2="44" y2="-50"/>
  </g>
  <rect x="-50" y="-50" width="100" height="10" rx="1" fill="var(--sector-soft)"
        stroke="var(--sector-accent)" stroke-width="0.6"/>
  <rect x="-50" y="-34" width="100" height="10" rx="1" fill="var(--sector-soft)"
        stroke="var(--sector-accent)" stroke-width="0.6"/>
  <rect x="-40" y="-12" width="80" height="14" rx="2" fill="var(--sector-accent)"
        opacity="0.7" stroke="var(--sector-warm)" stroke-width="0.8" class="glyph-pulse-2"/>
  <text x="0" y="-1" text-anchor="middle" font-family="Georgia,serif"
        font-size="9" letter-spacing="2" fill="var(--sector-warm)" opacity="0.95">PROOF</text>
  <line x1="0" y1="6" x2="0" y2="42" stroke="var(--sector-warm)" stroke-width="1.5"
        stroke-dasharray="3 3" opacity="0.8"/>
  <polygon points="0,50 -6,40 6,40" fill="var(--sector-warm)" opacity="0.9"/>
  <polygon points="0,58 -18,72 0,80 18,72" fill="var(--sector-soft)"
           stroke="var(--sector-accent)" stroke-width="0.8"/>
  <line x1="-18" y1="72" x2="18" y2="72" stroke="var(--sector-warm)" stroke-width="0.5" opacity="0.6"/>
</svg>''',

    "modular": '''<svg class="hero-glyph" viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="gGlow_modular" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="var(--sector-accent)" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#0B1C3D" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="0" cy="0" r="92" fill="url(#gGlow_modular)"/>
  <circle cx="0" cy="0" r="60" stroke="var(--sector-accent)" stroke-width="0.3"
          fill="none" stroke-dasharray="1 4" opacity="0.4" class="glyph-rotate-rev"/>
  <g class="glyph-pulse-1">
    <polygon points="0,-16 14,-8 14,8 0,16 -14,8 -14,-8"
             fill="var(--sector-accent)" opacity="0.5"
             stroke="var(--sector-warm)" stroke-width="0.8"/>
    <circle cx="0" cy="0" r="4" fill="var(--sector-warm)"/>
  </g>
  <g class="glyph-rotate">
    <g transform="translate(0, -60)">
      <polygon points="-12,-8 12,-8 12,8 -12,8" fill="var(--sector-soft)"
               stroke="var(--sector-accent)" stroke-width="0.7"/>
      <polygon points="-12,-8 -8,-12 16,-12 12,-8" fill="var(--sector-accent)" opacity="0.4"
               stroke="var(--sector-accent)" stroke-width="0.5"/>
      <polygon points="12,-8 16,-12 16,4 12,8" fill="var(--sector-accent)" opacity="0.6"
               stroke="var(--sector-accent)" stroke-width="0.5"/>
      <text x="0" y="2" text-anchor="middle" font-family="Georgia,serif"
            font-size="7" letter-spacing="1.5" fill="var(--sector-warm)">DA</text>
    </g>
    <g transform="translate(60, 0)">
      <polygon points="-12,-8 12,-8 12,8 -12,8" fill="var(--sector-soft)"
               stroke="var(--sector-accent)" stroke-width="0.7"/>
      <polygon points="-12,-8 -8,-12 16,-12 12,-8" fill="var(--sector-accent)" opacity="0.4"
               stroke="var(--sector-accent)" stroke-width="0.5"/>
      <polygon points="12,-8 16,-12 16,4 12,8" fill="var(--sector-accent)" opacity="0.6"
               stroke="var(--sector-accent)" stroke-width="0.5"/>
      <text x="0" y="2" text-anchor="middle" font-family="Georgia,serif"
            font-size="6" letter-spacing="1" fill="var(--sector-warm)">EXEC</text>
    </g>
    <g transform="translate(0, 60)">
      <polygon points="-12,-8 12,-8 12,8 -12,8" fill="var(--sector-soft)"
               stroke="var(--sector-accent)" stroke-width="0.7"/>
      <polygon points="-12,-8 -8,-12 16,-12 12,-8" fill="var(--sector-accent)" opacity="0.4"
               stroke="var(--sector-accent)" stroke-width="0.5"/>
      <polygon points="12,-8 16,-12 16,4 12,8" fill="var(--sector-accent)" opacity="0.6"
               stroke="var(--sector-accent)" stroke-width="0.5"/>
      <text x="0" y="2" text-anchor="middle" font-family="Georgia,serif"
            font-size="6" letter-spacing="1" fill="var(--sector-warm)">SET</text>
    </g>
    <g transform="translate(-60, 0)">
      <polygon points="-12,-8 12,-8 12,8 -12,8" fill="var(--sector-soft)"
               stroke="var(--sector-accent)" stroke-width="0.7"/>
      <polygon points="-12,-8 -8,-12 16,-12 12,-8" fill="var(--sector-accent)" opacity="0.4"
               stroke="var(--sector-accent)" stroke-width="0.5"/>
      <polygon points="12,-8 16,-12 16,4 12,8" fill="var(--sector-accent)" opacity="0.6"
               stroke="var(--sector-accent)" stroke-width="0.5"/>
      <text x="0" y="2" text-anchor="middle" font-family="Georgia,serif"
            font-size="6" letter-spacing="1" fill="var(--sector-warm)">CON</text>
    </g>
  </g>
  <g stroke="var(--sector-warm)" stroke-width="0.4" opacity="0.5" class="glyph-pulse-2">
    <line x1="0" y1="-44" x2="0" y2="-16"/><line x1="44" y1="0"  x2="16" y2="0"/>
    <line x1="0" y1="44"  x2="0" y2="16"/><line x1="-44" y1="0" x2="-16" y2="0"/>
  </g>
</svg>''',

    "defi": '''<svg class="hero-glyph" viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="gGlow_defi" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="var(--sector-accent)" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#0B1C3D" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="0" cy="0" r="92" fill="url(#gGlow_defi)"/>
  <g class="glyph-rotate">
    <circle cx="0" cy="-22" r="34" stroke="var(--sector-accent)" stroke-width="2.2"
            fill="none" opacity="0.85"/>
    <circle cx="-26" cy="18" r="34" stroke="var(--sector-warm)" stroke-width="2.2"
            fill="none" opacity="0.85"/>
    <circle cx="26" cy="18" r="34" stroke="var(--sector-accent)" stroke-width="2.2"
            fill="none" opacity="0.65"/>
  </g>
  <g class="glyph-rotate-rev" opacity="0.7">
    <path d="M 0,-78 A 78,78 0 0 1 67.5,39" stroke="var(--sector-warm)"
          stroke-width="0.6" fill="none" stroke-dasharray="3 4"/>
    <polygon points="67.5,39 60,46 70,50" fill="var(--sector-warm)"/>
    <path d="M 67.5,39 A 78,78 0 0 1 -67.5,39" stroke="var(--sector-warm)"
          stroke-width="0.6" fill="none" stroke-dasharray="3 4"/>
    <polygon points="-67.5,39 -70,50 -60,46" fill="var(--sector-warm)"/>
    <path d="M -67.5,39 A 78,78 0 0 1 0,-78" stroke="var(--sector-warm)"
          stroke-width="0.6" fill="none" stroke-dasharray="3 4"/>
    <polygon points="0,-78 -8,-72 -2,-66" fill="var(--sector-warm)"/>
  </g>
  <circle cx="0" cy="6" r="14" fill="var(--sector-soft)" stroke="var(--sector-accent)"
          stroke-width="0.6" class="glyph-pulse-1"/>
  <text x="0" y="10" text-anchor="middle" font-family="Georgia,serif"
        font-size="11" font-style="italic" fill="var(--sector-warm)">%</text>
</svg>''',

    "stablecoins": '''<svg class="hero-glyph" viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="gGlow_stablecoins" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="var(--sector-accent)" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#0B1C3D" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="0" cy="0" r="92" fill="url(#gGlow_stablecoins)"/>
  <circle cx="0" cy="0" r="76" stroke="var(--sector-accent)" stroke-width="0.5"
          fill="none" opacity="0.4" stroke-dasharray="1 3"/>
  <circle cx="0" cy="0" r="48" stroke="var(--sector-accent)" stroke-width="1.2"
          fill="var(--sector-soft)" opacity="0.85"/>
  <g class="glyph-pulse-1" stroke="var(--sector-warm)" stroke-width="0.8" opacity="0.7">
    <line x1="0"   y1="-76" x2="0"   y2="-48"/><line x1="76"  y1="0"   x2="48"  y2="0"/>
    <line x1="0"   y1="76"  x2="0"   y2="48"/><line x1="-76" y1="0"   x2="-48" y2="0"/>
    <line x1="54"  y1="-54" x2="34"  y2="-34"/><line x1="54"  y1="54"  x2="34"  y2="34"/>
    <line x1="-54" y1="54"  x2="-34" y2="34"/><line x1="-54" y1="-54" x2="-34" y2="-34"/>
  </g>
  <g fill="var(--sector-warm)">
    <circle cx="0" cy="-76" r="2.2"/><circle cx="76" cy="0" r="2.2"/>
    <circle cx="0" cy="76" r="2.2"/><circle cx="-76" cy="0" r="2.2"/>
    <circle cx="54" cy="-54" r="1.8"/><circle cx="54" cy="54" r="1.8"/>
    <circle cx="-54" cy="54" r="1.8"/><circle cx="-54" cy="-54" r="1.8"/>
  </g>
  <text x="0" y="-2" text-anchor="middle" font-family="Georgia,serif"
        font-size="42" font-weight="500" fill="var(--sector-warm)"
        stroke="var(--sector-accent)" stroke-width="0.4">$</text>
  <text x="0" y="22" text-anchor="middle" font-family="Georgia,serif"
        font-size="11" letter-spacing="3" fill="var(--sector-accent)"
        opacity="0.85" class="glyph-pulse-2">1.00</text>
</svg>''',

    "privacy": '''<svg class="hero-glyph" viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="gGlow_privacy" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="var(--sector-accent)" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#0B1C3D" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="gShield_privacy" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="var(--sector-warm)" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="var(--sector-accent)" stop-opacity="0.1"/>
    </radialGradient>
  </defs>
  <circle cx="0" cy="0" r="92" fill="url(#gGlow_privacy)"/>
  <g class="glyph-rotate" opacity="0.55">
    <line x1="0" y1="-32" x2="0" y2="-86" stroke="var(--sector-warm)" stroke-width="0.6"/>
    <line x1="22" y1="-22" x2="60" y2="-60" stroke="var(--sector-warm)" stroke-width="0.5"/>
    <line x1="32" y1="0" x2="86" y2="0" stroke="var(--sector-warm)" stroke-width="0.6"/>
    <line x1="22" y1="22" x2="60" y2="60" stroke="var(--sector-warm)" stroke-width="0.5"/>
    <line x1="0" y1="32" x2="0" y2="86" stroke="var(--sector-warm)" stroke-width="0.6"/>
    <line x1="-22" y1="22" x2="-60" y2="60" stroke="var(--sector-warm)" stroke-width="0.5"/>
    <line x1="-32" y1="0" x2="-86" y2="0" stroke="var(--sector-warm)" stroke-width="0.6"/>
    <line x1="-22" y1="-22" x2="-60" y2="-60" stroke="var(--sector-warm)" stroke-width="0.5"/>
  </g>
  <rect x="-32" y="-32" width="64" height="64" rx="2"
        fill="url(#gShield_privacy)" stroke="var(--sector-accent)" stroke-width="1.2"/>
  <g class="glyph-pulse-2" stroke="var(--sector-warm)" stroke-width="1" fill="none" opacity="0.85">
    <path d="M -16,-12 Q 0,-22 16,-12 L 14,-2 Q 8,2 4,0 L 0,8 L -4,0 Q -8,2 -14,-2 Z"/>
    <path d="M -10,4 Q -6,8 -2,6 M 2,6 Q 6,8 10,4"/>
    <line x1="-8" y1="-8" x2="-4" y2="-8" stroke-width="1.5"/>
    <line x1="4" y1="-8" x2="8" y2="-8" stroke-width="1.5"/>
    <path d="M -3,12 L 0,22 L 3,12"/>
  </g>
  <text x="0" y="-44" text-anchor="middle" font-family="Georgia,serif"
        font-size="9" letter-spacing="3" fill="var(--sector-warm)"
        opacity="0.9" class="glyph-pulse-1">ZK</text>
</svg>''',

    "ai": '''<svg class="hero-glyph" viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="gGlow_ai" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="var(--sector-accent)" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#0B1C3D" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="0" cy="0" r="92" fill="url(#gGlow_ai)"/>
  <circle cx="0" cy="0" r="78" stroke="var(--sector-accent)" stroke-width="0.3"
          fill="none" opacity="0.3" class="glyph-rotate-rev"/>
  <g class="glyph-rotate">
    <g stroke="var(--sector-accent)" stroke-width="0.7" opacity="0.7">
      <line x1="0" y1="0" x2="0"   y2="-72"/><line x1="0" y1="0" x2="36"  y2="-62"/>
      <line x1="0" y1="0" x2="62"  y2="-36"/><line x1="0" y1="0" x2="72"  y2="0"/>
      <line x1="0" y1="0" x2="62"  y2="36"/><line x1="0" y1="0" x2="36"  y2="62"/>
      <line x1="0" y1="0" x2="0"   y2="72"/><line x1="0" y1="0" x2="-36" y2="62"/>
      <line x1="0" y1="0" x2="-62" y2="36"/><line x1="0" y1="0" x2="-72" y2="0"/>
      <line x1="0" y1="0" x2="-62" y2="-36"/><line x1="0" y1="0" x2="-36" y2="-62"/>
    </g>
    <g fill="var(--sector-warm)">
      <circle cx="0"   cy="-72" r="3.5"/><circle cx="36"  cy="-62" r="2.6"/>
      <circle cx="62"  cy="-36" r="3.5"/><circle cx="72"  cy="0"   r="2.6"/>
      <circle cx="62"  cy="36"  r="3.5"/><circle cx="36"  cy="62"  r="2.6"/>
      <circle cx="0"   cy="72"  r="3.5"/><circle cx="-36" cy="62"  r="2.6"/>
      <circle cx="-62" cy="36"  r="3.5"/><circle cx="-72" cy="0"   r="2.6"/>
      <circle cx="-62" cy="-36" r="3.5"/><circle cx="-36" cy="-62" r="2.6"/>
    </g>
  </g>
  <circle cx="0" cy="0" r="16" fill="var(--sector-soft)"
          stroke="var(--sector-warm)" stroke-width="1" class="glyph-pulse-1"/>
  <circle cx="0" cy="0" r="6" fill="var(--sector-warm)" class="glyph-pulse-2"/>
  <text x="0" y="4" text-anchor="middle" font-family="Georgia,serif"
        font-size="12" fill="var(--sector-accent)" font-style="italic">τ</text>
</svg>''',

    "gamefi": '''<svg class="hero-glyph" viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="gGlow_gamefi" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="var(--sector-accent)" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#0B1C3D" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="0" cy="0" r="92" fill="url(#gGlow_gamefi)"/>
  <g class="glyph-pulse-1">
    <path d="M -56,-22 Q -68,-22 -68,-6 L -60,30 Q -56,40 -42,40 Q -28,40 -22,28
             L -8,28 Q 0,38 8,28 L 22,28 Q 28,40 42,40 Q 56,40 60,30 L 68,-6
             Q 68,-22 56,-22 Z"
          fill="var(--sector-soft)" stroke="var(--sector-accent)" stroke-width="1.2"/>
  </g>
  <g fill="var(--sector-accent)" opacity="0.85">
    <rect x="-46" y="-2" width="14" height="4"/>
    <rect x="-41" y="-7" width="4" height="14"/>
  </g>
  <circle cx="40" cy="-2" r="3.5" fill="var(--sector-warm)" class="glyph-pulse-2"/>
  <circle cx="50" cy="6" r="3.5" fill="var(--sector-warm)" class="glyph-pulse-1"/>
  <g class="glyph-pulse-2" fill="var(--sector-warm)" opacity="0.85">
    <rect x="-2" y="-78" width="4" height="4"/><rect x="-2" y="-74" width="4" height="4"/>
    <rect x="-2" y="-70" width="4" height="4"/><rect x="-2" y="-66" width="4" height="4"/>
    <rect x="-2" y="-62" width="4" height="4"/><rect x="-2" y="-58" width="4" height="4"/>
    <rect x="-2" y="-54" width="4" height="4"/><rect x="-2" y="-50" width="4" height="4"/>
    <rect x="-10" y="-46" width="20" height="4" fill="var(--sector-accent)"/>
    <rect x="-2" y="-42" width="4" height="8" fill="var(--sector-accent)"/>
    <rect x="-3" y="-34" width="6" height="3" fill="var(--sector-warm)"/>
  </g>
  <g class="glyph-pulse-1">
    <rect x="-22" y="56" width="44" height="22" rx="2"
          fill="var(--sector-soft)" stroke="var(--sector-accent)" stroke-width="0.8"/>
    <path d="M -22,62 Q 0,52 22,62" stroke="var(--sector-accent)"
          stroke-width="0.8" fill="none"/>
    <rect x="-3" y="62" width="6" height="6" fill="var(--sector-warm)"/>
    <text x="0" y="72" text-anchor="middle" font-family="Georgia,serif"
          font-size="6" letter-spacing="1.5" fill="var(--sector-warm)">LOOT</text>
  </g>
</svg>''',

    "socialfi": '''<svg class="hero-glyph" viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="gGlow_socialfi" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="var(--sector-accent)" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#0B1C3D" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="0" cy="0" r="92" fill="url(#gGlow_socialfi)"/>
  <g class="glyph-rotate">
    <g fill="var(--sector-soft)" stroke="var(--sector-accent)" stroke-width="0.7">
      <circle cx="0"   cy="-66" r="9"/><circle cx="57"  cy="-33" r="9"/>
      <circle cx="57"  cy="33"  r="9"/><circle cx="0"   cy="66"  r="9"/>
      <circle cx="-57" cy="33"  r="9"/><circle cx="-57" cy="-33" r="9"/>
    </g>
    <g fill="var(--sector-warm)">
      <circle cx="0"   cy="-67" r="2"/><circle cx="57"  cy="-34" r="2"/>
      <circle cx="57"  cy="32"  r="2"/><circle cx="0"   cy="65"  r="2"/>
      <circle cx="-57" cy="32"  r="2"/><circle cx="-57" cy="-34" r="2"/>
    </g>
  </g>
  <g class="glyph-rotate" stroke="var(--sector-warm)" stroke-width="0.8" opacity="0.75" fill="none">
    <line x1="0" y1="-22" x2="0" y2="-54"/>
    <polygon points="0,-54 -3,-48 3,-48" fill="var(--sector-warm)"/>
    <line x1="19"  y1="-11" x2="46" y2="-26"/>
    <polygon points="46,-26 41,-22 44,-30" fill="var(--sector-warm)"/>
    <line x1="19"  y1="11"  x2="46" y2="26"/>
    <polygon points="46,26 44,30 41,22" fill="var(--sector-warm)"/>
    <line x1="0"   y1="22"  x2="0"  y2="54"/>
    <polygon points="0,54 -3,48 3,48" fill="var(--sector-warm)"/>
    <line x1="-19" y1="11"  x2="-46" y2="26"/>
    <polygon points="-46,26 -41,22 -44,30" fill="var(--sector-warm)"/>
    <line x1="-19" y1="-11" x2="-46" y2="-26"/>
    <polygon points="-46,-26 -41,-22 -44,-30" fill="var(--sector-warm)"/>
  </g>
  <circle cx="0" cy="0" r="20" fill="var(--sector-accent)" opacity="0.6"
          stroke="var(--sector-warm)" stroke-width="1" class="glyph-pulse-1"/>
  <circle cx="0" cy="-4" r="5.5" fill="var(--sector-warm)"/>
  <path d="M -10,12 Q 0,2 10,12 L 10,8 Q 0,-2 -10,8 Z"
        fill="var(--sector-warm)" opacity="0.95"/>
</svg>''',

    "rwa": '''<svg class="hero-glyph" viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="gGlow_rwa" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="var(--sector-accent)" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#0B1C3D" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="0" cy="0" r="92" fill="url(#gGlow_rwa)"/>
  <g stroke="var(--sector-accent)" stroke-width="0.8" fill="var(--sector-soft)">
    <rect x="-72" y="-30" width="24" height="56"/>
    <rect x="-76" y="-34" width="32" height="6"/>
    <rect x="-76" y="26" width="32" height="6"/>
    <line x1="-66" y1="-28" x2="-66" y2="24" stroke-width="0.4"/>
    <line x1="-60" y1="-28" x2="-60" y2="24" stroke-width="0.4"/>
    <line x1="-54" y1="-28" x2="-54" y2="24" stroke-width="0.4"/>
  </g>
  <text x="-60" y="3" text-anchor="middle" font-family="Georgia,serif"
        font-size="20" fill="var(--sector-warm)" font-weight="500">$</text>
  <g stroke="var(--sector-accent)" stroke-width="0.8" fill="var(--sector-soft)">
    <rect x="48" y="-30" width="24" height="56"/>
    <rect x="44" y="-34" width="32" height="6"/>
    <rect x="44" y="26" width="32" height="6"/>
  </g>
  <g transform="translate(60, 0)">
    <polygon points="0,-14 -8,0 0,-4" fill="var(--sector-soft)"
             stroke="var(--sector-accent)" stroke-width="0.6"/>
    <polygon points="0,-14 8,0 0,-4" fill="var(--sector-warm)"
             stroke="var(--sector-accent)" stroke-width="0.6" opacity="0.7"/>
    <polygon points="0,14 -8,2 0,-2" fill="var(--sector-soft)"
             stroke="var(--sector-accent)" stroke-width="0.6"/>
    <polygon points="0,14 8,2 0,-2" fill="var(--sector-warm)"
             stroke="var(--sector-accent)" stroke-width="0.6" opacity="0.5"/>
  </g>
  <path d="M -48,-2 Q 0,-30 48,-2"
        stroke="var(--sector-warm)" stroke-width="1.5" fill="none" opacity="0.85"/>
  <path d="M -48,8 Q 0,-20 48,8"
        stroke="var(--sector-accent)" stroke-width="0.6" fill="none" opacity="0.5"/>
  <g stroke="var(--sector-accent)" stroke-width="0.4" opacity="0.6">
    <line x1="-30" y1="-12" x2="-30" y2="-2"/><line x1="-15" y1="-20" x2="-15" y2="-2"/>
    <line x1="0" y1="-24" x2="0" y2="-2"/><line x1="15" y1="-20" x2="15" y2="-2"/>
    <line x1="30" y1="-12" x2="30" y2="-2"/>
  </g>
  <circle cx="-32" cy="-12" r="2.2" fill="var(--sector-warm)" class="glyph-pulse-1"/>
  <circle cx="0" cy="-22" r="2.2" fill="var(--sector-warm)" class="glyph-pulse-2"/>
  <circle cx="32" cy="-12" r="2.2" fill="var(--sector-warm)" class="glyph-pulse-1"/>
  <text x="0" y="58" text-anchor="middle" font-family="Georgia,serif"
        font-size="8" letter-spacing="3" fill="var(--sector-warm)" opacity="0.7">RWA</text>
</svg>''',

    "depin": '''<svg class="hero-glyph" viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="gGlow_depin" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="var(--sector-accent)" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#0B1C3D" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="0" cy="0" r="92" fill="url(#gGlow_depin)"/>
  <g fill="none" stroke="var(--sector-warm)" stroke-width="0.8">
    <path d="M -34,-50 Q 0,-72 34,-50" opacity="0.8" class="glyph-pulse-1"/>
    <path d="M -50,-44 Q 0,-86 50,-44" opacity="0.55" class="glyph-pulse-2"/>
    <path d="M -66,-38 Q 0,-98 66,-38" opacity="0.3" class="glyph-pulse-1"/>
  </g>
  <g stroke="var(--sector-accent)" stroke-width="1" fill="none">
    <line x1="-14" y1="60" x2="-3" y2="-30"/>
    <line x1="14"  y1="60" x2="3"  y2="-30"/>
    <line x1="-12" y1="50" x2="12" y2="50"/>
    <line x1="-10" y1="36" x2="10" y2="36"/>
    <line x1="-8"  y1="22" x2="8"  y2="22"/>
    <line x1="-6"  y1="8"  x2="6"  y2="8"/>
    <line x1="-5"  y1="-6" x2="5"  y2="-6"/>
    <line x1="-4"  y1="-20" x2="4" y2="-20"/>
    <line x1="-12" y1="50" x2="10" y2="36"/>
    <line x1="12"  y1="50" x2="-10" y2="36"/>
    <line x1="-10" y1="36" x2="8" y2="22"/>
    <line x1="10"  y1="36" x2="-8" y2="22"/>
    <line x1="-8"  y1="22" x2="6" y2="8"/>
    <line x1="8"   y1="22" x2="-6" y2="8"/>
    <line x1="-6"  y1="8" x2="5" y2="-6"/>
    <line x1="6"   y1="8" x2="-5" y2="-6"/>
  </g>
  <circle cx="0" cy="-32" r="3" fill="var(--sector-warm)" class="glyph-pulse-1"/>
  <line x1="0" y1="-32" x2="0" y2="-44" stroke="var(--sector-warm)" stroke-width="1.2"/>
  <circle cx="0" cy="-46" r="2" fill="var(--sector-warm)"/>
  <line x1="-40" y1="60" x2="40" y2="60" stroke="var(--sector-accent)" stroke-width="0.6" opacity="0.5"/>
  <g fill="var(--sector-accent)" opacity="0.85">
    <circle cx="-66" cy="60" r="2.5"/><circle cx="66"  cy="60" r="2.5"/>
    <circle cx="-50" cy="78" r="2"/><circle cx="50"  cy="78" r="2"/>
  </g>
  <g stroke="var(--sector-accent)" stroke-width="0.7">
    <line x1="-66" y1="60" x2="-66" y2="50"/>
    <line x1="66"  y1="60" x2="66"  y2="50"/>
  </g>
</svg>''',

    "oracles": '''<svg class="hero-glyph" viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="gGlow_oracles" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="var(--sector-accent)" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#0B1C3D" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="0" cy="0" r="92" fill="url(#gGlow_oracles)"/>
  <g class="glyph-rotate">
    <polygon points="0,-32 28,-16 28,16 0,32 -28,16 -28,-16"
             fill="var(--sector-soft)" stroke="var(--sector-accent)" stroke-width="1.2"/>
    <polygon points="0,-22 19,-11 19,11 0,22 -19,11 -19,-11"
             fill="none" stroke="var(--sector-warm)" stroke-width="0.8" opacity="0.9"/>
    <line x1="0" y1="-22" x2="0" y2="22" stroke="var(--sector-warm)" stroke-width="0.5" opacity="0.7"/>
    <line x1="-19" y1="-11" x2="19" y2="11" stroke="var(--sector-warm)" stroke-width="0.5" opacity="0.5"/>
    <line x1="19" y1="-11" x2="-19" y2="11" stroke="var(--sector-warm)" stroke-width="0.5" opacity="0.5"/>
  </g>
  <g class="glyph-pulse-1">
    <circle cx="-66" cy="-66" r="8" fill="var(--sector-warm)" opacity="0.7"/>
    <g stroke="var(--sector-warm)" stroke-width="0.7" opacity="0.6">
      <line x1="-66" y1="-82" x2="-66" y2="-78"/>
      <line x1="-50" y1="-66" x2="-54" y2="-66"/>
      <line x1="-78" y1="-66" x2="-82" y2="-66"/>
      <line x1="-66" y1="-50" x2="-66" y2="-54"/>
    </g>
  </g>
  <g class="glyph-pulse-2">
    <rect x="48" y="-78" width="22" height="14" rx="2"
          fill="var(--sector-soft)" stroke="var(--sector-accent)" stroke-width="0.6"/>
    <text x="59" y="-68" text-anchor="middle" font-family="Georgia,serif"
          font-size="9" fill="var(--sector-warm)">$</text>
  </g>
  <g stroke="var(--sector-warm)" stroke-width="0.7" fill="none" opacity="0.7">
    <line x1="-58" y1="-58" x2="-22" y2="-22"/>
    <polygon points="-22,-22 -28,-20 -24,-26" fill="var(--sector-warm)"/>
    <line x1="50" y1="-58" x2="22" y2="-22"/>
    <polygon points="22,-22 28,-20 24,-26" fill="var(--sector-warm)"/>
  </g>
  <g fill="var(--sector-soft)" stroke="var(--sector-accent)" stroke-width="0.6">
    <rect x="-66" y="56" width="22" height="18" rx="1"/>
    <rect x="-11" y="56" width="22" height="18" rx="1"/>
    <rect x="44" y="56" width="22" height="18" rx="1"/>
  </g>
  <g stroke="var(--sector-accent)" stroke-width="1" fill="none">
    <line x1="-44" y1="65" x2="-11" y2="65"/>
    <line x1="11" y1="65" x2="44" y2="65"/>
  </g>
  <g stroke="var(--sector-warm)" stroke-width="0.7" fill="none" opacity="0.7">
    <line x1="-14" y1="22" x2="-55" y2="52"/>
    <polygon points="-55,52 -50,50 -53,56" fill="var(--sector-warm)"/>
    <line x1="0" y1="32" x2="0" y2="52"/>
    <polygon points="0,52 -3,46 3,46" fill="var(--sector-warm)"/>
    <line x1="14" y1="22" x2="55" y2="52"/>
    <polygon points="55,52 53,56 50,50" fill="var(--sector-warm)"/>
  </g>
</svg>''',

    "staking": '''<svg class="hero-glyph" viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="gGlow_staking" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="var(--sector-accent)" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#0B1C3D" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="0" cy="0" r="92" fill="url(#gGlow_staking)"/>
  <path d="M 0,-78 L 56,-58 L 56,4 Q 56,52 0,80 Q -56,52 -56,4 L -56,-58 Z"
        fill="var(--sector-soft)" stroke="var(--sector-accent)" stroke-width="1.4"/>
  <path d="M 0,-68 L 48,-50 L 48,4 Q 48,46 0,70 Q -48,46 -48,4 L -48,-50 Z"
        fill="none" stroke="var(--sector-warm)" stroke-width="0.6" opacity="0.7"/>
  <g class="glyph-rotate-rev" opacity="0.55">
    <circle cx="0" cy="0" r="40" stroke="var(--sector-accent)" stroke-width="0.6" fill="none" stroke-dasharray="2 4"/>
    <circle cx="0" cy="0" r="30" stroke="var(--sector-accent)" stroke-width="0.5" fill="none" stroke-dasharray="2 4"/>
    <circle cx="0" cy="0" r="20" stroke="var(--sector-accent)" stroke-width="0.4" fill="none" stroke-dasharray="2 4"/>
  </g>
  <polygon points="0,-26 -16,-2 0,-8" fill="var(--sector-soft)"
           stroke="var(--sector-warm)" stroke-width="0.7" opacity="0.95"/>
  <polygon points="0,-26 16,-2 0,-8" fill="var(--sector-warm)"
           stroke="var(--sector-warm)" stroke-width="0.7" opacity="0.6"/>
  <polygon points="0,26 -16,4 0,-2" fill="var(--sector-soft)"
           stroke="var(--sector-warm)" stroke-width="0.7"/>
  <polygon points="0,26 16,4 0,-2" fill="var(--sector-warm)"
           stroke="var(--sector-warm)" stroke-width="0.7" opacity="0.55"/>
  <circle cx="0" cy="0" r="50" stroke="var(--sector-warm)" stroke-width="0.4"
          fill="none" opacity="0.5" class="glyph-pulse-1"/>
  <g fill="var(--sector-warm)" class="glyph-pulse-2">
    <rect x="42" y="-46" width="3" height="6"/>
    <rect x="42" y="-36" width="3" height="6"/>
    <rect x="42" y="-26" width="3" height="6"/>
  </g>
  <text x="0" y="56" text-anchor="middle" font-family="Georgia,serif"
        font-size="9" letter-spacing="2" fill="var(--sector-warm)" opacity="0.85">% APR</text>
</svg>''',

    "predictions": '''<svg class="hero-glyph" viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="gGlow_predictions" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="var(--sector-accent)" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#0B1C3D" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="0" cy="0" r="92" fill="url(#gGlow_predictions)"/>
  <circle cx="0" cy="-58" r="9" fill="var(--sector-warm)"
          stroke="var(--sector-accent)" stroke-width="0.8" class="glyph-pulse-1"/>
  <text x="0" y="-55" text-anchor="middle" font-family="Georgia,serif"
        font-size="11" fill="var(--sector-accent)" font-style="italic">?</text>
  <line x1="-3" y1="-50" x2="-46" y2="-2" stroke="var(--sector-accent)" stroke-width="1.2"/>
  <line x1="3"  y1="-50" x2="46"  y2="-2" stroke="var(--sector-accent)" stroke-width="1.2"/>
  <circle cx="-46" cy="6" r="20" fill="var(--sector-soft)"
          stroke="var(--sector-accent)" stroke-width="1" class="glyph-pulse-2"/>
  <text x="-46" y="2" text-anchor="middle" font-family="Georgia,serif"
        font-size="14" font-weight="500" fill="var(--sector-accent)">38</text>
  <text x="-46" y="14" text-anchor="middle" font-family="Georgia,serif"
        font-size="8" fill="var(--sector-warm)" opacity="0.85">NO ¢</text>
  <circle cx="46" cy="6" r="22" fill="var(--sector-soft)"
          stroke="var(--sector-warm)" stroke-width="1.2" class="glyph-pulse-1"/>
  <text x="46" y="3" text-anchor="middle" font-family="Georgia,serif"
        font-size="16" font-weight="500" fill="var(--sector-warm)">62</text>
  <text x="46" y="16" text-anchor="middle" font-family="Georgia,serif"
        font-size="8" fill="var(--sector-warm)" opacity="0.85">YES ¢</text>
  <g stroke="var(--sector-accent)" stroke-width="0.5" opacity="0.5">
    <line x1="-46" y1="26" x2="-66" y2="58"/>
    <line x1="-46" y1="26" x2="-26" y2="58"/>
    <line x1="46"  y1="28" x2="26"  y2="58"/>
    <line x1="46"  y1="28" x2="66"  y2="58"/>
  </g>
  <g fill="var(--sector-accent)" opacity="0.6">
    <circle cx="-66" cy="62" r="3"/><circle cx="-26" cy="62" r="3"/>
    <circle cx="26"  cy="62" r="3"/><circle cx="66"  cy="62" r="3"/>
  </g>
  <line x1="-72" y1="78" x2="72" y2="78" stroke="var(--sector-warm)"
        stroke-width="0.4" opacity="0.4"/>
  <text x="0" y="90" text-anchor="middle" font-family="Georgia,serif"
        font-size="8" letter-spacing="3" fill="var(--sector-warm)" opacity="0.65">PROBABILITY</text>
</svg>''',

    "desci": '''<svg class="hero-glyph" viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="gGlow_desci" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="var(--sector-accent)" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#0B1C3D" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="0" cy="0" r="92" fill="url(#gGlow_desci)"/>
  <g class="glyph-rotate">
    <path d="M -28,-72 Q 0,-54 28,-72 Q 56,-90 28,-72
             Q 0,-54 -28,-36 Q -56,-18 -28,-36
             Q 0,-18 28,0 Q 56,18 28,0
             Q 0,18 -28,36 Q -56,54 -28,36
             Q 0,54 28,72"
          stroke="var(--sector-accent)" stroke-width="1.2" fill="none" opacity="0.85"/>
    <path d="M 28,-72 Q 0,-54 -28,-72 Q -56,-90 -28,-72
             Q 0,-54 28,-36 Q 56,-18 28,-36
             Q 0,-18 -28,0 Q -56,18 -28,0
             Q 0,18 28,36 Q 56,54 28,36
             Q 0,54 -28,72"
          stroke="var(--sector-warm)" stroke-width="1.2" fill="none" opacity="0.75"/>
    <g stroke="var(--sector-warm)" stroke-width="0.5" opacity="0.6">
      <line x1="-22" y1="-58" x2="22" y2="-58"/>
      <line x1="-22" y1="-22" x2="22" y2="-22"/>
      <line x1="-22" y1="14" x2="22" y2="14"/>
      <line x1="-22" y1="50" x2="22" y2="50"/>
    </g>
  </g>
  <g class="glyph-pulse-1">
    <path d="M -16,-12 L -16,4 L -26,28 Q -28,38 -18,38 L 18,38 Q 28,38 26,28 L 16,4 L 16,-12 Z"
          fill="var(--sector-soft)" stroke="var(--sector-accent)" stroke-width="1.2" opacity="0.85"/>
    <line x1="-18" y1="-12" x2="-14" y2="-12" stroke="var(--sector-accent)" stroke-width="1"/>
    <line x1="14" y1="-12" x2="18" y2="-12" stroke="var(--sector-accent)" stroke-width="1"/>
    <path d="M -22,18 L 22,18 L 26,28 Q 28,38 18,38 L -18,38 Q -28,38 -26,28 Z"
          fill="var(--sector-warm)" opacity="0.45"/>
    <circle cx="-6" cy="22" r="1.5" fill="var(--sector-warm)" class="glyph-pulse-2"/>
    <circle cx="6" cy="28" r="1.2" fill="var(--sector-warm)" class="glyph-pulse-1"/>
    <circle cx="0" cy="14" r="1" fill="var(--sector-warm)" class="glyph-pulse-2"/>
  </g>
</svg>''',

    "icm": '''<svg class="hero-glyph" viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="gGlow_icm" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="var(--sector-accent)" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#0B1C3D" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gCurve_icm" x1="0" x2="1" y1="1" y2="0">
      <stop offset="0%" stop-color="var(--sector-accent)" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="var(--sector-warm)" stop-opacity="0.45"/>
    </linearGradient>
  </defs>
  <circle cx="0" cy="0" r="92" fill="url(#gGlow_icm)"/>
  <line x1="-72" y1="60" x2="72" y2="60" stroke="var(--sector-accent)" stroke-width="0.5" opacity="0.6"/>
  <line x1="-72" y1="60" x2="-72" y2="-72" stroke="var(--sector-accent)" stroke-width="0.5" opacity="0.6"/>
  <g stroke="var(--sector-accent)" stroke-width="0.3" opacity="0.2">
    <line x1="-72" y1="30" x2="72" y2="30"/>
    <line x1="-72" y1="0"  x2="72" y2="0"/>
    <line x1="-72" y1="-30" x2="72" y2="-30"/>
    <line x1="-36" y1="60" x2="-36" y2="-72"/>
    <line x1="0"   y1="60" x2="0"   y2="-72"/>
    <line x1="36"  y1="60" x2="36"  y2="-72"/>
  </g>
  <path d="M -72,60 Q -40,58 -10,46 Q 20,32 40,4 Q 56,-22 64,-58 L 72,-58 L 72,60 Z"
        fill="url(#gCurve_icm)" opacity="0.85"/>
  <path d="M -72,60 Q -40,58 -10,46 Q 20,32 40,4 Q 56,-22 64,-58"
        stroke="var(--sector-warm)" stroke-width="1.6" fill="none" class="glyph-pulse-1"/>
  <g class="glyph-pulse-2" transform="translate(64, -58)">
    <path d="M -3,-12 Q 0,-18 3,-12 L 3,4 L -3,4 Z"
          fill="var(--sector-warm)" stroke="var(--sector-accent)" stroke-width="0.5"/>
    <path d="M -3,0 L -7,6 L -3,4 Z" fill="var(--sector-accent)"/>
    <path d="M 3,0 L 7,6 L 3,4 Z" fill="var(--sector-accent)"/>
    <circle cx="0" cy="-6" r="1.5" fill="var(--sector-accent)"/>
    <path d="M -2,4 Q 0,16 -1,22 M 2,4 Q 0,18 1,24"
          stroke="var(--sector-warm)" stroke-width="0.6" fill="none" opacity="0.6"/>
  </g>
  <g class="glyph-pulse-1">
    <line x1="-50" y1="42" x2="-50" y2="-10" stroke="var(--sector-warm)" stroke-width="0.7"/>
    <rect x="-54" y="14" width="8" height="22" fill="var(--sector-warm)" opacity="0.7"
          stroke="var(--sector-warm)" stroke-width="0.5"/>
  </g>
  <text x="0" y="78" text-anchor="middle" font-family="Georgia,serif"
        font-size="8" letter-spacing="3" fill="var(--sector-warm)" opacity="0.65">SUPPLY → PRICE</text>
</svg>''',

    "memes": '''<svg class="hero-glyph" viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="gGlow_memes" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="var(--sector-accent)" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="#0B1C3D" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="gFire_memes" cx="50%" cy="80%" r="60%">
      <stop offset="0%" stop-color="var(--sector-warm)" stop-opacity="0.85"/>
      <stop offset="80%" stop-color="var(--sector-accent)" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="var(--sector-accent)" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="0" cy="0" r="92" fill="url(#gGlow_memes)"/>
  <path class="glyph-pulse-1"
        d="M 0,72 Q -44,58 -42,18 Q -40,-12 -22,-22
           Q -28,4 -14,12 Q -22,-28 0,-58
           Q 14,-30 6,-12 Q 22,-20 18,-44
           Q 42,-12 42,18 Q 44,58 0,72 Z"
        fill="url(#gFire_memes)" stroke="var(--sector-warm)" stroke-width="1.2"/>
  <path class="glyph-pulse-2"
        d="M 0,52 Q -22,42 -22,18 Q -22,-2 -8,-14
           Q -10,2 0,4 Q -6,-12 0,-32
           Q 8,-14 4,-2 Q 14,-6 12,-20
           Q 22,-2 22,18 Q 22,42 0,52 Z"
        fill="var(--sector-warm)" opacity="0.65"/>
  <g class="glyph-pulse-2">
    <text x="-60" y="40" font-family="Georgia,serif" font-size="22"
          font-weight="500" fill="var(--sector-warm)" opacity="0.75">$</text>
    <text x="62" y="20" font-family="Georgia,serif" font-size="26"
          font-weight="500" fill="var(--sector-warm)" opacity="0.85">$</text>
    <text x="-66" y="-12" font-family="Georgia,serif" font-size="18"
          font-weight="500" fill="var(--sector-accent)" opacity="0.65">$</text>
  </g>
  <circle cx="0" cy="32" r="3" fill="var(--sector-warm)" class="glyph-pulse-1"/>
  <g fill="var(--sector-warm)" opacity="0.85">
    <circle cx="-32" cy="-66" r="1.5"/>
    <circle cx="36" cy="-58" r="1.8"/>
    <circle cx="0" cy="-78" r="1.3"/>
  </g>
</svg>''',

    "nfts": '''<svg class="hero-glyph" viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="gGlow_nfts" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="var(--sector-accent)" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#0B1C3D" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="0" cy="0" r="92" fill="url(#gGlow_nfts)"/>
  <rect x="-60" y="-72" width="120" height="120" rx="2"
        fill="none" stroke="var(--sector-accent)" stroke-width="1.6"/>
  <rect x="-54" y="-66" width="108" height="108" rx="1"
        fill="var(--sector-soft)" stroke="var(--sector-warm)" stroke-width="0.5"/>
  <g fill="var(--sector-warm)" opacity="0.85">
    <circle cx="-60" cy="-72" r="2.5"/><circle cx="60"  cy="-72" r="2.5"/>
    <circle cx="-60" cy="48"  r="2.5"/><circle cx="60"  cy="48"  r="2.5"/>
  </g>
  <g fill="var(--sector-accent)" class="glyph-pulse-1">
    <rect x="-30" y="-50" width="6" height="6"/>
    <rect x="-24" y="-56" width="48" height="6"/>
    <rect x="24"  y="-50" width="6" height="6"/>
    <rect x="-30" y="-44" width="6" height="42"/>
    <rect x="24"  y="-44" width="6" height="42"/>
    <rect x="-24" y="-2" width="48" height="6"/>
  </g>
  <rect x="-24" y="-50" width="48" height="48" fill="var(--sector-warm)" opacity="0.55"/>
  <g fill="var(--sector-accent)">
    <rect x="-20" y="-32" width="14" height="6"/>
    <rect x="6"   y="-32" width="14" height="6"/>
    <rect x="-6"  y="-30" width="6"  height="2"/>
  </g>
  <rect x="-8" y="-14" width="16" height="3" fill="var(--sector-accent)"/>
  <rect x="22" y="-20" width="4" height="4" fill="var(--sector-warm)" class="glyph-pulse-2"/>
  <text x="0" y="68" text-anchor="middle" font-family="Georgia,serif"
        font-size="11" letter-spacing="3" fill="var(--sector-warm)"
        font-style="italic">#0427 / 10000</text>
</svg>''',

    "neobanks": '''<svg class="hero-glyph" viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="gGlow_neobanks" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="var(--sector-accent)" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#0B1C3D" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gCard_neobanks" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="var(--sector-accent)" stop-opacity="0.65"/>
      <stop offset="100%" stop-color="var(--sector-warm)" stop-opacity="0.4"/>
    </linearGradient>
    <linearGradient id="gChip_neobanks" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="var(--sector-warm)" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="var(--sector-accent)" stop-opacity="0.6"/>
    </linearGradient>
  </defs>
  <circle cx="0" cy="0" r="92" fill="url(#gGlow_neobanks)"/>
  <g class="glyph-pulse-1">
    <path d="M -68,-30 L 60,-46 L 76,30 L -52,46 Z"
          fill="var(--sector-accent)" opacity="0.25"/>
    <path d="M -64,-26 L 64,-42 L 80,34 L -48,50 Z"
          fill="url(#gCard_neobanks)" stroke="var(--sector-accent)" stroke-width="1"/>
  </g>
  <g class="glyph-pulse-2">
    <path d="M -44,-12 L -16,-15 L -12,5 L -40,8 Z"
          fill="url(#gChip_neobanks)" stroke="var(--sector-accent)" stroke-width="0.6"/>
    <g stroke="var(--sector-accent)" stroke-width="0.4" opacity="0.6">
      <line x1="-40" y1="-8" x2="-16" y2="-11"/>
      <line x1="-39" y1="-3" x2="-15" y2="-6"/>
      <line x1="-38" y1="2"  x2="-14" y2="-1"/>
      <line x1="-30" y1="-12" x2="-28" y2="6"/>
      <line x1="-22" y1="-13" x2="-20" y2="5"/>
    </g>
  </g>
  <g stroke="var(--sector-warm)" stroke-width="1" fill="none" opacity="0.7">
    <path d="M -4,-14 Q 4,-12 6,-4" class="glyph-pulse-1"/>
    <path d="M 0,-20 Q 12,-16 14,0" class="glyph-pulse-2"/>
    <path d="M 4,-26 Q 20,-20 22,4" class="glyph-pulse-1"/>
  </g>
  <text x="50" y="34" text-anchor="end" font-family="Georgia,serif"
        font-size="12" font-style="italic" font-weight="400"
        fill="var(--sector-warm)" letter-spacing="0.5">FRQNCY</text>
  <g fill="var(--sector-warm)" opacity="0.6">
    <rect x="-44" y="20" width="14" height="2"/>
    <rect x="-26" y="18" width="14" height="2"/>
    <rect x="-8"  y="16" width="14" height="2"/>
    <rect x="10"  y="14" width="14" height="2"/>
  </g>
  <g fill="var(--sector-warm)" opacity="0.4">
    <circle cx="-72" cy="-60" r="1.5"/><circle cx="-60" cy="-68" r="1.2"/>
    <circle cx="64"  cy="60" r="1.5"/><circle cx="76"  cy="52" r="1.2"/>
  </g>
</svg>''',
}
