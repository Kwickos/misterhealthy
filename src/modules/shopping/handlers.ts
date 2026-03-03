import type { BotContext } from "../../bot.js";
import { getProfile, getLatestMenu, getShoppingList } from "../../services/supabase.js";
import { formatShoppingList } from "../../utils/format.js";
import { mainKeyboard } from "../../utils/keyboard.js";

export async function handleShoppingList(ctx: BotContext) {
  const profile = await getProfile(ctx.from!.id);
  if (!profile) {
    await ctx.reply("Tu n'as pas encore de profil. Tape /start pour commencer.");
    return;
  }

  const menu = await getLatestMenu(profile.id);
  if (!menu) {
    await ctx.reply("Tu n'as pas encore de menu. Génère-en un d'abord !", {
      reply_markup: mainKeyboard(),
    });
    return;
  }

  const items = await getShoppingList(menu.id);
  if (!items || items.length === 0) {
    await ctx.reply("Liste de courses vide.", { reply_markup: mainKeyboard() });
    return;
  }

  const text = formatShoppingList(items, menu.week_start);
  await ctx.reply(text, { parse_mode: "HTML", reply_markup: mainKeyboard() });
}
