import type { BotContext, BotConversation } from "../../bot.js";
import { getLocale } from "../../bot.js";
import { getProfile, saveMenu, getLatestMenu, saveShoppingList, deleteMenu, getContextualBadgeNames } from "../../services/database.js";
import { generateMenu } from "../../services/gemini.js";
import { aggregateShoppingList } from "../../utils/shopping.js";
import { formatMenuOverview, formatDayDetail, formatRecipe, formatRecipeStep, formatIngredients, formatBatchCooking } from "../../utils/format.js";
import { daysKeyboard, dayMealsKeyboard, recipeBackKeyboard, recipeStepKeyboard, mainKeyboard, onboardingDaysKeyboard, onboardingMealsKeyboard, onboardingServingsKeyboard } from "../../utils/keyboard.js";
import type { MenuData, DayMenu, Meal } from "../../types.js";
import { InlineKeyboard } from "grammy";
import { t, DEFAULT_LOCALE, type Locale } from "../../i18n/index.js";

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

export async function generateMenuConversation(conversation: BotConversation, ctx: BotContext) {
  const profile = await getProfile(ctx.from!.id);
  if (!profile) {
    await ctx.reply(t(DEFAULT_LOCALE, "profile.no_profile"));
    return;
  }

  const locale = getLocale(profile);

  // 1. Ask which days
  const selectedDays: string[] = [];
  await ctx.reply(t(locale, "menu.ask_days"), {
    reply_markup: onboardingDaysKeyboard(locale),
  });
  while (true) {
    const dayCtx = await conversation.waitForCallbackQuery(/^onb_day:|^onb_days:done|^conv:cancel/);
    const data = dayCtx.callbackQuery.data;
    if (data === "conv:cancel") {
      await dayCtx.answerCallbackQuery();
      await ctx.reply(t(locale, "menu.cancelled"), { reply_markup: mainKeyboard(locale) });
      return;
    }
    if (data === "onb_days:done") {
      await dayCtx.answerCallbackQuery();
      break;
    }
    const day = data.replace("onb_day:", "");
    if (selectedDays.includes(day)) {
      selectedDays.splice(selectedDays.indexOf(day), 1);
      await dayCtx.answerCallbackQuery({ text: t(locale, "menu.day_removed", { day }) });
    } else {
      selectedDays.push(day);
      await dayCtx.answerCallbackQuery({ text: t(locale, "menu.day_added", { day }) });
    }
  }

  const menuDays = selectedDays.length > 0
    ? selectedDays
    : ["lundi", "mardi", "mercredi", "jeudi", "vendredi"];

  // 2. Ask which meals
  const selectedMeals: string[] = [];
  await ctx.reply(t(locale, "menu.ask_meals"), {
    reply_markup: onboardingMealsKeyboard(locale),
  });
  while (true) {
    const mealCtx = await conversation.waitForCallbackQuery(/^meal:|^meals:done|^conv:cancel/);
    const data = mealCtx.callbackQuery.data;
    if (data === "conv:cancel") {
      await mealCtx.answerCallbackQuery();
      await ctx.reply(t(locale, "menu.cancelled"), { reply_markup: mainKeyboard(locale) });
      return;
    }
    if (data === "meals:done") {
      await mealCtx.answerCallbackQuery();
      break;
    }
    const meal = data.replace("meal:", "");
    if (selectedMeals.includes(meal)) {
      selectedMeals.splice(selectedMeals.indexOf(meal), 1);
      await mealCtx.answerCallbackQuery({ text: t(locale, "menu.meal_removed", { meal }) });
    } else {
      selectedMeals.push(meal);
      await mealCtx.answerCallbackQuery({ text: t(locale, "menu.meal_added", { meal }) });
    }
  }

  const mealsConfig = selectedMeals.length > 0
    ? selectedMeals
    : profile.meals_config;

  // 3. Ask servings
  await ctx.reply(t(locale, "menu.ask_servings"), {
    reply_markup: onboardingServingsKeyboard(locale),
  });
  const servingsCtx = await conversation.waitForCallbackQuery(/^servings:|^conv:cancel/);
  const servingsData = servingsCtx.callbackQuery.data;
  if (servingsData === "conv:cancel") {
    await servingsCtx.answerCallbackQuery();
    await ctx.reply(t(locale, "menu.cancelled"), { reply_markup: mainKeyboard(locale) });
    return;
  }
  await servingsCtx.answerCallbackQuery();
  const servings = parseInt(servingsData.replace("servings:", ""));

  // 4. Ask for extra instructions
  await ctx.reply(t(locale, "menu.ask_extra"));
  const extraCtx = await conversation.waitFor("message:text");
  if (extraCtx.message.text.trim() === "/cancel") {
    await ctx.reply(t(locale, "menu.cancelled"), { reply_markup: mainKeyboard(locale) });
    return;
  }
  const extraText = extraCtx.message.text.toLowerCase();
  const extraInstructions = extraText === "non" || extraText === "no"
    ? undefined
    : extraCtx.message.text;

  // 3. Generate
  await ctx.reply(t(locale, "menu.generating"), {
    reply_markup: mainKeyboard(locale),
  });

  try {
    const profileWithDays = { ...profile, menu_days: menuDays, meals_config: mealsConfig, servings };
    const badgeNames = await getContextualBadgeNames();
    const menuData = await generateMenu(profileWithDays, extraInstructions, badgeNames, locale);
    const weekStart = getWeekStart();

    const menu = await saveMenu(profile.id, weekStart, menuData, extraInstructions);

    const items = aggregateShoppingList(menuData);
    await saveShoppingList(menu.id, items);

    const text = formatMenuOverview(locale, menuData, weekStart);
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: daysKeyboard(locale, menuData),
    });
  } catch (err) {
    console.error("Menu generation error:", err);
    await ctx.reply(t(locale, "menu.error"));
  }
}

