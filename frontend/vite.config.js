import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // vitest ne doit pas lancer les tests playwright (dossier e2e)
  test: {
    exclude: ['e2e/**', 'node_modules/**'],
  },
  server: {
    // ouvre le navigateur tout seul
    open: true,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});
