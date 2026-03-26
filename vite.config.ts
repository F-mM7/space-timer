import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/space-timer/',
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    exclude: ['cubing']
  }
});
