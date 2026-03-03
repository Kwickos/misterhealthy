import type { BotContext } from "../../bot.js";
import { getProfile } from "../../services/supabase.js";
import { mainKeyboard } from "../../utils/keyboard.js";
import { InlineKeyboard } from "grammy";

export async function handleProfile(ctx: BotContext) {
  const profile = await getProfile(ctx.from!.id);
  if (!profile) {
    await ctx.reply("Tu n'as pas encore de profil. Tape /start pour commencer.");
    return;
  }

  const goalLabels: Record<string, string> = {
    perte_poids: "Perte de poids",
    prise_masse: "Prise de masse",
    maintien: "Maintien",
    manger_equilibre: "Mieux manger",
  };

  const text = [
    `👤 <b>Mon profil</b>\n`,
    `Nom : ${profile.username ?? "-"}`,
    `Poids : ${profile.weight ?? "-"} kg`,
    `Taille : ${profile.height ?? "-"} cm`,
    `Âge : ${profile.age ?? "-"} ans`,
    `Objectif : ${goalLabels[profile.goal] ?? profile.goal}`,
    `Personnes : ${profile.servings}`,
    `Repas : ${profile.meals_config.join(", ")}`,
    `Batch cooking : ${profile.batch_cooking ? "Oui" : "Non"}`,
    `Restrictions : ${profile.dietary_restrictions.length > 0 ? profile.dietary_restrictions.join(", ") : "Aucune"}`,
    `Équipement : ${profile.kitchen_equipment.join(", ")}`,
    profile.extra_preferences ? `Préférences : ${profile.extra_preferences}` : "",
  ].filter(Boolean).join("\n");

  const kb = new InlineKeyboard().text("✏️ Modifier mon profil", "profile:edit");

  await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
}
