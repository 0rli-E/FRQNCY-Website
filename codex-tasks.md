# Codex Tasks for FRQNCY — Copy & Paste Ready

Each task below is a self-contained prompt you can paste directly into Codex. Run them one at a time in this order.

---

## Task 1 — Dead Link Audit (read-only)

```
Repository: github.com/0rli-E/FRQNCY-Website
Local path: /Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE
Scope: v2/ topic pages ONLY

You are working on the FRQNCY website — a static HTML/CSS/JS site with no build step. The project lives at /Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE. The repo root contains index.html, search.html, and other top-level pages. Topic pages live at v2/[topic-slug]/index.html.

YOUR SANDBOX — files you MAY read:
- v2/[topic-slug]/index.html — the 152 topic pages

DO NOT touch these files under any circumstances:
- index.html, search.html, my-frqncy.html, about.html, start-here.html, platform.html, podcast.html, space.html, chart.html, 404.html
- v2/explore.html
- v2/watch/**
- v2/courses/**
- v2/builder/**
- v2/fund/**
- v2/og/**
- search.json, resources.json
- Any .css, .js, or .json files in the root

The structure of every topic page is identical:
- <nav> → <div class="hero"> → <main> containing resource cards (.rcard[data-type]) with a filter bar (.ftab buttons) → a "More in [Domain]" section with .ncard links → <footer>
- Each .rcard has: <span class="rtype">, <div class="rinfo"><h4>…</h4><p>…</p></div>, <a class="rlink">
- CSS is inline in each page's <style> block (not a shared stylesheet)

YOUR TASK:
This is a READ-ONLY audit. Do not modify any HTML files.

For every .rcard across all 152 topic pages, extract the href from the .rlink anchor element. Make an HTTP HEAD request to each URL. Output a report as link-audit.md in the project root with these columns: topic slug, resource name (from h4), URL, HTTP status code. Flag anything that is not 200 (including redirects, timeouts, and connection failures). Group the results by status: broken first, then redirects, then healthy.

Rules:
1. Do NOT modify any HTML files — this is a read-only audit
2. Only read files matching the pattern v2/*/index.html where * is a topic slug (not courses, watch, builder, fund, or og)
3. Output only the link-audit.md report file
4. Use a 10-second timeout per request
5. When finished, report the total number of links checked, how many are healthy, how many redirect, and how many are broken
```

---

## Task 2 — Fix OG Image Meta Tags

```
Repository: github.com/0rli-E/FRQNCY-Website
Local path: /Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE
Scope: v2/ topic pages ONLY

You are working on the FRQNCY website — a static HTML/CSS/JS site with no build step. The project lives at /Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE. The repo root contains index.html, search.html, and other top-level pages. Topic pages live at v2/[topic-slug]/index.html.

YOUR SANDBOX — files you MAY edit:
- v2/[topic-slug]/index.html — the 152 topic pages only

DO NOT touch these files under any circumstances:
- index.html, search.html, my-frqncy.html, about.html, start-here.html, platform.html, podcast.html, space.html, chart.html, 404.html
- v2/explore.html
- v2/watch/**
- v2/courses/**
- v2/builder/**
- v2/fund/**
- v2/og/**
- search.json, resources.json
- Any .css, .js, or .json files in the root

The structure of every topic page is identical:
- <nav> → <div class="hero"> → <main> containing resource cards (.rcard[data-type]) with a filter bar (.ftab buttons) → a "More in [Domain]" section with .ncard links → <footer>
- Each .rcard has: <span class="rtype">, <div class="rinfo"><h4>…</h4><p>…</p></div>, <a class="rlink">
- CSS is inline in each page's <style> block (not a shared stylesheet)

YOUR TASK:
Each topic page should have these meta tags in the <head>:

  <meta property="og:image" content="https://frqncy.network/v2/og/[slug].png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:image" content="https://frqncy.network/v2/og/[slug].png">

Where [slug] matches the folder name (e.g. v2/aliens/ → aliens.png).

Audit all 152 topic pages. For each page:
- If the og:image tag is missing, add it after the existing og:description tag
- If the og:image tag exists but has a wrong path or slug, fix it
- Do the same for og:image:width, og:image:height, and twitter:image
- First check that v2/og/[slug].png actually exists. For any topic where the OG image file does not exist, leave a comment <!-- TODO: missing og image for [slug] --> instead of adding a broken tag

Rules:
1. Only modify files matching the pattern v2/*/index.html where * is a topic slug (not courses, watch, builder, fund, or og)
2. Do not change any CSS custom properties, class names, or DOM structure
3. Only edit within the <head> section — do not touch <body> content
4. Before finishing, count how many files you modified and list them
```

