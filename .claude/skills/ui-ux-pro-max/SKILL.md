---
name: ui-ux-pro-max
description: "UI/UX design intelligence for web and mobile. Includes 50+ styles, 161 color palettes, 57 font pairings, 161 product types, 99 UX guidelines, and 25 chart types across 10 stacks. Searchable database with design-system generation. Use when designing pages, components, choosing colors/typography, reviewing UI for UX issues, or implementing accessible and performant interfaces."
---

# UI/UX Pro Max - Design Intelligence

Comprehensive design guide for web and mobile applications. Contains 50+ styles, 161 color palettes, 57 font pairings, 161 product types with reasoning rules, 99 UX guidelines, and 25 chart types across 10 technology stacks. Searchable database with priority-based recommendations.

## When to Apply

This Skill should be used when the task involves UI structure, visual design decisions, interaction patterns, or user experience quality control.

**Must Use** — invoke in the following situations:
- Designing new pages (Landing Page, Dashboard, Admin, SaaS, Mobile App)
- Creating or refactoring UI components (buttons, modals, forms, tables, charts, etc.)
- Choosing color schemes, typography systems, spacing standards, or layout systems
- Reviewing UI code for user experience, accessibility, or visual consistency
- Implementing navigation structures, animations, or responsive behavior
- Making product-level design decisions (style, information hierarchy, brand expression)
- Improving perceived quality, clarity, or usability of interfaces

**Recommended** — use in these situations:
- UI looks "not professional enough" but the reason is unclear
- Receiving feedback on usability or experience
- Pre-launch UI quality optimization
- Aligning cross-platform design (Web / iOS / Android)
- Building design systems or reusable component libraries

**Skip** — not needed in these situations:
- Pure backend logic development
- Only involving API or database design
- Performance optimization unrelated to the interface
- Infrastructure or DevOps work
- Non-visual scripts or automation tasks

**Decision criteria:** If the task will change how a feature looks, feels, moves, or is interacted with, this Skill should be used.

---

## Rule Categories by Priority

For human/AI reference: follow priority 1→10 to decide which rule category to focus on first; use `--domain <Domain>` to query details when needed.

| Priority | Category | Impact | Domain | Key Checks (Must Have) | Anti-Patterns (Avoid) |
|----------|----------|--------|--------|------------------------|----------------------|
| 1 | Accessibility | CRITICAL | ux | Contrast 4.5:1, Alt text, Keyboard nav, Aria-labels | Removing focus rings, Icon-only buttons without labels |
| 2 | Touch & Interaction | CRITICAL | ux | Min size 44×44px, 8px+ spacing, Loading feedback | Reliance on hover only, Instant state changes (0ms) |
| 3 | Performance | HIGH | ux | WebP/AVIF, Lazy loading, Reserve space (CLS < 0.1) | Layout thrashing, Cumulative Layout Shift |
| 4 | Style Selection | HIGH | style, product | Match product type, Consistency, SVG icons (no emoji) | Mixing flat & skeuomorphic randomly, Emoji as icons |
| 5 | Layout & Responsive | HIGH | ux | Mobile-first breakpoints, Viewport meta, No horizontal scroll | Horizontal scroll, Fixed px container widths, Disable zoom |
| 6 | Typography & Color | MEDIUM | typography, color | Base 16px, Line-height 1.5, Semantic color tokens | Text < 12px body, Gray-on-gray, Raw hex in components |
| 7 | Animation | MEDIUM | ux | Duration 150–300ms, Motion conveys meaning, Spatial continuity | Decorative-only animation, Animating width/height, No reduced-motion |
| 8 | Forms & Feedback | MEDIUM | ux | Visible labels, Error near field, Helper text, Progressive disclosure | Placeholder-only label, Errors only at top, Overwhelm upfront |
| 9 | Navigation Patterns | HIGH | ux | Predictable back, Bottom nav ≤5, Deep linking | Overloaded nav, Broken back behavior, No deep links |
| 10 | Charts & Data | LOW | chart | Legends, Tooltips, Accessible colors | Relying on color alone to convey meaning |

---

## Quick Reference

### 1. Accessibility (CRITICAL)