export async function handleMenuCallbacks(ctx: BotContext) {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  // profile:edit -> doesn't need a menu
  if (data === "profile:edit") {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter("onboarding");
    return;
  }

  const profile = await getProfile(ctx.from!.id);
  if (!profile) return;

  const locale = getLocale(profile);
  const menu = await getLatestMenu(profile.id);
  if (!menu) {
    await ctx.answerCallbackQuery({ text: t(locale, "menu.not_found") });
    return;
  }

  const menuData = menu.menu_data as MenuData;

  // day:lundi -> show day detail
  if (data.startsWith("day:")) {
    const dayKey = data.replace("day:", "");
    const dayMenu = menuData.days[dayKey];
    if (!dayMenu) {
      await ctx.answerCallbackQuery({ text: t(locale, "menu.day_not_found") });
      return;
    }
    const text = formatDayDetail(locale, dayKey, dayMenu);
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: dayMealsKeyboard(locale, dayKey, dayMenu),
    });
    return;
  }

  // recipe:lundi:dejeuner -> show step 1
  if (data.startsWith("recipe:")) {
    const [, dayKey, mealKey] = data.split(":");
    const meal = (menuData.days[dayKey] as Record<string, Meal>)?.[mealKey];
    if (!meal) {
      await ctx.answerCallbackQuery({ text: t(locale, "menu.recipe_not_found") });
      return;
    }
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(formatRecipeStep(locale, meal, 0), {
      parse_mode: "HTML",
      reply_markup: recipeStepKeyboard(locale, dayKey, mealKey, 0, meal.steps.length),
    });
    return;
  }

  // step:lundi:dejeuner:2 -> show step N
  if (data.startsWith("step:")) {
    const [, dayKey, mealKey, stepStr] = data.split(":");
    const meal = (menuData.days[dayKey] as Record<string, Meal>)?.[mealKey];
    if (!meal) {
      await ctx.answerCallbackQuery({ text: t(locale, "menu.recipe_not_found") });
      return;
    }
    const stepIndex = parseInt(stepStr);
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(formatRecipeStep(locale, meal, stepIndex), {
      parse_mode: "HTML",
      reply_markup: recipeStepKeyboard(locale, dayKey, mealKey, stepIndex, meal.steps.length),
    });
    return;
  }

  // recipe_full:lundi:dejeuner -> show all steps
  if (data.startsWith("recipe_full:")) {
    const [, dayKey, mealKey] = data.split(":");
    const meal = (menuData.days[dayKey] as Record<string, Meal>)?.[mealKey];
    if (!meal) {
      await ctx.answerCallbackQuery({ text: t(locale, "menu.recipe_not_found") });
      return;
    }
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(formatRecipe(meal), {
      parse_mode: "HTML",
      reply_markup: recipeBackKeyboard(locale, dayKey),
    });
    return;
  }

  // ingredients:lundi:dejeuner -> show ingredients
  if (data.startsWith("ingredients:")) {
    const [, dayKey, mealKey] = data.split(":");
    const meal = (menuData.days[dayKey] as Record<string, Meal>)?.[mealKey];
    if (!meal) {
      await ctx.answerCallbackQuery({ text: t(locale, "menu.ingredients_not_found") });
      return;
    }
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(formatIngredients(locale, meal), {
      parse_mode: "HTML",
      reply_markup: recipeBackKeyboard(locale, dayKey),
    });
    return;
  }

  // batch:view -> show batch cooking
  if (data === "batch:view") {
    const text = formatBatchCooking(locale, menuData);
    if (!text) {
      await ctx.answerCallbackQuery({ text: t(locale, "menu.no_batch") });
      return;
    }
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().text(t(locale, "kb.back"), "back:menu"),
    });
    return;
  }

  // back:menu -> show menu overview
  if (data === "back:menu") {
    const text = formatMenuOverview(locale, menuData, menu.week_start);
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: daysKeyboard(locale, menuData),
    });
    return;
  }

  // menu:delete -> confirm deletion
  if (data === "menu:delete") {
    const confirmKb = new InlineKeyboard()
      .text(t(locale, "kb.yes_delete"), "menu:delete:confirm")
      .text(t(locale, "kb.no_cancel"), "back:menu");
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(t(locale, "menu.confirm_delete"), {
      reply_markup: confirmKb,
    });
    return;
  }

  // menu:delete:confirm -> actually delete
  if (data === "menu:delete:confirm") {
    await deleteMenu(menu.id);
    await ctx.answerCallbackQuery({ text: t(locale, "menu.deleted") });
    await ctx.editMessageText(t(locale, "menu.deleted_long"));
    return;
  }

  await ctx.answerCallbackQuery();
}
