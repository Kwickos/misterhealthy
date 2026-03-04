# MisterHealthy

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Telegram Bot](https://img.shields.io/badge/Telegram-Bot-26A5E4.svg?logo=telegram)](https://core.telegram.org/bots)
[![Gemini AI](https://img.shields.io/badge/Gemini-3_Flash-4285F4.svg?logo=google)](https://ai.google.dev/)

AI-powered Telegram bot for personalized meal planning.

MisterHealthy generates weekly menus tailored to your profile (goals, dietary restrictions, kitchen equipment), with detailed recipes, automatic shopping lists, and a gamification system to keep you motivated.

## Features

**Smart menus**
- AI-generated weekly menus (Gemini 3 Flash)
- Choose days, meals, and servings for each generation
- Full step-by-step recipes with inline navigation
- Ingredient reuse optimization (zero waste)
- Batch cooking mode with preparation instructions

**Personalized profile**
- Goals: weight loss, muscle gain, maintenance, eat healthier
- Dietary restrictions: vegetarian, gluten-free, lactose-free...
- Kitchen equipment (free text)
- Additional preferences

**Shopping list**
- Automatic weekly ingredient aggregation
- Smart deduplication
- Categorized by aisle

**Gamification**
- XP and levels (Beginner → Gordon Ramsay, 20 levels)
- Daily streaks with alerts
- 89+ badges (fixed + contextual, assigned by AI)
- Meal validation with optional photo
- Automatic reminders at each meal time
- AI can invent unique new badges

**Multi-language (i18n)**
- French and English supported
- Language selection during onboarding
- `/language` command to switch anytime
- AI-generated menus adapt to the chosen language

**Security**
- Private access via invite code
- Telegram deep link (`t.me/BOT?start=CODE`) or chat input

## Tech stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js + TypeScript (ESM) |
| Bot framework | grammY + @grammyjs/conversations |
| AI | Google Gemini 3 Flash Preview (@google/genai) |
| Database | SQLite (better-sqlite3, zero config) |
| Dev | tsx (watch mode), Vitest |

## Project structure

```
src/
  index.ts                          # Entry point
  bot.ts                            # Bot config, middleware, routing
  config.ts                         # Environment variables
  types.ts                          # TypeScript interfaces
  i18n/
    index.ts                        # t() function, hearsKey(), Locale types
    locales/
      fr.ts                         # French translations
      en.ts                         # English translations
  services/
    database.ts                     # SQLite CRUD (better-sqlite3)
    badge-seeds.ts                  # 89 predefined badges
    gemini.ts                       # AI menu generation
    gamification.ts                 # XP, levels, streaks, badges logic
    scheduler.ts                    # Scheduled reminders
  modules/
    profile/
      onboarding.ts                 # Onboarding conversation (+ language selection)
      handlers.ts                   # Profile display
    menu/
      handlers.ts                   # Menu generation and navigation
      display.ts                    # Saved menu display
    shopping/
      handlers.ts                   # Shopping list
    gamification/
      handlers.ts                   # Meal validation
      stats.ts                      # Stats, badges, reminder times
  utils/
    format.ts                       # HTML message formatting
    keyboard.ts                     # Inline and persistent keyboards
    shopping.ts                     # Ingredient aggregation
```

## Installation

```bash
# Clone the repo
git clone https://github.com/Kwickos/misterhealthy.git
cd misterhealthy

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in the values in .env
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `INVITE_CODE` | Invite code (optional, empty = open access) |
| `DATABASE_PATH` | Path to SQLite DB (default: `./data/misterhealthy.db`) |

> **No external service required** for the database: SQLite is embedded, the DB file is created automatically on first launch.

## Usage

```bash
# Development (hot reload)
npm run dev

# Production
npm start

# Tests
npm test
```

## Bot commands

| Command | Description |
|---------|-------------|
| `/start` | Sign up or return to main menu |
| `/stats` | View your stats and progression |
| `/badges` | View your badge collection |
| `/horaires` | Change reminder times |
| `/language` | Change language (FR/EN) |
| `/cancel` | Cancel current conversation |

## Main keyboard

| Button | Action |
|--------|--------|
| Generate menu | Start generation (days, meals, servings, instructions) |
| My menu | View saved menu with navigation |
| Shopping list | View aggregated shopping list |
| My stats | View XP, level, streak, badges |
| My profile | View and edit profile |

---

## Roadmap

### V1 — Telegram Bot (current)
- [x] AI-powered personalized menus
- [x] Full user profile
- [x] Step-by-step recipes
- [x] Automatic shopping list
- [x] Batch cooking
- [x] Private invite system
- [x] Gamification (XP, levels, streaks, badges)
- [x] Automatic reminders
- [x] AI contextual badges
- [x] Multi-language (FR/EN)
- [ ] "What can I make with this?" photo (Gemini Vision analyzes fridge and suggests recipes)
- [ ] Past menu history
- [ ] Share favorite recipes between users

### V2 — Evolving character
- [ ] Pixel art avatar that evolves with level (20 sprites)
- [ ] Cosmetics unlocked by badges (chef hat, accessories, backgrounds)
- [ ] Equippable slots: head, hand, accessory
- [ ] `/look` command to view and customize your character
- [ ] Dynamic image composition (Sharp)

### V3 — Social
- [ ] Friend leaderboards
- [ ] Weekly challenges between users
- [ ] Share your character and stats
- [ ] Collaborative achievements (cook the same dish with friends)

### V4 — Mobile app (if needed)
- [ ] Migration to PWA or React Native + Expo
- [ ] Enhanced recipe UI (timer, swipe)
- [ ] Native push notifications
- [ ] Distribution via TestFlight / APK
- [ ] Supabase Auth (email / magic link)
