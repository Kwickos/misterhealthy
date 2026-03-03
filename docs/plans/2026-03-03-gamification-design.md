# Gamification — Design Document

**Goal:** Ajouter un système de gamification complet au bot Telegram MisterHealthy avec progression personnelle (streaks, XP/niveaux, badges contextuels attribués par Gemini).

## Concept

3 piliers : **streaks**, **XP/niveaux** et **badges**. Alimenté par la validation des repas cuisinés.

### Flux quotidien

1. Le bot envoie un rappel à l'heure de chaque repas prévu
2. L'utilisateur clique "Oui" ou "Pas aujourd'hui"
3. Si "Oui" → possibilité d'envoyer une photo (+5 XP bonus)
4. Attribution XP + vérification badges + mise à jour streak
5. Message récap avec XP gagné, streak, badges débloqués
6. Le soir à 22h, alerte si streak en danger

### XP par action

- Repas cuisiné : 10 XP
- Photo ajoutée : 5 XP bonus
- Batch cooking réalisé : 20 XP
- Journée complète : 15 XP bonus

### Paliers de streak (bonus XP)

- 3 jours : +10 XP
- 7 jours : +25 XP
- 14 jours : +50 XP
- 30 jours : +100 XP

### Niveaux

Formule : `XP requis pour level up = niveau * 50`

| Niveau | XP cumulé | Titre |
|--------|-----------|-------|
| 1→2 | 50 | Marmiton |
| 3 | 150 | Commis |
| 5 | 400 | Cuistot |
| 8 | 900 | Sous-chef |
| 12 | 1800 | Chef |
| 16 | 3200 | Chef étoilé |
| 20 | 5000 | Gordon Ramsay |

## Badges

Tous les badges sont stockés en base dans `badge_definitions`, jamais hardcodés. Deux types :

### Badges fixes (déclenchés par compteurs côté code)

**Streak :** Premier feu (3j), Semaine de feu (7j), Endurant (14j), Inarrêtable (30j), Deux mois de flammes (60j), Centenaire (100j), Légende (365j)

**Volume repas :** Premier pas (1), Lancé (10), Régulier (25), Demi-centurion (50), Centurion (100), Machine à cuisiner (250), Demi-millier (500)

**Photos :** Première photo (1), Instagrameur (10), Foodie (25), Photographe culinaire (50), National Geographic de la bouffe (100)

**Batch cooking :** Premier batch (1), Batch habitué (5), Batch master (10), Roi de la prep (25)

**Semaine parfaite :** Semaine parfaite (1), Mois parfait (4), Trimestre parfait (10)

**Petit-déj :** Lève-tôt (5), Matinal (15), Le petit-déj c'est sacré (30), Jamais sans mon petit-déj (50)

**Menus générés :** Curieux (1), Planificateur (5), Organisé (10), Stratège culinaire (25)

### Badges contextuels (attribués par Gemini à la génération du menu)

Intégrés dans le JSON de chaque repas via un champ `badges: string[]`. Gemini reçoit la liste complète des badges existants et attribue ceux pertinents. Il peut en inventer de nouveaux uniquement si vraiment mérité.

**Cuisines du monde :** Mama mia (italien), Olé (espagnol), Samouraï (japonais), Dragon (chinois), Maharaja (indien), Pad thaï lover (thaïlandais), Couscous royal (maghrébin), Sombrero (mexicain), K-food (coréen), Mezze master (libanais/turc), American dream (américain), Tour du monde (5 cuisines/semaine), Globe-trotter (10 cuisines cumulées), Ambassadeur culinaire (20 cuisines)

**Ingrédients et saveurs :** Roi du piquant (5 épicés), Douceur sucrée (5 sucrés), Herbivore (10 herbes fraîches), Ail vampire (5 aillés), Agrumes fan (5 agrumes), Champignon hunter (5 champignons), Fromage addict (10 fromage), Choco lover (5 chocolat), Épicier (10 épices différentes), Herboriste (8 herbes différentes)

