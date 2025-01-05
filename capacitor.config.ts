import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'chattucharts.replit.app',
  appName: 'CharttyCharts',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: ['*']
  },
  android: {
    buildOptions: {
      keystorePath: 'release.keystore',
      keystorePassword: 'android',
      keystoreAlias: 'key0',
      releaseType: 'APK'
    }
  }
};

export default config;