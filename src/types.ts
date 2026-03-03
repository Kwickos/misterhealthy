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
  badges?: string[];
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

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  source: "predefined" | "generated";
  category: string;
  threshold: number | null;
  created_at: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  xp: number;
  level: number;
  current_streak: number;
  best_streak: number;
  total_meals: number;
  total_photos: number;
  total_batch: number;
  perfect_weeks: number;
  last_validation_date: string | null;
  created_at: string;
}

export interface MealValidation {
  id: string;
  user_id: string;
  menu_id: string;
  day_key: string;
  meal_key: string;
  photo_file_id: string | null;
  xp_earned: number;
  validated_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  meal_validation_id: string | null;
}

export interface ReminderSettings {
  id: string;
  user_id: string;
  petit_dej: string;
  dejeuner: string;
  snack: string;
  diner: string;
  streak_alert: string;
}
