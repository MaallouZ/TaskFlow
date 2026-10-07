# TaskFlow — Frontend

Interface de TaskFlow, faite en **React** avec **Vite**.
Elle permet de créer un compte, gérer ses tâches et suivre ses habitudes.
Toutes les données passent par l'API Express du dossier `backend/`.

## Lancer le front

Depuis la racine du projet :

```bash
npm install    # installe les paquets du front et du back
npm run dev    # lance le back (port 3000) et le front (port 5173)
```

Le site s'ouvre sur **http://localhost:5173**.

MongoDB doit tourner et le fichier `backend/.env` doit être rempli (voir `backend/.env.example`).

**Proxy Vite** : quand le front appelle `/api/...`, Vite renvoie la requête vers le back sur `http://localhost:3000`.
On n'écrit donc jamais l'adresse du back dans le code React.

## Les pages

| Adresse | Page | Connexion obligatoire |
|---|---|---|
| `/login` | Connexion | non |
| `/register` | Inscription | non |
| `/tasks` | Liste des tâches : compteurs, filtres (statut, en retard, priorité), recherche, heatmap | oui |
| `/tasks/new` | Créer une tâche | oui |
| `/tasks/:id/edit` | Modifier une tâche | oui |
| `/habits` | Habitudes : à cocher chaque jour ou chaque semaine | oui |
| `/habits/new` | Créer une habitude | oui |
| `/habits/:id/edit` | Modifier une habitude | oui |
| `/account` | Mon compte : infos, modification, fuseau horaire, suppression | oui |
| autre adresse | Page 404 | non |

## Organisation des dossiers

```text
frontend/
├── src/
│   ├── App.jsx        les routes et l'utilisateur connecté
│   ├── main.jsx       point d'entrée (BrowserRouter)
│   ├── index.css      tout le style du site
│   ├── pages/         une page = un écran (LoginPage, TaskListPage, HabitListPage...)
│   ├── components/    morceaux réutilisables (Input, Button, Card, TaskList, HabitList...)
│   ├── services/      appels à l'API (api.js, taskService.js, habitService.js...)
│   └── utils/         petites fonctions de calcul (dates, habitudes, validation)
├── e2e/               tests end-to-end (Playwright)
└── playwright.config.js
```

## Choix techniques

- **React Router** pour passer d'une page à l'autre sans recharger le site.
- **ProtectedRoute** : un composant qui entoure les pages privées. Si personne n'est connecté, il renvoie vers `/login`.
- **L'utilisateur connecté** est gardé dans `App.jsx` (`useState`) et donné aux pages par les props.
  Pas de Context ni de Redux : le projet est assez petit pour rester simple.
- **Les appels à l'API** passent tous par `services/api.js`, qui :
  - ajoute le token (`Authorization: Bearer ...`) à chaque requête ;
  - en cas de **401** (token expiré ou invalide), déconnecte et renvoie vers `/login` ;
  - transforme les erreurs du back en message lisible pour l'utilisateur.
- **Les formulaires** vérifient les champs avant l'envoi (titre obligatoire, email valide, mot de passe de 8 caractères...) et affichent les erreurs sous chaque champ.
- **Fuseau horaire** : les habitudes utilisent le fuseau choisi dans « Mon compte », pour que « aujourd'hui » soit le bon jour pour l'utilisateur.

### Le token et le localStorage

Après la connexion, le back renvoie un **token JWT** (valable 7 jours).
Le front le range dans le **localStorage** du navigateur, ce qui permet de rester connecté même après avoir rechargé la page.

- **Avantage** : simple à mettre en place.
- **Risque** : tout script JavaScript de la page peut lire le localStorage. Si un pirate arrivait à injecter un script dans le site (attaque **XSS**), il pourrait voler le token.
- **Pourquoi c'est acceptable ici** : React affiche toujours les données comme du texte, jamais comme du code, ce qui protège déjà contre la plupart des attaques XSS.
- **Plus sûr** : un cookie `httpOnly`, que JavaScript ne peut pas lire. Cela demande de modifier le back.

## Les tests

### Tests unitaires (Vitest)

Ils testent les fonctions de `src/utils/` toutes seules : retard d'une tâche, date du jour selon le fuseau, nombre d'habitudes cochées dans la semaine, validation de l'email...

```bash
npm test --workspace frontend
```

Les fichiers de test sont à côté des fichiers testés (`dates.test.js` à côté de `dates.js`).
Les tests qui dépendent de la date « bloquent » l'heure avec `vi.setSystemTime` pour donner toujours le même résultat.

### Tests end-to-end (Playwright)

Un robot ouvre un navigateur et utilise le site comme un vrai utilisateur :
inscription, formulaire avec erreurs, mauvais mot de passe, connexion et déconnexion, redirection vers `/login` quand on n'est pas connecté.

Le site doit tourner pendant les tests :

```bash
# terminal 1
npm run dev

# terminal 2
npm run test:e2e --workspace frontend               # lancer les tests
npm run test:e2e --workspace frontend -- --ui       # voir chaque étape en détail
npm run test:e2e --workspace frontend -- --headed   # voir le navigateur
```

Chaque lancement crée un nouveau compte de test (`test_...`) dans la base.

## Limites connues

- Les tests end-to-end ne couvrent pas encore la création, la modification et la suppression des tâches et des habitudes.
- Le token est gardé dans le localStorage (voir plus haut).
- Une habitude ne peut être cochée que pour aujourd'hui depuis l'interface (le back accepte aussi les jours passés).
