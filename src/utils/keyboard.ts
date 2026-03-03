import { InlineKeyboard, Keyboard } from "grammy";
import type { DayMenu, MenuData } from "../types.js";
import { DAY_LABELS, MEAL_LABELS } from "./format.js";

export function mainKeyboard(): Keyboard {
  return new Keyboard()
    .text("🍽 Générer menu").text("📋 Mon menu")
    .row()
    .text("🛒 Liste de courses").text("👤 Mon profil")
    .resized()
    .persistent();
}

export function daysKeyboard(menu: MenuData): InlineKeyboard {
  const kb = new InlineKeyboard();
  const days = Object.keys(menu.days);
  for (let i = 0; i < days.length; i++) {
    kb.text(DAY_LABELS[days[i]] ?? days[i], `day:${days[i]}`);
    if ((i + 1) % 4 === 0) kb.row();
  }
  kb.row().text("🗑 Supprimer ce menu", "menu:delete");
  return kb;
}

export function dayMealsKeyboard(dayKey: string, dayMenu: DayMenu): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const mealKey of Object.keys(dayMenu)) {
    const label = MEAL_LABELS[mealKey] ?? mealKey;
    kb.text(`📖 ${label}`, `recipe:${dayKey}:${mealKey}`);
    kb.text(`🥕 ${label}`, `ingredients:${dayKey}:${mealKey}`);
    kb.row();
  }
  kb.text("⬅️ Retour", "back:menu");
  return kb;
}

export function recipeBackKeyboard(dayKey: string): InlineKeyboard {
  return new InlineKeyboard().text("⬅️ Retour", `day:${dayKey}`);
}

export function generateMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("✅ Générer", "gen:confirm")
    .text("📅 Modifier les jours", "gen:days")
    .row()
    .text("✏️ Précisions", "gen:instructions");
}

export function onboardingGoalKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("Perte de poids", "goal:perte_poids")
    .text("Prise de masse", "goal:prise_masse")
    .row()
    .text("Maintien", "goal:maintien")
    .text("Mieux manger", "goal:manger_equilibre");
}

export function onboardingServingsKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("1", "servings:1")
    .text("2", "servings:2")
    .text("3", "servings:3")
    .text("4+", "servings:4");
}

export function onboardingMealsKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🌅 Petit-déj", "meal:petit_dej")
    .text("🍽 Déjeuner", "meal:dejeuner")
    .row()
    .text("🍰 Collation", "meal:collation")
    .text("🌙 Dîner", "meal:diner")
    .row()
    .text("✅ Valider", "meals:done");
}

export function onboardingDaysKeyboard(): InlineKeyboard {
  const days = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  const kb = new InlineKeyboard();
  for (let i = 0; i < days.length; i++) {
    kb.text(DAY_LABELS[days[i]], `onb_day:${days[i]}`);
    if ((i + 1) % 4 === 0) kb.row();
  }
  kb.row().text("✅ Valider", "onb_days:done");
  return kb;
}

export function onboardingBatchKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("Oui", "batch:true")
    .text("Non", "batch:false");
}

export function onboardingRestrictionsKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("Végétarien", "restrict:vegetarien")
    .text("Sans gluten", "restrict:sans_gluten")
    .row()
    .text("Sans lactose", "restrict:sans_lactose")
    .text("Aucune", "restrict:aucune")
    .row()
    .text("✅ Valider", "restrictions:done");
}

export function onboardingEquipmentKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("Four", "equip:four")
    .text("Robot cuisine", "equip:robot_cuisine")
    .row()
    .text("Airfryer", "equip:airfryer")
    .text("Micro-ondes", "equip:micro_ondes")
    .row()
    .text("Plaques seules", "equip:plaques")
    .text("✅ Valider", "equipment:done");
}
