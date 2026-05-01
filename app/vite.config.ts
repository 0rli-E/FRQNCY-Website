import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  // Relative base so AlarmActivity (which loads alarm.html via
  // file:///android_asset/public/app/alarm.html — outside Capacitor's
  // https://localhost bridge) can still resolve its JS chunks.
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        wake: resolve(__dirname, 'src/app/wake.html'),
        sleep: resolve(__dirname, 'src/app/sleep.html'),
        alarm: resolve(__dirname, 'src/app/alarm.html'),
        bedside: resolve(__dirname, 'src/app/bedside.html'),
        settings: resolve(__dirname, 'src/app/settings.html'),
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