- **color-contrast** — Minimum 4.5:1 ratio for normal text (large text 3:1)
- **focus-states** — Visible focus rings on interactive elements (2–4px)
- **alt-text** — Descriptive alt text for meaningful images
- **aria-labels** — aria-label for icon-only buttons; accessibilityLabel in native
- **keyboard-nav** — Tab order matches visual order; full keyboard support
- **form-labels** — Use label with `for` attribute
- **skip-links** — Skip to main content for keyboard users
- **heading-hierarchy** — Sequential h1→h6, no level skip
- **color-not-only** — Don't convey info by color alone (add icon/text)
- **dynamic-type** — Support system text scaling; avoid truncation as text grows
- **reduced-motion** — Respect `prefers-reduced-motion`; reduce/disable animations when requested
- **voiceover-sr** — Meaningful accessibilityLabel/accessibilityHint; logical reading order for VoiceOver/screen readers
- **escape-routes** — Provide cancel/back in modals and multi-step flows
- **keyboard-shortcuts** — Preserve system and a11y shortcuts; offer keyboard alternatives for drag-and-drop

### 2. Touch & Interaction (CRITICAL)

- **touch-target-size** — Min 44×44pt (Apple) / 48×48dp (Material); extend hit area beyond visual bounds if needed
- **touch-spacing** — Minimum 8px/8dp gap between touch targets
- **hover-vs-tap** — Use click/tap for primary interactions; don't rely on hover alone
- **loading-buttons** — Disable button during async operations; show spinner or progress
- **error-feedback** — Clear error messages near problem
- **cursor-pointer** — Add cursor-pointer to clickable elements (Web)
- **gesture-conflicts** — Avoid horizontal swipe on main content; prefer vertical scroll
- **tap-delay** — Use `touch-action: manipulation` to reduce 300ms delay (Web)
- **standard-gestures** — Use platform standard gestures consistently; don't redefine (swipe-back, pinch-zoom)
- **system-gestures** — Don't block system gestures (Control Center, back swipe, etc.)
- **press-feedback** — Visual feedback on press (ripple/highlight; MD state layers)
- **haptic-feedback** — Use haptic for confirmations and important actions; avoid overuse
- **gesture-alternative** — Don't rely on gesture-only interactions; always provide visible controls for critical actions
- **safe-area-awareness** — Keep primary touch targets away from notch, Dynamic Island, gesture bar and screen edges
- **no-precision-required** — Avoid requiring pixel-perfect taps on small icons or thin edges
- **swipe-clarity** — Swipe actions must show clear affordance or hint (chevron, label, tutorial)
- **drag-threshold** — Use a movement threshold before starting drag to avoid accidental drags

### 3. Performance (HIGH)

- **image-optimization** — Use WebP/AVIF, responsive images (srcset/sizes), lazy load non-critical assets
- **image-dimension** — Declare width/height or use aspect-ratio to prevent layout shift (CLS)
- **font-loading** — Use font-display: swap/optional to avoid invisible text (FOIT)
- **font-preload** — Preload only critical fonts; avoid overusing preload on every variant
- **critical-css** — Prioritize above-the-fold CSS
- **lazy-loading** — Lazy load non-hero components via dynamic import / route-level splitting
- **bundle-splitting** — Split code by route/feature (React Suspense / Next.js dynamic)
- **third-party-scripts** — Load third-party scripts async/defer; audit and remove unnecessary ones
- **reduce-reflows** — Avoid frequent layout reads/writes; batch DOM reads then writes
- **content-jumping** — Reserve space for async content to avoid layout jumps (CLS)
- **lazy-load-below-fold** — Use `loading="lazy"` for below-the-fold images and heavy media
- **virtualize-lists** — Virtualize lists with 50+ items
- **main-thread-budget** — Keep per-frame work under ~16ms for 60fps
- **progressive-loading** — Use skeleton screens / shimmer instead of long blocking spinners for >1s operations
- **input-latency** — Keep input latency under ~100ms for taps/scrolls
- **tap-feedback-speed** — Provide visual feedback within 100ms of tap
- **debounce-throttle** — Use debounce/throttle for high-frequency events (scroll, resize, input)
- **offline-support** — Provide offline state messaging and basic fallback
- **network-fallback** — Offer degraded modes for slow networks

### 4. Style Selection (HIGH)

