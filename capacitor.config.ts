import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.timesnap.constructionpro',
  appName: 'TimeSnap Construction Pro',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
  },
  plugins: {
    Camera: {
      presentationStyle: 'fullscreen',
    },
    Geolocation: {
      // standard fine location
    },
    Filesystem: {
      // safe scoped access
    },
  },
};

export default config;
