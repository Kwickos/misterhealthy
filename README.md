# MisterHealthy

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Telegram Bot](https://img.shields.io/badge/Telegram-Bot-26A5E4.svg?logo=telegram)](https://core.telegram.org/bots)
[![Gemini AI](https://img.shields.io/badge/Gemini-3_Flash-4285F4.svg?logo=google)](https://ai.google.dev/)

Bot Telegram de planification de repas personnalisé, propulsé par l'IA.

MisterHealthy génère des menus hebdomadaires adaptés à ton profil (objectif, restrictions, équipement cuisine), avec recettes détaillées, liste de courses automatique et un système de gamification pour rester motivé.

## Fonctionnalités

**Menu intelligent**
- Génération de menus hebdomadaires par IA (Gemini 3 Flash)
- Choix des jours, repas et nombre de personnes à chaque génération
- Recettes complètes étape par étape avec navigation inline
- Optimisation de la réutilisation des ingrédients (zéro gaspi)
- Mode batch cooking avec instructions de préparation

**Profil personnalisé**
- Objectif : perte de poids, prise de masse, maintien, mieux manger
- Restrictions alimentaires : végétarien, sans gluten, sans lactose...
- Équipement cuisine en texte libre
- Préférences supplémentaires

**Liste de courses**
- Agrégation automatique des ingrédients de la semaine
- Dédoublication intelligente
- Catégorisation par rayon

**Gamification**
- XP et niveaux (Débutant → Gordon Ramsay, 20 niveaux)
- Streaks quotidiens avec alertes
- 89+ badges (fixes + contextuels attribués par l'IA)
- Validation des repas avec photo optionnelle
- Rappels automatiques à l'heure de chaque repas
- L'IA peut inventer de nouveaux badges uniques

**Multi-langue (i18n)**
- Français et anglais supportés
- Sélection de la langue à l'inscription
- Commande `/language` pour changer à tout moment
- Les menus générés par l'IA s'adaptent à la langue choisie

**Sécurité**
- Accès privé par code d'invitation
- Deep link Telegram (`t.me/BOT?start=CODE`) ou saisie dans le chat

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Runtime | Node.js + TypeScript (ESM) |
| Bot framework | grammY + @grammyjs/conversations |
| IA | Google Gemini 3 Flash Preview (@google/genai) |
| Base de données | SQLite (better-sqlite3, zero config) |
| Dev | tsx (watch mode), Vitest |

## Structure du projet

```
src/
  index.ts                          # Point d'entrée
  bot.ts                            # Configuration du bot, middleware, routing
  config.ts                         # Variables d'environnement
  types.ts                          # Interfaces TypeScript
  i18n/
    index.ts                        # Fonction t(), hearsKey(), types Locale
    locales/
      fr.ts                         # Traductions françaises
      en.ts                         # Traductions anglaises
  services/
    database.ts                     # CRUD SQLite (better-sqlite3)
    badge-seeds.ts                  # 89 badges prédéfinis
    gemini.ts                       # Génération de menus par IA
    gamification.ts                 # Logique XP, niveaux, streaks, badges
    scheduler.ts                    # Rappels programmés
  modules/
    profile/
      onboarding.ts                 # Conversation d'inscription (+ sélection langue)
      handlers.ts                   # Affichage profil
    menu/
      handlers.ts                   # Génération et navigation menu
      display.ts                    # Affichage du menu sauvegardé
    shopping/
      handlers.ts                   # Liste de courses
    gamification/
      handlers.ts                   # Validation des repas
      stats.ts                      # Stats, badges, horaires
  utils/
    format.ts                       # Formatage des messages HTML
    keyboard.ts                     # Claviers inline et persistants
    shopping.ts                     # Agrégation des ingrédients
```

## Installation

```bash
# Cloner le repo
git clone <repo-url>
cd misterhealthy

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Remplir les valeurs dans .env
```

### Variables d'environnement

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Token du bot via @BotFather |
| `GEMINI_API_KEY` | Clé API Google AI Studio |
| `INVITE_CODE` | Code d'invitation (optionnel, vide = accès libre) |
| `DATABASE_PATH` | Chemin vers la DB SQLite (par défaut : `./data/misterhealthy.db`) |

> **Aucun service externe requis** pour la base de données : SQLite est embarqué, le fichier DB est créé automatiquement au premier lancement.

## Lancement

```bash
# Développement (hot reload)
npm run dev

# Production
npm start

# Tests
npm test
```

## Commandes du bot

| Commande | Description |
|----------|-------------|
| `/start` | Inscription ou retour au menu principal |
| `/stats` | Voir ses statistiques et progression |
| `/badges` | Voir sa collection de badges |
| `/horaires` | Modifier les heures de rappel |
| `/language` | Changer la langue (FR/EN) |
| `/cancel` | Annuler une conversation en cours |

## Clavier principal

| Bouton | Action |
|--------|--------|
| Générer menu | Lance la génération (jours, repas, personnes, instructions) |
| Mon menu | Affiche le dernier menu avec navigation |
| Liste de courses | Affiche la liste agrégée |
| Mes stats | Affiche XP, niveau, streak, badges |
| Mon profil | Affiche et permet d'éditer le profil |

---

## Roadmap

### V1 — Bot Telegram (actuel)
- [x] Génération de menus IA personnalisés
- [x] Profil utilisateur complet
- [x] Recettes étape par étape
- [x] Liste de courses automatique
- [x] Batch cooking
- [x] Système d'invitation privé
- [x] Gamification (XP, niveaux, streaks, badges)
- [x] Rappels automatiques
- [x] Badges contextuels par IA
- [x] Multi-langue (FR/EN)
- [ ] Photo "Qu'est-ce que je fais avec ça ?" (Gemini Vision analyse le frigo et propose des recettes)
- [ ] Historique des menus passés
- [ ] Partage de recettes favorites entre utilisateurs

### V2 — Personnage évolutif
- [ ] Avatar pixel art qui évolue avec le niveau (20 sprites)
- [ ] Cosmétiques débloqués par les badges (toque, accessoires, fonds)
- [ ] Slots équipables : tête, main, accessoire
- [ ] Commande `/look` pour voir et personnaliser son personnage
- [ ] Composition d'image dynamique (Sharp)

### V3 — Social
- [ ] Classements entre amis
- [ ] Défis hebdomadaires entre utilisateurs
- [ ] Partage de son personnage et ses stats
- [ ] Achievements collaboratifs (cuisiner le même plat entre potes)

### V4 — App mobile (si besoin)
- [ ] Migration vers PWA ou React Native + Expo
- [ ] UI enrichie pour les recettes (timer, swipe)
- [ ] Notifications push natives
- [ ] Distribution via TestFlight / APK
- [ ] Supabase Auth (email / magic link)