- **style-match** — Match style to product type
- **consistency** — Use same style across all pages
- **no-emoji-icons** — Use SVG icons (Heroicons, Lucide), not emojis
- **color-palette-from-product** — Choose palette from product/industry
- **effects-match-style** — Shadows, blur, radius aligned with chosen style (glass / flat / clay etc.)
- **platform-adaptive** — Respect platform idioms (iOS HIG vs Material)
- **state-clarity** — Make hover/pressed/disabled states visually distinct while staying on-style
- **elevation-consistent** — Use a consistent elevation/shadow scale for cards, sheets, modals
- **dark-mode-pairing** — Design light/dark variants together to keep brand, contrast, and style consistent
- **icon-style-consistent** — Use one icon set/visual language (stroke width, corner radius) across the product
- **system-controls** — Prefer native/system controls over fully custom ones
- **blur-purpose** — Use blur to indicate background dismissal (modals, sheets), not as decoration
- **primary-action** — Each screen should have only one primary CTA; secondary actions visually subordinate

### 5. Layout & Responsive (HIGH)

- **viewport-meta** — `width=device-width initial-scale=1` (never disable zoom)
- **mobile-first** — Design mobile-first, then scale up to tablet and desktop
- **breakpoint-consistency** — Use systematic breakpoints (e.g. 375 / 768 / 1024 / 1440)
- **readable-font-size** — Minimum 16px body text on mobile (avoids iOS auto-zoom)
- **line-length-control** — Mobile 35–60 chars per line; desktop 60–75 chars
- **horizontal-scroll** — No horizontal scroll on mobile; ensure content fits viewport width
- **spacing-scale** — Use 4pt/8dp incremental spacing system
- **touch-density** — Keep component spacing comfortable for touch
- **container-width** — Consistent max-width on desktop (max-w-6xl / 7xl)
- **z-index-management** — Define layered z-index scale (e.g. 0 / 10 / 20 / 40 / 100 / 1000)
- **fixed-element-offset** — Fixed navbar/bottom bar must reserve safe padding for underlying content
- **scroll-behavior** — Avoid nested scroll regions that interfere with the main scroll experience
- **viewport-units** — Prefer min-h-dvh over 100vh on mobile
- **orientation-support** — Keep layout readable and operable in landscape mode
- **content-priority** — Show core content first on mobile; fold or hide secondary content
- **visual-hierarchy** — Establish hierarchy via size, spacing, contrast — not color alone

### 6. Typography & Color (MEDIUM)

- **line-height** — Use 1.5-1.75 for body text
- **line-length** — Limit to 65-75 characters per line
- **font-pairing** — Match heading/body font personalities
- **font-scale** — Consistent type scale (e.g. 12 14 16 18 24 32)
- **contrast-readability** — Darker text on light backgrounds (e.g. slate-900 on white)
- **text-styles-system** — Use platform type system: iOS Dynamic Type styles / Material 5 type roles
- **weight-hierarchy** — Bold headings (600–700), Regular body (400), Medium labels (500)
- **color-semantic** — Define semantic color tokens (primary, secondary, error, surface, on-surface) not raw hex
- **color-dark-mode** — Dark mode uses desaturated / lighter tonal variants, not inverted colors
- **color-accessible-pairs** — Foreground/background pairs must meet 4.5:1 (AA) or 7:1 (AAA)
- **color-not-decorative-only** — Functional color (error red, success green) must include icon/text
- **truncation-strategy** — Prefer wrapping over truncation; when truncating use ellipsis and provide full text via tooltip
- **letter-spacing** — Respect default letter-spacing per platform; avoid tight tracking on body text
- **number-tabular** — Use tabular/monospaced figures for data columns, prices, and timers
- **whitespace-balance** — Use whitespace intentionally to group related items and separate sections

### 7. Animation (MEDIUM)

