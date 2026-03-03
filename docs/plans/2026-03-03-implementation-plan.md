# MisterHealthy Bot Telegram - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Telegram bot that generates personalized weekly meal plans with recipes and shopping lists, powered by Gemini AI and stored in Supabase.

**Architecture:** TypeScript bot using grammY framework with conversations plugin for onboarding. Gemini 3 Flash generates structured JSON menus. Supabase stores profiles and menus. Pure functions handle shopping list aggregation.

**Tech Stack:** TypeScript, grammY, @grammyjs/conversations, @google/genai, @supabase/supabase-js

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.env`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `src/config.ts`

**Step 1: Initialize project and install dependencies**

Run:
```bash
cd /Users/Alexandre/Projects/misterhealthy
npm init -y
npm install grammy @grammyjs/conversations @google/genai @supabase/supabase-js dotenv
npm install -D typescript @types/node tsx vitest
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "resolveJsonModule": true,
    "declaration": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create .env.example and .env**

`.env.example`:
```
TELEGRAM_BOT_TOKEN=
SUPABASE_URL=
SUPABASE_ANON_KEY=
GEMINI_API_KEY=
```

`.env` — copy and fill with real values.

**Step 4: Create .gitignore**

```
node_modules/
dist/
.env
```

**Step 5: Create src/config.ts**

```typescript
import "dotenv/config";

export const config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN!,
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY!,
  geminiApiKey: process.env.GEMINI_API_KEY!,
} as const;
```

**Step 6: Add scripts to package.json**

Add to `package.json`:
```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**Step 7: Commit**

```bash
git init
git add package.json tsconfig.json .env.example .gitignore src/config.ts
git commit -m "chore: scaffold project with dependencies"
```

---

### Task 2: Supabase database setup

**Files:**
- No local files — migrations via Supabase MCP

**Step 1: Create profiles table**

Apply migration `create_profiles` with SQL:
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  weight NUMERIC,
  height NUMERIC,
  age INTEGER,
  goal TEXT DEFAULT 'manger_equilibre',
  meals_config TEXT[] DEFAULT ARRAY['dejeuner', 'diner'],
  menu_days TEXT[] DEFAULT ARRAY['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'],
  servings INTEGER DEFAULT 2,
  batch_cooking BOOLEAN DEFAULT false,
  dietary_restrictions TEXT[] DEFAULT ARRAY[]::TEXT[],
  kitchen_equipment TEXT[] DEFAULT ARRAY['four', 'plaques'],
  extra_preferences TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Step 2: Create weekly_menus table**

Apply migration `create_weekly_menus` with SQL:
```sql
CREATE TABLE weekly_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  menu_data JSONB NOT NULL,
  extra_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_weekly_menus_profile ON weekly_menus(profile_id);