**Protéines :** Poisson fan (10 poisson), Roi de la viande (10 viande rouge), Team poulet (10 volaille), Veggie lover (10 végétariens), Vegan warrior (5 vegan), Protéiné (10 riches protéines), Flexitarien (mix/semaine), Océan (3 poisson/semaine)

**Techniques :** Roi des sauces (5 sauces maison), Boulanger (5 pâte maison), Pâtissier (5 desserts), Grill master (5 grillés), Vapeur zen (5 vapeur), Wok star (5 wok), Mijoté (5 mijotés), Marinade master (5 marinades), Risotto boss (3 risottos), Soup king (5 soupes)

**Temps et difficulté :** Express (10 plats <15min), Challenge accepted (1 plat >1h), Chef pâtissier (dessert complexe), Dimanche en cuisine (cuisiné 5 dimanches), Cuisine du soir (20 dîners)

**Nutrition :** Miam les légumes (15 plats 3+ légumes), 5 fruits et légumes (journée 5+), Fibre power (10 riches fibres), Bowl master (5 bowls), Salade king (5 salades), Smoothie addict (5 smoothies), Sans sucre ajouté (5 desserts sans sucre), Léger comme une plume (10 plats light)

**Fun :** Brunch du dimanche (brunch weekend), Meal prep god (batch + semaine parfaite), One pot wonder (5 one pot), Zéro gaspi (semaine sans gaspillage), Comfort food (5 réconfortants), Date night (plat élaboré pour 2), Street food (5 street food maison), Fait maison (10 éléments fait maison)

## Architecture technique

### Nouvelles tables Supabase

- `badge_definitions` — id, name, description, emoji, source ("predefined" | "generated"), category, threshold (pour fixes), created_at
- `user_badges` — id, user_id (FK profiles), badge_id (FK badge_definitions), earned_at, meal_validation_id (nullable)
- `user_stats` — id, user_id (FK profiles), xp, level, current_streak, best_streak, total_meals, total_photos, total_batch, perfect_weeks, last_validation_date
- `meal_validations` — id, user_id (FK profiles), menu_id (FK weekly_menus), day_key, meal_key, photo_file_id (nullable), xp_earned, validated_at
- `reminder_settings` — id, user_id (FK profiles), petit_dej (default "09:00"), dejeuner (default "13:00"), collation (default "17:00"), diner (default "20:00"), streak_alert (default "22:00")

### Modifications existantes

- Type `Meal` : ajout `badges?: string[]`
- Schema Gemini : ajout champ badges par repas
- System prompt : liste des badges contextuels + règles d'attribution

### Nouveaux handlers

- Rappels programmés (scheduler)
- Validation repas (oui / non / photo / passer)
- `/stats` — voir ses stats
- `/badges` — voir sa collection
- `/horaires` — modifier les rappels
- Alerte streak (22h)
- Nouveau bouton clavier persistant

## UX Messages

### Rappel
```
🍽 C'est l'heure du déjeuner !
Aujourd'hui : Curry thaï aux crevettes

Tu l'as cuisiné ?

[✅ Oui] [❌ Pas aujourd'hui]
```

### Validation avec photo
```
📸 Belle assiette !
+15 XP (10 + 5 photo) — Streak 8 jours 🔥
```

### Nouveau badge
```
🏅 Nouveau badge : "Roi du piquant"
A cuisiné 5 plats épicés
```

### Passage de niveau
```
🎉 NIVEAU 5 — Cuistot !
Tu as accumulé 400 XP. La cuisine n'a plus de secrets pour toi.
```

### Alerte streak (22h)
```
🔥 Alerte streak !
Ton streak de 12 jours va s'éteindre à minuit...

[📋 Voir mes repas du jour]
```

### /stats
```
📊 Tes stats

🔥 Streak : 12 jours (record : 18)
⭐ Niveau 5 — Cuistot
💎 XP : 412 / 500
🍽 Repas cuisinés : 47
📸 Photos : 12
🏅 Badges : 14 / 89

[🏅 Mes badges] [📈 Historique]
```
