import { defineConfig } from '@playwright/test';

// réglages des tests end-to-end
export default defineConfig({
  testDir: './e2e', // dossier des tests
  use: {
    baseURL: 'http://localhost:5173', // adresse du site (npm run dev doit tourner)
  },
});
