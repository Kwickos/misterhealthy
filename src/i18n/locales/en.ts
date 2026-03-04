import type { TranslationKey } from "./fr.js";

export const en: Record<TranslationKey, string> = {
  // ── bot.ts ──
  "bot.welcome_back": "Welcome back {name}! What would you like to do?",
  "bot.welcome_new": "Welcome to MisterHealthy!\nI'll help you create your profile to generate personalized menus.",
  "bot.invite_required": "This bot is private. Enter the invite code:",
  "bot.invite_accepted": "Code accepted! Welcome to MisterHealthy!\nI'll help you create your profile.",
  "bot.invite_incorrect": "Incorrect code. Try again or ask the admin for the correct code.",

  // ── onboarding ──
  "onboarding.cancelled": "Onboarding cancelled. Type /start to restart.",
  "onboarding.ask_name": "What's your name? (/cancel to cancel)",
  "onboarding.ask_goal": "What's your goal?",
  "onboarding.ask_weight": "Your weight in kg? (e.g. 75)",
  "onboarding.ask_height": "Your height in cm? (e.g. 175)",
  "onboarding.ask_age": "Your age?",
  "onboarding.ask_batch": "Do you want to do batch cooking?",
  "onboarding.ask_restrictions": "Dietary restrictions? (click then Validate)",
  "onboarding.ask_equipment": "What kitchen equipment do you have? Describe what you have.\n(e.g. \"oven, stove, thermomix, airfryer, microwave, no food processor\")",
  "onboarding.ask_extra": "Any other preferences? (or send \"no\")",
  "onboarding.profile_created": "Profile created {name}! You can now generate your first menu.",

  // ── keyboard (main) ──
  "kb.generate_menu": "🍽 Generate menu",
  "kb.my_menu": "📋 My menu",
  "kb.shopping_list": "🛒 Shopping list",
  "kb.my_stats": "📊 My stats",
  "kb.my_profile": "👤 My profile",
  "kb.cancel": "❌ Cancel",
  "kb.validate": "✅ Validate",
  "kb.back": "⬅️ Back",
  "kb.previous": "⬅️ Previous",
  "kb.next": "Next ➡️",
  "kb.generate": "✅ Generate",
  "kb.edit_days": "📅 Edit days",
  "kb.edit_instructions": "✏️ Instructions",
  "kb.delete_menu": "🗑 Delete menu",
  "kb.batch_cooking": "🍳 Batch cooking",
  "kb.all_steps": "📋 All steps",
  "kb.edit_profile": "✏️ Edit my profile",
  "kb.my_badges": "🏅 My badges",
  "kb.history": "📈 History",
  "kb.yes_delete": "Yes, delete",
  "kb.no_cancel": "No, cancel",
  "kb.skip": "⏭ Skip",
  "kb.yes": "✅ Yes",
  "kb.no_today": "❌ Not today",
  "kb.see_today_meals": "📋 See today's meals",
  "kb.done": "✅ Done",

  // ── goals ──
  "goal.perte_poids": "Weight loss",
  "goal.prise_masse": "Muscle gain",
  "goal.maintien": "Maintenance",
  "goal.manger_equilibre": "Eat healthier",

  // ── meals ──
  "meal.petit_dej": "🌅 Breakfast",
  "meal.dejeuner": "🍽 Lunch",
  "meal.collation": "🍰 Snack",
  "meal.diner": "🌙 Dinner",

  // ── days ──
  "day.lundi": "Monday",
  "day.mardi": "Tuesday",
  "day.mercredi": "Wednesday",
  "day.jeudi": "Thursday",
  "day.vendredi": "Friday",
  "day.samedi": "Saturday",
  "day.dimanche": "Sunday",

  // ── batch cooking ──
  "batch.yes": "Yes",
  "batch.no": "No",

  // ── restrictions ──
  "restriction.vegetarien": "Vegetarian",
  "restriction.sans_gluten": "Gluten-free",
  "restriction.sans_lactose": "Lactose-free",
  "restriction.aucune": "None",

  // ── equipment ──
  "equipment.four": "Oven",
  "equipment.robot_cuisine": "Food processor",
  "equipment.airfryer": "Air fryer",
  "equipment.micro_ondes": "Microwave",
  "equipment.plaques": "Stovetop only",

  // ── profile display ──
  "profile.title": "👤 <b>My profile</b>\n",
  "profile.no_profile": "You don't have a profile yet. Type /start to get started.",
  "profile.name": "Name: {value}",
  "profile.weight": "Weight: {value} kg",
  "profile.height": "Height: {value} cm",
  "profile.age": "Age: {value}",
  "profile.goal": "Goal: {value}",
  "profile.servings": "Servings: {value}",
  "profile.meals": "Meals: {value}",
  "profile.batch": "Batch cooking: {value}",
  "profile.restrictions": "Restrictions: {value}",
  "profile.equipment": "Equipment: {value}",
  "profile.preferences": "Preferences: {value}",

  // ── menu generation ──
  "menu.ask_days": "Which days do you want a menu for? (click then Validate)",
  "menu.ask_meals": "Which meals? (click then Validate)",
  "menu.ask_servings": "How many servings?",
  "menu.ask_extra": "Any instructions for this week? (or send \"no\" or /cancel to cancel)\n(e.g. \"light week\", \"with fish\", \"tight budget\")",
  "menu.generating": "⏳ Generating your personalized menu, this may take a few seconds...",
  "menu.cancelled": "Generation cancelled.",
  "menu.error": "Error generating the menu. Please try again in a moment.",
  "menu.day_removed": "{day} removed",
  "menu.day_added": "{day} added ✓",
  "menu.meal_removed": "{meal} removed",
  "menu.meal_added": "{meal} added ✓",
  "menu.not_found": "No menu found",
  "menu.day_not_found": "Day not found",
  "menu.recipe_not_found": "Recipe not found",
  "menu.ingredients_not_found": "Ingredients not found",
  "menu.no_batch": "No batch cooking",
  "menu.confirm_delete": "Are you sure you want to delete this menu and its shopping list?",
  "menu.deleted": "Menu deleted",
  "menu.deleted_long": "Menu deleted. Click \"Generate menu\" to create a new one.",
  "menu.no_menu": "You don't have a menu yet. Click \"🍽 Generate menu\" to create one!",

  // ── shopping ──
  "shopping.no_menu": "You don't have a menu yet. Generate one first!",
  "shopping.empty": "Shopping list empty.",

  // ── format ──
  "format.menu_week": "📅 <b>Menu for the week of {weekStart}</b>\n",
  "format.prep_time": "⏱ Prep time: {time}",
  "format.step": "<b>Step {current}/{total}</b>\n",
  "format.ingredients_title": "🥕 <b>Ingredients — {name}</b>\n",
  "format.ingredient_line": "• {quantity} {unit} of {name}",
  "format.batch_title": "🍳 <b>Batch cooking — {day}</b>\n",
  "format.batch_line": "• {task} <i>({duration})</i>",
  "format.shopping_title": "🛒 <b>Shopping list — Week of {weekStart}</b>\n",
  "format.shopping_category": "<b>{category}:</b>",
  "format.shopping_item": "• {quantity} {unit} — {name}",

  // ── gamification ──
  "gamification.photo_prompt": "📸 Send a photo of your plate for +5 XP bonus!\n(or click Skip)",
  "gamification.nice_plate": "📸 Nice plate!",
  "gamification.xp_earned": "+{xp} XP{photoText} — Streak {streak} days 🔥",
  "gamification.streak_bonus": "🎁 Streak bonus: +{bonus} XP",
  "gamification.level_up": "🎉 LEVEL {level} — {title}!",
  "gamification.new_badge": "🏅 New badge: \"{emoji} {name}\"",
  "gamification.meal_not_found": "Meal not found.",
  "gamification.no_worries": "No worries, next time! 💪",
  "gamification.no_menu_today": "No menu planned for today.",
  "gamification.today_meals": "📋 Your meals today:",
  "gamification.photo_text_bonus": " (10 + 5 photo)",

  // ── stats ──
  "stats.title": "📊 <b>Your stats</b>\n",
  "stats.streak": "🔥 Streak: {current} days (record: {best})",
  "stats.level": "⭐ Level {level} — {title}",
  "stats.xp": "💎 XP: {current} / {next}",
  "stats.meals": "🍽 Meals cooked: {count}",
  "stats.photos": "📸 Photos: {count}",
  "stats.badges": "🏅 Badges: {earned} / {total}",
  "stats.badges_title": "🏅 <b>Badges</b> (page {current}/{total})\n",
  "stats.history_title": "📈 <b>History</b>\n",
  "stats.history_meals": "🍽 Total meals: {count}",
  "stats.history_photos": "📸 Total photos: {count}",
  "stats.history_batch": "🍳 Total batch cooking: {count}",
  "stats.history_perfect": "⭐ Perfect weeks: {count}",
  "stats.history_best_streak": "🔥 Best streak: {count} days",

  // ── horaires ──
  "horaires.title": "⏰ <b>Your reminder times</b>\n",
  "horaires.petit_dej": "🌅 Breakfast: {time}",
  "horaires.dejeuner": "🍽 Lunch: {time}",
  "horaires.collation": "🍰 Snack: {time}",
  "horaires.diner": "🌙 Dinner: {time}",
  "horaires.streak_alert": "🔥 Streak alert: {time}",
  "horaires.ask_modify": "\nWhich time do you want to change? (or /cancel to cancel)",
  "horaires.saved": "Times saved ✅",
  "horaires.ask_new_time": "New time for this reminder? (format HH:MM, e.g. 12:30)",
  "horaires.invalid_format": "Invalid format. Use HH:MM (e.g. 13:00)",
  "horaires.cancelled": "Modification cancelled.",
  "horaires.updated": "Time updated: {time} ✅\n\nAnother change?",

  // ── scheduler ──
  "scheduler.meal_time": "{label} – It's time!\n\n🍴 *{name}*\n\nDid you follow your planned meal?",
  "scheduler.streak_danger": "🔥 Warning! Your *{streak} day(s)* streak is at risk!\n\nYou haven't validated any meals today. Don't let your streak end!",

  // ── level titles ──
  "level.1": "Beginner",
  "level.2": "Kitchen helper",
  "level.3": "Commis",
  "level.4": "Senior commis",
  "level.5": "Cook",
  "level.6": "Senior cook",
  "level.7": "Experienced cook",
  "level.8": "Sous-chef",
  "level.9": "Senior sous-chef",
  "level.10": "Head sous-chef",
  "level.11": "Demi-chef",
  "level.12": "Chef",
  "level.13": "Senior chef",
  "level.14": "Experienced chef",
  "level.15": "Executive chef",
  "level.16": "Starred chef",
  "level.17": "2-star chef",
  "level.18": "3-star chef",
  "level.19": "Master craftsman",
  "level.20": "Gordon Ramsay",

  // ── language ──
  "language.changed": "Language changed to English 🇬🇧",

  // ── gemini ──
  "gemini.respond_in": "Respond in English",
};
