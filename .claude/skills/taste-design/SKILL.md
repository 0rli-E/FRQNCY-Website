---
name: taste-design
description: Generate opinionated, anti-slop DESIGN.md files optimized for Google Stitch screen generation. Use when you want a premium, non-generic design system with explicit anti-patterns, spring physics motion, and curated typography — enforcing creative taste over AI defaults.
---

# Stitch Design Taste — Semantic Design System

## Overview

This skill generates `DESIGN.md` files optimized for Google Stitch screen generation. It translates battle-tested anti-slop frontend engineering directives into Stitch's native semantic design language — descriptive, natural-language rules paired with precise values.

The generated `DESIGN.md` serves as the single source of truth for prompting Stitch to generate new screens with a curated, high-agency design language.

## Prerequisites

- Access to Google Stitch via labs.google.com/stitch
- Optionally: Stitch MCP Server for programmatic integration

## Analysis & Synthesis Instructions

### 1. Define the Atmosphere

Use evocative adjectives from the taste spectrum:

| Axis | Low (1–3) | Mid (4–7) | High (8–10) |
|------|-----------|-----------|-------------|
| Density | Art Gallery Airy | Daily App Balanced | Cockpit Dense |
| Variance | Predictable Symmetric | Offset Asymmetric | Artsy Chaotic |
| Motion | Static Restrained | Fluid CSS | Cinematic Choreography |

**Default baseline:** Creativity 9, Variance 8, Motion 6, Density 5. Adapt dynamically based on user's vibe description.

### 2. Map the Color Palette

For each color provide: Descriptive Name + Hex Code + Functional Role.

