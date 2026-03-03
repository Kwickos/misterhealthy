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

1. Fork le repo
2. Cree une branche (`git checkout -b feat/ma-feature`)
3. Code tes changements
4. Lance les tests (`npm test`)
5. Commit (`git commit -m "feat: description"`)
6. Push (`git push origin feat/ma-feature`)
7. Ouvre une Pull Request

## Conventions

- **Commits** : format [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, etc.)
- **TypeScript** : strict mode, pas de `any`
- **Tests** : ajoute des tests pour les nouvelles fonctionnalites

## Setup local

```bash
npm install
cp .env.example .env
# Remplir les variables dans .env
npm run dev
```

## Structure

Voir le [README](README.md) pour la structure du projet.
