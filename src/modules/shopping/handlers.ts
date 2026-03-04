import type { BotContext } from "../../bot.js";
import { getLocale } from "../../bot.js";
import { getProfile, getLatestMenu, getShoppingList } from "../../services/database.js";
import { formatShoppingList } from "../../utils/format.js";
import { mainKeyboard } from "../../utils/keyboard.js";
import { t, DEFAULT_LOCALE } from "../../i18n/index.js";

export async function handleShoppingList(ctx: BotContext) {
  const profile = await getProfile(ctx.from!.id);
  if (!profile) {
    await ctx.reply(t(DEFAULT_LOCALE, "profile.no_profile"));
    return;
  }

  const locale = getLocale(profile);
  const menu = await getLatestMenu(profile.id);
  if (!menu) {
    await ctx.reply(t(locale, "shopping.no_menu"), {
      reply_markup: mainKeyboard(locale),
    });
    return;
  }

  const items = await getShoppingList(menu.id);
  if (!items || items.length === 0) {
    await ctx.reply(t(locale, "shopping.empty"), { reply_markup: mainKeyboard(locale) });
    return;
  }

  const text = formatShoppingList(locale, items, menu.week_start);
  await ctx.reply(text, { parse_mode: "HTML", reply_markup: mainKeyboard(locale) });
}
