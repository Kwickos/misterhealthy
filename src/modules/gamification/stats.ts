import type { BotContext, BotConversation } from "../../bot.js";
import { getProfile, getOrCreateUserStats, getUserBadges, getAllBadgeDefinitions, getReminderSettings, updateReminderSettings } from "../../services/supabase.js";
import { getLevelTitle, xpForNextLevel, totalXpForLevel } from "../../services/gamification.js";
import { InlineKeyboard } from "grammy";

const BADGES_PER_PAGE = 10;

// /stats command
export async function handleStats(ctx: BotContext) {
  const profile = await getProfile(ctx.from!.id);
  if (!profile) {
    await ctx.reply("Tu n'as pas encore de profil. Tape /start pour commencer.");
    return;
  }

  const stats = await getOrCreateUserStats(profile.id);
  const allBadges = await getAllBadgeDefinitions();
  const earnedBadges = await getUserBadges(profile.id);
  const title = getLevelTitle(stats.level);
  const nextLevelXp = totalXpForLevel(stats.level) + xpForNextLevel(stats.level);

  const text = [
    "\u{1F4CA} <b>Tes stats</b>\n",
    `\u{1F525} Streak : ${stats.current_streak} jours (record : ${stats.best_streak})`,
    `\u2B50 Niveau ${stats.level} \u2014 ${title}`,
    `\u{1F48E} XP : ${stats.xp} / ${nextLevelXp}`,
    `\u{1F37D} Repas cuisin\u00e9s : ${stats.total_meals}`,
    `\u{1F4F8} Photos : ${stats.total_photos}`,
    `\u{1F3C5} Badges : ${earnedBadges.length} / ${allBadges.length}`,
  ].join("\n");

  const kb = new InlineKeyboard()
    .text("\u{1F3C5} Mes badges", "badges:0")
    .text("\u{1F4C8} Historique", "stats:history");

  await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
}

// Badges display with pagination
export async function handleBadgesCallback(ctx: BotContext) {
  const data = ctx.callbackQuery?.data;
  if (!data || !data.startsWith("badges:")) return false;

  const page = parseInt(data.replace("badges:", ""));
  const profile = await getProfile(ctx.from!.id);
  if (!profile) return false;

  const allBadges = await getAllBadgeDefinitions();
  const earned = await getUserBadges(profile.id);
  const earnedIds = new Set(earned.map(e => e.badge_id));

  const totalPages = Math.ceil(allBadges.length / BADGES_PER_PAGE);
  const start = page * BADGES_PER_PAGE;
  const pageBadges = allBadges.slice(start, start + BADGES_PER_PAGE);

  const lines = [`\u{1F3C5} <b>Badges</b> (page ${page + 1}/${totalPages})\n`];

  for (const badge of pageBadges) {
    if (earnedIds.has(badge.id)) {
      const userBadge = earned.find(e => e.badge_id === badge.id);
      const date = userBadge ? new Date(userBadge.earned_at).toLocaleDateString("fr-FR") : "";
      lines.push(`${badge.emoji} <b>${badge.name}</b> \u2014 ${date}`);
      lines.push(`  <i>${badge.description}</i>`);
    } else {
      lines.push(`\u2B1C <b>${badge.name}</b>`);
      lines.push(`  <i>${badge.description}</i>`);
    }
  }

  const kb = new InlineKeyboard();
  if (page > 0) {
    kb.text("\u2B05\uFE0F Pr\u00e9c\u00e9dent", `badges:${page - 1}`);
  }
  if (page < totalPages - 1) {
    kb.text("Suivant \u27A1\uFE0F", `badges:${page + 1}`);
  }
  kb.row().text("\u2B05\uFE0F Retour", "stats:back");

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(lines.join("\n"), { parse_mode: "HTML", reply_markup: kb });
  return true;
}

// Stats history (simple for now - just show a summary)
export async function handleStatsHistoryCallback(ctx: BotContext) {
  if (ctx.callbackQuery?.data !== "stats:history") return false;

  const profile = await getProfile(ctx.from!.id);
  if (!profile) return false;

  const stats = await getOrCreateUserStats(profile.id);

  const text = [
    "\u{1F4C8} <b>Historique</b>\n",
    `\u{1F37D} Total repas : ${stats.total_meals}`,
    `\u{1F4F8} Total photos : ${stats.total_photos}`,
    `\u{1F373} Total batch cooking : ${stats.total_batch}`,
    `\u2B50 Semaines parfaites : ${stats.perfect_weeks}`,
    `\u{1F525} Meilleur streak : ${stats.best_streak} jours`,
  ].join("\n");

  const kb = new InlineKeyboard().text("\u2B05\uFE0F Retour", "stats:back");

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
  return true;
}

