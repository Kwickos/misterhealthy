import type { BotConversation, BotContext } from "../../bot.js";
import { upsertProfile } from "../../services/supabase.js";
import { mainKeyboard } from "../../utils/keyboard.js";
import {
  onboardingGoalKeyboard,
  onboardingServingsKeyboard,
  onboardingMealsKeyboard,
  onboardingBatchKeyboard,
  onboardingRestrictionsKeyboard,
} from "../../utils/keyboard.js";

export async function onboarding(conversation: BotConversation, ctx: BotContext) {
  const telegramId = ctx.from!.id;

  // 1. Username
  await ctx.reply("Comment tu t'appelles ?");
  const nameCtx = await conversation.waitFor("message:text");
  const username = nameCtx.message.text;

  // 2. Goal
  await ctx.reply("Quel est ton objectif ?", { reply_markup: onboardingGoalKeyboard() });
  const goalCtx = await conversation.waitForCallbackQuery(/^goal:/);
  const goal = goalCtx.callbackQuery.data.replace("goal:", "");
  await goalCtx.answerCallbackQuery();

  // 3. Weight
  await ctx.reply("Ton poids en kg ? (ex: 75)");
  const weightCtx = await conversation.waitFor("message:text");
  const weight = parseFloat(weightCtx.message.text);

  // 4. Height
  await ctx.reply("Ta taille en cm ? (ex: 175)");
  const heightCtx = await conversation.waitFor("message:text");
  const height = parseFloat(heightCtx.message.text);

  // 5. Age
  await ctx.reply("Ton âge ?");
  const ageCtx = await conversation.waitFor("message:text");
  const age = parseInt(ageCtx.message.text);

  // 6. Servings
  await ctx.reply("Pour combien de personnes ?", { reply_markup: onboardingServingsKeyboard() });
  const servingsCtx = await conversation.waitForCallbackQuery(/^servings:/);
  const servings = parseInt(servingsCtx.callbackQuery.data.replace("servings:", ""));
  await servingsCtx.answerCallbackQuery();

  // 7. Meals config (multi-select)
  const selectedMeals: string[] = [];
  await ctx.reply("Quels repas veux-tu ? (clique puis Valider)", {
    reply_markup: onboardingMealsKeyboard(),
  });
  while (true) {
    const mealCtx = await conversation.waitForCallbackQuery(/^meal:|^meals:done/);
    const data = mealCtx.callbackQuery.data;
    if (data === "meals:done") {
      await mealCtx.answerCallbackQuery();
      break;
    }
    const meal = data.replace("meal:", "");
    if (selectedMeals.includes(meal)) {
      selectedMeals.splice(selectedMeals.indexOf(meal), 1);
      await mealCtx.answerCallbackQuery({ text: `${meal} retiré` });
    } else {
      selectedMeals.push(meal);
      await mealCtx.answerCallbackQuery({ text: `${meal} ajouté ✓` });
    }
  }

  // 8. Batch cooking
  await ctx.reply("Tu veux faire du batch cooking ?", { reply_markup: onboardingBatchKeyboard() });
  const batchCtx = await conversation.waitForCallbackQuery(/^batch:/);
  const batchCooking = batchCtx.callbackQuery.data === "batch:true";
  await batchCtx.answerCallbackQuery();

  // 10. Dietary restrictions (multi-select)
  const restrictions: string[] = [];
  await ctx.reply("Restrictions alimentaires ? (clique puis Valider)", {
    reply_markup: onboardingRestrictionsKeyboard(),
  });
  while (true) {
    const rCtx = await conversation.waitForCallbackQuery(/^restrict:|^restrictions:done/);
    const data = rCtx.callbackQuery.data;
    if (data === "restrictions:done") {
      await rCtx.answerCallbackQuery();
      break;
    }
    const r = data.replace("restrict:", "");
    if (r === "aucune") {
      restrictions.length = 0;
      await rCtx.answerCallbackQuery({ text: "Aucune restriction" });
      break;
    }
    if (restrictions.includes(r)) {
      restrictions.splice(restrictions.indexOf(r), 1);
      await rCtx.answerCallbackQuery({ text: `${r} retiré` });
    } else {
      restrictions.push(r);
      await rCtx.answerCallbackQuery({ text: `${r} ajouté ✓` });
    }
  }

  // 11. Equipment (free text)
  await ctx.reply("Quel équipement cuisine tu as ? Décris ce que tu as.\n(ex: \"four, plaques, thermomix, airfryer, micro-ondes, pas de robot\")");
  const equipCtx = await conversation.waitFor("message:text");
  const equipmentText = equipCtx.message.text;

  // 12. Extra preferences
  await ctx.reply("Autres précisions ? (ou envoie \"non\")");
  const extraCtx = await conversation.waitFor("message:text");
  const extra = extraCtx.message.text.toLowerCase() === "non" ? null : extraCtx.message.text;

  // Save profile
  await upsertProfile(telegramId, {
    username,
    weight,
    height,
    age,
    goal,
    meals_config: selectedMeals.length > 0 ? selectedMeals : ["dejeuner", "diner"],
    servings,
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
