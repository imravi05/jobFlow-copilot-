import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  srcDir: 'src',
  vite: () => ({
    plugins: [react() as any],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
  }),
  manifest: {
    name: 'JobFlow - Job Application Tracker',
    description: 'Automatically track your LinkedIn job applications locally and receive follow-up alerts.',
    version: '1.0.1',
    icons: {
      '16': 'icons/icon16.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png'
    },
    permissions: [
      'storage',
      'alarms',
      'notifications',
      'activeTab',
      'scripting'
    ],
    host_permissions: [
      'https://www.linkedin.com/jobs/*',
      'https://www.linkedin.com/jobs/view/*'
    ],
    action: {
      default_title: 'JobFlow Dashboard',
      default_icon: {
        '16': 'icons/icon16.png',
        '48': 'icons/icon48.png',
        '128': 'icons/icon128.png'
      }
    }
  }
});