// Stats back button -> re-show stats
export async function handleStatsBackCallback(ctx: BotContext) {
  if (ctx.callbackQuery?.data !== "stats:back") return false;

  const profile = await getProfile(ctx.from!.id);
  if (!profile) return false;

  const stats = await getOrCreateUserStats(profile.id);
  const allBadges = await getAllBadgeDefinitions();
  const earnedBadges = await getUserBadges(profile.id);
  const title = getLevelTitle(stats.level);
  const nextLevelXp = totalXpForLevel(stats.level) + xpForNextLevel(stats.level);

  const text = [
    "\u{1F4CA} <b>Tes stats</b>\n",
    `\u{1F525} Streak : ${stats.current_streak} jours (record : ${stats.best_streak})`,
    `\u2B50 Niveau ${stats.level} \u2014 ${title}`,
    `\u{1F48E} XP : ${stats.xp} / ${nextLevelXp}`,
    `\u{1F37D} Repas cuisin\u00e9s : ${stats.total_meals}`,
    `\u{1F4F8} Photos : ${stats.total_photos}`,
    `\u{1F3C5} Badges : ${earnedBadges.length} / ${allBadges.length}`,
  ].join("\n");

  const kb = new InlineKeyboard()
    .text("\u{1F3C5} Mes badges", "badges:0")
    .text("\u{1F4C8} Historique", "stats:history");

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
  return true;
}

// /horaires conversation
export async function horairesConversation(conversation: BotConversation, ctx: BotContext) {
  const profile = await getProfile(ctx.from!.id);
  if (!profile) {
    await ctx.reply("Tu n'as pas encore de profil. Tape /start pour commencer.");
    return;
  }

  const settings = await getReminderSettings(profile.id);

  const text = [
    "\u23F0 <b>Tes horaires de rappel</b>\n",
    `\u{1F305} Petit-d\u00e9j : ${settings.petit_dej}`,
    `\u{1F37D} D\u00e9jeuner : ${settings.dejeuner}`,
    `\u{1F370} Collation : ${settings.snack}`,
    `\u{1F319} D\u00eener : ${settings.diner}`,
    `\u{1F525} Alerte streak : ${settings.streak_alert}`,
    "\nQuel horaire veux-tu modifier ? (ou /cancel pour annuler)",
  ].join("\n");

  const kb = new InlineKeyboard()
    .text("\u{1F305} Petit-d\u00e9j", "horaire:petit_dej")
    .text("\u{1F37D} D\u00e9jeuner", "horaire:dejeuner")
    .row()
    .text("\u{1F370} Collation", "horaire:snack")
    .text("\u{1F319} D\u00eener", "horaire:diner")
    .row()
    .text("\u{1F525} Alerte streak", "horaire:streak_alert")
    .row()
    .text("\u2705 C'est bon", "horaire:done");

  await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });

  while (true) {
    const cbCtx = await conversation.waitForCallbackQuery(/^horaire:/);
    const data = cbCtx.callbackQuery.data;

    if (data === "horaire:done") {
      await cbCtx.answerCallbackQuery();
      await ctx.reply("Horaires sauvegard\u00e9s \u2705");
      return;
    }

    const field = data.replace("horaire:", "");
    await cbCtx.answerCallbackQuery();
    await ctx.reply(`Nouvelle heure pour ce rappel ? (format HH:MM, ex: 12:30)`);

    const timeCtx = await conversation.waitFor("message:text");
    const timeText = timeCtx.message.text.trim();

    if (timeText === "/cancel") {
      await ctx.reply("Modification annul\u00e9e.");
      return;
    }

    // Validate HH:MM format
    if (!/^\d{2}:\d{2}$/.test(timeText)) {
      await ctx.reply("Format invalide. Utilise HH:MM (ex: 13:00)");
      continue;
    }

    await updateReminderSettings(profile.id, { [field]: timeText });
    await ctx.reply(`Horaire mis \u00e0 jour : ${timeText} \u2705\n\nAutre modification ?`, { reply_markup: kb });
  }
}
