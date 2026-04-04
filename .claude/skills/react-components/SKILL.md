---
name: react-components
description: Transform Google Stitch designs into clean, modular React + TypeScript components. Use when converting a Stitch-generated screen into production-ready React code with proper hooks, typed props, mock data separation, and Tailwind theming.
---

# Stitch to React Components

You are a frontend engineer focused on transforming designs into clean React code. You follow a modular approach and use automated tools to ensure code quality.

## Retrieval and Networking

### Namespace discovery
Run `list_tools` to find the Stitch MCP prefix. Use this prefix (e.g., `stitch:`) for all subsequent calls.

### Metadata fetch
Call `[prefix]:get_screen` to retrieve the design JSON.

### Check for existing designs
Before downloading, check if `.stitch/designs/{page}.html` and `.stitch/designs/{page}.png` already exist:
- **If files exist:** Ask the user whether to refresh from the Stitch project or reuse existing local files.
- **If files do not exist:** Proceed to download.

### High-reliability download
Internal AI fetch tools can fail on Google Cloud Storage domains. Use these bash commands:

```bash
# HTML
bash scripts/fetch-stitch.sh "[htmlCode.downloadUrl]" ".stitch/designs/{page}.html"

# Screenshot (append =w{width} to get full resolution)
bash scripts/fetch-stitch.sh "[screenshot.downloadUrl]=w{width}" ".stitch/designs/{page}.png"
```

### Visual audit
Review the downloaded screenshot (`.stitch/designs/{page}.png`) to confirm design intent and layout details.

## Architectural Rules

- **Modular components:** Break the design into independent files. Avoid large, single-file outputs.
- **Logic isolation:** Move event handlers and business logic into custom hooks in `src/hooks/`.
- **Data decoupling:** Move all static text, image URLs, and lists into `src/data/mockData.ts`.
- **Type safety:** Every component must include a `Readonly` TypeScript interface named `[ComponentName]Props`.
- **Leave Google license headers out** of the generated React components.
- **Style mapping:** Extract the `tailwind.config` from the HTML `<head>`. Sync these values with `resources/style-guide.json`. Use theme-mapped Tailwind classes instead of arbitrary hex codes.

## Execution Steps

1. **Environment setup:** If `node_modules` is missing, run `npm install` to enable the validation tools.
2. **Data layer:** Create `src/data/mockData.ts` based on the design content.
3. **Component drafting:** Use `resources/component-template.tsx` as a base. Find and replace all instances of `StitchComponent` with the actual component name.
4. **Application wiring:** Update the project entry point (like `App.tsx`) to render the new components.
5. **Quality check:** Run `npm run validate <file_path>` for each component. Verify against `resources/architecture-checklist.md`.
6. **Start dev server** with `npm run dev` to verify the live result.

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Fetch errors | Ensure the URL is quoted in the bash command to prevent shell errors |
| Validation errors | Review the AST report and fix any missing interfaces or hardcoded styles |
