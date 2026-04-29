import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwind from '@astrojs/tailwind';

// Static output — dist/ is copied into repo-root /social/ during deploy.
// See scripts/build-social.js for the copy step and ../_redirects for the
// Cloudflare Pages rewrite rules that serve it at URL /social/*.
export default defineConfig({
  output: 'static',
  base: '/social',
  trailingSlash: 'ignore',
  integrations: [
    // compat enables React-only libraries (e.g. @privy-io/react-auth) to render
    // through Preact's compatibility layer. Required for Privy embedded-wallet
    // auth island. See proposals/PROTOCOL-LESSONS-2026-04.md for the rationale.
    preact({ compat: true }),
    tailwind(),
  ],
  outDir: './dist',
});
