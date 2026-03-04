import type { BotConversation, BotContext } from "../../bot.js";
import { upsertProfile } from "../../services/database.js";
import { mainKeyboard, languageKeyboard } from "../../utils/keyboard.js";
import {
  onboardingGoalKeyboard,
  onboardingBatchKeyboard,
  onboardingRestrictionsKeyboard,
} from "../../utils/keyboard.js";
import { t, DEFAULT_LOCALE, type Locale } from "../../i18n/index.js";

async function waitCallback(
  conversation: BotConversation,
  ctx: BotContext,
  pattern: RegExp,
  locale: Locale,
): Promise<string | null> {
  const cbCtx = await conversation.waitForCallbackQuery(
    new RegExp(pattern.source + "|^conv:cancel"),
  );
  const data = cbCtx.callbackQuery.data;
  if (data === "conv:cancel") {
    await cbCtx.answerCallbackQuery();
    await ctx.reply(t(locale, "onboarding.cancelled"), { reply_markup: mainKeyboard(locale) });
    return null;
  }
  await cbCtx.answerCallbackQuery();
  return data;
}

async function waitText(
  conversation: BotConversation,
  ctx: BotContext,
  locale: Locale,
): Promise<string | null> {
  const textCtx = await conversation.waitFor("message:text");
  if (textCtx.message.text.trim() === "/cancel") {
    await ctx.reply(t(locale, "onboarding.cancelled"), { reply_markup: mainKeyboard(locale) });
    return null;
  }
  return textCtx.message.text;
}

export async function onboarding(conversation: BotConversation, ctx: BotContext) {
  const telegramId = ctx.from!.id;

  // 0. Language selection
  await ctx.reply("🌐 Choose your language / Choisis ta langue :", {
    reply_markup: languageKeyboard(),
  });
  const langCtx = await conversation.waitForCallbackQuery(/^lang:/);
  await langCtx.answerCallbackQuery();
  const locale = langCtx.callbackQuery.data.replace("lang:", "") as Locale;

  // 1. Username
  await ctx.reply(t(locale, "onboarding.ask_name"));
  const username = await waitText(conversation, ctx, locale);
  if (!username) return;

  // 2. Goal
  await ctx.reply(t(locale, "onboarding.ask_goal"), { reply_markup: onboardingGoalKeyboard(locale) });
  const goalData = await waitCallback(conversation, ctx, /^goal:/, locale);
  if (!goalData) return;
  const goal = goalData.replace("goal:", "");

  // 3. Weight
  await ctx.reply(t(locale, "onboarding.ask_weight"));
  const weightText = await waitText(conversation, ctx, locale);
  if (!weightText) return;
  const weight = parseFloat(weightText);

  // 4. Height
  await ctx.reply(t(locale, "onboarding.ask_height"));
  const heightText = await waitText(conversation, ctx, locale);
  if (!heightText) return;
  const height = parseFloat(heightText);

  // 5. Age
  await ctx.reply(t(locale, "onboarding.ask_age"));
  const ageText = await waitText(conversation, ctx, locale);
  if (!ageText) return;
  const age = parseInt(ageText);

  // 6. Batch cooking
  await ctx.reply(t(locale, "onboarding.ask_batch"), { reply_markup: onboardingBatchKeyboard(locale) });
  const batchData = await waitCallback(conversation, ctx, /^batch:/, locale);
  if (!batchData) return;
  const batchCooking = batchData === "batch:true";

  // 9. Dietary restrictions (multi-select)
  const restrictions: string[] = [];
  await ctx.reply(t(locale, "onboarding.ask_restrictions"), {
    reply_markup: onboardingRestrictionsKeyboard(locale),
  });
  let restrictionsCancelled = false;
  while (true) {
    const data = await waitCallback(conversation, ctx, /^restrict:|^restrictions:done/, locale);
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
  await ctx.reply(t(locale, "onboarding.ask_equipment"));
  const equipmentText = await waitText(conversation, ctx, locale);
  if (!equipmentText) return;

  // 11. Extra preferences
  await ctx.reply(t(locale, "onboarding.ask_extra"));
  const extraText = await waitText(conversation, ctx, locale);
  if (!extraText) return;
  const extra = extraText.toLowerCase() === "non" || extraText.toLowerCase() === "no" ? null : extraText;

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
    language: locale,
  });

  await ctx.reply(
    t(locale, "onboarding.profile_created", { name: username }),
    { reply_markup: mainKeyboard(locale) },
  );
}
