import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";
import type {
  Profile,
  WeeklyMenu,
  MenuData,
  ShoppingItem,
  UserStats,
  MealValidation,
  UserBadge,
  BadgeDefinition,
  ReminderSettings,
} from "../types.js";

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
  // Delete previous menus (and their shopping lists via cascade)
  await supabase
    .from("weekly_menus")
    .delete()
    .eq("profile_id", profileId);

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

export async function deleteMenu(menuId: string): Promise<void> {
  const { error } = await supabase
    .from("weekly_menus")
    .delete()
    .eq("id", menuId);
  if (error) throw error;
}

// ── Gamification ─────────────────────────────────────────────────────

export async function getOrCreateUserStats(userId: string): Promise<UserStats> {
  const { data } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (data) return data;

  const { data: created, error } = await supabase
    .from("user_stats")
    .insert({ user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return created!;
}

export async function updateUserStats(
  userId: string,
  fields: Partial<Omit<UserStats, "id" | "user_id" | "created_at">>
): Promise<void> {
  const { error } = await supabase
    .from("user_stats")
    .update(fields)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function createMealValidation(data: {
  user_id: string;
  menu_id: string;
  day_key: string;
  meal_key: string;
  photo_file_id?: string;
  xp_earned: number;
}): Promise<MealValidation> {
  const { data: created, error } = await supabase
    .from("meal_validations")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return created!;
}

export async function getUserBadges(
  userId: string
): Promise<(UserBadge & { badge: BadgeDefinition })[]> {
  const { data, error } = await supabase
    .from("user_badges")
    .select("*, badge:badge_definitions(*)")
    .eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}

export async function awardBadge(
  userId: string,
  badgeId: string,
  mealValidationId?: string
): Promise<UserBadge | null> {
  const { data, error } = await supabase
    .from("user_badges")
    .upsert(
      {
        user_id: userId,
        badge_id: badgeId,
        meal_validation_id: mealValidationId ?? null,
      },
      { onConflict: "user_id,badge_id", ignoreDuplicates: true }
    )
    .select()
    .single();

  // If the row already existed, ignoreDuplicates means nothing is returned
  if (error && error.code === "PGRST116") return null;
  if (error) throw error;
  return data ?? null;
}

export async function getAllBadgeDefinitions(): Promise<BadgeDefinition[]> {
  const { data, error } = await supabase
    .from("badge_definitions")
    .select("*");
  if (error) throw error;
  return data ?? [];
}

export async function getContextualBadgeNames(): Promise<string[]> {
  const { data, error } = await supabase
    .from("badge_definitions")
    .select("name")
    .is("threshold", null);
  if (error) throw error;
  return (data ?? []).map((row) => row.name);
}

export async function saveBadgeDefinition(
  name: string,
  description: string,
  emoji: string
): Promise<BadgeDefinition> {
  const { data, error } = await supabase
    .from("badge_definitions")
    .insert({ name, description, emoji, source: "generated", category: "generated" })
    .select()
    .single();
  if (error) throw error;
  return data!;
}

export async function getReminderSettings(
  userId: string
): Promise<ReminderSettings> {
  const { data } = await supabase
    .from("reminder_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (data) return data;

  const { data: created, error } = await supabase
    .from("reminder_settings")
    .insert({ user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return created!;
}

export async function updateReminderSettings(
  userId: string,
  fields: Partial<Omit<ReminderSettings, "id" | "user_id">>
): Promise<void> {
  const { error } = await supabase
    .from("reminder_settings")
    .update(fields)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function getUsersWithActiveMenus(): Promise<
  { profile: Profile; menu: WeeklyMenu; reminders: ReminderSettings }[]
> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: menus, error } = await supabase
    .from("weekly_menus")
    .select("*, profile:profiles(*)")
    .lte("week_start", today);
  if (error) throw error;
  if (!menus || menus.length === 0) return [];

  const results: { profile: Profile; menu: WeeklyMenu; reminders: ReminderSettings }[] = [];
  for (const row of menus) {
    const profile = row.profile as unknown as Profile;
    const menu: WeeklyMenu = {
      id: row.id,
      profile_id: row.profile_id,
      week_start: row.week_start,
      menu_data: row.menu_data,
      extra_instructions: row.extra_instructions,
      created_at: row.created_at,
    };
    const reminders = await getReminderSettings(profile.id);
    results.push({ profile, menu, reminders });
  }
  return results;
}

export async function getTodayValidations(
  userId: string
): Promise<MealValidation[]> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const { data, error } = await supabase
    .from("meal_validations")
    .select("*")
    .eq("user_id", userId)
    .gte("validated_at", todayStart.toISOString())
    .lt("validated_at", tomorrowStart.toISOString());
  if (error) throw error;
  return data ?? [];
}

export async function getBadgeByName(
  name: string
): Promise<BadgeDefinition | null> {
  const { data } = await supabase
    .from("badge_definitions")
    .select("*")
    .eq("name", name)
    .single();
  return data ?? null;
}
