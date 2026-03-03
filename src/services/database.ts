import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { BADGE_SEEDS } from "./badge-seeds.js";
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

// ── Init ────────────────────────────────────────────────────────────

mkdirSync(dirname(config.databasePath), { recursive: true });

const db = new Database(config.databasePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Schema ──────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    telegram_id INTEGER UNIQUE NOT NULL,
    username TEXT,
    weight REAL,
    height REAL,
    age INTEGER,
    goal TEXT NOT NULL DEFAULT 'maintien',
    meals_config TEXT NOT NULL DEFAULT '["dejeuner","diner"]',
    menu_days TEXT NOT NULL DEFAULT '["lundi","mardi","mercredi","jeudi","vendredi"]',
    servings INTEGER NOT NULL DEFAULT 2,
    batch_cooking INTEGER NOT NULL DEFAULT 0,
    dietary_restrictions TEXT NOT NULL DEFAULT '[]',
    kitchen_equipment TEXT NOT NULL DEFAULT '[]',
    extra_preferences TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS weekly_menus (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    week_start TEXT NOT NULL,
    menu_data TEXT NOT NULL,
    extra_instructions TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS shopping_lists (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    menu_id TEXT UNIQUE NOT NULL REFERENCES weekly_menus(id) ON DELETE CASCADE,
    items TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_stats (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    current_streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    total_meals INTEGER NOT NULL DEFAULT 0,
    total_photos INTEGER NOT NULL DEFAULT 0,
    total_batch INTEGER NOT NULL DEFAULT 0,
    perfect_weeks INTEGER NOT NULL DEFAULT 0,
    last_validation_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS meal_validations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    menu_id TEXT NOT NULL REFERENCES weekly_menus(id) ON DELETE CASCADE,
    day_key TEXT NOT NULL,
    meal_key TEXT NOT NULL,
    photo_file_id TEXT,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    validated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS badge_definitions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    emoji TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'predefined',
    category TEXT NOT NULL DEFAULT 'general',
    threshold INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_badges (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
    earned_at TEXT NOT NULL DEFAULT (datetime('now')),
    meal_validation_id TEXT REFERENCES meal_validations(id),
    UNIQUE(user_id, badge_id)
  );

  CREATE TABLE IF NOT EXISTS reminder_settings (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    petit_dej TEXT NOT NULL DEFAULT '08:00',
    dejeuner TEXT NOT NULL DEFAULT '12:00',
    snack TEXT NOT NULL DEFAULT '16:00',
    diner TEXT NOT NULL DEFAULT '19:30',
    streak_alert TEXT NOT NULL DEFAULT '21:00'
  );
`);

// ── Seed badges ─────────────────────────────────────────────────────

const insertBadge = db.prepare(`
  INSERT OR IGNORE INTO badge_definitions (id, name, description, emoji, source, category, threshold)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const seedBadges = db.transaction(() => {
  for (const b of BADGE_SEEDS) {
    insertBadge.run(randomUUID(), b.name, b.description, b.emoji, b.source, b.category, b.threshold);
  }
});
seedBadges();

// ── Helpers ─────────────────────────────────────────────────────────

function parseProfile(row: Record<string, unknown>): Profile {
  return {
    ...row,
    meals_config: JSON.parse(row.meals_config as string),
    menu_days: JSON.parse(row.menu_days as string),
    dietary_restrictions: JSON.parse(row.dietary_restrictions as string),
    kitchen_equipment: JSON.parse(row.kitchen_equipment as string),
    batch_cooking: Boolean(row.batch_cooking),
  } as Profile;
}

function parseMenu(row: Record<string, unknown>): WeeklyMenu {
  return {
    ...row,
    menu_data: JSON.parse(row.menu_data as string),
  } as WeeklyMenu;
}

// ── Profiles ────────────────────────────────────────────────────────

export async function getProfile(telegramId: number): Promise<Profile | null> {
  const row = db.prepare("SELECT * FROM profiles WHERE telegram_id = ?").get(telegramId) as Record<string, unknown> | undefined;
  return row ? parseProfile(row) : null;
}

export async function upsertProfile(
  telegramId: number,
  fields: Partial<Omit<Profile, "id" | "telegram_id" | "created_at" | "updated_at">>
): Promise<Profile> {
  const existing = db.prepare("SELECT * FROM profiles WHERE telegram_id = ?").get(telegramId) as Record<string, unknown> | undefined;

  if (existing) {
    const sets: string[] = [];
    const values: unknown[] = [];
    for (const [key, value] of Object.entries(fields)) {
      sets.push(`${key} = ?`);
      if (Array.isArray(value)) values.push(JSON.stringify(value));
      else if (typeof value === "boolean") values.push(value ? 1 : 0);
      else values.push(value);
    }
    sets.push("updated_at = datetime('now')");
    values.push(telegramId);
    db.prepare(`UPDATE profiles SET ${sets.join(", ")} WHERE telegram_id = ?`).run(...values);
  } else {
    const id = randomUUID();
    const cols = ["id", "telegram_id"];
    const placeholders = ["?", "?"];
    const values: unknown[] = [id, telegramId];
    for (const [key, value] of Object.entries(fields)) {
      cols.push(key);
      placeholders.push("?");
      if (Array.isArray(value)) values.push(JSON.stringify(value));
      else if (typeof value === "boolean") values.push(value ? 1 : 0);
      else values.push(value);
    }
    db.prepare(`INSERT INTO profiles (${cols.join(", ")}) VALUES (${placeholders.join(", ")})`).run(...values);
  }

  const row = db.prepare("SELECT * FROM profiles WHERE telegram_id = ?").get(telegramId) as Record<string, unknown>;
  return parseProfile(row);
}

// ── Menus ───────────────────────────────────────────────────────────

export async function saveMenu(
  profileId: string,
  weekStart: string,
  menuData: MenuData,
  extraInstructions?: string
): Promise<WeeklyMenu> {
  db.prepare("DELETE FROM weekly_menus WHERE profile_id = ?").run(profileId);

  const id = randomUUID();
  db.prepare(
    "INSERT INTO weekly_menus (id, profile_id, week_start, menu_data, extra_instructions) VALUES (?, ?, ?, ?, ?)"
  ).run(id, profileId, weekStart, JSON.stringify(menuData), extraInstructions ?? null);

  const row = db.prepare("SELECT * FROM weekly_menus WHERE id = ?").get(id) as Record<string, unknown>;
  return parseMenu(row);
}

export async function getLatestMenu(profileId: string): Promise<WeeklyMenu | null> {
  const row = db
    .prepare("SELECT * FROM weekly_menus WHERE profile_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(profileId) as Record<string, unknown> | undefined;
  return row ? parseMenu(row) : null;
}

export async function deleteMenu(menuId: string): Promise<void> {
  db.prepare("DELETE FROM weekly_menus WHERE id = ?").run(menuId);
}

// ── Shopping ────────────────────────────────────────────────────────

export async function saveShoppingList(
  menuId: string,
  items: ShoppingItem[]
): Promise<void> {
  db.prepare(
    "INSERT OR REPLACE INTO shopping_lists (id, menu_id, items) VALUES (coalesce((SELECT id FROM shopping_lists WHERE menu_id = ?), ?), ?, ?)"
  ).run(menuId, randomUUID(), menuId, JSON.stringify(items));
}

export async function getShoppingList(menuId: string): Promise<ShoppingItem[] | null> {
  const row = db.prepare("SELECT items FROM shopping_lists WHERE menu_id = ?").get(menuId) as { items: string } | undefined;
  return row ? JSON.parse(row.items) : null;
}

// ── Stats ───────────────────────────────────────────────────────────

export async function getOrCreateUserStats(userId: string): Promise<UserStats> {
  let row = db.prepare("SELECT * FROM user_stats WHERE user_id = ?").get(userId) as Record<string, unknown> | undefined;
  if (row) return row as unknown as UserStats;

  const id = randomUUID();
  db.prepare("INSERT INTO user_stats (id, user_id) VALUES (?, ?)").run(id, userId);
  row = db.prepare("SELECT * FROM user_stats WHERE id = ?").get(id) as Record<string, unknown>;
  return row as unknown as UserStats;
}

export async function updateUserStats(
  userId: string,
  fields: Partial<Omit<UserStats, "id" | "user_id" | "created_at">>
): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(fields)) {
    sets.push(`${key} = ?`);
    values.push(value);
  }
  values.push(userId);
  db.prepare(`UPDATE user_stats SET ${sets.join(", ")} WHERE user_id = ?`).run(...values);
}

// ── Validations ─────────────────────────────────────────────────────

export async function createMealValidation(data: {
  user_id: string;
  menu_id: string;
  day_key: string;
  meal_key: string;
  photo_file_id?: string;
  xp_earned: number;
}): Promise<MealValidation> {
  const id = randomUUID();
  db.prepare(
    "INSERT INTO meal_validations (id, user_id, menu_id, day_key, meal_key, photo_file_id, xp_earned) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, data.user_id, data.menu_id, data.day_key, data.meal_key, data.photo_file_id ?? null, data.xp_earned);

  return db.prepare("SELECT * FROM meal_validations WHERE id = ?").get(id) as unknown as MealValidation;
}

export async function getTodayValidations(userId: string): Promise<MealValidation[]> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const rows = db
    .prepare("SELECT * FROM meal_validations WHERE user_id = ? AND validated_at >= ? AND validated_at < ?")
    .all(userId, todayStart.toISOString(), tomorrowStart.toISOString()) as unknown[];
  return rows as MealValidation[];
}

// ── Badges ──────────────────────────────────────────────────────────

export async function getUserBadges(
  userId: string
): Promise<(UserBadge & { badge: BadgeDefinition })[]> {
  const rows = db
    .prepare(
      `SELECT ub.*, bd.id AS bd_id, bd.name AS bd_name, bd.description AS bd_description,
              bd.emoji AS bd_emoji, bd.source AS bd_source, bd.category AS bd_category,
              bd.threshold AS bd_threshold, bd.created_at AS bd_created_at
       FROM user_badges ub
       JOIN badge_definitions bd ON ub.badge_id = bd.id
       WHERE ub.user_id = ?`
    )
    .all(userId) as Record<string, unknown>[];

  return rows.map((row) => ({
    id: row.id as string,
    user_id: row.user_id as string,
    badge_id: row.badge_id as string,
    earned_at: row.earned_at as string,
    meal_validation_id: row.meal_validation_id as string | null,
    badge: {
      id: row.bd_id as string,
      name: row.bd_name as string,
      description: row.bd_description as string,
      emoji: row.bd_emoji as string,
      source: row.bd_source as "predefined" | "generated",
      category: row.bd_category as string,
      threshold: row.bd_threshold as number | null,
      created_at: row.bd_created_at as string,
    },
  }));
}

export async function awardBadge(
  userId: string,
  badgeId: string,
  mealValidationId?: string
): Promise<UserBadge | null> {
  const existing = db
    .prepare("SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?")
    .get(userId, badgeId);
  if (existing) return null;

  const id = randomUUID();
  db.prepare(
    "INSERT INTO user_badges (id, user_id, badge_id, meal_validation_id) VALUES (?, ?, ?, ?)"
  ).run(id, userId, badgeId, mealValidationId ?? null);

  return db.prepare("SELECT * FROM user_badges WHERE id = ?").get(id) as unknown as UserBadge;
}

export async function getAllBadgeDefinitions(): Promise<BadgeDefinition[]> {
  return db.prepare("SELECT * FROM badge_definitions").all() as unknown as BadgeDefinition[];
}

export async function getContextualBadgeNames(): Promise<string[]> {
  const rows = db
    .prepare("SELECT name FROM badge_definitions WHERE threshold IS NULL")
    .all() as { name: string }[];
  return rows.map((row) => row.name);
}

export async function saveBadgeDefinition(
  name: string,
  description: string,
  emoji: string
): Promise<BadgeDefinition> {
  const id = randomUUID();
  db.prepare(
    "INSERT INTO badge_definitions (id, name, description, emoji, source, category) VALUES (?, ?, ?, ?, 'generated', 'generated')"
  ).run(id, name, description, emoji);

  return db.prepare("SELECT * FROM badge_definitions WHERE id = ?").get(id) as unknown as BadgeDefinition;
}

export async function getBadgeByName(name: string): Promise<BadgeDefinition | null> {
  const row = db.prepare("SELECT * FROM badge_definitions WHERE name = ?").get(name);
  return (row as BadgeDefinition) ?? null;
}

// ── Reminders ───────────────────────────────────────────────────────

export async function getReminderSettings(userId: string): Promise<ReminderSettings> {
  let row = db.prepare("SELECT * FROM reminder_settings WHERE user_id = ?").get(userId);
  if (row) return row as unknown as ReminderSettings;

  const id = randomUUID();
  db.prepare("INSERT INTO reminder_settings (id, user_id) VALUES (?, ?)").run(id, userId);
  row = db.prepare("SELECT * FROM reminder_settings WHERE id = ?").get(id);
  return row as unknown as ReminderSettings;
}

export async function updateReminderSettings(
  userId: string,
  fields: Partial<Omit<ReminderSettings, "id" | "user_id">>
): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(fields)) {
    sets.push(`${key} = ?`);
    values.push(value);
  }
  values.push(userId);
  db.prepare(`UPDATE reminder_settings SET ${sets.join(", ")} WHERE user_id = ?`).run(...values);
}

// ── Scheduler ───────────────────────────────────────────────────────

export async function getUsersWithActiveMenus(): Promise<
  { profile: Profile; menu: WeeklyMenu; reminders: ReminderSettings }[]
> {
  const today = new Date().toISOString().slice(0, 10);

  const rows = db
    .prepare(
      `SELECT m.*, p.id AS p_id, p.telegram_id, p.username, p.weight, p.height, p.age,
              p.goal, p.meals_config, p.menu_days, p.servings, p.batch_cooking,
              p.dietary_restrictions, p.kitchen_equipment, p.extra_preferences,
              p.created_at AS p_created_at, p.updated_at AS p_updated_at
       FROM weekly_menus m
       JOIN profiles p ON m.profile_id = p.id
       WHERE m.week_start <= ?`
    )
    .all(today) as Record<string, unknown>[];

  const results: { profile: Profile; menu: WeeklyMenu; reminders: ReminderSettings }[] = [];

  for (const row of rows) {
    const profile = parseProfile({
      id: row.p_id,
      telegram_id: row.telegram_id,
      username: row.username,
      weight: row.weight,
      height: row.height,
      age: row.age,
      goal: row.goal,
      meals_config: row.meals_config,
      menu_days: row.menu_days,
      servings: row.servings,
      batch_cooking: row.batch_cooking,
      dietary_restrictions: row.dietary_restrictions,
      kitchen_equipment: row.kitchen_equipment,
      extra_preferences: row.extra_preferences,
      created_at: row.p_created_at,
      updated_at: row.p_updated_at,
    });

    const menu = parseMenu({
      id: row.id,
      profile_id: row.profile_id,
      week_start: row.week_start,
      menu_data: row.menu_data,
      extra_instructions: row.extra_instructions,
      created_at: row.created_at,
    });

    const reminders = await getReminderSettings(profile.id);
    results.push({ profile, menu, reminders });
  }

  return results;
}
