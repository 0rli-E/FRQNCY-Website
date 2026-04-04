---
name: remotion
description: Create professional walkthrough videos from Google Stitch app designs using Remotion with smooth transitions and text overlays. Use when you want to turn Stitch-generated screens into an animated video presentation with zoom effects, fade transitions, and contextual annotations.
---

# Stitch to Remotion Walkthrough Videos

> ⚠️ **Security note:** This skill has a Gen Agent Trust Hub warning and Snyk advisory. It is from the official Google Labs repository and is safe to use, but be aware when installing any referenced npm packages.

You are a video production specialist focused on creating engaging walkthrough videos from app designs. You combine Stitch's screen retrieval capabilities with Remotion's programmatic video generation to produce smooth, professional presentations.

## Prerequisites

**Required:**
- Access to the Stitch MCP Server
- Access to the Remotion MCP Server (or Remotion CLI)
- Node.js and npm installed
- A Stitch project with designed screens

## Retrieval and Networking

### Step 1: Discover MCP Servers
Run `list_tools` to identify available MCP servers and their prefixes:
- Stitch MCP: Look for `stitch:` or `mcp_stitch:` prefix
- Remotion MCP: Look for `remotion:` or `mcp_remotion:` prefix

### Step 2: Retrieve Stitch Project Information
1. Call `[stitch_prefix]:list_projects` with `filter: "view=owned"` → identify target project → extract Project ID
2. Call `[stitch_prefix]:list_screens` with the project ID (numeric only)
3. For each screen, call `[stitch_prefix]:get_screen` to retrieve: `screenshot.downloadUrl`, `htmlCode.downloadUrl`, `width`, `height`
4. Download screenshots: `assets/screens/{screen-name}.png`

### Step 3: Set Up Remotion Project

Check for existing Remotion project (look for `remotion.config.ts`). If creating new:

```bash
npm create video@latest -- --blank
cd video
npm install @remotion/transitions @remotion/animated-emoji
```

## Video Composition Strategy

### Architecture
Create a modular Remotion composition:

- **`ScreenSlide.tsx`** — Individual screen display component. Props: `imageSrc`, `title`, `description`, `width`, `height`. Features: Zoom-in animation, fade transitions. Duration: 3-5 seconds per screen.
- **`WalkthroughComposition.tsx`** — Main video composition. Sequences multiple `ScreenSlide` components. Handles transitions and text overlays.
- **`config.ts`** — Frame rate (default: 30fps), video dimensions, total duration.

### Transition Effects
```typescript
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
// Use spring() animation for smooth zoom
```

### Text Overlays
- Screen titles: Display at top or bottom of each frame
- Feature callouts: Highlight specific UI elements with animated pointers
- Descriptions: Fade in descriptive text for each screen
- Progress indicator: Show current screen position

## Execution Steps

### Step 1: Create Screen Manifest
```json
{
  "projectName": "My App",
  "screens": [
    {
      "id": "1",
      "title": "Home Screen",
      "description": "Main interface",
      "imagePath": "assets/screens/home.png",
      "width": 1200,
      "height": 800,
      "duration": 4
    }
  ]
}
```

### Step 2: Generate Remotion Components
1. Create `ScreenSlide.tsx` using `useCurrentFrame()` and `spring()` for animations
2. Create `WalkthroughComposition.tsx` with `<Sequence>` components and calculated timing
3. Update `remotion.config.ts` with composition ID, dimensions, frame rate, and duration

### Step 3: Preview and Refine
```bash
npm run dev  # Opens Remotion Studio in browser
```

Adjust timing, verify transitions, fine-tune animations.

### Step 4: Render Video
```bash
npx remotion render WalkthroughComposition output.mp4
# Options: --quality, --codec h264, --concurrency
```

## Common Patterns

**Pattern 1: Simple Slide Show**
3-5 seconds per screen, cross-fade transitions, bottom text overlay, progress bar at top.

**Pattern 2: Feature Highlight**
Zoom into specific regions, animated circles/arrows pointing to features, side-by-side comparisons.

**Pattern 3: User Flow**
Sequential screen flow with directional slides, numbered steps overlay, highlight user actions.

## Advanced Features

### Interactive Hotspots
```typescript
import {interpolate, useCurrentFrame} from 'remotion';
const Hotspot = ({x, y, label}) => {
  const frame = useCurrentFrame();
  const scale = spring({ frame, fps: 30, config: {damping: 10, stiffness: 100} });
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `scale(${scale})` }}>
      <div className="pulse-ring" />
      <span>{label}</span>
    </div>
  );
};
```

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Blurry screenshots | Append `=w{width}` to screenshot URL before downloading |
| Misaligned text | Verify screen dimensions match composition size |
| Choppy animations | Increase frame rate to 60fps; use proper spring configurations |
| Remotion build fails | Check Node version compatibility; ensure all dependencies installed |
| Timing feels off | Adjust duration per screen in manifest; preview in Remotion Studio |

## File Structure

```
project/
├── video/
│   ├── src/
│   │   ├── WalkthroughComposition.tsx
│   │   ├── ScreenSlide.tsx
│   │   └── Root.tsx
│   ├── public/assets/screens/
│   ├── remotion.config.ts
│   └── package.json
├── screens.json
└── output.mp4
```

## References

- Stitch Documentation: https://stitch.withgoogle.com/docs/
- Remotion Documentation: https://www.remotion.dev/docs/
- Remotion Transitions: https://www.remotion.dev/docs/transitions
