import type { Bot } from "grammy";
import type { BotContext } from "../bot.js";
import { getUsersWithActiveMenus, getTodayValidations, getOrCreateUserStats } from "./database.js";
import { InlineKeyboard } from "grammy";
import type { MenuData, Meal } from "../types.js";
import { t, mealLabel, type Locale, DEFAULT_LOCALE } from "../i18n/index.js";

const MEAL_TO_REMINDER_COL: Record<string, string> = {
  petit_dej: "petit_dej",
  dejeuner: "dejeuner",
  collation: "snack",
  diner: "diner",
};

const DAY_NAMES = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

const sentReminders = new Set<string>();

function getCurrentHHMM(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getTodayDayKey(): string {
  return DAY_NAMES[new Date().getDay()];
}

function buildReminderKey(userId: string, dayKey: string, mealKey: string, date: string): string {
  return `${userId}:${dayKey}:${mealKey}:${date}`;
}

function cleanOldReminders(todayDate: string): void {
  for (const key of sentReminders) {
    if (!key.endsWith(`:${todayDate}`)) {
      sentReminders.delete(key);
    }
  }
}

export function startScheduler(bot: Bot<BotContext>): void {
  console.log("[Scheduler] Started – checking every 60s");

  setInterval(async () => {
    try {
      const currentTime = getCurrentHHMM();
      const todayDate = getTodayDateString();
      const dayKey = getTodayDayKey();

      // Clean up reminders from previous days
      cleanOldReminders(todayDate);

      const users = await getUsersWithActiveMenus();

      for (const { profile, menu, reminders } of users) {
        const locale = (profile.language as Locale) ?? DEFAULT_LOCALE;
        const menuData = menu.menu_data as MenuData;
        const dayMenu = menuData.days?.[dayKey];

        // ── Meal reminders ────────────────────────────────────────
        for (const [mealKey, reminderCol] of Object.entries(MEAL_TO_REMINDER_COL)) {
          const reminderTime = (reminders as unknown as Record<string, string>)[reminderCol];
          if (!reminderTime || reminderTime !== currentTime) continue;

          const key = buildReminderKey(profile.id, dayKey, mealKey, todayDate);
          if (sentReminders.has(key)) continue;

          // Check if meal is already validated today
          const validations = await getTodayValidations(profile.id);
          const alreadyValidated = validations.some(
            (v) => v.day_key === dayKey && v.meal_key === mealKey,
          );
          if (alreadyValidated) {
            sentReminders.add(key);
            continue;
          }

          // Get the meal from today's menu
          const meal = dayMenu?.[mealKey as keyof typeof dayMenu] as Meal | undefined;
          if (!meal) continue;

          const label = mealLabel(locale, mealKey);
          const text = t(locale, "scheduler.meal_time", { label, name: meal.name });

          const keyboard = new InlineKeyboard()
            .text(t(locale, "kb.yes"), `validate:yes:${dayKey}:${mealKey}`)
            .text(t(locale, "kb.no_today"), `validate:no:${dayKey}:${mealKey}`);

          try {
            await bot.api.sendMessage(profile.telegram_id, text, {
              parse_mode: "Markdown",
              reply_markup: keyboard,
            });
            sentReminders.add(key);
          } catch (err) {
            console.error(`[Scheduler] Failed to send meal reminder to ${profile.telegram_id}:`, err);
          }
        }

        // ── Streak alert ──────────────────────────────────────────
        if (reminders.streak_alert && reminders.streak_alert === currentTime) {
          const streakKey = buildReminderKey(profile.id, dayKey, "streak_alert", todayDate);
          if (sentReminders.has(streakKey)) continue;

          const validations = await getTodayValidations(profile.id);
          if (validations.length === 0) {
            const stats = await getOrCreateUserStats(profile.id);
            if (stats.current_streak > 0) {
              const text = t(locale, "scheduler.streak_danger", { streak: stats.current_streak });

              const keyboard = new InlineKeyboard().text(
                t(locale, "kb.see_today_meals"),
                "validate:today_meals",
              );

              try {
                await bot.api.sendMessage(profile.telegram_id, text, {
                  parse_mode: "Markdown",
                  reply_markup: keyboard,
                });
              } catch (err) {
                console.error(`[Scheduler] Failed to send streak alert to ${profile.telegram_id}:`, err);
              }
            }
          }

          sentReminders.add(streakKey);
        }
      }
    } catch (err) {
      console.error("[Scheduler] Tick error:", err);
    }
  }, 60_000);
}
