import type { BotContext } from "../../bot.js";
import { getProfile, getLatestMenu } from "../../services/supabase.js";
import { formatMenuOverview } from "../../utils/format.js";
import { daysKeyboard, mainKeyboard } from "../../utils/keyboard.js";
import type { MenuData } from "../../types.js";

export async function handleMyMenu(ctx: BotContext) {
  const profile = await getProfile(ctx.from!.id);
  if (!profile) {
    await ctx.reply("Tu n'as pas encore de profil. Tape /start pour commencer.");
    return;
  }

  const menu = await getLatestMenu(profile.id);
  if (!menu) {
    await ctx.reply("Tu n'as pas encore de menu. Clique sur \"🍽 Générer menu\" pour en créer un !", {
      reply_markup: mainKeyboard(),
    });
    return;
  }

  const menuData = menu.menu_data as MenuData;
  const text = formatMenuOverview(menuData, menu.week_start);
  await ctx.reply(text, {
    parse_mode: "HTML",
    reply_markup: daysKeyboard(menuData),
  });
}
