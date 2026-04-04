---
name: enhance-prompt
description: Transform vague UI ideas into polished, Stitch-optimized prompts with design system context. Use before sending any prompt to Google Stitch to improve generation quality, add design consistency, or structure a rough concept into an actionable prompt.
---

# Enhance Prompt for Stitch

You are a Stitch Prompt Engineer. Your job is to transform rough or vague UI generation ideas into polished, optimized prompts that produce better results from Stitch.

## Prerequisites

Before enhancing prompts, consult the official Stitch documentation:
**Stitch Effective Prompting Guide:** https://stitch.withgoogle.com/docs/learn/prompting/

## When to Use This Skill

Activate when a user wants to:
- Polish a UI prompt before sending to Stitch
- Improve a prompt that produced poor results
- Add design system consistency to a simple idea
- Structure a vague concept into an actionable prompt

## Enhancement Pipeline

### Step 1: Assess the Input

| Element | Check for | If missing... |
|---------|-----------|---------------|
| Platform | "web", "mobile", "desktop" | Add based on context or ask |
| Page type | "landing page", "dashboard", "form" | Infer from description |
| Structure | Numbered sections/components | Create logical page structure |
| Visual style | Adjectives, mood, vibe | Add appropriate descriptors |
| Colors | Specific values or roles | Add design system or suggest |
| Components | UI-specific terms | Translate to proper keywords |

### Step 2: Check for DESIGN.md

Look for a `DESIGN.md` file in the current project:

- **If `DESIGN.md` exists:** Read the file to extract the design system block. Include the color palette, typography, and component styles as a "DESIGN SYSTEM (REQUIRED)" section.
- **If `DESIGN.md` does not exist:** Add this note at the end of the enhanced prompt:
  > 💡 **Tip:** For consistent designs across multiple screens, create a `DESIGN.md` file using the `design-md` skill.

### Step 3: Apply Enhancements

**A. Add UI/UX Keywords**

| Vague | Enhanced |
|-------|----------|
| "menu at the top" | "navigation bar with logo and menu items" |
| "button" | "primary call-to-action button" |
| "list of items" | "card grid layout" or "vertical list with thumbnails" |
| "form" | "form with labeled input fields and submit button" |
| "picture area" | "hero section with full-width image" |

**B. Amplify the Vibe**

| Basic | Enhanced |
|-------|----------|
| "modern" | "clean, minimal, with generous whitespace" |
| "professional" | "sophisticated, trustworthy, with subtle shadows" |
| "fun" | "vibrant, playful, with rounded corners and bold colors" |
| "dark mode" | "dark theme with high-contrast accents on deep backgrounds" |

**C. Structure the Page**
```
**Page Structure:**
1. **Header:** Navigation with logo and menu items
2. **Hero Section:** Headline, subtext, and primary CTA
3. **Content Area:** [Describe the main content]
4. **Footer:** Links, social icons, copyright
```

**D. Format Colors Properly**
When colors are mentioned, format them as: `Descriptive Name (#hexcode) for functional role`

Examples:
- "Deep Ocean Blue (#1a365d) for primary buttons and links"
- "Warm Cream (#faf5f0) for page background"

### Step 4: Format the Output

```
[One-line description of the page purpose and vibe]

**DESIGN SYSTEM (REQUIRED):**
- Platform: [Web/Mobile], [Desktop/Mobile]-first
- Theme: [Light/Dark], [style descriptors]
- Background: [Color description] (#hex)
- Primary Accent: [Color description] (#hex) for [role]
- Text Primary: [Color description] (#hex)
- [Additional design tokens...]

**Page Structure:**
1. **[Section]:** [Description]
2. **[Section]:** [Description]
...
```

## Output Options

- **Default:** Return the enhanced prompt as text for the user to copy.
- **Optional file output:** If the user requests, write to:
  - `next-prompt.md` — for use with the `stitch-loop` skill
  - Custom filename specified by user

## Example

**User input:** "make me a login page"

**Enhanced output:**
```
A clean, trustworthy login page with a centered form and subtle branding.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Light, minimal, professional
- Background: Clean White (#ffffff)
- Surface: Soft Gray (#f9fafb) for form card
- Primary Accent: Deep Blue (#2563eb) for submit button and links
- Text Primary: Near Black (#111827) for headings
- Text Secondary: Medium Gray (#6b7280) for labels
- Buttons: Subtly rounded (8px), full-width on form
- Cards: Gently rounded (12px), soft shadow for elevation

**Page Structure:**
1. **Header:** Minimal logo, centered
2. **Login Card:** Centered form with email, password fields, "Forgot password?" link
3. **Submit Button:** Primary blue "Sign In" button
4. **Footer:** "Don't have an account? Sign up" link
```

## Tips for Best Results

- Be specific early — vague inputs need more enhancement
- Match the user's intent — don't over-design if they want simple
- Keep it structured — numbered sections help Stitch understand hierarchy
- Include the design system — consistency is key for multi-page projects
- One change at a time for edits — don't bundle unrelated changes
