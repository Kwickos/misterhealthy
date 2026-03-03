import type { MenuData, ShoppingItem, Meal } from "../types.js";

const CATEGORY_MAP: Record<string, string> = {
  poulet: "Viandes & Poissons",
  boeuf: "Viandes & Poissons",
  porc: "Viandes & Poissons",
  saumon: "Viandes & Poissons",
  thon: "Viandes & Poissons",
  crevette: "Viandes & Poissons",
  oeuf: "Produits laitiers",
  lait: "Produits laitiers",
  fromage: "Produits laitiers",
  yaourt: "Produits laitiers",
  crème: "Produits laitiers",
  beurre: "Produits laitiers",
  riz: "Épicerie",
  pâtes: "Épicerie",
  farine: "Épicerie",
  huile: "Épicerie",
  sucre: "Épicerie",
  sel: "Épicerie",
  lentille: "Épicerie",
  pois: "Épicerie",
  flocon: "Épicerie",
  avoine: "Épicerie",
};

function guessCategory(ingredientName: string): string {
  const lower = ingredientName.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(keyword)) return category;
  }
  return "Fruits & Légumes";
}

export function aggregateShoppingList(menu: MenuData): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>();

  for (const day of Object.values(menu.days)) {
    const meals = Object.values(day) as Meal[];
    for (const meal of meals) {
      for (const ing of meal.ingredients) {
        const key = `${ing.name.toLowerCase()}|${ing.unit.toLowerCase()}`;
        const existing = map.get(key);
        if (existing) {
          existing.quantity += ing.quantity;
        } else {
          map.set(key, {
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            category: guessCategory(ing.name),
          });
        }
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.category.localeCompare(b.category));
}
