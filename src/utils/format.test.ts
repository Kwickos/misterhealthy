import { describe, it, expect } from "vitest";
import {
  formatMenuOverview,
  formatDayDetail,
  formatRecipe,
  formatRecipeStep,
  formatIngredients,
  formatBatchCooking,
} from "./format.js";
import type { Meal, MenuData, DayMenu } from "../types.js";

const mockMeal: Meal = {
  name: "Poulet rôti",
  prep_time: "45 min",
  ingredients: [
    { name: "poulet", quantity: 1, unit: "pièce" },
    { name: "pommes de terre", quantity: 500, unit: "g" },
  ],
  steps: ["Préchauffer le four à 200°C", "Assaisonner le poulet", "Enfourner 45 min"],
};

const mockMealSimple: Meal = {
  name: "Salade verte",
  prep_time: "10 min",
  ingredients: [
    { name: "salade", quantity: 1, unit: "pièce" },
    { name: "vinaigrette", quantity: 2, unit: "cuillères" },
  ],
  steps: ["Laver la salade", "Assaisonner"],
};

const mockMenuData: MenuData = {
  days: {
    lundi: {
      dejeuner: mockMeal,
      diner: mockMealSimple,
    },
    mardi: {
      petit_dej: {
        name: "Porridge",
        prep_time: "15 min",
        ingredients: [
          { name: "flocons d'avoine", quantity: 80, unit: "g" },
          { name: "lait", quantity: 200, unit: "ml" },
        ],
        steps: ["Faire chauffer le lait", "Ajouter les flocons", "Remuer 5 min"],
      },
    },
  },
};

describe("formatMenuOverview", () => {
  it("returns HTML with the week start date in the header", () => {
    const result = formatMenuOverview(mockMenuData, "3 mars");
    expect(result).toContain("<b>Menu semaine du 3 mars</b>");
  });

  it("includes day labels for each day in the menu", () => {
    const result = formatMenuOverview(mockMenuData, "3 mars");
    expect(result).toContain("<b>Lundi</b>");
    expect(result).toContain("<b>Mardi</b>");
  });

  it("includes meal labels and meal names", () => {
    const result = formatMenuOverview(mockMenuData, "3 mars");
    expect(result).toContain("🍽 Déjeuner : Poulet rôti");
    expect(result).toContain("🌙 Dîner : Salade verte");
    expect(result).toContain("🌅 Petit-déj : Porridge");
  });

  it("uses raw day key when no label is defined", () => {
    const menu: MenuData = {
      days: {
        custom_day: {
          dejeuner: mockMeal,
        },
      },
    };
    const result = formatMenuOverview(menu, "3 mars");
    expect(result).toContain("<b>custom_day</b>");
  });

  it("uses raw meal key when no label is defined", () => {
    const menu: MenuData = {
      days: {
        lundi: {
          custom_meal: mockMeal,
        } as unknown as DayMenu,
      },
    };
    const result = formatMenuOverview(menu, "3 mars");
    expect(result).toContain("custom_meal : Poulet rôti");
  });

  it("returns correct output for empty menu", () => {
    const menu: MenuData = { days: {} };
    const result = formatMenuOverview(menu, "3 mars");
    expect(result).toContain("<b>Menu semaine du 3 mars</b>");
    expect(result).not.toContain("<b>Lundi</b>");
  });
});

describe("formatDayDetail", () => {
  it("returns HTML with the correct day label", () => {
    const dayMenu: DayMenu = { dejeuner: mockMeal };
    const result = formatDayDetail("lundi", dayMenu);
    expect(result).toContain("<b>Lundi</b>");
  });

  it("lists all meals for the day", () => {
    const dayMenu: DayMenu = { dejeuner: mockMeal, diner: mockMealSimple };
    const result = formatDayDetail("lundi", dayMenu);
    expect(result).toContain("🍽 Déjeuner : Poulet rôti");
    expect(result).toContain("🌙 Dîner : Salade verte");
  });

  it("uses raw day key for unknown days", () => {
    const dayMenu: DayMenu = { dejeuner: mockMeal };
    const result = formatDayDetail("jour_special", dayMenu);
    expect(result).toContain("<b>jour_special</b>");
  });

  it("handles a day with a single meal", () => {
    const dayMenu: DayMenu = { petit_dej: mockMealSimple };
    const result = formatDayDetail("samedi", dayMenu);
    expect(result).toContain("<b>Samedi</b>");
    expect(result).toContain("🌅 Petit-déj : Salade verte");
  });
});

