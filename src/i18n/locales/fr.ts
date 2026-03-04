export const fr = {
  // ── bot.ts ──
  "bot.welcome_back": "Re-bonjour {name} ! Que veux-tu faire ?",
  "bot.welcome_new": "Bienvenue sur MisterHealthy !\nJe vais t'aider à créer ton profil pour générer des menus personnalisés.",
  "bot.invite_required": "Ce bot est privé. Entre le code d'invitation :",
  "bot.invite_accepted": "Code accepté ! Bienvenue sur MisterHealthy !\nJe vais t'aider à créer ton profil.",
  "bot.invite_incorrect": "Code incorrect. Réessaie ou demande le bon code à l'administrateur.",

  // ── onboarding ──
  "onboarding.cancelled": "Onboarding annulé. Tape /start pour recommencer.",
  "onboarding.ask_name": "Comment tu t'appelles ? (/cancel pour annuler)",
  "onboarding.ask_goal": "Quel est ton objectif ?",
  "onboarding.ask_weight": "Ton poids en kg ? (ex: 75)",
  "onboarding.ask_height": "Ta taille en cm ? (ex: 175)",
  "onboarding.ask_age": "Ton âge ?",
  "onboarding.ask_batch": "Tu veux faire du batch cooking ?",
  "onboarding.ask_restrictions": "Restrictions alimentaires ? (clique puis Valider)",
  "onboarding.ask_equipment": "Quel équipement cuisine tu as ? Décris ce que tu as.\n(ex: \"four, plaques, thermomix, airfryer, micro-ondes, pas de robot\")",
  "onboarding.ask_extra": "Autres précisions ? (ou envoie \"non\")",
  "onboarding.profile_created": "Profil créé {name} ! Tu peux maintenant générer ton premier menu.",

  // ── keyboard (main) ──
  "kb.generate_menu": "🍽 Générer menu",
  "kb.my_menu": "📋 Mon menu",
  "kb.shopping_list": "🛒 Liste de courses",
  "kb.my_stats": "📊 Mes stats",
  "kb.my_profile": "👤 Mon profil",
  "kb.cancel": "❌ Annuler",
  "kb.validate": "✅ Valider",
  "kb.back": "⬅️ Retour",
  "kb.previous": "⬅️ Précédent",
  "kb.next": "Suivant ➡️",
  "kb.generate": "✅ Générer",
  "kb.edit_days": "📅 Modifier les jours",
  "kb.edit_instructions": "✏️ Précisions",
  "kb.delete_menu": "🗑 Supprimer ce menu",
  "kb.batch_cooking": "🍳 Batch cooking",
  "kb.all_steps": "📋 Toutes les étapes",
  "kb.edit_profile": "✏️ Modifier mon profil",
  "kb.my_badges": "🏅 Mes badges",
  "kb.history": "📈 Historique",
  "kb.yes_delete": "Oui, supprimer",
  "kb.no_cancel": "Non, annuler",
  "kb.skip": "⏭ Passer",
  "kb.yes": "✅ Oui",
  "kb.no_today": "❌ Pas aujourd'hui",
  "kb.see_today_meals": "📋 Voir mes repas du jour",
  "kb.done": "✅ C'est bon",

  // ── goals ──
  "goal.perte_poids": "Perte de poids",
  "goal.prise_masse": "Prise de masse",
  "goal.maintien": "Maintien",
  "goal.manger_equilibre": "Mieux manger",

  // ── meals ──
  "meal.petit_dej": "🌅 Petit-déj",
  "meal.dejeuner": "🍽 Déjeuner",
  "meal.collation": "🍰 Collation",
  "meal.diner": "🌙 Dîner",

  // ── days ──
  "day.lundi": "Lundi",
  "day.mardi": "Mardi",
  "day.mercredi": "Mercredi",
  "day.jeudi": "Jeudi",
  "day.vendredi": "Vendredi",
  "day.samedi": "Samedi",
  "day.dimanche": "Dimanche",

  // ── batch cooking ──
  "batch.yes": "Oui",
  "batch.no": "Non",

  // ── restrictions ──
  "restriction.vegetarien": "Végétarien",
  "restriction.sans_gluten": "Sans gluten",
  "restriction.sans_lactose": "Sans lactose",
  "restriction.aucune": "Aucune",

  // ── equipment ──
  "equipment.four": "Four",
  "equipment.robot_cuisine": "Robot cuisine",
  "equipment.airfryer": "Airfryer",
  "equipment.micro_ondes": "Micro-ondes",
  "equipment.plaques": "Plaques seules",

  // ── profile display ──
  "profile.title": "👤 <b>Mon profil</b>\n",
  "profile.no_profile": "Tu n'as pas encore de profil. Tape /start pour commencer.",
  "profile.name": "Nom : {value}",
  "profile.weight": "Poids : {value} kg",
  "profile.height": "Taille : {value} cm",
  "profile.age": "Âge : {value} ans",
  "profile.goal": "Objectif : {value}",
  "profile.servings": "Personnes : {value}",
  "profile.meals": "Repas : {value}",
  "profile.batch": "Batch cooking : {value}",
  "profile.restrictions": "Restrictions : {value}",
  "profile.equipment": "Équipement : {value}",
  "profile.preferences": "Préférences : {value}",

  // ── menu generation ──
  "menu.ask_days": "Pour quels jours veux-tu un menu ? (clique puis Valider)",
  "menu.ask_meals": "Quels repas ? (clique puis Valider)",
  "menu.ask_servings": "Pour combien de personnes ?",
  "menu.ask_extra": "Des précisions pour cette semaine ? (ou envoie \"non\" ou /cancel pour annuler)\n(ex: \"cette semaine light\", \"avec du poisson\", \"budget serré\")",
  "menu.generating": "⏳ Je génère ton menu personnalisé, ça peut prendre quelques secondes...",
  "menu.cancelled": "Génération annulée.",
  "menu.error": "Erreur lors de la génération du menu. Réessaie dans quelques instants.",
  "menu.day_removed": "{day} retiré",
  "menu.day_added": "{day} ajouté ✓",
  "menu.meal_removed": "{meal} retiré",
  "menu.meal_added": "{meal} ajouté ✓",
  "menu.not_found": "Aucun menu trouvé",
  "menu.day_not_found": "Jour non trouvé",
  "menu.recipe_not_found": "Recette non trouvée",
  "menu.ingredients_not_found": "Ingrédients non trouvés",
  "menu.no_batch": "Pas de batch cooking",
  "menu.confirm_delete": "Tu es sûr de vouloir supprimer ce menu et sa liste de courses ?",
  "menu.deleted": "Menu supprimé",
  "menu.deleted_long": "Menu supprimé. Clique sur \"Générer menu\" pour en créer un nouveau.",
  "menu.no_menu": "Tu n'as pas encore de menu. Clique sur \"🍽 Générer menu\" pour en créer un !",

  // ── shopping ──
  "shopping.no_menu": "Tu n'as pas encore de menu. Génère-en un d'abord !",
  "shopping.empty": "Liste de courses vide.",

  // ── format ──
  "format.menu_week": "📅 <b>Menu semaine du {weekStart}</b>\n",
  "format.prep_time": "⏱ Préparation : {time}",
  "format.step": "<b>Étape {current}/{total}</b>\n",
  "format.ingredients_title": "🥕 <b>Ingrédients — {name}</b>\n",
  "format.ingredient_line": "• {quantity} {unit} de {name}",
  "format.batch_title": "🍳 <b>Batch cooking — {day}</b>\n",
  "format.batch_line": "• {task} <i>({duration})</i>",
  "format.shopping_title": "🛒 <b>Liste de courses — Semaine du {weekStart}</b>\n",
  "format.shopping_category": "<b>{category} :</b>",
  "format.shopping_item": "• {quantity} {unit} — {name}",

  // ── gamification ──
  "gamification.photo_prompt": "📸 Envoie une photo de ton plat pour +5 XP bonus !\n(ou clique Passer)",
  "gamification.nice_plate": "📸 Belle assiette !",
  "gamification.xp_earned": "+{xp} XP{photoText} — Streak {streak} jours 🔥",
  "gamification.streak_bonus": "🎁 Bonus streak : +{bonus} XP",
  "gamification.level_up": "🎉 NIVEAU {level} — {title} !",
  "gamification.new_badge": "🏅 Nouveau badge : \"{emoji} {name}\"",
  "gamification.meal_not_found": "Repas non trouvé.",
  "gamification.no_worries": "Pas de souci, à la prochaine ! 💪",
  "gamification.no_menu_today": "Pas de menu prévu aujourd'hui.",
  "gamification.today_meals": "📋 Tes repas d'aujourd'hui :",
  "gamification.photo_text_bonus": " (10 + 5 photo)",

  // ── stats ──
  "stats.title": "📊 <b>Tes stats</b>\n",
  "stats.streak": "🔥 Streak : {current} jours (record : {best})",
  "stats.level": "⭐ Niveau {level} — {title}",
  "stats.xp": "💎 XP : {current} / {next}",
  "stats.meals": "🍽 Repas cuisinés : {count}",
  "stats.photos": "📸 Photos : {count}",
  "stats.badges": "🏅 Badges : {earned} / {total}",
  "stats.badges_title": "🏅 <b>Badges</b> (page {current}/{total})\n",
  "stats.history_title": "📈 <b>Historique</b>\n",
  "stats.history_meals": "🍽 Total repas : {count}",
  "stats.history_photos": "📸 Total photos : {count}",
  "stats.history_batch": "🍳 Total batch cooking : {count}",
  "stats.history_perfect": "⭐ Semaines parfaites : {count}",
  "stats.history_best_streak": "🔥 Meilleur streak : {count} jours",

  // ── horaires ──
  "horaires.title": "⏰ <b>Tes horaires de rappel</b>\n",
  "horaires.petit_dej": "🌅 Petit-déjeuner : {time}",
  "horaires.dejeuner": "🍽 Déjeuner : {time}",
  "horaires.collation": "🍰 Collation : {time}",
  "horaires.diner": "🌙 Dîner : {time}",
  "horaires.streak_alert": "🔥 Alerte streak : {time}",
  "horaires.ask_modify": "\nQuel horaire veux-tu modifier ? (ou /cancel pour annuler)",
  "horaires.saved": "Horaires sauvegardés ✅",
  "horaires.ask_new_time": "Nouvelle heure pour ce rappel ? (format HH:MM, ex: 12:30)",
  "horaires.invalid_format": "Format invalide. Utilise HH:MM (ex: 13:00)",
  "horaires.cancelled": "Modification annulée.",
  "horaires.updated": "Horaire mis à jour : {time} ✅\n\nAutre modification ?",

  // ── scheduler ──
  "scheduler.meal_time": "{label} – C'est l'heure !\n\n🍴 *{name}*\n\nAs-tu suivi ton repas prévu ?",
  "scheduler.streak_danger": "🔥 Attention ! Ta streak de *{streak} jour(s)* est en danger !\n\nTu n'as validé aucun repas aujourd'hui. Ne laisse pas ta série s'arrêter !",

  // ── level titles ──
  "level.1": "Débutant",
  "level.2": "Marmiton",
  "level.3": "Commis",
  "level.4": "Commis confirmé",
  "level.5": "Cuistot",
  "level.6": "Cuistot confirmé",
  "level.7": "Cuistot expérimenté",
  "level.8": "Sous-chef",
  "level.9": "Sous-chef confirmé",
  "level.10": "Sous-chef expérimenté",
  "level.11": "Demi-chef",
  "level.12": "Chef",
  "level.13": "Chef confirmé",
  "level.14": "Chef expérimenté",
  "level.15": "Chef exécutif",
  "level.16": "Chef étoilé",
  "level.17": "Chef 2 étoiles",
  "level.18": "Chef 3 étoiles",
  "level.19": "Meilleur Ouvrier",
  "level.20": "Gordon Ramsay",

  // ── language ──
  "language.changed": "Langue changée en français 🇫🇷",

  // ── gemini ──
  "gemini.respond_in": "Répondre en français",
} as const;

export type TranslationKey = keyof typeof fr;
