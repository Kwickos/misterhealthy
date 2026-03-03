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

export async function deleteMenu(menuId: string): Promise<void> {
  const { error } = await supabase
    .from("weekly_menus")
    .delete()
    .eq("id", menuId);
  if (error) throw error;
}