**Mandatory constraints:**
- Maximum 1 accent color. Saturation below 80%.
- The "AI Purple/Blue Neon" aesthetic is strictly **BANNED** — no purple button glows, no neon gradients
- Use absolute neutral bases (Zinc/Slate) with high-contrast singular accents
- Stick to one palette — no warm/cool gray fluctuation
- **Never use pure black (#000000)** — use Off-Black, Zinc-950, or Charcoal

### 3. Establish Typography Rules

- **Display/Headlines:** Track-tight, controlled scale. Hierarchy through weight and color, not just massive size.
- **Body:** Relaxed leading, max 65 characters per line.
- **Font Selection:** Inter is **BANNED** for premium/creative contexts. Force unique character: Geist, Outfit, Cabinet Grotesk, or Satoshi.
- **Serif Ban:** Generic serif fonts (Times New Roman, Georgia, Garamond, Palatino) are **BANNED**. If serif is needed for editorial contexts only, use distinctive modern serifs: Fraunces, Gambarino, Editorial New, or Instrument Serif. Serif is **always BANNED** in dashboards or software UIs.
- **Dashboard Constraint:** Use Sans-Serif pairings exclusively (Geist + Geist Mono or Satoshi + JetBrains Mono).
- **High-Density Override:** When density exceeds 7, all numbers must use Monospace.

### 4. Define the Hero Section

The Hero is the first impression and must be creative, striking, and never generic:

- **Inline Image Typography:** Embed small, contextual photos or visuals directly between words or letters in the headline. Images sit inline at type-height, rounded, acting as visual punctuation.
- **No Overlapping:** Text must never overlap images or other text. Every element occupies its own clean spatial zone.
- **No Filler Text:** "Scroll to explore", "Swipe down", scroll arrow icons, bouncing chevrons are **BANNED**.
- **Asymmetric Structure:** Centered Hero layouts **BANNED** when variance exceeds 4.
- **CTA Restraint:** Maximum one primary CTA. No secondary "Learn more" links.

### 5. Describe Component Stylings

- **Buttons:** Tactile push feedback on active state. No neon outer glows. No custom mouse cursors.
- **Cards:** Use ONLY when elevation communicates hierarchy. Tint shadows to background hue. For high-density layouts, replace cards with border-top dividers or negative space.
- **Inputs/Forms:** Label above input, helper text optional, error text below. Standard gap spacing.
- **Loading States:** Skeletal loaders matching layout dimensions — no generic circular spinners.
- **Empty States:** Composed compositions indicating how to populate data.
- **Error States:** Clear, inline error reporting.

### 6. Define Layout Principles

- No overlapping elements — every element occupies its own clear spatial zone
- Centered Hero sections are **BANNED** when variance exceeds 4 — force Split Screen, Left-Aligned, or Asymmetric Whitespace
- The generic "3 equal cards horizontally" feature row is **BANNED** — use 2-column Zig-Zag, asymmetric grid, or horizontal scroll
- CSS Grid over Flexbox math — never use `calc()` percentage hacks
- Contain layouts using max-width constraints (e.g., 1400px centered)
- Full-height sections must use `min-h-[100dvh]` — never `h-screen` (iOS Safari catastrophic jump)

### 7. Define Responsive Rules

- **Mobile-First Collapse (< 768px):** All multi-column layouts collapse to single column. No exceptions.
- **No Horizontal Scroll:** Horizontal overflow on mobile is a critical failure.
- **Typography Scaling:** Headlines scale via `clamp()`. Body text minimum 1rem/14px.
- **Touch Targets:** All interactive elements minimum 44px tap target.
- **Image Behavior:** Inline typography images stack below headline on mobile.
- **Navigation:** Desktop horizontal nav collapses to clean mobile menu.
- **Spacing:** Vertical section gaps reduce proportionally (`clamp(3rem, 8vw, 6rem)`).

### 8. Encode Motion Philosophy

- **Spring Physics default:** `stiffness: 100, damping: 20` — premium, weighty feel. No linear easing.
- **Perpetual Micro-Interactions:** Every active component should have an infinite loop state (Pulse, Typewriter, Float, Shimmer).
- **Staggered Orchestration:** Never mount lists instantly — use cascade delays for waterfall reveals.
- **Performance:** Animate exclusively via `transform` and `opacity`. Never animate `top`, `left`, `width`, `height`. Grain/noise filters on fixed pseudo-elements only.

### 9. List Anti-Patterns (AI Tells)

Encode these as explicit "NEVER DO" rules in the `DESIGN.md`:

- No emojis anywhere
- No Inter font
- No generic serif fonts (Times New Roman, Georgia, Garamond) — distinctive modern serifs only if needed
- No pure black (#000000)
- No neon/outer glow shadows
- No oversaturated accents
- No excessive gradient text on large headers
- No custom mouse cursors
- No overlapping elements — clean spatial separation always
- No 3-column equal card layouts
- No generic names ("John Doe", "Acme", "Nexus")
- No fake round numbers (99.99%, 50%)
- **No fabricated data or statistics** — never generate metrics, performance numbers, uptime percentages, or response times. Use clear placeholder labels like `[metric]` instead.
- No fake system/metric sections ("SYSTEM PERFORMANCE METRICS" filled with invented data)
- No `LABEL // YEAR` formatting — lazy AI convention
- No AI copywriting clichés ("Elevate", "Seamless", "Unleash", "Next-Gen")
- No filler UI text: "Scroll to explore", "Swipe down", scroll arrows, bouncing chevrons
- No broken Unsplash links — use `picsum.photos` or SVG avatars
- No centered Hero sections (for high-variance projects)

## Output Format (DESIGN.md Structure)

```markdown
# Design System: [Project Title]

## 1. Visual Theme & Atmosphere
(Evocative description of mood, density, variance, and motion intensity.)

## 2. Color Palette & Roles
- **Canvas White** (#F9FAFB) — Primary background surface
- **Charcoal Ink** (#18181B) — Primary text, Zinc-950 depth
- **[Accent Name]** (#XXXXXX) — Single accent (Max 1, Saturation < 80%, No purple/neon)

## 3. Typography Rules
- **Display:** [Font Name] — Track-tight, controlled scale
- **Body:** [Font Name] — Relaxed leading, 65ch max-width
- **Mono:** [Font Name] — For code, metadata, timestamps
- **Banned:** Inter, generic system fonts, generic serifs

## 4. Component Stylings
* **Buttons:** Flat, tactile -1px translate on active. No outer glow.
* **Cards:** Used only when elevation serves hierarchy.
* **Inputs:** Label above, error below. Focus ring in accent color.
* **Loaders:** Skeletal shimmer. No circular spinners.

## 5. Layout Principles
(Grid-first, asymmetric splits for Hero, strict single-column collapse below 768px.)

## 6. Motion & Interaction
(Spring physics. Staggered cascade reveals. Hardware-accelerated transforms only.)

## 7. Anti-Patterns (Banned)
(Full list of forbidden patterns.)
```
