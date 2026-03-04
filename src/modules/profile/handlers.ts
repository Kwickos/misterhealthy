import type { BotContext } from "../../bot.js";
import { getLocale } from "../../bot.js";
import { getProfile } from "../../services/database.js";
import { mainKeyboard } from "../../utils/keyboard.js";
import { InlineKeyboard } from "grammy";
import { t, type Locale, DEFAULT_LOCALE } from "../../i18n/index.js";

export async function handleProfile(ctx: BotContext) {
  const profile = await getProfile(ctx.from!.id);
  if (!profile) {
    await ctx.reply(t(DEFAULT_LOCALE, "profile.no_profile"));
    return;
  }

  const locale = getLocale(profile);

  const goalLabels: Record<string, string> = {
    perte_poids: t(locale, "goal.perte_poids"),
    prise_masse: t(locale, "goal.prise_masse"),
    maintien: t(locale, "goal.maintien"),
    manger_equilibre: t(locale, "goal.manger_equilibre"),
  };

  const text = [
    t(locale, "profile.title"),
    t(locale, "profile.name", { value: profile.username ?? "-" }),
    t(locale, "profile.weight", { value: profile.weight ?? "-" }),
    t(locale, "profile.height", { value: profile.height ?? "-" }),
    t(locale, "profile.age", { value: profile.age ?? "-" }),
    t(locale, "profile.goal", { value: goalLabels[profile.goal] ?? profile.goal }),
    t(locale, "profile.servings", { value: profile.servings }),
    t(locale, "profile.meals", { value: profile.meals_config.join(", ") }),
    t(locale, "profile.batch", { value: profile.batch_cooking ? t(locale, "batch.yes") : t(locale, "batch.no") }),
    t(locale, "profile.restrictions", { value: profile.dietary_restrictions.length > 0 ? profile.dietary_restrictions.join(", ") : t(locale, "restriction.aucune") }),
    t(locale, "profile.equipment", { value: profile.kitchen_equipment.join(", ") }),
    profile.extra_preferences ? t(locale, "profile.preferences", { value: profile.extra_preferences }) : "",
  ].filter(Boolean).join("\n");

  const kb = new InlineKeyboard().text(t(locale, "kb.edit_profile"), "profile:edit");

  await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
}