describe("formatRecipe", () => {
  it("includes the meal name in bold", () => {
    const result = formatRecipe(mockMeal);
    expect(result).toContain("<b>Poulet rôti</b>");
  });

  it("includes the prep time", () => {
    const result = formatRecipe(mockMeal);
    expect(result).toContain("⏱ Préparation : 45 min");
  });

  it("includes all steps numbered starting at 1", () => {
    const result = formatRecipe(mockMeal);
    expect(result).toContain("1. Préchauffer le four à 200°C");
    expect(result).toContain("2. Assaisonner le poulet");
    expect(result).toContain("3. Enfourner 45 min");
  });

  it("handles a recipe with a single step", () => {
    const singleStepMeal: Meal = {
      name: "Toast",
      prep_time: "2 min",
      ingredients: [{ name: "pain", quantity: 2, unit: "tranches" }],
      steps: ["Griller le pain"],
    };
    const result = formatRecipe(singleStepMeal);
    expect(result).toContain("1. Griller le pain");
    expect(result).not.toContain("2.");
  });
});

describe("formatRecipeStep", () => {
  it("shows correct step number and total", () => {
    const result = formatRecipeStep(mockMeal, 0);
    expect(result).toContain("<b>Étape 1/3</b>");
  });

  it("shows the correct step content for step 0", () => {
    const result = formatRecipeStep(mockMeal, 0);
    expect(result).toContain("Préchauffer le four à 200°C");
  });

  it("shows the correct step content for step 1", () => {
    const result = formatRecipeStep(mockMeal, 1);
    expect(result).toContain("<b>Étape 2/3</b>");
    expect(result).toContain("Assaisonner le poulet");
  });

  it("shows the correct step content for the last step", () => {
    const result = formatRecipeStep(mockMeal, 2);
    expect(result).toContain("<b>Étape 3/3</b>");
    expect(result).toContain("Enfourner 45 min");
  });

  it("includes the meal name", () => {
    const result = formatRecipeStep(mockMeal, 0);
    expect(result).toContain("<b>Poulet rôti</b>");
  });

  it("includes the prep time", () => {
    const result = formatRecipeStep(mockMeal, 0);
    expect(result).toContain("45 min");
  });
});

describe("formatIngredients", () => {
  it("includes the meal name in the header", () => {
    const result = formatIngredients(mockMeal);
    expect(result).toContain("<b>Ingrédients — Poulet rôti</b>");
  });

  it("lists all ingredients with quantities and units", () => {
    const result = formatIngredients(mockMeal);
    expect(result).toContain("• 1 pièce de poulet");
    expect(result).toContain("• 500 g de pommes de terre");
  });

  it("handles a meal with a single ingredient", () => {
    const meal: Meal = {
      name: "Eau citronnée",
      prep_time: "1 min",
      ingredients: [{ name: "citron", quantity: 1, unit: "pièce" }],
      steps: ["Presser le citron dans l'eau"],
    };
    const result = formatIngredients(meal);
    expect(result).toContain("• 1 pièce de citron");
    // Should only have one bullet
    const bulletCount = (result.match(/•/g) || []).length;
    expect(bulletCount).toBe(1);
  });
});

describe("formatBatchCooking", () => {
  it("returns empty string when no batch_cooking", () => {
    const menu: MenuData = { days: {} };
    expect(formatBatchCooking(menu)).toBe("");
  });

  it("returns empty string when batch_cooking is undefined", () => {
    const menu: MenuData = { days: {}, batch_cooking: undefined };
    expect(formatBatchCooking(menu)).toBe("");
  });

  it("formats batch cooking day in the header", () => {
    const menu: MenuData = {
      days: {},
      batch_cooking: {
        day: "Dimanche",
        preparations: [{ task: "Cuire le riz", duration: "20 min" }],
      },
    };
    const result = formatBatchCooking(menu);
    expect(result).toContain("<b>Batch cooking — Dimanche</b>");
  });

  it("lists all preparations with tasks and durations", () => {
    const menu: MenuData = {
      days: {},
      batch_cooking: {
        day: "Dimanche",
        preparations: [
          { task: "Cuire le riz", duration: "20 min" },
          { task: "Préparer la sauce", duration: "15 min" },
          { task: "Couper les légumes", duration: "10 min" },
        ],
      },
    };
    const result = formatBatchCooking(menu);
    expect(result).toContain("• Cuire le riz <i>(20 min)</i>");
    expect(result).toContain("• Préparer la sauce <i>(15 min)</i>");
    expect(result).toContain("• Couper les légumes <i>(10 min)</i>");
  });

  it("handles a single preparation", () => {
    const menu: MenuData = {
      days: {},
      batch_cooking: {
        day: "Samedi",
        preparations: [{ task: "Faire mariner le poulet", duration: "5 min" }],
      },
    };
    const result = formatBatchCooking(menu);
    expect(result).toContain("• Faire mariner le poulet <i>(5 min)</i>");
    const bulletCount = (result.match(/•/g) || []).length;
    expect(bulletCount).toBe(1);
  });
});
