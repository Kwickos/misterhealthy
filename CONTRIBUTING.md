# Contributing to MisterHealthy

Thanks for wanting to contribute! Here's how to get started.

## Report a bug

Open an [issue](https://github.com/Kwickos/misterhealthy/issues/new?template=bug_report.md) with:
- What you did
- What happened
- What you expected

## Suggest a feature

Open an [issue](https://github.com/Kwickos/misterhealthy/issues/new?template=feature_request.md) with your proposal. Let's discuss before coding.

## Contribute code

### Git workflow

The project uses two main branches:
- `master` — stable branch (production)
- `develop` — integration branch (PRs go here)

### Steps

1. Fork the repo
2. Clone your fork: `git clone https://github.com/YOUR_USER/misterhealthy.git`
3. Add the original repo as a remote: `git remote add upstream https://github.com/Kwickos/misterhealthy.git`
4. Create your branch from `develop`:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feat/my-feature
   ```
5. Code your changes
6. Run tests: `npm test`
7. Commit following conventions: `git commit -m "feat: description"`
8. Push: `git push origin feat/my-feature`
9. Open a Pull Request **targeting `develop`** (not `master`)

### Branch naming

| Prefix | Usage |
|--------|-------|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `docs/` | Documentation |
| `chore/` | Maintenance, CI, config |

## Conventions

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) format (`feat:`, `fix:`, `chore:`, etc.)
- **TypeScript**: strict mode, no `any`
- **Tests**: add tests for new features
- **Language**: code and comments in English

## Local setup

```bash
# Install Node.js 20 (see .nvmrc)
nvm use

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Fill in TELEGRAM_BOT_TOKEN and GEMINI_API_KEY in .env
# (no external service needed — SQLite is embedded)

# Run in dev (hot reload)
npm run dev
# The SQLite database is created automatically in data/

# Run tests
npm test
npm run test:watch  # watch mode
```

## Structure

See the [README](README.md) for the project structure.
