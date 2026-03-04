import type { MenuData, DayMenu, Meal, ShoppingItem } from "../types.js";
import { t, mealLabel, dayLabel, type Locale } from "../i18n/index.js";

export function getMealLabel(locale: Locale, key: string): string {
  return mealLabel(locale, key);
}

export function getDayLabel(locale: Locale, key: string): string {
  return dayLabel(locale, key);
}

export function formatMenuOverview(locale: Locale, menu: MenuData, weekStart: string): string {
  const lines = [t(locale, "format.menu_week", { weekStart })];

  for (const [dayKey, dayMenu] of Object.entries(menu.days)) {
    lines.push(`<b>${dayLabel(locale, dayKey)}</b>`);
    for (const [mealKey, meal] of Object.entries(dayMenu)) {
      const m = meal as Meal;
      lines.push(`  ${mealLabel(locale, mealKey)} : ${m.name}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function formatDayDetail(locale: Locale, dayKey: string, dayMenu: DayMenu): string {
  const lines = [`📅 <b>${dayLabel(locale, dayKey)}</b>\n`];
  for (const [mealKey, meal] of Object.entries(dayMenu)) {
    const m = meal as Meal;
    lines.push(`${mealLabel(locale, mealKey)} : ${m.name}`);
  }
  return lines.join("\n");
}

export function formatRecipe(meal: Meal): string {
  const lines = [
    `🍳 <b>${meal.name}</b>`,
    `⏱ ${meal.prep_time}\n`,
  ];
  meal.steps.forEach((step, i) => {
    lines.push(`${i + 1}. ${step}`);
  });
  return lines.join("\n");
}

export function formatRecipeStep(locale: Locale, meal: Meal, stepIndex: number): string {
  const total = meal.steps.length;
  const lines = [
    `🍳 <b>${meal.name}</b>`,
    `⏱ ${meal.prep_time}\n`,
    t(locale, "format.step", { current: stepIndex + 1, total }),
    meal.steps[stepIndex],
  ];
  return lines.join("\n");
}

export function formatIngredients(locale: Locale, meal: Meal): string {
  const lines = [t(locale, "format.ingredients_title", { name: meal.name })];
  for (const ing of meal.ingredients) {
    lines.push(`  ${t(locale, "format.ingredient_line", { quantity: ing.quantity, unit: ing.unit, name: ing.name })}`);
  }
  return lines.join("\n");
}

export function formatBatchCooking(locale: Locale, menu: MenuData): string {
  if (!menu.batch_cooking) return "";
  const lines = [t(locale, "format.batch_title", { day: menu.batch_cooking.day })];
  for (const prep of menu.batch_cooking.preparations) {
    lines.push(`  ${t(locale, "format.batch_line", { task: prep.task, duration: prep.duration })}`);
  }
  return lines.join("\n");
}

export function formatShoppingList(locale: Locale, items: ShoppingItem[], weekStart: string): string {
  const lines = [t(locale, "format.shopping_title", { weekStart })];
  const byCategory = new Map<string, ShoppingItem[]>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }
  for (const [category, catItems] of byCategory) {
    lines.push(t(locale, "format.shopping_category", { category }));
    for (const item of catItems) {
      lines.push(`  ${t(locale, "format.shopping_item", { quantity: item.quantity, unit: item.unit, name: item.name })}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
