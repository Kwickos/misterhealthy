# MisterHealthy - Bot Telegram de menus personnalisés

## Vue d'ensemble

Bot Telegram qui génère des menus hebdomadaires personnalisés avec recettes et liste de courses. L'IA adapte les menus au profil de l'utilisateur (objectif, restrictions, équipement cuisine). Usage prévu : personnel + proches.

## Stack technique

- **Runtime** : TypeScript + Node.js
- **Bot Telegram** : grammY
- **Base de données** : Supabase (PostgreSQL)
- **IA** : Gemini 3 Flash Preview (tier gratuit)
- **Mode** : Long-polling (dev + prod pour petit usage)

## Architecture

```
Utilisateur Telegram
        |
   Bot grammY (TypeScript)
    ├── Module Profil (onboarding + édition)
    ├── Module Menu (génération + navigation)
    ├── Module Recettes (détail + ingrédients)
    └── Module Liste de courses (agrégation)
        |
   Supabase (stockage profils, menus)
        |
   Gemini API (génération menus/recettes)
```

## Modèle de données

### Table `profiles`

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID, PK | Identifiant interne |
| telegram_id | bigint, unique | ID Telegram de l'utilisateur |
| username | text | Prénom ou pseudo |
| weight | numeric | Poids en kg |
| height | numeric | Taille en cm |
| age | integer | Âge |
| goal | text | "perte_poids", "prise_masse", "maintien", "manger_equilibre" |
| meals_config | text[] | Repas activés : "petit_dej", "dejeuner", "collation", "diner" |
| menu_days | text[] | Jours activés : "lundi", "mardi", ... "dimanche" |
| servings | integer | Nombre de personnes |
| batch_cooking | boolean | Mode batch cooking activé/désactivé |
| dietary_restrictions | text[] | "vegetarien", "sans_gluten", "sans_lactose", etc. |
| kitchen_equipment | text[] | "four", "robot_cuisine", "airfryer", "micro_ondes", etc. |
| extra_preferences | text | Texte libre pour précisions |
| created_at | timestamptz | Date de création |
| updated_at | timestamptz | Dernière modification |

### Table `weekly_menus`

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID, PK | Identifiant |
| profile_id | UUID, FK → profiles | Utilisateur |
| week_start | date | Date de début du menu |
| menu_data | jsonb | Menu complet structuré (voir format ci-dessous) |
| extra_instructions | text | Précisions de l'utilisateur pour cette semaine |
| created_at | timestamptz | Date de création |

### Table `shopping_lists`

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID, PK | Identifiant |
| menu_id | UUID, FK → weekly_menus | Menu associé |
| items | jsonb | Liste agrégée [{name, quantity, unit, category}] |
| created_at | timestamptz | Date de création |

## Format JSON du menu (menu_data)

```json
{
  "batch_cooking": {
    "day": "Dimanche",
    "preparations": [
      { "task": "Cuire 600g de riz complet", "duration": "20min" },
      { "task": "Préparer sauce tomate maison", "duration": "30min" }
    ]
  },
  "days": {
    "lundi": {
      "dejeuner": {
        "name": "Poulet grillé + riz complet",
        "prep_time": "15min",
        "ingredients": [
          { "name": "Filet de poulet", "quantity": 200, "unit": "g" },
          { "name": "Riz complet", "quantity": 150, "unit": "g" }
        ],
        "steps": [
          "Faire chauffer une poêle avec un filet d'huile d'olive",
          "Griller le poulet 6min par face",
          "Servir avec le riz préparé en batch"
        ]
      },
      "diner": { "..." : "..." }
    },
    "mardi": { "..." : "..." }
  }
}
```

Seuls les jours et repas activés par l'utilisateur apparaissent.

## Interface Telegram

### Menu persistant (ReplyKeyboard)

Toujours visible en bas du chat après l'onboarding :

```
[ Générer menu ] [ Mon menu    ]
[ Liste courses ] [ Mon profil ]
```

### Flow onboarding (première utilisation)

Conversation guidée, une question à la fois :

1. "Comment tu t'appelles ?"
2. "Quel est ton objectif ?" → boutons : Perte de poids | Prise de masse | Maintien | Mieux manger
3. "Ton poids (kg) ?" → saisie libre
4. "Ta taille (cm) ?" → saisie libre
5. "Ton âge ?" → saisie libre
6. "Pour combien de personnes ?" → boutons : 1 | 2 | 3 | 4+
7. "Quels repas veux-tu ?" → boutons multi-select : Petit-déj | Déjeuner | Collation | Dîner
8. "Quels jours ?" → boutons multi-select : Lun | Mar | Mer | Jeu | Ven | Sam | Dim
9. "Batch cooking ?" → boutons : Oui | Non
10. "Restrictions alimentaires ?" → boutons multi-select : Végétarien | Sans gluten | Sans lactose | Aucune | Autre
11. "Quel équipement cuisine ?" → boutons multi-select : Four | Robot cuisine | Airfryer | Micro-ondes | Plaques uniquement
12. "Autres précisions ?" → saisie libre ou bouton "Rien de plus"