CREATE INDEX idx_weekly_menus_week ON weekly_menus(profile_id, week_start);
```

**Step 3: Create shopping_lists table**

Apply migration `create_shopping_lists` with SQL:
```sql
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES weekly_menus(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Step 4: Enable RLS and create policies**

Apply migration `enable_rls` with SQL:
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

-- Service role policies (bot uses service role key)
CREATE POLICY "Service role full access profiles" ON profiles FOR ALL USING (true);
CREATE POLICY "Service role full access weekly_menus" ON weekly_menus FOR ALL USING (true);
CREATE POLICY "Service role full access shopping_lists" ON shopping_lists FOR ALL USING (true);
```

---

### Task 3: Supabase client service

**Files:**
- Create: `src/services/supabase.ts`
- Create: `src/types.ts`

**Step 1: Create src/types.ts with all shared types**

```typescript
export interface Profile {
  id: string;
  telegram_id: number;
  username: string | null;
  weight: number | null;
  height: number | null;
  age: number | null;
  goal: string;
  meals_config: string[];
  menu_days: string[];
  servings: number;
  batch_cooking: boolean;
  dietary_restrictions: string[];
  kitchen_equipment: string[];
  extra_preferences: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Meal {
  name: string;
  prep_time: string;
  ingredients: Ingredient[];
  steps: string[];
}

export interface DayMenu {
  petit_dej?: Meal;
  dejeuner?: Meal;
  collation?: Meal;
  diner?: Meal;
}

export interface BatchCooking {
  day: string;
  preparations: { task: string; duration: string }[];
}

export interface MenuData {
  batch_cooking?: BatchCooking;
  days: Record<string, DayMenu>;
}

export interface WeeklyMenu {
  id: string;
  profile_id: string;
  week_start: string;
  menu_data: MenuData;
  extra_instructions: string | null;
  created_at: string;
}

export interface ShoppingItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

export interface ShoppingList {
  id: string;
  menu_id: string;
  items: ShoppingItem[];
  created_at: string;
}
```

**Step 2: Create src/services/supabase.ts**

```typescript
import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";
import type { Profile, WeeklyMenu, MenuData, ShoppingItem } from "../types.js";

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

export async function getProfile(telegramId: number): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("telegram_id", telegramId)
    .single();
  return data;
}

export async function upsertProfile(
  telegramId: number,
  fields: Partial<Omit<Profile, "id" | "telegram_id" | "created_at" | "updated_at">>
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      { telegram_id: telegramId, ...fields, updated_at: new Date().toISOString() },
      { onConflict: "telegram_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data!;
}

export async function saveMenu(
  profileId: string,
  weekStart: string,
  menuData: MenuData,
  extraInstructions?: string
): Promise<WeeklyMenu> {
  const { data, error } = await supabase
    .from("weekly_menus")
    .insert({
      profile_id: profileId,
      week_start: weekStart,
      menu_data: menuData,
      extra_instructions: extraInstructions ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data!;
}

export async function getLatestMenu(profileId: string): Promise<WeeklyMenu | null> {
  const { data } = await supabase
    .from("weekly_menus")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return data;
}

export async function saveShoppingList(
  menuId: string,
  items: ShoppingItem[]
): Promise<void> {
  const { error } = await supabase
    .from("shopping_lists")
    .upsert(
      { menu_id: menuId, items },
      { onConflict: "menu_id" }
    );
  if (error) throw error;
}

export async function getShoppingList(menuId: string): Promise<ShoppingItem[] | null> {
  const { data } = await supabase
    .from("shopping_lists")
    .select("items")
    .eq("menu_id", menuId)
    .single();
  return data?.items ?? null;
}
```

**Step 3: Commit**

```bash
git add src/types.ts src/services/supabase.ts
git commit -m "feat: add types and Supabase service layer"
```

---

### Task 4: Gemini AI service

**Files:**
- Create: `src/services/gemini.ts`

**Step 1: Create src/services/gemini.ts**

```typescript
import { GoogleGenAI } from "@google/genai";
import { config } from "../config.js";
import type { Profile, MenuData } from "../types.js";

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

const SYSTEM_PROMPT = `Tu es un nutritionniste et chef cuisinier expert. Tu génères des menus hebdomadaires personnalisés en JSON strictement structuré.

Règles obligatoires :
1. Adapter les calories et macronutriments au profil de l'utilisateur (poids, taille, âge, objectif)
2. Respecter strictement les restrictions alimentaires
3. N'utiliser QUE le matériel cuisine disponible dans le profil
4. TOUJOURS favoriser la réutilisation des ingrédients sur la semaine : si un ingrédient est acheté, l'utiliser dans au minimum 2-3 recettes
5. Minimiser le gaspillage : ne jamais demander une petite quantité d'un ingrédient périssable sans le réutiliser dans la semaine
6. Adapter les quantités au nombre de personnes indiqué
7. Recettes réalistes, accessibles, avec temps de préparation honnêtes
8. Si batch cooking activé : regrouper les préparations en une session (typiquement dimanche), préciser clairement quoi préparer à l'avance et comment les plats de la semaine réutilisent ces préparations
9. Varier les saveurs et textures sur la semaine
10. Ne générer QUE les jours et repas demandés
11. Répondre en français`;

function buildUserPrompt(profile: Profile, extraInstructions?: string): string {
  const lines = [
    `Profil utilisateur :`,
    `- Poids : ${profile.weight ?? "non renseigné"} kg`,
    `- Taille : ${profile.height ?? "non renseigné"} cm`,
    `- Âge : ${profile.age ?? "non renseigné"} ans`,
    `- Objectif : ${profile.goal}`,
    `- Nombre de personnes : ${profile.servings}`,
    `- Repas souhaités : ${profile.meals_config.join(", ")}`,
    `- Jours souhaités : ${profile.menu_days.join(", ")}`,
    `- Batch cooking : ${profile.batch_cooking ? "oui" : "non"}`,
    `- Restrictions alimentaires : ${profile.dietary_restrictions.length > 0 ? profile.dietary_restrictions.join(", ") : "aucune"}`,
    `- Équipement cuisine : ${profile.kitchen_equipment.join(", ")}`,
  ];
  if (profile.extra_preferences) {
    lines.push(`- Préférences supplémentaires : ${profile.extra_preferences}`);
  }
  if (extraInstructions) {
    lines.push(`\nInstructions spéciales pour cette semaine : ${extraInstructions}`);
  }
  lines.push(`\nGénère le menu de la semaine en JSON.`);
  return lines.join("\n");
}

function buildResponseSchema(profile: Profile) {
  const mealSchema = {
    type: "object" as const,
    properties: {
      name: { type: "string" as const },
      prep_time: { type: "string" as const },
      ingredients: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            name: { type: "string" as const },
            quantity: { type: "number" as const },
            unit: { type: "string" as const },
          },
          required: ["name", "quantity", "unit"],
        },
      },
      steps: { type: "array" as const, items: { type: "string" as const } },
    },
    required: ["name", "prep_time", "ingredients", "steps"],
  };

  const dayProperties: Record<string, typeof mealSchema> = {};
  for (const meal of profile.meals_config) {
    dayProperties[meal] = mealSchema;
  }

  const daysProperties: Record<string, object> = {};
  for (const day of profile.menu_days) {
    daysProperties[day] = {
      type: "object" as const,
      properties: dayProperties,
      required: profile.meals_config,
    };
  }

  const schema: Record<string, unknown> = {
    type: "object",
    properties: {
      days: {
        type: "object",
        properties: daysProperties,
        required: profile.menu_days,
      },
    },
    required: ["days"],
  };

  if (profile.batch_cooking) {
    (schema.properties as Record<string, unknown>).batch_cooking = {
      type: "object",
      properties: {
        day: { type: "string" },
        preparations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              task: { type: "string" },
              duration: { type: "string" },
            },
            required: ["task", "duration"],
          },
        },
      },
      required: ["day", "preparations"],
    };
    (schema.required as string[]).push("batch_cooking");
  }

  return schema;
}

