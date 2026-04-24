import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'network.frqncy.app',
  appName: 'FRQNCY',
  webDir: 'dist',

  // Hybrid routing strategy:
  // - The main app experience loads frqncy.network live (website = app content).
  // - Local routes (/app/*) are served from the bundled `dist` and run native plugins.
  // The router in src/main.ts decides which to show.
  server: {
    androidScheme: 'https',
    // Allow the local bundle to navigate to the live site without triggering a system browser.
    allowNavigation: [
      'frqncy.network',
      '*.frqncy.network',
    ],
    // NOTE: We intentionally do NOT set `server.url` to frqncy.network.
    // Doing so would make every route load from the network, breaking the offline
    // wake/sleep screens. Instead, the local bundle (main.ts) loads the live site
    // in an <iframe>/WebView for content pages and swaps in local HTML for /app/*.
  },

  ios: {
    contentInset: 'never',
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: '#0a0a0a',
  },

  android: {
    backgroundColor: '#0a0a0a',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#0a0a0a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#e8c547',
      sound: 'morning.caf',
    },
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      androidIsEncryption: false,
    },
  },
};

export default config;
