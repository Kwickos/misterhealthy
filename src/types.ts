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