export async function generateMenu(
  profile: Profile,
  extraInstructions?: string
): Promise<MenuData> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: buildUserPrompt(profile, extraInstructions),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: buildResponseSchema(profile),
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from Gemini");
  return JSON.parse(text) as MenuData;
}

export { buildUserPrompt, buildResponseSchema };
```

**Step 2: Commit**

```bash
git add src/services/gemini.ts
git commit -m "feat: add Gemini AI service with structured menu generation"
```

---

### Task 5: Shopping list aggregation (with tests)

**Files:**
- Create: `src/utils/shopping.ts`
- Create: `src/utils/shopping.test.ts`

**Step 1: Write the failing test**

Create `src/utils/shopping.test.ts`:
```typescript
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
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/shopping.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

Create `src/utils/shopping.ts`:
```typescript
import type { MenuData, ShoppingItem, DayMenu, Meal } from "../types.js";

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
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/shopping.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/shopping.ts src/utils/shopping.test.ts
git commit -m "feat: add shopping list aggregation with tests"
```

---

### Task 6: Formatting utilities

**Files:**
- Create: `src/utils/format.ts`

**Step 1: Create src/utils/format.ts**

```typescript
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

  if (menu.batch_cooking) {
    lines.push(`🍳 <b>Batch cooking (${menu.batch_cooking.day}) :</b>`);
    for (const prep of menu.batch_cooking.preparations) {
      lines.push(`  • ${prep.task} (${prep.duration})`);
    }
    lines.push("");
  }

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

export function formatIngredients(meal: Meal): string {
  const lines = [`🥕 <b>Ingrédients — ${meal.name}</b>\n`];
  for (const ing of meal.ingredients) {
    lines.push(`  • ${ing.quantity} ${ing.unit} de ${ing.name}`);
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
```

