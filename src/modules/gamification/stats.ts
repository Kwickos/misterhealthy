import type { BotContext, BotConversation } from "../../bot.js";
import { getLocale } from "../../bot.js";
import { getProfile, getOrCreateUserStats, getUserBadges, getAllBadgeDefinitions, getReminderSettings, updateReminderSettings } from "../../services/database.js";
import { getLevelTitle, xpForNextLevel, totalXpForLevel } from "../../services/gamification.js";
import { InlineKeyboard } from "grammy";
import { t, badgeName, badgeDesc, DEFAULT_LOCALE, type Locale } from "../../i18n/index.js";

const BADGES_PER_PAGE = 10;

function buildStatsText(locale: Locale, stats: import("../../types.js").UserStats, earnedCount: number, totalCount: number): string {
  const title = getLevelTitle(locale, stats.level);
  const nextLevelXp = totalXpForLevel(stats.level) + xpForNextLevel(stats.level);

  return [
    t(locale, "stats.title"),
    t(locale, "stats.streak", { current: stats.current_streak, best: stats.best_streak }),
    t(locale, "stats.level", { level: stats.level, title }),
    t(locale, "stats.xp", { current: stats.xp, next: nextLevelXp }),
    t(locale, "stats.meals", { count: stats.total_meals }),
    t(locale, "stats.photos", { count: stats.total_photos }),
    t(locale, "stats.badges", { earned: earnedCount, total: totalCount }),
  ].join("\n");
}

function buildStatsKeyboard(locale: Locale): InlineKeyboard {
  return new InlineKeyboard()
    .text(t(locale, "kb.my_badges"), "badges:0")
    .text(t(locale, "kb.history"), "stats:history");
}

// /stats command
export async function handleStats(ctx: BotContext) {
  const profile = await getProfile(ctx.from!.id);
  if (!profile) {
    await ctx.reply(t(DEFAULT_LOCALE, "profile.no_profile"));
    return;
  }

  const locale = getLocale(profile);
  const stats = await getOrCreateUserStats(profile.id);
  const allBadges = await getAllBadgeDefinitions();
  const earnedBadges = await getUserBadges(profile.id);

  const text = buildStatsText(locale, stats, earnedBadges.length, allBadges.length);
  await ctx.reply(text, { parse_mode: "HTML", reply_markup: buildStatsKeyboard(locale) });
}

// Badges display with pagination
export async function handleBadgesCallback(ctx: BotContext) {
  const data = ctx.callbackQuery?.data;
  if (!data || !data.startsWith("badges:")) return false;

  const page = parseInt(data.replace("badges:", ""));
  const profile = await getProfile(ctx.from!.id);
  if (!profile) return false;

  const locale = getLocale(profile);
  const allBadges = await getAllBadgeDefinitions();
  const earned = await getUserBadges(profile.id);
  const earnedIds = new Set(earned.map(e => e.badge_id));

  const totalPages = Math.ceil(allBadges.length / BADGES_PER_PAGE);
  const start = page * BADGES_PER_PAGE;
  const pageBadges = allBadges.slice(start, start + BADGES_PER_PAGE);

  const dateLocale = locale === "en" ? "en-GB" : "fr-FR";
  const lines = [t(locale, "stats.badges_title", { current: page + 1, total: totalPages })];

  for (const badge of pageBadges) {
    if (earnedIds.has(badge.id)) {
      const userBadge = earned.find(e => e.badge_id === badge.id);
      const date = userBadge ? new Date(userBadge.earned_at).toLocaleDateString(dateLocale) : "";
      lines.push(`${badge.emoji} <b>${badgeName(locale, badge.name)}</b> — ${date}`);
      lines.push(`  <i>${badgeDesc(locale, badge.description)}</i>`);
    } else {
      lines.push(`⬜ <b>${badgeName(locale, badge.name)}</b>`);
      lines.push(`  <i>${badgeDesc(locale, badge.description)}</i>`);
    }
  }

  const kb = new InlineKeyboard();
  if (page > 0) {
    kb.text(t(locale, "kb.previous"), `badges:${page - 1}`);
  }
  if (page < totalPages - 1) {
    kb.text(t(locale, "kb.next"), `badges:${page + 1}`);
  }
  kb.row().text(t(locale, "kb.back"), "stats:back");

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(lines.join("\n"), { parse_mode: "HTML", reply_markup: kb });
  return true;
}

