/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        navy: '#0B1C3D',
        'navy-mid': '#0D2451',
        gold: '#C4973A',
        'gold-light': '#E0C06A',
        text: '#C8D8F0',
        'text-dim': '#7090B8',
        accent: '#7B61FF',
        'card-bg': 'rgba(255,255,255,0.04)',
        'card-border': 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        heading: ['Cormorant', 'serif'],
        body: ['Jost', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
