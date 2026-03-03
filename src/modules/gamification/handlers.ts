import type { BotContext } from "../../bot.js";
import { getProfile, getLatestMenu, getTodayValidations } from "../../services/supabase.js";
import { processValidation, getLevelTitle, xpForNextLevel, totalXpForLevel } from "../../services/gamification.js";
import type { MenuData, Meal } from "../../types.js";
import { InlineKeyboard } from "grammy";

const MEAL_LABELS: Record<string, string> = {
  petit_dej: "🌅 Petit-déj",
  dejeuner: "🍽 Déjeuner",
  collation: "🍰 Collation",
  diner: "🌙 Dîner",
};

const DAY_NAMES = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

// Track users waiting to send a photo: Map<telegramId, { userId, menuId, dayKey, mealKey }>
const waitingForPhoto = new Map<number, { userId: string; menuId: string; dayKey: string; mealKey: string }>();

export async function handleValidationCallbacks(ctx: BotContext) {
  const data = ctx.callbackQuery?.data;
  if (!data || !data.startsWith("validate:")) return false;

  const profile = await getProfile(ctx.from!.id);
  if (!profile) return false;

  const menu = await getLatestMenu(profile.id);
  if (!menu) {
    await ctx.answerCallbackQuery({ text: "Aucun menu trouvé" });
    return true;
  }

  const menuData = menu.menu_data as MenuData;

  // validate:yes:dayKey:mealKey
  if (data.startsWith("validate:yes:")) {
    const [,, dayKey, mealKey] = data.split(":");
    await ctx.answerCallbackQuery();

    // Ask for photo
    const kb = new InlineKeyboard()
      .text("⏭ Passer", `validate:skip_photo:${dayKey}:${mealKey}`);
    await ctx.editMessageText("📸 Envoie une photo de ton plat pour +5 XP bonus !\n(ou clique Passer)", {
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
      await ctx.editMessageText("Repas non trouvé.");
      return true;
    }

    const result = await processValidation(profile.id, menu.id, dayKey, mealKey, meal);
    await ctx.editMessageText(formatValidationResult(result, false));

    return true;
  }

  // validate:no:dayKey:mealKey
  if (data.startsWith("validate:no:")) {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("Pas de souci, à la prochaine ! 💪");
    return true;
  }

  // validate:today_meals -> show today's meals with validation status
  if (data === "validate:today_meals") {
    await ctx.answerCallbackQuery();
    const todayIndex = new Date().getDay();
    const todayKey = DAY_NAMES[todayIndex];
    const dayMenu = menuData.days[todayKey];

    if (!dayMenu) {
      await ctx.editMessageText("Pas de menu prévu aujourd'hui.");
      return true;
    }

    const validations = await getTodayValidations(profile.id);
    const validatedKeys = new Set(validations.map(v => v.meal_key));

    const kb = new InlineKeyboard();
    for (const mealKey of Object.keys(dayMenu)) {
      const label = MEAL_LABELS[mealKey] ?? mealKey;
      if (validatedKeys.has(mealKey)) {
        kb.text(`✅ ${label}`, "noop");
      } else {
        kb.text(`⬜ ${label}`, `validate:yes:${todayKey}:${mealKey}`);
      }
      kb.row();
    }

    await ctx.editMessageText("📋 Tes repas d'aujourd'hui :", { reply_markup: kb });
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

  const menu = await getLatestMenu(pending.userId);
  if (!menu) return false;

  const menuData = menu.menu_data as MenuData;
  const meal = (menuData.days[pending.dayKey] as Record<string, Meal>)?.[pending.mealKey];
  if (!meal) return false;

  const result = await processValidation(pending.userId, pending.menuId, pending.dayKey, pending.mealKey, meal, fileId);
  await ctx.reply(formatValidationResult(result, true));

  return true;
}

function formatValidationResult(result: import("../../services/gamification.js").ValidationResult, hasPhoto: boolean): string {
  const lines: string[] = [];

  if (hasPhoto) {
    lines.push("📸 Belle assiette !");
  }

  const photoText = hasPhoto ? " (10 + 5 photo)" : "";
  lines.push(`+${result.xpEarned} XP${photoText} — Streak ${result.streak} jours 🔥`);

  if (result.streakBonus > 0) {
    lines.push(`🎁 Bonus streak : +${result.streakBonus} XP`);
  }

  if (result.levelUp) {
    lines.push("");
    lines.push(`🎉 NIVEAU ${result.levelUp.newLevel} — ${result.levelUp.title} !`);
  }

  for (const badge of result.newBadges) {
    lines.push("");
    lines.push(`🏅 Nouveau badge : "${badge.emoji} ${badge.name}"`);
    lines.push(badge.description);
  }

  return lines.join("\n");
}

export { waitingForPhoto };