**Step 2: Commit**

```bash
git add src/utils/format.ts
git commit -m "feat: add Telegram message formatting utilities"
```

---

### Task 7: Keyboard helpers

**Files:**
- Create: `src/utils/keyboard.ts`

**Step 1: Create src/utils/keyboard.ts**

```typescript
import { InlineKeyboard, Keyboard } from "grammy";
import type { MenuData } from "../types.js";
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
  return kb;
}

export function dayMealsKeyboard(dayKey: string, dayMenu: Record<string, unknown>): InlineKeyboard {
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
```

**Step 2: Commit**

```bash
git add src/utils/keyboard.ts
git commit -m "feat: add keyboard helpers for Telegram UI"
```

---

### Task 8: Bot bootstrap and main keyboard

**Files:**
- Create: `src/bot.ts`
- Create: `src/index.ts`

**Step 1: Create src/bot.ts**

```typescript
import { Bot, type Context, session } from "grammy";
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import { config } from "./config.js";
import { mainKeyboard } from "./utils/keyboard.js";
import { onboarding } from "./modules/profile/onboarding.js";
import { handleProfile } from "./modules/profile/handlers.js";
import { handleGenerateMenu, handleMenuCallbacks } from "./modules/menu/handlers.js";
import { handleMyMenu } from "./modules/menu/display.js";
import { handleShoppingList } from "./modules/shopping/handlers.js";

export type BotContext = ConversationFlavor<Context>;
export type BotConversation = Conversation<BotContext>;

export const bot = new Bot<BotContext>(config.telegramBotToken);

// Session and conversations
bot.use(session({ initial: () => ({}) }));
bot.use(conversations());
bot.use(createConversation(onboarding));

// /start command
bot.command("start", async (ctx) => {
  const { getProfile } = await import("./services/supabase.js");
  const profile = await getProfile(ctx.from!.id);

  if (!profile) {
    await ctx.reply(
      "Bienvenue sur MisterHealthy ! 🥗\nJe vais t'aider à créer ton profil pour générer des menus personnalisés."
    );
    await ctx.conversation.enter("onboarding");
  } else {
    await ctx.reply(`Re-bonjour ${profile.username ?? ""}! Que veux-tu faire ?`, {
      reply_markup: mainKeyboard(),
      parse_mode: "HTML",
    });
  }
});

// Main menu button handlers
bot.hears("🍽 Générer menu", handleGenerateMenu);
bot.hears("📋 Mon menu", handleMyMenu);
bot.hears("🛒 Liste de courses", handleShoppingList);
bot.hears("👤 Mon profil", handleProfile);

// Callback query handlers for inline keyboards
bot.on("callback_query:data", handleMenuCallbacks);
```

**Step 2: Create src/index.ts**

```typescript
import { bot } from "./bot.js";

console.log("Starting MisterHealthy bot...");
bot.start({
  onStart: () => console.log("MisterHealthy bot is running!"),
});
```

**Step 3: Commit**

```bash
git add src/bot.ts src/index.ts
git commit -m "feat: add bot bootstrap with main keyboard routing"
```

---

### Task 9: Profile onboarding conversation

**Files:**
- Create: `src/modules/profile/onboarding.ts`

**Step 1: Create src/modules/profile/onboarding.ts**

