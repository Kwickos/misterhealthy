# Contribuer a MisterHealthy

Merci de vouloir contribuer ! Voici comment faire.

## Signaler un bug

Ouvre une [issue](https://github.com/Kwickos/misterhealthy/issues/new?template=bug_report.md) avec :
- Ce que tu as fait
- Ce qui s'est passe
- Ce que tu attendais

## Proposer une fonctionnalite

Ouvre une [issue](https://github.com/Kwickos/misterhealthy/issues/new?template=feature_request.md) avec ta proposition. On en discute avant de coder.

## Contribuer du code

### Workflow Git

Le projet utilise deux branches principales :
- `master` — branche stable (production)
- `develop` — branche d'integration (les PR vont ici)

### Etapes

1. Fork le repo
2. Clone ton fork : `git clone https://github.com/TON_USER/misterhealthy.git`
3. Ajoute le repo original comme remote : `git remote add upstream https://github.com/Kwickos/misterhealthy.git`
4. Cree ta branche depuis `develop` :
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feat/ma-feature
   ```
5. Code tes changements
6. Lance les tests : `npm test`
7. Commit en suivant les conventions : `git commit -m "feat: description"`
8. Push : `git push origin feat/ma-feature`
9. Ouvre une Pull Request **vers `develop`** (pas `master`)

### Nommage des branches

| Prefixe | Usage |
|---------|-------|
| `feat/` | Nouvelle fonctionnalite |
| `fix/` | Correction de bug |
| `docs/` | Documentation |
| `chore/` | Maintenance, CI, config |

## Conventions

- **Commits** : format [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, etc.)
- **TypeScript** : strict mode, pas de `any`
- **Tests** : ajoute des tests pour les nouvelles fonctionnalites
- **Langue** : code et commentaires en anglais, messages utilisateur en francais

## Setup local

```bash
# Installer Node.js 20 (voir .nvmrc)
nvm use

# Installer les dependances
npm install

# Configurer l'environnement
cp .env.example .env
# Remplir les variables dans .env

# Lancer en dev (hot reload)
npm run dev

# Lancer les tests
npm test
npm run test:watch  # mode watch
```

## Structure

Voir le [README](README.md) pour la structure du projet.