- **duration-timing** — Use 150–300ms for micro-interactions; complex transitions ≤400ms; avoid >500ms
- **transform-performance** — Use transform/opacity only; avoid animating width/height/top/left
- **loading-states** — Show skeleton or progress indicator when loading exceeds 300ms
- **excessive-motion** — Animate 1-2 key elements per view max
- **easing** — Use ease-out for entering, ease-in for exiting; avoid linear for UI transitions
- **motion-meaning** — Every animation must express a cause-effect relationship, not just be decorative
- **state-transition** — State changes (hover / active / expanded / collapsed / modal) should animate smoothly
- **continuity** — Page/screen transitions should maintain spatial continuity (shared element, directional slide)
- **parallax-subtle** — Use parallax sparingly; must respect reduced-motion and not cause disorientation
- **spring-physics** — Prefer spring/physics-based curves over linear or cubic-bezier for natural feel
- **exit-faster-than-enter** — Exit animations shorter than enter (~60–70% of enter duration)
- **stagger-sequence** — Stagger list/grid item entrance by 30–50ms per item
- **shared-element-transition** — Use shared element / hero transitions for visual continuity between screens
- **interruptible** — Animations must be interruptible; user tap/gesture cancels in-progress animation immediately
- **no-blocking-animation** — Never block user input during an animation; UI must stay interactive
- **fade-crossfade** — Use crossfade for content replacement within the same container
- **scale-feedback** — Subtle scale (0.95–1.05) on press for tappable cards/buttons
- **gesture-feedback** — Drag, swipe, and pinch must provide real-time visual response tracking the finger
- **hierarchy-motion** — Use translate/scale direction to express hierarchy
- **motion-consistency** — Unify duration/easing tokens globally; all animations share the same rhythm
- **opacity-threshold** — Fading elements should not linger below opacity 0.2
- **modal-motion** — Modals/sheets should animate from their trigger source
- **navigation-direction** — Forward navigation animates left/up; backward animates right/down
- **layout-shift-avoid** — Animations must not cause layout reflow or CLS

### 8. Forms & Feedback (MEDIUM)

- **input-labels** — Visible label per input (not placeholder-only)
- **error-placement** — Show error below the related field
- **submit-feedback** — Loading then success/error state on submit
- **required-indicators** — Mark required fields (e.g. asterisk)
- **empty-states** — Helpful message and action when no content
- **toast-dismiss** — Auto-dismiss toasts in 3-5s
- **confirmation-dialogs** — Confirm before destructive actions
- **input-helper-text** — Provide persistent helper text below complex inputs
- **disabled-states** — Disabled elements use reduced opacity (0.38–0.5) + cursor change + semantic attribute
- **progressive-disclosure** — Reveal complex options progressively; don't overwhelm users upfront
- **inline-validation** — Validate on blur (not keystroke); show error only after user finishes input
- **input-type-keyboard** — Use semantic input types (email, tel, number) to trigger correct mobile keyboard
- **password-toggle** — Provide show/hide toggle for password fields
- **autofill-support** — Use autocomplete / textContentType attributes
- **undo-support** — Allow undo for destructive or bulk actions (e.g. "Undo delete" toast)
- **success-feedback** — Confirm completed actions with brief visual feedback
- **error-recovery** — Error messages must include a clear recovery path (retry, edit, help link)
- **multi-step-progress** — Multi-step flows show step indicator or progress bar; allow back navigation
- **form-autosave** — Long forms should auto-save drafts to prevent data loss
- **sheet-dismiss-confirm** — Confirm before dismissing a sheet/modal with unsaved changes
- **error-clarity** — Error messages must state cause + how to fix (not just "Invalid input")
- **field-grouping** — Group related fields logically
- **read-only-distinction** — Read-only state should be visually and semantically different from disabled
- **focus-management** — After submit error, auto-focus the first invalid field
- **error-summary** — For multiple errors, show summary at top with anchor links to each field
- **touch-friendly-input** — Mobile input height ≥44px
- **destructive-emphasis** — Destructive actions use semantic danger color (red) and are visually separated
- **toast-accessibility** — Toasts must not steal focus; use aria-live="polite"
- **aria-live-errors** — Form errors use aria-live region or role="alert"
- **contrast-feedback** — Error and success state colors must meet 4.5:1 contrast ratio
- **timeout-feedback** — Request timeout must show clear feedback with retry option

### 9. Navigation Patterns (HIGH)