```typescript
import type { BotConversation, BotContext } from "../../bot.js";
import { upsertProfile } from "../../services/supabase.js";
import { mainKeyboard } from "../../utils/keyboard.js";
import {
  onboardingGoalKeyboard,
  onboardingServingsKeyboard,
  onboardingMealsKeyboard,
  onboardingDaysKeyboard,
  onboardingBatchKeyboard,
  onboardingRestrictionsKeyboard,
  onboardingEquipmentKeyboard,
} from "../../utils/keyboard.js";

export async function onboarding(conversation: BotConversation, ctx: BotContext) {
  const telegramId = ctx.from!.id;

  // 1. Username
  await ctx.reply("Comment tu t'appelles ?");
  const nameCtx = await conversation.waitFor("message:text");
  const username = nameCtx.message.text;

  // 2. Goal
  await ctx.reply("Quel est ton objectif ?", { reply_markup: onboardingGoalKeyboard() });
  const goalCtx = await conversation.waitForCallbackQuery(/^goal:/);
  const goal = goalCtx.callbackQuery.data.replace("goal:", "");
  await goalCtx.answerCallbackQuery();

  // 3. Weight
  await ctx.reply("Ton poids en kg ? (ex: 75)");
  const weightCtx = await conversation.waitFor("message:text");
  const weight = parseFloat(weightCtx.message.text);

  // 4. Height
  await ctx.reply("Ta taille en cm ? (ex: 175)");
  const heightCtx = await conversation.waitFor("message:text");
  const height = parseFloat(heightCtx.message.text);

  // 5. Age
  await ctx.reply("Ton âge ?");
  const ageCtx = await conversation.waitFor("message:text");
  const age = parseInt(ageCtx.message.text);

  // 6. Servings
  await ctx.reply("Pour combien de personnes ?", { reply_markup: onboardingServingsKeyboard() });
  const servingsCtx = await conversation.waitForCallbackQuery(/^servings:/);
  const servings = parseInt(servingsCtx.callbackQuery.data.replace("servings:", ""));
  await servingsCtx.answerCallbackQuery();

  // 7. Meals config (multi-select)
  const selectedMeals: string[] = [];
  await ctx.reply("Quels repas veux-tu ? (clique puis Valider)", {
    reply_markup: onboardingMealsKeyboard(),
  });
  while (true) {
    const mealCtx = await conversation.waitForCallbackQuery(/^meal:|^meals:done/);
    const data = mealCtx.callbackQuery.data;
    if (data === "meals:done") {
      await mealCtx.answerCallbackQuery();
      break;
    }
    const meal = data.replace("meal:", "");
    if (selectedMeals.includes(meal)) {
      selectedMeals.splice(selectedMeals.indexOf(meal), 1);
      await mealCtx.answerCallbackQuery({ text: `${meal} retiré` });
    } else {
      selectedMeals.push(meal);
      await mealCtx.answerCallbackQuery({ text: `${meal} ajouté ✓` });
    }
  }

  // 8. Menu days (multi-select)
  const selectedDays: string[] = [];
  await ctx.reply("Quels jours ? (clique puis Valider)", {
    reply_markup: onboardingDaysKeyboard(),
  });
  while (true) {
    const dayCtx = await conversation.waitForCallbackQuery(/^onb_day:|^onb_days:done/);
    const data = dayCtx.callbackQuery.data;
    if (data === "onb_days:done") {
      await dayCtx.answerCallbackQuery();
      break;
    }
    const day = data.replace("onb_day:", "");
    if (selectedDays.includes(day)) {
      selectedDays.splice(selectedDays.indexOf(day), 1);
      await dayCtx.answerCallbackQuery({ text: `${day} retiré` });
    } else {
      selectedDays.push(day);
      await dayCtx.answerCallbackQuery({ text: `${day} ajouté ✓` });
    }
  }

  // 9. Batch cooking
  await ctx.reply("Tu veux faire du batch cooking ?", { reply_markup: onboardingBatchKeyboard() });
  const batchCtx = await conversation.waitForCallbackQuery(/^batch:/);
  const batchCooking = batchCtx.callbackQuery.data === "batch:true";
  await batchCtx.answerCallbackQuery();

  // 10. Dietary restrictions (multi-select)
  const restrictions: string[] = [];
  await ctx.reply("Restrictions alimentaires ? (clique puis Valider)", {
    reply_markup: onboardingRestrictionsKeyboard(),
  });
  while (true) {
    const rCtx = await conversation.waitForCallbackQuery(/^restrict:|^restrictions:done/);
    const data = rCtx.callbackQuery.data;
    if (data === "restrictions:done") {
      await rCtx.answerCallbackQuery();
      break;
    }
    const r = data.replace("restrict:", "");
    if (r === "aucune") {
      restrictions.length = 0;
      await rCtx.answerCallbackQuery({ text: "Aucune restriction" });
      break;
    }
    if (restrictions.includes(r)) {
      restrictions.splice(restrictions.indexOf(r), 1);
      await rCtx.answerCallbackQuery({ text: `${r} retiré` });
    } else {
      restrictions.push(r);
      await rCtx.answerCallbackQuery({ text: `${r} ajouté ✓` });
    }
  }

  // 11. Equipment (multi-select)
  const equipment: string[] = [];
  await ctx.reply("Quel équipement cuisine ? (clique puis Valider)", {
    reply_markup: onboardingEquipmentKeyboard(),
  });
  while (true) {
    const eCtx = await conversation.waitForCallbackQuery(/^equip:|^equipment:done/);
    const data = eCtx.callbackQuery.data;
    if (data === "equipment:done") {
      await eCtx.answerCallbackQuery();
      break;
    }
    const e = data.replace("equip:", "");
    if (equipment.includes(e)) {
      equipment.splice(equipment.indexOf(e), 1);
      await eCtx.answerCallbackQuery({ text: `${e} retiré` });
    } else {
      equipment.push(e);
      await eCtx.answerCallbackQuery({ text: `${e} ajouté ✓` });
    }
  }

  // 12. Extra preferences
  await ctx.reply("Autres précisions ? (ou envoie \"non\")");
  const extraCtx = await conversation.waitFor("message:text");
  const extra = extraCtx.message.text.toLowerCase() === "non" ? null : extraCtx.message.text;

  // Save profile
  await upsertProfile(telegramId, {
    username,
    weight,
    height,
    age,
    goal,
    meals_config: selectedMeals.length > 0 ? selectedMeals : ["dejeuner", "diner"],
    menu_days: selectedDays.length > 0 ? selectedDays : ["lundi", "mardi", "mercredi", "jeudi", "vendredi"],
    servings,
    batch_cooking: batchCooking,
    dietary_restrictions: restrictions,
    kitchen_equipment: equipment.length > 0 ? equipment : ["plaques"],
    extra_preferences: extra,
  });

  await ctx.reply(
    `Profil créé ${username} ! Tu peux maintenant générer ton premier menu.`,
    { reply_markup: mainKeyboard() }
  );
}
```

