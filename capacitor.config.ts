import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fr.evolyafit.app',
  appName: 'Evolya',
  webDir: 'out',
  server: {
    url: 'https://www.evolyafit.fr',
    cleartext: false
  }
};

export default config;
