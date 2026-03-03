import type { MenuData, DayMenu, Meal, ShoppingItem } from "../types.js";

const MEAL_LABELS: Record<string, string> = {
  petit_dej: "🌅 Petit-déj",
  dejeuner: "🍽 Déjeuner",
  collation: "🍰 Collation",
  diner: "🌙 Dîner",
};

const DAY_LABELS: Record<string, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
  dimanche: "Dimanche",
};

export function formatMenuOverview(menu: MenuData, weekStart: string): string {
  const lines = [`📅 <b>Menu semaine du ${weekStart}</b>\n`];

  for (const [dayKey, dayMenu] of Object.entries(menu.days)) {
    lines.push(`<b>${DAY_LABELS[dayKey] ?? dayKey}</b>`);
    for (const [mealKey, meal] of Object.entries(dayMenu)) {
      const m = meal as Meal;
      lines.push(`  ${MEAL_LABELS[mealKey] ?? mealKey} : ${m.name}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function formatDayDetail(dayKey: string, dayMenu: DayMenu): string {
  const lines = [`📅 <b>${DAY_LABELS[dayKey] ?? dayKey}</b>\n`];
  for (const [mealKey, meal] of Object.entries(dayMenu)) {
    const m = meal as Meal;
    lines.push(`${MEAL_LABELS[mealKey] ?? mealKey} : ${m.name}`);
  }
  return lines.join("\n");
}

export function formatRecipe(meal: Meal): string {
  const lines = [
    `🍳 <b>${meal.name}</b>`,
    `⏱ Préparation : ${meal.prep_time}\n`,
  ];
  meal.steps.forEach((step, i) => {
    lines.push(`${i + 1}. ${step}`);
  });
  return lines.join("\n");
}

export function formatRecipeStep(meal: Meal, stepIndex: number): string {
  const total = meal.steps.length;
  const lines = [
    `🍳 <b>${meal.name}</b>`,
    `⏱ ${meal.prep_time}\n`,
    `<b>Étape ${stepIndex + 1}/${total}</b>\n`,
    meal.steps[stepIndex],
  ];
  return lines.join("\n");
}

export function formatIngredients(meal: Meal): string {
  const lines = [`🥕 <b>Ingrédients — ${meal.name}</b>\n`];
  for (const ing of meal.ingredients) {
    lines.push(`  • ${ing.quantity} ${ing.unit} de ${ing.name}`);
  }
  return lines.join("\n");
}

export function formatBatchCooking(menu: MenuData): string {
  if (!menu.batch_cooking) return "";
  const lines = [`🍳 <b>Batch cooking — ${menu.batch_cooking.day}</b>\n`];
  for (const prep of menu.batch_cooking.preparations) {
    lines.push(`  • ${prep.task} <i>(${prep.duration})</i>`);
  }
  return lines.join("\n");
}

export function formatShoppingList(items: ShoppingItem[], weekStart: string): string {
  const lines = [`🛒 <b>Liste de courses — Semaine du ${weekStart}</b>\n`];
  const byCategory = new Map<string, ShoppingItem[]>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }
  for (const [category, catItems] of byCategory) {
    lines.push(`<b>${category} :</b>`);
    for (const item of catItems) {
      lines.push(`  • ${item.quantity} ${item.unit} — ${item.name}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export { DAY_LABELS, MEAL_LABELS };