- **bottom-nav-limit** — Bottom navigation max 5 items; use labels with icons
- **drawer-usage** — Use drawer/sidebar for secondary navigation, not primary actions
- **back-behavior** — Back navigation must be predictable and consistent; preserve scroll/state
- **deep-linking** — All key screens must be reachable via deep link / URL
- **tab-bar-ios** — iOS: use bottom Tab Bar for top-level navigation
- **top-app-bar-android** — Android: use Top App Bar with navigation icon for primary structure
- **nav-label-icon** — Navigation items must have both icon and text label
- **nav-state-active** — Current location must be visually highlighted in navigation
- **nav-hierarchy** — Primary nav (tabs/bottom bar) vs secondary nav (drawer/settings) must be clearly separated
- **modal-escape** — Modals and sheets must offer a clear close/dismiss affordance; swipe-down to dismiss on mobile
- **search-accessible** — Search must be easily reachable (top bar or tab)
- **breadcrumb-web** — Web: use breadcrumbs for 3+ level deep hierarchies
- **state-preservation** — Navigating back must restore previous scroll position, filter state, and input
- **gesture-nav-support** — Support system gesture navigation (iOS swipe-back, Android predictive back)
- **tab-badge** — Use badges on nav items sparingly; clear after user visits
- **overflow-menu** — When actions exceed available space, use overflow/more menu
- **bottom-nav-top-level** — Bottom nav is for top-level screens only; never nest sub-navigation inside it
- **adaptive-navigation** — Large screens (≥1024px) prefer sidebar; small screens use bottom/top nav
- **back-stack-integrity** — Never silently reset the navigation stack
- **navigation-consistency** — Navigation placement must stay the same across all pages
- **avoid-mixed-patterns** — Don't mix Tab + Sidebar + Bottom Nav at the same hierarchy level
- **modal-vs-navigation** — Modals must not be used for primary navigation flows
- **focus-on-route-change** — After page transition, move focus to main content region for screen readers
- **persistent-nav** — Core navigation must remain reachable from deep pages
- **destructive-nav-separation** — Dangerous actions (delete account, logout) must be visually and spatially separated from normal nav items
- **empty-nav-state** — When a nav destination is unavailable, explain why instead of silently hiding it

### 10. Charts & Data (LOW)

- **chart-type** — Match chart type to data type (trend → line, comparison → bar, proportion → pie/donut)
- **color-guidance** — Use accessible color palettes; avoid red/green only pairs for colorblind users
- **data-table** — Provide table alternative for accessibility; charts alone are not screen-reader friendly
- **pattern-texture** — Supplement color with patterns, textures, or shapes so data is distinguishable without color
- **legend-visible** — Always show legend; position near the chart
- **tooltip-on-interact** — Provide tooltips/data labels on hover (Web) or tap (mobile)
- **axis-labels** — Label axes with units and readable scale
- **responsive-chart** — Charts must reflow or simplify on small screens
- **empty-data-state** — Show meaningful empty state when no data exists, not a blank chart
- **loading-chart** — Use skeleton or shimmer placeholder while chart data loads
- **animation-optional** — Chart entrance animations must respect prefers-reduced-motion
- **large-dataset** — For 1000+ data points, aggregate or sample; provide drill-down for detail
- **number-formatting** — Use locale-aware formatting for numbers, dates, currencies
- **touch-target-chart** — Interactive chart elements must have ≥44pt tap area
- **no-pie-overuse** — Avoid pie/donut for >5 categories; switch to bar chart for clarity
- **contrast-data** — Data lines/bars vs background ≥3:1; data text labels ≥4.5:1
- **legend-interactive** — Legends should be clickable to toggle series visibility
- **direct-labeling** — For small datasets, label values directly on the chart
- **tooltip-keyboard** — Tooltip content must be keyboard-reachable
- **sortable-table** — Data tables must support sorting with aria-sort
- **axis-readability** — Axis ticks must not be cramped; maintain readable spacing
- **data-density** — Limit information density per chart to avoid cognitive overload
- **trend-emphasis** — Emphasize data trends over decoration
- **gridline-subtle** — Grid lines should be low-contrast (e.g. gray-200)
- **focusable-elements** — Interactive chart elements must be keyboard-navigable
- **screen-reader-summary** — Provide a text summary or aria-label describing the chart's key insight
- **error-state-chart** — Data load failure must show error message with retry action
- **export-option** — For data-heavy products, offer CSV/image export of chart data
- **drill-down-consistency** — Drill-down interactions must maintain a clear back-path
- **time-scale-clarity** — Time series charts must clearly label time granularity

---

## How to Use This Skill

### Prerequisites

Check if Python is installed:
```bash
python3 --version || python --version
```

Install if needed:
- macOS: `brew install python3`
- Ubuntu/Debian: `sudo apt update && sudo apt install python3`
- Windows: `winget install Python.Python.3.12`

### Workflow

Follow this workflow:

**Step 1: Analyze User Requirements**

Extract key information from user request:
- Product type: Entertainment (social, video, music, gaming), Tool (scanner, editor, converter), Productivity (task manager, notes, calendar), or hybrid
- Target audience: consider age group, usage context (commute, leisure, work)
- Style keywords: playful, vibrant, minimal, dark mode, content-first, immersive, etc.
- Stack: React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui, or HTML/CSS