**Step 2: Commit**

```bash
git add src/modules/profile/onboarding.ts
git commit -m "feat: add onboarding conversation flow"
```

---

### Task 10: Profile view/edit handlers

**Files:**
- Create: `src/modules/profile/handlers.ts`

**Step 1: Create src/modules/profile/handlers.ts**

```typescript
import type { BotContext } from "../../bot.js";
import { getProfile } from "../../services/supabase.js";
import { mainKeyboard } from "../../utils/keyboard.js";
import { InlineKeyboard } from "grammy";

export async function handleProfile(ctx: BotContext) {
  const profile = await getProfile(ctx.from!.id);
  if (!profile) {
    await ctx.reply("Tu n'as pas encore de profil. Tape /start pour commencer.");
    return;
  }

  const goalLabels: Record<string, string> = {
    perte_poids: "Perte de poids",
    prise_masse: "Prise de masse",
    maintien: "Maintien",
    manger_equilibre: "Mieux manger",
  };

  const text = [
    `👤 <b>Mon profil</b>\n`,
    `Nom : ${profile.username ?? "-"}`,
    `Poids : ${profile.weight ?? "-"} kg`,
    `Taille : ${profile.height ?? "-"} cm`,
    `Âge : ${profile.age ?? "-"} ans`,
    `Objectif : ${goalLabels[profile.goal] ?? profile.goal}`,
    `Personnes : ${profile.servings}`,
    `Repas : ${profile.meals_config.join(", ")}`,
    `Jours : ${profile.menu_days.join(", ")}`,
    `Batch cooking : ${profile.batch_cooking ? "Oui" : "Non"}`,
    `Restrictions : ${profile.dietary_restrictions.length > 0 ? profile.dietary_restrictions.join(", ") : "Aucune"}`,
    `Équipement : ${profile.kitchen_equipment.join(", ")}`,
    profile.extra_preferences ? `Préférences : ${profile.extra_preferences}` : "",
  ].filter(Boolean).join("\n");

  const kb = new InlineKeyboard().text("✏️ Modifier mon profil", "profile:edit");

  await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
}
```

