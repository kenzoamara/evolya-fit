import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fr.evolyafit.app',
  appName: 'Evolya',
  webDir: 'out',
  server: {
    url: 'https://www.evolyafit.fr',
    cleartext: false
  },
  ios: {
    // Marqueur dans le User-Agent pour que le web détecte qu'il tourne dans l'app iOS
    appendUserAgent: 'EvolyaApp-ios'
  },
  android: {
    appendUserAgent: 'EvolyaApp-android'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
