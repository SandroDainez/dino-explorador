import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.joguimho.dinoexplorador',
  appName: 'Dino Explorador',
  webDir: 'dist',
  backgroundColor: '#1d4e89',
  android: {
    backgroundColor: '#1d4e89',
  },
  ios: {
    backgroundColor: '#1d4e89',
    contentInset: 'automatic',
  },
};

export default config;
