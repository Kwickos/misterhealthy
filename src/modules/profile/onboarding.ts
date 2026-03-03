import type { BotConversation, BotContext } from "../../bot.js";
import { upsertProfile } from "../../services/supabase.js";
import { mainKeyboard } from "../../utils/keyboard.js";
import {
  onboardingGoalKeyboard,
  onboardingBatchKeyboard,
  onboardingRestrictionsKeyboard,
} from "../../utils/keyboard.js";

const CANCEL_MSG = "Onboarding annulé. Tape /start pour recommencer.";

async function waitCallback(
  conversation: BotConversation,
  ctx: BotContext,
  pattern: RegExp
): Promise<string | null> {
  const cbCtx = await conversation.waitForCallbackQuery(
    new RegExp(pattern.source + "|^conv:cancel")
  );
  const data = cbCtx.callbackQuery.data;
  if (data === "conv:cancel") {
    await cbCtx.answerCallbackQuery();
    await ctx.reply(CANCEL_MSG, { reply_markup: mainKeyboard() });
    return null;
  }
  await cbCtx.answerCallbackQuery();
  return data;
}

async function waitText(
  conversation: BotConversation,
  ctx: BotContext
): Promise<string | null> {
  const textCtx = await conversation.waitFor("message:text");
  if (textCtx.message.text.trim() === "/cancel") {
    await ctx.reply(CANCEL_MSG, { reply_markup: mainKeyboard() });
    return null;
  }
  return textCtx.message.text;
}

export async function onboarding(conversation: BotConversation, ctx: BotContext) {
  const telegramId = ctx.from!.id;

  // 1. Username
  await ctx.reply("Comment tu t'appelles ? (/cancel pour annuler)");
  const username = await waitText(conversation, ctx);
  if (!username) return;

  // 2. Goal
  await ctx.reply("Quel est ton objectif ?", { reply_markup: onboardingGoalKeyboard() });
  const goalData = await waitCallback(conversation, ctx, /^goal:/);
  if (!goalData) return;
  const goal = goalData.replace("goal:", "");

  // 3. Weight
  await ctx.reply("Ton poids en kg ? (ex: 75)");
  const weightText = await waitText(conversation, ctx);
  if (!weightText) return;
  const weight = parseFloat(weightText);

  // 4. Height
  await ctx.reply("Ta taille en cm ? (ex: 175)");
  const heightText = await waitText(conversation, ctx);
  if (!heightText) return;
  const height = parseFloat(heightText);

  // 5. Age
  await ctx.reply("Ton âge ?");
  const ageText = await waitText(conversation, ctx);
  if (!ageText) return;
  const age = parseInt(ageText);

  // 6. Batch cooking
  await ctx.reply("Tu veux faire du batch cooking ?", { reply_markup: onboardingBatchKeyboard() });
  const batchData = await waitCallback(conversation, ctx, /^batch:/);
  if (!batchData) return;
  const batchCooking = batchData === "batch:true";

  // 9. Dietary restrictions (multi-select)
  const restrictions: string[] = [];
  await ctx.reply("Restrictions alimentaires ? (clique puis Valider)", {
    reply_markup: onboardingRestrictionsKeyboard(),
  });
  let restrictionsCancelled = false;
  while (true) {
    const data = await waitCallback(conversation, ctx, /^restrict:|^restrictions:done/);
    if (!data) { restrictionsCancelled = true; break; }
    if (data === "restrictions:done") break;
    const r = data.replace("restrict:", "");
    if (r === "aucune") {
      restrictions.length = 0;
      break;
    }
    if (restrictions.includes(r)) {
      restrictions.splice(restrictions.indexOf(r), 1);
    } else {
      restrictions.push(r);
    }
  }
  if (restrictionsCancelled) return;

  // 10. Equipment (free text)
  await ctx.reply("Quel équipement cuisine tu as ? Décris ce que tu as.\n(ex: \"four, plaques, thermomix, airfryer, micro-ondes, pas de robot\")");
  const equipmentText = await waitText(conversation, ctx);
  if (!equipmentText) return;

  // 11. Extra preferences
  await ctx.reply("Autres précisions ? (ou envoie \"non\")");
  const extraText = await waitText(conversation, ctx);
  if (!extraText) return;
  const extra = extraText.toLowerCase() === "non" ? null : extraText;

  // Save profile
  await upsertProfile(telegramId, {
    username,
    weight,
    height,
    age,
    goal,
    batch_cooking: batchCooking,
    dietary_restrictions: restrictions,
    kitchen_equipment: [equipmentText],
    extra_preferences: extra,
  });

  await ctx.reply(
    `Profil créé ${username} ! Tu peux maintenant générer ton premier menu.`,
    { reply_markup: mainKeyboard() }
  );
}