**Step 2: Commit**

```bash
git add src/modules/profile/handlers.ts
git commit -m "feat: add profile display handler"
```

---

### Task 11: Menu generation and display handlers

**Files:**
- Create: `src/modules/menu/handlers.ts`
- Create: `src/modules/menu/display.ts`

**Step 1: Create src/modules/menu/handlers.ts**

```typescript
import type { BotContext } from "../../bot.js";
import { getProfile, saveMenu, getLatestMenu, saveShoppingList } from "../../services/supabase.js";
import { generateMenu } from "../../services/gemini.js";
import { aggregateShoppingList } from "../../utils/shopping.js";
import { formatMenuOverview, formatDayDetail, formatRecipe, formatIngredients } from "../../utils/format.js";
import { daysKeyboard, dayMealsKeyboard, recipeBackKeyboard, mainKeyboard } from "../../utils/keyboard.js";
import type { MenuData, DayMenu, Meal } from "../../types.js";

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

export async function handleGenerateMenu(ctx: BotContext) {
  const profile = await getProfile(ctx.from!.id);
  if (!profile) {
    await ctx.reply("Tu n'as pas encore de profil. Tape /start pour commencer.");
    return;
  }

  await ctx.reply("⏳ Je génère ton menu personnalisé, ça peut prendre quelques secondes...", {
    reply_markup: mainKeyboard(),
  });

  try {
    const menuData = await generateMenu(profile);
    const weekStart = getWeekStart();

    const menu = await saveMenu(profile.id, weekStart, menuData);

    // Generate and save shopping list
    const items = aggregateShoppingList(menuData);
    await saveShoppingList(menu.id, items);

    const text = formatMenuOverview(menuData, weekStart);
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: daysKeyboard(menuData),
    });
  } catch (err) {
    console.error("Menu generation error:", err);
    await ctx.reply("Erreur lors de la génération du menu. Réessaie dans quelques instants.");
  }
}

export async function handleMenuCallbacks(ctx: BotContext) {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  const profile = await getProfile(ctx.from!.id);
  if (!profile) return;

  const menu = await getLatestMenu(profile.id);
  if (!menu) {
    await ctx.answerCallbackQuery({ text: "Aucun menu trouvé" });
    return;
  }

  const menuData = menu.menu_data as MenuData;

  // day:lundi -> show day detail
  if (data.startsWith("day:")) {
    const dayKey = data.replace("day:", "");
    const dayMenu = menuData.days[dayKey];
    if (!dayMenu) {
      await ctx.answerCallbackQuery({ text: "Jour non trouvé" });
      return;
    }
    const text = formatDayDetail(dayKey, dayMenu);
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: dayMealsKeyboard(dayKey, dayMenu),
    });
    return;
  }

  // recipe:lundi:dejeuner -> show recipe
  if (data.startsWith("recipe:")) {
    const [, dayKey, mealKey] = data.split(":");
    const meal = (menuData.days[dayKey] as Record<string, Meal>)?.[mealKey];
    if (!meal) {
      await ctx.answerCallbackQuery({ text: "Recette non trouvée" });
      return;
    }
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(formatRecipe(meal), {
      parse_mode: "HTML",
      reply_markup: recipeBackKeyboard(dayKey),
    });
    return;
  }

  // ingredients:lundi:dejeuner -> show ingredients
  if (data.startsWith("ingredients:")) {
    const [, dayKey, mealKey] = data.split(":");
    const meal = (menuData.days[dayKey] as Record<string, Meal>)?.[mealKey];
    if (!meal) {
      await ctx.answerCallbackQuery({ text: "Ingrédients non trouvés" });
      return;
    }
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(formatIngredients(meal), {
      parse_mode: "HTML",
      reply_markup: recipeBackKeyboard(dayKey),
    });
    return;
  }

  // back:menu -> show menu overview
  if (data === "back:menu") {
    const text = formatMenuOverview(menuData, menu.week_start);
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: daysKeyboard(menuData),
    });
    return;
  }

  // profile:edit -> re-enter onboarding
  if (data === "profile:edit") {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter("onboarding");
    return;
  }

  await ctx.answerCallbackQuery();
}
```