**Step 2: Generate Design System (REQUIRED)**

Always start with `--design-system` to get comprehensive recommendations:

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

This command searches domains in parallel (product, style, color, landing, typography), applies reasoning rules, and returns a complete design system: pattern, style, colors, typography, effects, and anti-patterns to avoid.

**Step 2b: Persist Design System (Master + Overrides Pattern)**

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Project Name"
```

This creates:
- `design-system/MASTER.md` — Global Source of Truth with all design rules
- `design-system/pages/` — Folder for page-specific overrides

With page-specific override:
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Project Name" --page "dashboard"
```

Hierarchical retrieval: When building a specific page, first check `design-system/pages/<page-name>.md`. If it exists, its rules override the Master. If not, use `design-system/MASTER.md` exclusively.

**Step 3: Supplement with Detailed Searches**

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain> [-n <max_results>]
```

| Need | Domain | Example |
|------|--------|---------|
| Product type patterns | product | `--domain product "entertainment social"` |
| Style options | style | `--domain style "glassmorphism dark"` |
| Color palettes | color | `--domain color "entertainment vibrant"` |
| Font pairings | typography | `--domain typography "playful modern"` |
| Chart recommendations | chart | `--domain chart "real-time dashboard"` |
| UX best practices | ux | `--domain ux "animation accessibility"` |
| Individual Google Fonts | google-fonts | `--domain google-fonts "sans serif popular variable"` |
| Landing structure | landing | `--domain landing "hero social-proof"` |
| React performance | react | `--domain react "rerender memo list"` |
| App interface a11y | web | `--domain web "accessibilityLabel touch safe-areas"` |
| AI prompt / CSS keywords | prompt | `--domain prompt "minimalism"` |

**Step 4: Stack Guidelines**

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<keyword>" --stack react-native
```

Available stacks: react, nextjs, vue, svelte, swiftui, react-native, flutter, tailwind, shadcn, html-css

---

## Common Rules for Professional UI

### Icons & Visual Elements

| Rule | Standard | Avoid | Why It Matters |
|------|----------|-------|----------------|
| No Emoji as Structural Icons | Use vector-based icons (Lucide, react-native-vector-icons, @expo/vector-icons) | Using emojis (🎨 🚀 ⚙️) for navigation or system controls | Emojis are font-dependent, inconsistent across platforms, can't be themed |
| Vector-Only Assets | Use SVG or platform vector icons | Raster PNG icons that blur or pixelate | Ensures scalability, crisp rendering, dark/light mode adaptability |
| Stable Interaction States | Use color, opacity, or elevation transitions | Layout-shifting transforms that move surrounding content | Prevents unstable interactions |
| Correct Brand Logos | Use official brand assets and follow usage guidelines | Guessing logo paths, recoloring unofficially, modifying proportions | Prevents brand misuse and ensures legal/platform compliance |
| Consistent Icon Sizing | Define icon sizes as design tokens (icon-sm, icon-md = 24pt, icon-lg) | Mixing arbitrary values like 20pt / 24pt / 28pt randomly | Maintains rhythm and visual hierarchy |
| Stroke Consistency | Use consistent stroke width within the same visual layer (1.5px or 2px) | Mixing thick and thin stroke styles arbitrarily | Inconsistent strokes reduce perceived polish |
| Filled vs Outline Discipline | Use one icon style per hierarchy level | Mixing filled and outline icons at the same hierarchy level | Maintains semantic clarity and stylistic coherence |
| Touch Target Minimum | Minimum 44×44pt interactive area (use hitSlop if icon is smaller) | Small icons without expanded tap area | Meets accessibility and platform usability standards |
| Icon Alignment | Align icons to text baseline and maintain consistent padding | Misaligned icons or inconsistent spacing | Prevents subtle visual imbalance |
| Icon Contrast | WCAG contrast standards: 4.5:1 for small elements, 3:1 minimum for larger UI glyphs | Low-contrast icons that blend into the background | Ensures accessibility in both light and dark modes |

### Interaction (App)

