#!/bin/bash
# ============================================================
# 5 Claude Designer Skills — Install Script
# Source: https://x.com/growthflo/status/2036730602347430138
# Security check: ALL PASS (Socket, Snyk, Gen Agent Trust Hub)
# ============================================================

echo "Installing 5 Claude Designer Skills..."

# 1. UI-UX-Pro-Max (nextlevelbuilder)
#    50+ styles, 161 color palettes, 57 font pairings, 99 UX guidelines
npx skills add nextlevelbuilder/ui-ux-pro-max-skill@ui-ux-pro-max

# 2. frontend-design (Official Anthropic — 277k+ installs)
#    Production-ready frontend design partner
npx skills add anthropics/skills@frontend-design

# 3. shadcn-ui (giuseppe-trisciuoglio)
#    Deep knowledge of shadcn/ui component library & design system
npx skills add giuseppe-trisciuoglio/developer-kit@shadcn-ui

# 4. web-accessibility (supercent-io)
#    WCAG 2.1 standards — ARIA, keyboard nav, screen readers
nx skills add supercent-io/skills-template@web-accessibility

# 5. web-design-guidelines (Official Vercel Labs)
#    100+ UI/UX best practices — spacing, typography, responsive patterns
npx skills add vercel-labs/agent-skills@web-design-guidelines

echo ""
echo "✓ All 5 skills installed. Restart Claude Code to activate."