**Step 2: Create src/modules/menu/display.ts**

```typescript
import type { BotContext } from "../../bot.js";
import { getProfile, getLatestMenu } from "../../services/supabase.js";
import { formatMenuOverview } from "../../utils/format.js";
import { daysKeyboard, mainKeyboard } from "../../utils/keyboard.js";
import type { MenuData } from "../../types.js";

export async function handleMyMenu(ctx: BotContext) {
  const profile = await getProfile(ctx.from!.id);
  if (!profile) {
    await ctx.reply("Tu n'as pas encore de profil. Tape /start pour commencer.");
    return;
  }

  const menu = await getLatestMenu(profile.id);
  if (!menu) {
    await ctx.reply("Tu n'as pas encore de menu. Clique sur \"🍽 Générer menu\" pour en créer un !", {
      reply_markup: mainKeyboard(),
    });
    return;
  }

  const menuData = menu.menu_data as MenuData;
  const text = formatMenuOverview(menuData, menu.week_start);
  await ctx.reply(text, {
    parse_mode: "HTML",
    reply_markup: daysKeyboard(menuData),
  });
}
```

**Step 3: Commit**

```bash
git add src/modules/menu/handlers.ts src/modules/menu/display.ts
git commit -m "feat: add menu generation, display and navigation handlers"
```

---

### Task 12: Shopping list handler

**Files:**
- Create: `src/modules/shopping/handlers.ts`

**Step 1: Create src/modules/shopping/handlers.ts**

```typescript
import type { BotContext } from "../../bot.js";
import { getProfile, getLatestMenu, getShoppingList } from "../../services/supabase.js";
import { formatShoppingList } from "../../utils/format.js";
import { mainKeyboard } from "../../utils/keyboard.js";

export async function handleShoppingList(ctx: BotContext) {
  const profile = await getProfile(ctx.from!.id);
  if (!profile) {
    await ctx.reply("Tu n'as pas encore de profil. Tape /start pour commencer.");
    return;
  }

  const menu = await getLatestMenu(profile.id);
  if (!menu) {
    await ctx.reply("Tu n'as pas encore de menu. Génère-en un d'abord !", {
      reply_markup: mainKeyboard(),
    });
    return;
  }

  const items = await getShoppingList(menu.id);
  if (!items || items.length === 0) {
    await ctx.reply("Liste de courses vide.", { reply_markup: mainKeyboard() });
    return;
  }

  const text = formatShoppingList(items, menu.week_start);
  await ctx.reply(text, { parse_mode: "HTML", reply_markup: mainKeyboard() });
}
```

**Step 2: Commit**

```bash
git add src/modules/shopping/handlers.ts
git commit -m "feat: add shopping list handler"
```

---

### Task 13: Create necessary directories and verify build

**Step 1: Create all directories**

```bash
mkdir -p src/modules/profile src/modules/menu src/modules/shopping src/utils src/services
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Run tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 4: Test bot starts**

Run: `npm run dev`
Expected: "MisterHealthy bot is running!" in console (then Ctrl+C)

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: MisterHealthy bot v1 complete"
```
