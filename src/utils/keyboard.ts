import { InlineKeyboard, Keyboard } from "grammy";
import type { DayMenu, MenuData } from "../types.js";
import { t, dayLabel, mealLabel, type Locale } from "../i18n/index.js";

export function mainKeyboard(locale: Locale): Keyboard {
  return new Keyboard()
    .text(t(locale, "kb.generate_menu")).text(t(locale, "kb.my_menu"))
    .row()
    .text(t(locale, "kb.shopping_list")).text(t(locale, "kb.my_stats"))
    .row()
    .text(t(locale, "kb.my_profile"))
    .resized()
    .persistent();
}

export function daysKeyboard(locale: Locale, menu: MenuData): InlineKeyboard {
  const kb = new InlineKeyboard();
  const days = Object.keys(menu.days);
  for (let i = 0; i < days.length; i++) {
    kb.text(dayLabel(locale, days[i]), `day:${days[i]}`);
    if ((i + 1) % 4 === 0) kb.row();
  }
  if (menu.batch_cooking) {
    kb.row().text(t(locale, "kb.batch_cooking"), "batch:view");
  }
  kb.row().text(t(locale, "kb.delete_menu"), "menu:delete");
  return kb;
}

export function dayMealsKeyboard(locale: Locale, dayKey: string, dayMenu: DayMenu): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const mealKey of Object.keys(dayMenu)) {
    const label = mealLabel(locale, mealKey);
    kb.text(`📖 ${label}`, `recipe:${dayKey}:${mealKey}`);
    kb.text(`🥕 ${label}`, `ingredients:${dayKey}:${mealKey}`);
    kb.row();
  }
  kb.text(t(locale, "kb.back"), "back:menu");
  return kb;
}

export function recipeBackKeyboard(locale: Locale, dayKey: string): InlineKeyboard {
  return new InlineKeyboard().text(t(locale, "kb.back"), `day:${dayKey}`);
}

export function recipeStepKeyboard(
  locale: Locale,
  dayKey: string,
  mealKey: string,
  stepIndex: number,
  totalSteps: number,
): InlineKeyboard {
  const kb = new InlineKeyboard();
  if (stepIndex > 0) {
    kb.text(t(locale, "kb.previous"), `step:${dayKey}:${mealKey}:${stepIndex - 1}`);
  }
  if (stepIndex < totalSteps - 1) {
    kb.text(t(locale, "kb.next"), `step:${dayKey}:${mealKey}:${stepIndex + 1}`);
  }
  kb.row();
  kb.text(t(locale, "kb.all_steps"), `recipe_full:${dayKey}:${mealKey}`);
  kb.row();
  kb.text(t(locale, "kb.back"), `day:${dayKey}`);
  return kb;
}

export function generateMenuKeyboard(locale: Locale): InlineKeyboard {
  return new InlineKeyboard()
    .text(t(locale, "kb.generate"), "gen:confirm")
    .text(t(locale, "kb.edit_days"), "gen:days")
    .row()
    .text(t(locale, "kb.edit_instructions"), "gen:instructions");
}

export function onboardingGoalKeyboard(locale: Locale): InlineKeyboard {
  return new InlineKeyboard()
    .text(t(locale, "goal.perte_poids"), "goal:perte_poids")
    .text(t(locale, "goal.prise_masse"), "goal:prise_masse")
    .row()
    .text(t(locale, "goal.maintien"), "goal:maintien")
    .text(t(locale, "goal.manger_equilibre"), "goal:manger_equilibre")
    .row()
    .text(t(locale, "kb.cancel"), "conv:cancel");
}

export function onboardingServingsKeyboard(locale: Locale): InlineKeyboard {
  return new InlineKeyboard()
    .text("1", "servings:1")
    .text("2", "servings:2")
    .text("3", "servings:3")
    .text("4+", "servings:4")
    .row()
    .text(t(locale, "kb.cancel"), "conv:cancel");
}

export function onboardingMealsKeyboard(locale: Locale): InlineKeyboard {
  return new InlineKeyboard()
    .text(t(locale, "meal.petit_dej"), "meal:petit_dej")
    .text(t(locale, "meal.dejeuner"), "meal:dejeuner")
    .row()
    .text(t(locale, "meal.collation"), "meal:collation")
    .text(t(locale, "meal.diner"), "meal:diner")
    .row()
    .text(t(locale, "kb.validate"), "meals:done")
    .row()
    .text(t(locale, "kb.cancel"), "conv:cancel");
}

export function onboardingDaysKeyboard(locale: Locale): InlineKeyboard {
  const days = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  const kb = new InlineKeyboard();
  for (let i = 0; i < days.length; i++) {
    kb.text(dayLabel(locale, days[i]), `onb_day:${days[i]}`);
    if ((i + 1) % 4 === 0) kb.row();
  }
  kb.row().text(t(locale, "kb.validate"), "onb_days:done");
  kb.row().text(t(locale, "kb.cancel"), "conv:cancel");
  return kb;
}

export function onboardingBatchKeyboard(locale: Locale): InlineKeyboard {
  return new InlineKeyboard()
    .text(t(locale, "batch.yes"), "batch:true")
    .text(t(locale, "batch.no"), "batch:false")
    .row()
    .text(t(locale, "kb.cancel"), "conv:cancel");
}

export function onboardingRestrictionsKeyboard(locale: Locale): InlineKeyboard {
  return new InlineKeyboard()
    .text(t(locale, "restriction.vegetarien"), "restrict:vegetarien")
    .text(t(locale, "restriction.sans_gluten"), "restrict:sans_gluten")
    .row()
    .text(t(locale, "restriction.sans_lactose"), "restrict:sans_lactose")
    .text(t(locale, "restriction.aucune"), "restrict:aucune")
    .row()
    .text(t(locale, "kb.validate"), "restrictions:done")
    .row()
    .text(t(locale, "kb.cancel"), "conv:cancel");
}

export function onboardingEquipmentKeyboard(locale: Locale): InlineKeyboard {
  return new InlineKeyboard()
    .text(t(locale, "equipment.four"), "equip:four")
    .text(t(locale, "equipment.robot_cuisine"), "equip:robot_cuisine")
    .row()
    .text(t(locale, "equipment.airfryer"), "equip:airfryer")
    .text(t(locale, "equipment.micro_ondes"), "equip:micro_ondes")
    .row()
    .text(t(locale, "equipment.plaques"), "equip:plaques")
    .text(t(locale, "kb.validate"), "equipment:done");
}

export function languageKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🇫🇷 Français", "lang:fr")
    .text("🇬🇧 English", "lang:en");
}
