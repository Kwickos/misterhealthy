import type { BotContext } from "../../bot.js";
import { getLocale } from "../../bot.js";
import { getProfile, getLatestMenu, getTodayValidations } from "../../services/database.js";
import { processValidation } from "../../services/gamification.js";
import type { MenuData, Meal } from "../../types.js";
import { InlineKeyboard } from "grammy";
import { t, mealLabel, badgeName, badgeDesc, DEFAULT_LOCALE, type Locale } from "../../i18n/index.js";

const DAY_NAMES = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

// Track users waiting to send a photo: Map<telegramId, { userId, menuId, dayKey, mealKey }>
const waitingForPhoto = new Map<number, { userId: string; menuId: string; dayKey: string; mealKey: string }>();

export async function handleValidationCallbacks(ctx: BotContext) {
  const data = ctx.callbackQuery?.data;
  if (!data || !data.startsWith("validate:")) return false;

  const profile = await getProfile(ctx.from!.id);
  if (!profile) return false;

  const locale = getLocale(profile);
  const menu = await getLatestMenu(profile.id);
  if (!menu) {
    await ctx.answerCallbackQuery({ text: t(locale, "menu.not_found") });
    return true;
  }

  const menuData = menu.menu_data as MenuData;

  // validate:yes:dayKey:mealKey
  if (data.startsWith("validate:yes:")) {
    const [,, dayKey, mealKey] = data.split(":");
    await ctx.answerCallbackQuery();

    // Ask for photo
    const kb = new InlineKeyboard()
      .text(t(locale, "kb.skip"), `validate:skip_photo:${dayKey}:${mealKey}`);
    await ctx.editMessageText(t(locale, "gamification.photo_prompt"), {
      reply_markup: kb,
    });

    // Store that we're waiting for a photo from this user
    waitingForPhoto.set(ctx.from!.id, {
      userId: profile.id,
      menuId: menu.id,
      dayKey,
      mealKey,
    });

    return true;
  }

  // validate:skip_photo:dayKey:mealKey
  if (data.startsWith("validate:skip_photo:")) {
    const [,, dayKey, mealKey] = data.split(":");
    await ctx.answerCallbackQuery();
    waitingForPhoto.delete(ctx.from!.id);

    const meal = (menuData.days[dayKey] as Record<string, Meal>)?.[mealKey];
    if (!meal) {
      await ctx.editMessageText(t(locale, "gamification.meal_not_found"));
      return true;
    }

    const result = await processValidation(profile.id, menu.id, dayKey, mealKey, meal);
    await ctx.editMessageText(formatValidationResult(locale, result, false));

    return true;
  }

  // validate:no:dayKey:mealKey
  if (data.startsWith("validate:no:")) {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(t(locale, "gamification.no_worries"));
    return true;
  }

  // validate:today_meals -> show today's meals with validation status
  if (data === "validate:today_meals") {
    await ctx.answerCallbackQuery();
    const todayIndex = new Date().getDay();
    const todayKey = DAY_NAMES[todayIndex];
    const dayMenu = menuData.days[todayKey];

    if (!dayMenu) {
      await ctx.editMessageText(t(locale, "gamification.no_menu_today"));
      return true;
    }

    const validations = await getTodayValidations(profile.id);
    const validatedKeys = new Set(validations.map(v => v.meal_key));

    const kb = new InlineKeyboard();
    for (const mealKey of Object.keys(dayMenu)) {
      const label = mealLabel(locale, mealKey);
      if (validatedKeys.has(mealKey)) {
        kb.text(`✅ ${label}`, "noop");
      } else {
        kb.text(`⬜ ${label}`, `validate:yes:${todayKey}:${mealKey}`);
      }
      kb.row();
    }

    await ctx.editMessageText(t(locale, "gamification.today_meals"), { reply_markup: kb });
    return true;
  }

  return false;
}

// Handle photo messages (when user is in photo-waiting state)
export async function handlePhotoMessage(ctx: BotContext): Promise<boolean> {
  const telegramId = ctx.from?.id;
  if (!telegramId) return false;

  const pending = waitingForPhoto.get(telegramId);
  if (!pending) return false;

  const photo = ctx.message?.photo;
  if (!photo || photo.length === 0) return false;

  waitingForPhoto.delete(telegramId);

  // Get the largest photo
  const fileId = photo[photo.length - 1].file_id;

  const profile = await getProfile(telegramId);
  const locale = getLocale(profile);

  const menu = await getLatestMenu(pending.userId);
  if (!menu) return false;

  const menuData = menu.menu_data as MenuData;
  const meal = (menuData.days[pending.dayKey] as Record<string, Meal>)?.[pending.mealKey];
  if (!meal) return false;

  const result = await processValidation(pending.userId, pending.menuId, pending.dayKey, pending.mealKey, meal, fileId);
  await ctx.reply(formatValidationResult(locale, result, true));

  return true;
}

function formatValidationResult(locale: Locale, result: import("../../services/gamification.js").ValidationResult, hasPhoto: boolean): string {
  const lines: string[] = [];

  if (hasPhoto) {
    lines.push(t(locale, "gamification.nice_plate"));
  }

  const photoText = hasPhoto ? t(locale, "gamification.photo_text_bonus") : "";
  lines.push(t(locale, "gamification.xp_earned", { xp: result.xpEarned, photoText, streak: result.streak }));

  if (result.streakBonus > 0) {
    lines.push(t(locale, "gamification.streak_bonus", { bonus: result.streakBonus }));
  }

  if (result.levelUp) {
    lines.push("");
    lines.push(t(locale, "gamification.level_up", { level: result.levelUp.newLevel, title: result.levelUp.title }));
  }

  for (const badge of result.newBadges) {
    lines.push("");
    lines.push(t(locale, "gamification.new_badge", { emoji: badge.emoji, name: badgeName(locale, badge.name) }));
    lines.push(badgeDesc(locale, badge.description));
  }

  return lines.join("\n");
}

export { waitingForPhoto };
