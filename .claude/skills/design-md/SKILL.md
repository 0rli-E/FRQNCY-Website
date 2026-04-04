---
name: design-md
description: Analyze a Google Stitch design project and generate a semantic DESIGN.md file as the prompting source of truth. Use when you need to extract design tokens from an existing Stitch screen and write them into a .stitch/DESIGN.md file for consistent future generation.
---

# Stitch DESIGN.md Skill

You are an expert Design Systems Lead. Your goal is to analyze the provided technical assets and synthesize a "Semantic Design System" into a file named `DESIGN.md`.

## Overview

This skill helps you create `DESIGN.md` files that serve as the "source of truth" for prompting Stitch to generate new screens that align perfectly with existing design language. Stitch interprets design through "Visual Descriptions" supported by specific color values.

## Prerequisites

- Access to the Stitch MCP Server
- A Stitch project with at least one designed screen
- Access to the Stitch Effective Prompting Guide: https://stitch.withgoogle.com/docs/learn/prompting/

## Retrieval and Networking

### Namespace discovery
Run `list_tools` to find the Stitch MCP prefix. Use this prefix (e.g., `mcp_stitch:`) for all subsequent calls.

### Project lookup (if Project ID is not provided)
Call `[prefix]:list_projects` with `filter: "view=owned"` → identify the target project → extract the Project ID from the `name` field (e.g., `projects/13534454087919359824`)

### Screen lookup (if Screen ID is not provided)
Call `[prefix]:list_screens` with the `projectId` (numeric only) → review screen titles → extract Screen ID from the `name` field

### Metadata fetch
Call `[prefix]:get_screen` with both `projectId` and `screenId` (numeric IDs only). Returns:
- `screenshot.downloadUrl` — Visual reference
- `htmlCode.downloadUrl` — Full HTML/CSS source
- `width`, `height`, `deviceType` — Dimensions and platform
- `designTheme` — Color and style information

### Asset download
Use `web_fetch` to download the HTML code from `htmlCode.downloadUrl`. Parse the HTML to extract Tailwind classes, custom CSS, and component patterns.

### Project metadata extraction
Call `[prefix]:get_project` with the full project path (`projects/{id}`) to get the `designTheme` object.

## Analysis & Synthesis Instructions

### 1. Extract Project Identity
Locate the Project Title and Project ID (e.g., from the `name` field in the JSON).

### 2. Define the Atmosphere
Evaluate the screenshot and HTML structure to capture the overall "vibe." Use evocative adjectives to describe the mood (e.g., "Airy," "Dense," "Minimalist," "Utilitarian").

### 3. Map the Color Palette
For each color, provide:
- A descriptive, natural language name (e.g., "Deep Muted Teal-Navy")
- The specific hex code in parentheses (e.g., "#294056")
- Its specific functional role (e.g., "Used for primary actions")

### 4. Translate Geometry & Shape
Convert technical border-radius values into physical descriptions:
- `rounded-full` → "Pill-shaped"
- `rounded-lg` → "Subtly rounded corners"
- `rounded-none` → "Sharp, squared-off edges"

### 5. Describe Depth & Elevation
Explain how the UI handles layers: "Flat," "Whisper-soft diffused shadows," or "Heavy, high-contrast drop shadows."

## Output Format (DESIGN.md Structure)

```markdown
# Design System: [Project Title]

**Project ID:** [Insert Project ID Here]

## 1. Visual Theme & Atmosphere
(Description of the mood, density, and aesthetic philosophy.)

## 2. Color Palette & Roles
(List colors by Descriptive Name + Hex Code + Functional Role.)

## 3. Typography Rules
(Description of font family, weight usage for headers vs. body, and letter-spacing character.)

## 4. Component Stylings
* **Buttons:** (Shape description, color assignment, behavior).
* **Cards/Containers:** (Corner roundness description, background color, shadow depth).
* **Inputs/Forms:** (Stroke style, background).

## 5. Layout Principles
(Description of whitespace strategy, margins, and grid alignment.)
```

## Common Pitfalls to Avoid

- ❌ Using technical jargon without translation ("rounded-xl" instead of "generously rounded corners")
- ❌ Omitting color codes or using only descriptive names
- ❌ Forgetting to explain functional roles of design elements
- ❌ Being too vague in atmosphere descriptions
- ❌ Ignoring subtle design details like shadows or spacing patterns
