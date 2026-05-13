---
description: Fix the broken NRG production build by rebuilding social-src from scratch and copying dist over the deployed /social/.
---

The deployed `/social/` is currently non-functional: the Astro island markup is in the DOM but the `<script type="module">` that defines the `astro-island` custom element is missing, so PostComposer + Feed never hydrate. See the diagnosis in `proposals/ROADMAP-90D-2026-05.md` Track 1 + `DEPLOY-WEEK-1.md` step 6.

Walk Orlando through these terminal commands one block at a time. Sandbox cannot run them — `npm install` hits a bindfs rename limitation. Each command on its own line, no backslash continuations.

**Step 1 — confirm the env vars Orlando needs to inline at build time:**

```bash
echo "PUBLIC_SUPABASE_URL=https://vyazlspbmwmlyncdlezh.supabase.co"
echo "PUBLIC_SUPABASE_ANON_KEY=<paste from Supabase Dashboard → Project Settings → API → anon/public>"
echo "PUBLIC_PRIVY_APP_ID=<paste from Privy Dashboard → app settings>"
```

If `PUBLIC_PRIVY_APP_ID` is not yet set up, the build will still succeed but the Privy login surface will be empty — that's recoverable; the email/password path still works.

**Step 2 — clean rebuild from terminal:**

```bash
cd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/social-src
rm -rf node_modules package-lock.json dist
npm install --legacy-peer-deps
PUBLIC_SUPABASE_URL='https://vyazlspbmwmlyncdlezh.supabase.co' PUBLIC_SUPABASE_ANON_KEY='<paste>' PUBLIC_PRIVY_APP_ID='<paste>' npm run build
```

**Step 3 — verify the build emitted a module entry script:**

```bash
grep -c 'type="module"' dist/social/index.html
```

If this returns 0, the build is broken at Astro level — paste the full output of `npm run build` so we can diagnose. Should return a positive number.

**Step 4 — replace the deployed /social/:**

```bash
cd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE
rm -rf social
cp -r social-src/dist/social social
ls social/_astro/*.js | wc -l
```

The last command should return a positive number (the `_astro/` chunk files).

**Step 5 — commit and push:**

```bash
git add -A
git commit -m "Rebuild social-src dist with proper module entry scripts"
git push
```

Cloudflare Pages will auto-deploy in ~2–3 minutes. Watch the build: <https://dash.cloudflare.com> → Pages → frqncy-website → Deployments.

**Step 6 — verify in prod:**

Run `/social-smoke` once the deploy completes, OR open <https://frqncy.network/social> in a fresh incognito and confirm:

- The PostComposer card renders (with the textarea + Post button), not a pulsing skeleton.
- The Feed area renders either real posts or the empty "No posts yet" state, not three pulsing skeletons.
- `customElements.get('astro-island')` in the console returns a class definition, not undefined.

If any of those fail, paste the failure mode here and we'll diagnose.