| Rule | Do | Don't |
|------|----|-------|
| Tap feedback | Provide clear pressed feedback (ripple/opacity/elevation) within 80-150ms | No visual response on tap |
| Animation timing | Keep micro-interactions around 150-300ms with platform-native easing | Instant transitions or slow animations (>500ms) |
| Accessibility focus | Ensure screen reader focus order matches visual order and labels are descriptive | Unlabeled controls or confusing focus traversal |
| Disabled state clarity | Use disabled semantics, reduced emphasis, and no tap action | Controls that look tappable but do nothing |
| Touch target minimum | Keep tap areas ≥44x44pt (iOS) or ≥48x48dp (Android), expand hit area when icon is smaller | Tiny tap targets or icon-only hit areas without padding |
| Gesture conflict prevention | Keep one primary gesture per region and avoid nested tap/drag conflicts | Overlapping gestures causing accidental actions |
| Semantic native controls | Prefer native interactive primitives with proper accessibility roles | Generic containers used as primary controls without semantics |

### Light/Dark Mode Contrast

| Rule | Do | Don't |
|------|----|-------|
| Surface readability (light) | Keep cards/surfaces clearly separated from background with sufficient opacity/elevation | Overly transparent surfaces that blur hierarchy |
| Text contrast (light) | Maintain body text contrast ≥4.5:1 against light surfaces | Low-contrast gray body text |
| Text contrast (dark) | Maintain primary text contrast ≥4.5:1 and secondary text ≥3:1 on dark surfaces | Dark mode text that blends into background |
| Border and divider visibility | Ensure separators are visible in both themes | Theme-specific borders disappearing in one mode |
| State contrast parity | Keep pressed/focused/disabled states equally distinguishable in light and dark themes | Defining interaction states for one theme only |
| Token-driven theming | Use semantic color tokens mapped per theme across app surfaces/text/icons | Hardcoded per-screen hex values |
| Scrim and modal legibility | Use modal scrim 40-60% black | Weak scrim that leaves background visually competing |

### Layout & Spacing

| Rule | Do | Don't |
|------|----|-------|
| Safe-area compliance | Respect top/bottom safe areas for all fixed headers, tab bars, and CTA bars | Placing fixed UI under notch, status bar, or gesture area |
| System bar clearance | Add spacing for status/navigation bars and gesture home indicator | Let tappable content collide with OS chrome |
| Consistent content width | Keep predictable content width per device class (phone/tablet) | Mixing arbitrary widths between screens |
| 8dp spacing rhythm | Use consistent 4/8dp spacing system for padding/gaps/section spacing | Random spacing increments with no rhythm |
| Readable text measure | Keep long-form text readable on large devices (avoid edge-to-edge paragraphs on tablets) | Full-width long text that hurts readability |
| Section spacing hierarchy | Define clear vertical rhythm tiers (e.g., 16/24/32/48) by hierarchy | Similar UI levels with inconsistent spacing |
| Adaptive gutters by breakpoint | Increase horizontal insets on larger widths and in landscape | Same narrow gutter on all device sizes/orientations |
| Scroll and fixed element coexistence | Add bottom/top content insets so lists are not hidden behind fixed bars | Scroll content obscured by sticky headers/footers |

---

## Pre-Delivery Checklist

Run `--domain ux "animation accessibility z-index loading"` as a UX validation pass before implementation. Run through Quick Reference §1–§3 (CRITICAL + HIGH) as a final review.

**Visual Quality**
- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons come from a consistent icon family and style
- [ ] Official brand assets are used with correct proportions and clear space
- [ ] Pressed-state visuals do not shift layout bounds or cause jitter
- [ ] Semantic theme tokens are used consistently (no ad-hoc per-screen hardcoded colors)

**Interaction**
- [ ] All tappable elements provide clear pressed feedback (ripple/opacity/elevation)
- [ ] Touch targets meet minimum size (≥44x44pt iOS, ≥48x48dp Android)
- [ ] Micro-interaction timing stays in the 150-300ms range with native-feeling easing
- [ ] Disabled states are visually clear and non-interactive
- [ ] Screen reader focus order matches visual order, and interactive labels are descriptive
- [ ] Gesture regions avoid nested/conflicting interactions (tap/drag/back-swipe conflicts)

**Light/Dark Mode**
- [ ] Primary text contrast ≥4.5:1 in both light and dark mode
- [ ] Secondary text contrast ≥3:1 in both light and dark mode
- [ ] Dividers/borders and interaction states are distinguishable in both modes
- [ ] Modal/drawer scrim opacity is strong enough (typically 40-60% black)
- [ ] Both themes are tested before delivery (not inferred from a single theme)