---

## Task 3 — Accessibility Pass

```
Repository: github.com/0rli-E/FRQNCY-Website
Local path: /Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE
Scope: v2/ topic pages ONLY

You are working on the FRQNCY website — a static HTML/CSS/JS site with no build step. The project lives at /Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE. The repo root contains index.html, search.html, and other top-level pages. Topic pages live at v2/[topic-slug]/index.html.

YOUR SANDBOX — files you MAY edit:
- v2/[topic-slug]/index.html — the 152 topic pages only

DO NOT touch these files under any circumstances:
- index.html, search.html, my-frqncy.html, about.html, start-here.html, platform.html, podcast.html, space.html, chart.html, 404.html
- v2/explore.html
- v2/watch/**
- v2/courses/**
- v2/builder/**
- v2/fund/**
- v2/og/**
- search.json, resources.json
- Any .css, .js, or .json files in the root

The structure of every topic page is identical:
- <nav> → <div class="hero"> → <main> containing resource cards (.rcard[data-type]) with a filter bar (.ftab buttons) → a "More in [Domain]" section with .ncard links → <footer>
- Each .rcard has: <span class="rtype">, <div class="rinfo"><h4>…</h4><p>…</p></div>, <a class="rlink">
- CSS is inline in each page's <style> block (not a shared stylesheet)

YOUR TASK:
Add accessibility attributes across all 152 topic pages. For each page:

1. Filter buttons (.ftab): Add aria-label="Filter by [type]" to each .ftab button, where [type] is the button's text content (e.g. "All", "person", "book", etc.)

2. Resource links (.rlink): Change each .rlink from just "Visit →" to include an aria-label. Pull the resource name from the sibling <h4> inside the same .rcard. Result: <a ... class="rlink" aria-label="Visit [resource name]">Visit →</a>

3. Resource container: Add role="list" to the parent <div> that contains all the .rcard elements. Add role="listitem" to each .rcard div.

4. Navigation links (.ncard): Add aria-label="Explore [topic name]" to each .ncard anchor in the "More in [Domain]" section, pulling the name from the <h3> inside it.

5. Any <img> tags found in topic pages: ensure they have a non-empty alt attribute. If alt is missing, use the closest heading text as the alt value.

Rules:
1. Only modify files matching the pattern v2/*/index.html where * is a topic slug (not courses, watch, builder, fund, or og)
2. Do not change any CSS custom properties, class names, or DOM structure — only add aria-* attributes and role attributes
3. Do not change any visible text or styling
4. Before finishing, count how many files you modified and report the total number of aria attributes added
```

---

## Task 4 — Fix JSON-LD Structured Data Consistency

