import type { BotContext, BotConversation } from "../../bot.js";
import { getProfile, saveMenu, getLatestMenu, saveShoppingList, deleteMenu } from "../../services/supabase.js";
import { generateMenu } from "../../services/gemini.js";
import { aggregateShoppingList } from "../../utils/shopping.js";
import { formatMenuOverview, formatDayDetail, formatRecipe, formatIngredients } from "../../utils/format.js";
import { daysKeyboard, dayMealsKeyboard, recipeBackKeyboard, mainKeyboard, onboardingDaysKeyboard } from "../../utils/keyboard.js";
import type { MenuData, DayMenu, Meal } from "../../types.js";
import { InlineKeyboard } from "grammy";

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
    await ctx.reply("Tu n'as pas encore de profil. Tape /start pour commencer.");
    return;
  }

  // 1. Ask which days
  const selectedDays: string[] = [];
  await ctx.reply("Pour quels jours veux-tu un menu ? (clique puis Valider)", {
    reply_markup: onboardingDaysKeyboard(),
  });
  while (true) {
    const dayCtx = await conversation.waitForCallbackQuery(/^onb_day:|^onb_days:done/);
    const data = dayCtx.callbackQuery.data;
    if (data === "onb_days:done") {
      await dayCtx.answerCallbackQuery();
      break;
    }
    const day = data.replace("onb_day:", "");
    if (selectedDays.includes(day)) {
      selectedDays.splice(selectedDays.indexOf(day), 1);
      await dayCtx.answerCallbackQuery({ text: `${day} retiré` });
    } else {
      selectedDays.push(day);
      await dayCtx.answerCallbackQuery({ text: `${day} ajouté ✓` });
    }
  }

  const menuDays = selectedDays.length > 0
    ? selectedDays
    : ["lundi", "mardi", "mercredi", "jeudi", "vendredi"];

  // 2. Ask for extra instructions
  await ctx.reply("Des précisions pour cette semaine ? (ou envoie \"non\")\n(ex: \"cette semaine light\", \"avec du poisson\", \"budget serré\")");
  const extraCtx = await conversation.waitFor("message:text");
  const extraInstructions = extraCtx.message.text.toLowerCase() === "non"
    ? undefined
    : extraCtx.message.text;

  // 3. Generate
  await ctx.reply("⏳ Je génère ton menu personnalisé, ça peut prendre quelques secondes...", {
    reply_markup: mainKeyboard(),
  });

  try {
    const profileWithDays = { ...profile, menu_days: menuDays };
    const menuData = await generateMenu(profileWithDays, extraInstructions);
    const weekStart = getWeekStart();

    const menu = await saveMenu(profile.id, weekStart, menuData, extraInstructions);

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

  // profile:edit -> doesn't need a menu
  if (data === "profile:edit") {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter("onboarding");
    return;
  }

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

  // menu:delete -> confirm deletion
  if (data === "menu:delete") {
    const confirmKb = new InlineKeyboard()
      .text("Oui, supprimer", "menu:delete:confirm")
      .text("Non, annuler", "back:menu");
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("Tu es sûr de vouloir supprimer ce menu et sa liste de courses ?", {
      reply_markup: confirmKb,
    });
    return;
  }

  // menu:delete:confirm -> actually delete
  if (data === "menu:delete:confirm") {
    await deleteMenu(menu.id);
    await ctx.answerCallbackQuery({ text: "Menu supprimé" });
    await ctx.editMessageText("Menu supprimé. Clique sur \"Générer menu\" pour en créer un nouveau.");
    return;
  }

  await ctx.answerCallbackQuery();
}
