import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  base: '/social',
  integrations: [
    preact(),
    tailwind(),
  ],
  outDir: './dist',
  build: {
    client: './dist/client',
  },
});
