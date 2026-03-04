import type { BotContext } from "../../bot.js";
import { getLocale } from "../../bot.js";
import { getProfile, getLatestMenu } from "../../services/database.js";
import { formatMenuOverview } from "../../utils/format.js";
import { daysKeyboard, mainKeyboard } from "../../utils/keyboard.js";
import type { MenuData } from "../../types.js";
import { t, DEFAULT_LOCALE } from "../../i18n/index.js";

export async function handleMyMenu(ctx: BotContext) {
  const profile = await getProfile(ctx.from!.id);
  if (!profile) {
    await ctx.reply(t(DEFAULT_LOCALE, "profile.no_profile"));
    return;
  }

  const locale = getLocale(profile);
  const menu = await getLatestMenu(profile.id);
  if (!menu) {
    await ctx.reply(t(locale, "menu.no_menu"), {
      reply_markup: mainKeyboard(locale),
    });
    return;
  }

  const menuData = menu.menu_data as MenuData;
  const text = formatMenuOverview(locale, menuData, menu.week_start);
  await ctx.reply(text, {
    parse_mode: "HTML",
    reply_markup: daysKeyboard(locale, menuData),
  });
}
