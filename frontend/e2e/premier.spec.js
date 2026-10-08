import { test, expect } from '@playwright/test';

// premier test : la page de connexion s'affiche
test('la page de connexion s’affiche', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
});

// sans être connecté, /tasks renvoie vers /login
test('une page protégée renvoie vers la connexion', async ({ page }) => {
  await page.goto('/tasks');

  await expect(page).toHaveURL(/\/login/);
});