// Stats history (simple for now - just show a summary)
export async function handleStatsHistoryCallback(ctx: BotContext) {
  if (ctx.callbackQuery?.data !== "stats:history") return false;

  const profile = await getProfile(ctx.from!.id);
  if (!profile) return false;

  const locale = getLocale(profile);
  const stats = await getOrCreateUserStats(profile.id);

  const text = [
    t(locale, "stats.history_title"),
    t(locale, "stats.history_meals", { count: stats.total_meals }),
    t(locale, "stats.history_photos", { count: stats.total_photos }),
    t(locale, "stats.history_batch", { count: stats.total_batch }),
    t(locale, "stats.history_perfect", { count: stats.perfect_weeks }),
    t(locale, "stats.history_best_streak", { count: stats.best_streak }),
  ].join("\n");

  const kb = new InlineKeyboard().text(t(locale, "kb.back"), "stats:back");

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
  return true;
}

// Stats back button -> re-show stats
export async function handleStatsBackCallback(ctx: BotContext) {
  if (ctx.callbackQuery?.data !== "stats:back") return false;

  const profile = await getProfile(ctx.from!.id);
  if (!profile) return false;

  const locale = getLocale(profile);
  const stats = await getOrCreateUserStats(profile.id);
  const allBadges = await getAllBadgeDefinitions();
  const earnedBadges = await getUserBadges(profile.id);

  const text = buildStatsText(locale, stats, earnedBadges.length, allBadges.length);

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: buildStatsKeyboard(locale) });
  return true;
}

// /horaires conversation
export async function horairesConversation(conversation: BotConversation, ctx: BotContext) {
  const profile = await getProfile(ctx.from!.id);
  if (!profile) {
    await ctx.reply(t(DEFAULT_LOCALE, "profile.no_profile"));
    return;
  }

  const locale = getLocale(profile);
  const settings = await getReminderSettings(profile.id);

  const text = [
    t(locale, "horaires.title"),
    t(locale, "horaires.petit_dej", { time: settings.petit_dej }),
    t(locale, "horaires.dejeuner", { time: settings.dejeuner }),
    t(locale, "horaires.collation", { time: settings.snack }),
    t(locale, "horaires.diner", { time: settings.diner }),
    t(locale, "horaires.streak_alert", { time: settings.streak_alert }),
    t(locale, "horaires.ask_modify"),
  ].join("\n");

  const kb = new InlineKeyboard()
    .text(t(locale, "meal.petit_dej"), "horaire:petit_dej")
    .text(t(locale, "meal.dejeuner"), "horaire:dejeuner")
    .row()
    .text(t(locale, "meal.collation"), "horaire:snack")
    .text(t(locale, "meal.diner"), "horaire:diner")
    .row()
    .text("🔥 Streak", "horaire:streak_alert")
    .row()
    .text(t(locale, "kb.done"), "horaire:done");

  await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });

  while (true) {
    const cbCtx = await conversation.waitForCallbackQuery(/^horaire:/);
    const data = cbCtx.callbackQuery.data;

    if (data === "horaire:done") {
      await cbCtx.answerCallbackQuery();
      await ctx.reply(t(locale, "horaires.saved"));
      return;
    }

    const field = data.replace("horaire:", "");
    await cbCtx.answerCallbackQuery();
    await ctx.reply(t(locale, "horaires.ask_new_time"));

    const timeCtx = await conversation.waitFor("message:text");
    const timeText = timeCtx.message.text.trim();

    if (timeText === "/cancel") {
      await ctx.reply(t(locale, "horaires.cancelled"));
      return;
    }

    // Validate HH:MM format
    if (!/^\d{2}:\d{2}$/.test(timeText)) {
      await ctx.reply(t(locale, "horaires.invalid_format"));
      continue;
    }

    await updateReminderSettings(profile.id, { [field]: timeText });
    await ctx.reply(t(locale, "horaires.updated", { time: timeText }), { reply_markup: kb });
  }
}
