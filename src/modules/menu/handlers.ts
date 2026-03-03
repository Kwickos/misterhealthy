import type { BotContext } from "../../bot.js";
import { getProfile, saveMenu, getLatestMenu, saveShoppingList } from "../../services/supabase.js";
import { generateMenu } from "../../services/gemini.js";
import { aggregateShoppingList } from "../../utils/shopping.js";
import { formatMenuOverview, formatDayDetail, formatRecipe, formatIngredients } from "../../utils/format.js";
import { daysKeyboard, dayMealsKeyboard, recipeBackKeyboard, mainKeyboard } from "../../utils/keyboard.js";
import type { MenuData, DayMenu, Meal } from "../../types.js";

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

export async function handleGenerateMenu(ctx: BotContext) {
  const profile = await getProfile(ctx.from!.id);
  if (!profile) {
    await ctx.reply("Tu n'as pas encore de profil. Tape /start pour commencer.");
    return;
  }

  await ctx.reply("⏳ Je génère ton menu personnalisé, ça peut prendre quelques secondes...", {
    reply_markup: mainKeyboard(),
  });

  try {
    const menuData = await generateMenu(profile);
    const weekStart = getWeekStart();

    const menu = await saveMenu(profile.id, weekStart, menuData);

    // Generate and save shopping list
    const items = aggregateShoppingList(menuData);
    await saveShoppingList(menu.id, items);

    const text = formatMenuOverview(menuData, weekStart);
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: daysKeyboard(menuData),
    });
  } catch (err) {
    console.error("Menu generation error:", err);
    await ctx.reply("Erreur lors de la génération du menu. Réessaie dans quelques instants.");
  }
}

export async function handleMenuCallbacks(ctx: BotContext) {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  const profile = await getProfile(ctx.from!.id);
  if (!profile) return;

  const menu = await getLatestMenu(profile.id);
  if (!menu) {
    await ctx.answerCallbackQuery({ text: "Aucun menu trouvé" });
    return;
  }

  const menuData = menu.menu_data as MenuData;

  // day:lundi -> show day detail
  if (data.startsWith("day:")) {
    const dayKey = data.replace("day:", "");
    const dayMenu = menuData.days[dayKey];
    if (!dayMenu) {
      await ctx.answerCallbackQuery({ text: "Jour non trouvé" });
      return;
    }
    const text = formatDayDetail(dayKey, dayMenu);
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: dayMealsKeyboard(dayKey, dayMenu),
    });
    return;
  }

  // recipe:lundi:dejeuner -> show recipe
  if (data.startsWith("recipe:")) {
    const [, dayKey, mealKey] = data.split(":");
    const meal = (menuData.days[dayKey] as Record<string, Meal>)?.[mealKey];
    if (!meal) {
      await ctx.answerCallbackQuery({ text: "Recette non trouvée" });
      return;
    }
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(formatRecipe(meal), {
      parse_mode: "HTML",
      reply_markup: recipeBackKeyboard(dayKey),
    });
    return;
  }

  // ingredients:lundi:dejeuner -> show ingredients
  if (data.startsWith("ingredients:")) {
    const [, dayKey, mealKey] = data.split(":");
    const meal = (menuData.days[dayKey] as Record<string, Meal>)?.[mealKey];
    if (!meal) {
      await ctx.answerCallbackQuery({ text: "Ingrédients non trouvés" });
      return;
    }
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(formatIngredients(meal), {
      parse_mode: "HTML",
      reply_markup: recipeBackKeyboard(dayKey),
    });
    return;
  }

  // back:menu -> show menu overview
  if (data === "back:menu") {
    const text = formatMenuOverview(menuData, menu.week_start);
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: daysKeyboard(menuData),
    });
    return;
  }

  // profile:edit -> re-enter onboarding
  if (data === "profile:edit") {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter("onboarding");
    return;
  }

  await ctx.answerCallbackQuery();
}