### Flow génération de menu

1. Utilisateur clique "Générer menu"
2. Bot affiche config actuelle + options :
   ```
   Jours : Lundi → Vendredi
   Repas : Déjeuner, Dîner
   Personnes : 2

   [Générer] [Modifier les jours] [Précisions]
   ```
3. Si "Précisions" → saisie libre ("cette semaine light", "avec du poisson")
4. Génération via Gemini → stockage Supabase
5. Affichage résumé avec inline keyboard

### Navigation dans le menu (Inline Keyboards)

**Vue semaine :**
```
Menu semaine du 3 mars

Lundi
  Déjeuner : Poulet grillé + riz complet
  Dîner : Soupe de lentilles

Mardi
  Déjeuner : Bowl saumon avocat
  Dîner : Omelette champignons

[Lundi] [Mardi] [Mercredi] [Jeudi]
[Vendredi] [Samedi] [Dimanche]
```

**Vue jour (clic sur un jour) :**
```
Mardi

Déjeuner : Bowl saumon avocat
Dîner : Omelette champignons

[Recette Déjeuner] [Ingrédients Déjeuner]
[Recette Dîner] [Ingrédients Dîner]
[Retour]
```

**Vue recette (clic sur "Recette") :**
```
Bowl saumon avocat
Temps de préparation : 15min

1. Cuire le riz vinaigré...
2. Trancher le saumon...
3. ...

[Ingrédients] [Retour]
```

**Vue ingrédients (clic sur "Ingrédients") :**
```
Bowl saumon avocat

- 150g de saumon frais
- 1 avocat
- 100g de riz à sushi
- ...

[Recette] [Retour]
```

### Liste de courses globale

Agrège tous les ingrédients de la semaine. Calculée côté code (pas par l'IA). Groupée par catégorie :

```
Liste de courses - Semaine du 3 mars

Fruits & Légumes :
  - 3 avocats
  - 500g de champignons
  - 1 bouquet de coriandre

Viandes & Poissons :
  - 600g de filet de poulet
  - 300g de saumon frais

Épicerie :
  - 500g de riz complet
  - 200g de lentilles

Produits laitiers :
  - 500g de yaourt grec
  - 200ml de crème fraîche
```

## Prompt système Gemini

```
Tu es un nutritionniste et chef cuisinier expert. Tu génères des menus
hebdomadaires personnalisés en JSON strictement structuré.

Règles obligatoires :
1. Adapter les calories et macronutriments au profil de l'utilisateur
   (poids, taille, âge, objectif)
2. Respecter strictement les restrictions alimentaires
3. N'utiliser QUE le matériel cuisine disponible dans le profil
4. TOUJOURS favoriser la réutilisation des ingrédients sur la semaine :
   si un ingrédient est acheté, l'utiliser dans au minimum 2-3 recettes
5. Minimiser le gaspillage : ne jamais demander une petite quantité d'un
   ingrédient périssable sans le réutiliser dans la semaine
6. Adapter les quantités au nombre de personnes
7. Recettes réalistes, accessibles, avec temps de préparation honnêtes
8. Si batch cooking activé : regrouper les préparations en une session
   (typiquement dimanche), préciser clairement quoi préparer à l'avance
   et comment les plats de la semaine réutilisent ces préparations
9. Varier les saveurs et textures sur la semaine
10. Ne générer que les jours et repas demandés
```

## Structure du projet

```
misterhealthy/
├── src/
│   ├── index.ts              # Point d'entrée, init bot
│   ├── bot.ts                # Config grammY, middleware, commandes
│   ├── config.ts             # Variables d'env, constantes
│   ├── modules/
│   │   ├── profile/
│   │   │   ├── onboarding.ts # Flow onboarding conversationnel
│   │   │   ├── edit.ts       # Édition du profil
│   │   │   └── handlers.ts   # Handlers boutons profil
│   │   ├── menu/
│   │   │   ├── generate.ts   # Appel Gemini + stockage
│   │   │   ├── display.ts    # Affichage menu + inline keyboards
│   │   │   └── handlers.ts   # Handlers navigation menu
│   │   ├── recipe/
│   │   │   ├── display.ts    # Affichage recette + ingrédients
│   │   │   └── handlers.ts   # Handlers boutons recette
│   │   └── shopping/
│   │       ├── aggregate.ts  # Agrégation ingrédients
│   │       └── handlers.ts   # Handler liste de courses
│   ├── services/
│   │   ├── gemini.ts         # Client Gemini API
│   │   └── supabase.ts       # Client Supabase
│   └── utils/
│       ├── keyboard.ts       # Helpers pour claviers Telegram
│       └── format.ts         # Formatage texte pour Telegram
├── package.json
├── tsconfig.json
└── .env
```
