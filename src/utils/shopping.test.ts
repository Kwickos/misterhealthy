import { describe, it, expect } from "vitest";
import { aggregateShoppingList } from "./shopping.js";
import type { MenuData } from "../types.js";

describe("aggregateShoppingList", () => {
  it("aggregates ingredients across days and meals", () => {
    const menu: MenuData = {
      days: {
        lundi: {
          dejeuner: {
            name: "Poulet riz",
            prep_time: "20min",
            ingredients: [
              { name: "Filet de poulet", quantity: 200, unit: "g" },
              { name: "Riz complet", quantity: 150, unit: "g" },
            ],
            steps: ["Cuire"],
          },
        },
        mardi: {
          dejeuner: {
            name: "Poulet légumes",
            prep_time: "25min",
            ingredients: [
              { name: "Filet de poulet", quantity: 300, unit: "g" },
              { name: "Courgette", quantity: 2, unit: "pièce" },
            ],
            steps: ["Cuire"],
          },
        },
      },
    };

    const result = aggregateShoppingList(menu);
    const poulet = result.find((i) => i.name === "Filet de poulet");
    expect(poulet).toBeDefined();
    expect(poulet!.quantity).toBe(500);
    expect(poulet!.unit).toBe("g");
    expect(result).toHaveLength(3);
  });

  it("returns empty list for empty menu", () => {
    const menu: MenuData = { days: {} };
    expect(aggregateShoppingList(menu)).toEqual([]);
  });

  it("categorizes ingredients correctly", () => {
    const menu: MenuData = {
      days: {
        lundi: {
          dejeuner: {
            name: "Test",
            prep_time: "10min",
            ingredients: [
              { name: "Filet de poulet", quantity: 200, unit: "g" },
              { name: "Riz complet", quantity: 150, unit: "g" },
              { name: "Courgette", quantity: 2, unit: "pièce" },
              { name: "Yaourt grec", quantity: 200, unit: "g" },
            ],
            steps: ["Test"],
          },
        },
      },
    };

    const result = aggregateShoppingList(menu);
    expect(result.find((i) => i.name === "Filet de poulet")!.category).toBe("Viandes & Poissons");
    expect(result.find((i) => i.name === "Riz complet")!.category).toBe("Épicerie");
    expect(result.find((i) => i.name === "Courgette")!.category).toBe("Fruits & Légumes");
    expect(result.find((i) => i.name === "Yaourt grec")!.category).toBe("Produits laitiers");
  });
});