```
Repository: github.com/0rli-E/FRQNCY-Website
Local path: /Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE
Scope: v2/ topic pages ONLY

You are working on the FRQNCY website — a static HTML/CSS/JS site with no build step. The project lives at /Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE. The repo root contains index.html, search.html, and other top-level pages. Topic pages live at v2/[topic-slug]/index.html.

YOUR SANDBOX — files you MAY edit:
- v2/[topic-slug]/index.html — the 152 topic pages only

DO NOT touch these files under any circumstances:
- index.html, search.html, my-frqncy.html, about.html, start-here.html, platform.html, podcast.html, space.html, chart.html, 404.html
- v2/explore.html
- v2/watch/**
- v2/courses/**
- v2/builder/**
- v2/fund/**
- v2/og/**
- search.json, resources.json
- Any .css, .js, or .json files in the root

The structure of every topic page is identical:
- <nav> → <div class="hero"> → <main> containing resource cards (.rcard[data-type]) with a filter bar (.ftab buttons) → a "More in [Domain]" section with .ncard links → <footer>
- Each .rcard has: <span class="rtype">, <div class="rinfo"><h4>…</h4><p>…</p></div>, <a class="rlink">
- CSS is inline in each page's <style> block (not a shared stylesheet)

YOUR TASK:
Each topic page already has a <script type="application/ld+json"> block. Audit every one and ensure the JSON-LD is correct and consistent with the page's own meta tags.

For each of the 152 topic pages:
1. Read the <title> tag, <meta name="description">, and <link rel="canonical"> values
2. Read the existing JSON-LD block
3. Ensure the JSON-LD contains at minimum:
   - "@context": "https://schema.org"
   - "@type": "WebPage"
   - "name": must match the <title> text exactly
   - "description": must match the <meta name="description"> content exactly
   - "url": must match the <link rel="canonical"> href exactly
4. If any field is missing, add it
5. If any field has a value that doesn't match the corresponding meta tag, fix it to match
6. Do NOT add new schema types or properties beyond these — just make the existing ones consistent
7. Ensure the JSON is valid (proper escaping, no trailing commas)

Rules:
1. Only modify files matching the pattern v2/*/index.html where * is a topic slug (not courses, watch, builder, fund, or og)
2. Only edit within <script type="application/ld+json"> blocks — do not touch anything else
3. Do not add new JSON-LD blocks if one already exists — fix the existing one
4. Before finishing, list every file where you made a change and what you fixed (e.g. "aliens: fixed mismatched description")
```

---

## Task 5 — Fix URL-as-Name Person Cards

```
Repository: github.com/0rli-E/FRQNCY-Website
Local path: /Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE
Scope: v2/ topic pages ONLY

You are working on the FRQNCY website — a static HTML/CSS/JS site with no build step. The project lives at /Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE. The repo root contains index.html, search.html, and other top-level pages. Topic pages live at v2/[topic-slug]/index.html.

YOUR SANDBOX — files you MAY edit:
- v2/[topic-slug]/index.html — the 152 topic pages only

DO NOT touch these files under any circumstances:
- index.html, search.html, my-frqncy.html, about.html, start-here.html, platform.html, podcast.html, space.html, chart.html, 404.html
- v2/explore.html
- v2/watch/**
- v2/courses/**
- v2/builder/**
- v2/fund/**
- v2/og/**
- search.json, resources.json
- Any .css, .js, or .json files in the root

The structure of every topic page is identical:
- <nav> → <div class="hero"> → <main> containing resource cards (.rcard[data-type]) with a filter bar (.ftab buttons) → a "More in [Domain]" section with .ncard links → <footer>
- Each .rcard has: <span class="rtype">, <div class="rinfo"><h4>…</h4><p>…</p></div>, <a class="rlink">
- CSS is inline in each page's <style> block (not a shared stylesheet)

YOUR TASK:
Some .rcard[data-type="person"] cards have an <h4> that contains a URL or domain name instead of a person's name (e.g. "BobLazar.com" instead of "Bob Lazar").

Across all 152 topic pages:
1. Find every .rcard with data-type="person"
2. Check if the <h4> text matches the pattern of a domain name — specifically, if it ends in .com, .org, .net, .io, .co, .info, .gov, .edu, or .tv (case insensitive)
3. For each match, visit the URL in the .rlink href for that card, determine the actual person's name from the site content (page title, about page, header, etc.)
4. Replace the <h4> text with the real person's name
5. Do NOT change the <p> description or the .rlink href — only the <h4> text

Output a changelog as name-fixes.md in the project root with columns: topic slug, old h4 text, new h4 text, source URL you used to determine the name.

Rules:
1. Only modify files matching the pattern v2/*/index.html where * is a topic slug (not courses, watch, builder, fund, or og)
2. Only change the text inside <h4> tags within .rcard[data-type="person"] — nothing else
3. If you cannot confidently determine the person's real name from the URL, leave it unchanged and note it in the changelog as "SKIPPED — could not determine name"
4. Before finishing, count how many names you fixed and list them all
```
