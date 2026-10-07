import { test, expect } from '@playwright/test';

// un nom différent à chaque fois (sinon "déjà utilisé" au 2e lancement)
const username = `test_${Date.now()}`;
const email = `${username}@test.fr`;
const password = 'motdepasse123';

// les tests de ce fichier se suivent : on s'inscrit puis on se reconnecte
test.describe.configure({ mode: 'serial' });

test('inscription puis arrivée sur la page des tâches', async ({ page }) => {
  await page.goto('/register');

  await page.getByLabel('Nom d’utilisateur').fill(username);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(password);
  await page.getByLabel('Confirmer le mot de passe').fill(password);
  await page.getByRole('button', { name: 'Créer mon compte' }).click();

  await expect(page).toHaveURL(/\/tasks/);
  await expect(page.getByRole('heading', { name: 'Tâches', exact: true })).toBeVisible();
});

test('formulaire d’inscription avec des erreurs', async ({ page }) => {
  await page.goto('/register');

  // "amina@gmail" est accepté par le navigateur mais pas par notre vérification (pas de point)
  await page.getByLabel('Email').fill('amina@gmail');
  await page.getByLabel('Mot de passe', { exact: true }).fill('court');
  await page.getByLabel('Confirmer le mot de passe').fill('autre');
  await page.getByRole('button', { name: 'Créer mon compte' }).click();

  await expect(page.getByText('Le nom d’utilisateur est obligatoire.')).toBeVisible();
  await expect(page.getByText('Email invalide.')).toBeVisible();
  await expect(page.getByText('Les mots de passe ne sont pas identiques.')).toBeVisible();
});

test('connexion avec un mauvais mot de passe', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Nom d’utilisateur').fill(username);
  await page.getByLabel('Mot de passe').fill('mauvais');
  await page.getByRole('button', { name: 'Se connecter' }).click();

  await expect(page.getByText('Identifiants incorrects.')).toBeVisible();
});

test('connexion puis déconnexion', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Nom d’utilisateur').fill(username);
  await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/tasks/);

  await page.getByRole('button', { name: 'Déconnexion' }).click();
  await expect(page).toHaveURL(/\/login/);
});