**Layout**
- [ ] Safe areas are respected for headers, tab bars, and bottom CTA bars
- [ ] Scroll content is not hidden behind fixed/sticky bars
- [ ] Verified on small phone, large phone, and tablet (portrait + landscape)
- [ ] Horizontal insets/gutters adapt correctly by device size and orientation
- [ ] 4/8dp spacing rhythm is maintained across component, section, and page levels
- [ ] Long-form text measure remains readable on larger devices

**Accessibility**
- [ ] All meaningful images/icons have accessibility labels
- [ ] Form fields have labels, hints, and clear error messages
- [ ] Color is not the only indicator
- [ ] Reduced motion and dynamic text size are supported without layout breakage
- [ ] Accessibility traits/roles/states (selected, disabled, expanded) are announced correctly

---

## Common Sticking Points

| Problem | What to Do |
|---------|------------|
| Can't decide on style/color | Re-run `--design-system` with different keywords |
| Dark mode contrast issues | Quick Reference §6: color-dark-mode + color-accessible-pairs |
| Animations feel unnatural | Quick Reference §7: spring-physics + easing + exit-faster-than-enter |
| Form UX is poor | Quick Reference §8: inline-validation + error-clarity + focus-management |
| Navigation feels confusing | Quick Reference §9: nav-hierarchy + bottom-nav-limit + back-behavior |
| Layout breaks on small screens | Quick Reference §5: mobile-first + breakpoint-consistency |
| Performance / jank | Quick Reference §3: virtualize-lists + main-thread-budget + debounce-throttle |

---

## Search Reference

### Available Domains

| Domain | Use For | Example Keywords |
|--------|---------|-----------------|
| product | Product type recommendations | SaaS, e-commerce, portfolio, healthcare, beauty, service |
| style | UI styles, colors, effects | glassmorphism, minimalism, dark mode, brutalism |
| typography | Font pairings, Google Fonts | elegant, playful, professional, modern |
| color | Color palettes by product type | saas, ecommerce, healthcare, beauty, fintech, service |
| landing | Page structure, CTA strategies | hero, hero-centric, testimonial, pricing, social-proof |
| chart | Chart types, library recommendations | trend, comparison, timeline, funnel, pie |
| ux | Best practices, anti-patterns | animation, accessibility, z-index, loading |
| google-fonts | Individual Google Fonts lookup | sans serif, monospace, japanese, variable font, popular |
| react | React/Next.js performance | waterfall, bundle, suspense, memo, rerender, cache |
| web | App interface guidelines (iOS/Android/React Native) | accessibilityLabel, touch targets, safe areas, Dynamic Type |
| prompt | AI prompts, CSS keywords (style name) | |

### Available Stacks

| Stack | Focus |
|-------|-------|
| react-native | Components, Navigation, Lists |

---

## Example Workflow

**User request:** "Make an AI search homepage."

**Step 1:** Analyze Requirements — Product type: Tool (AI search engine), Target: C-end users, Style: modern, minimal, content-first, dark mode, Stack: React

**Step 2:** Generate Design System
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "AI search tool modern minimal" --design-system -p "AI Search"
```

**Step 3:** Supplement with Detailed Searches
```bash
# Style options for a modern tool product
python3 skills/ui-ux-pro-max/scripts/search.py "minimalism dark mode" --domain style
# UX best practices for search interaction and loading
python3 skills/ui-ux-pro-max/scripts/search.py "search loading animation" --domain ux
```

**Step 4:** Stack Guidelines
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "list performance navigation" --stack react-native
```

Then synthesize design system + detailed searches and implement the design.

---

## Output Formats

```bash
# ASCII box (default) - best for terminal display
python3 skills/ui-ux-pro-max/scripts/search.py "fintech crypto" --design-system

# Markdown - best for documentation
python3 skills/ui-ux-pro-max/scripts/search.py "fintech crypto" --design-system -f markdown
```

## Tips for Better Results

**Query Strategy:**
- Use multi-dimensional keywords — combine product + industry + tone + density: `"entertainment social vibrant content-dense"` not just `"app"`
- Try different keywords for the same need: `"playful neon"` → `"vibrant dark"` → `"content-first minimal"`
- Use `--design-system` first for full recommendations, then `--domain` to deep-dive any dimension
- Always add `--stack react-native` for implementation-specific guidance
