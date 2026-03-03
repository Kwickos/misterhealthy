import { Bot, type Context, session, type SessionFlavor } from "grammy";
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import { config } from "./config.js";
import { mainKeyboard } from "./utils/keyboard.js";
import { onboarding } from "./modules/profile/onboarding.js";
import { handleProfile } from "./modules/profile/handlers.js";
import { generateMenuConversation, handleMenuCallbacks } from "./modules/menu/handlers.js";
import { handleMyMenu } from "./modules/menu/display.js";
import { handleShoppingList } from "./modules/shopping/handlers.js";
import { handleValidationCallbacks, handlePhotoMessage } from "./modules/gamification/handlers.js";
import { handleStats, handleBadgesCallback, handleStatsHistoryCallback, handleStatsBackCallback, horairesConversation } from "./modules/gamification/stats.js";

type SessionData = Record<string, never>;
export type BotContext = ConversationFlavor<Context & SessionFlavor<SessionData>>;
export type BotConversation = Conversation<BotContext, BotContext>;

export const bot = new Bot<BotContext>(config.telegramBotToken);

// Auth: check user has profile (except /start which handles invite code)
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  // Always allow /start (handles invite code for new users)
  const text = ctx.message?.text ?? "";
  if (text.startsWith("/start")) {
    await next();
    return;
  }
  // Allow conversations in progress (onboarding)
  await next();
});

// Session and conversations
bot.use(session({ initial: () => ({}) }));
bot.use(conversations());
bot.use(createConversation(onboarding));
bot.use(createConversation(generateMenuConversation));
bot.use(createConversation(horairesConversation));

// /start command — handles invite code via deep link or conversation
bot.command("start", async (ctx) => {
  const { getProfile } = await import("./services/supabase.js");
  const profile = await getProfile(ctx.from!.id);

  if (profile) {
    await ctx.reply(`Re-bonjour ${profile.username ?? ""}! Que veux-tu faire ?`, {
      reply_markup: mainKeyboard(),
      parse_mode: "HTML",
    });
    return;
  }

  // New user — check invite code if configured
  if (config.inviteCode) {
    const args = ctx.match; // text after /start
    if (args === config.inviteCode) {
      await ctx.reply(
        "Bienvenue sur MisterHealthy !\nJe vais t'aider à créer ton profil pour générer des menus personnalisés."
      );
      await ctx.conversation.enter("onboarding");
      return;
    }
    // No valid code via deep link — ask for it
    await ctx.reply("Ce bot est privé. Entre le code d'invitation :");
    return;
  }

  await ctx.reply(
    "Bienvenue sur MisterHealthy !\nJe vais t'aider à créer ton profil pour générer des menus personnalisés."
  );
  await ctx.conversation.enter("onboarding");
});

// Listen for invite code typed in chat
bot.hears(/.+/, async (ctx, next) => {
  if (!config.inviteCode) return next();
  const { getProfile } = await import("./services/supabase.js");
  const profile = await getProfile(ctx.from!.id);
  if (profile) return next();

  // User has no profile — check if message is the invite code
  if (ctx.message?.text?.trim() === config.inviteCode) {
    await ctx.reply(
      "Code accepté ! Bienvenue sur MisterHealthy !\nJe vais t'aider à créer ton profil."
    );
    await ctx.conversation.enter("onboarding");
    return;
  }
  await ctx.reply("Code incorrect. Réessaie ou demande le bon code à l'administrateur.");
});

// Commands
bot.command("stats", handleStats);
bot.command("badges", async (ctx) => {
  // Show first page of badges
  await handleStats(ctx);
});
bot.command("horaires", async (ctx) => {
  await ctx.conversation.enter("horairesConversation");
});

// Main menu button handlers
bot.hears("\u{1F37D} G\u00e9n\u00e9rer menu", async (ctx) => {
  await ctx.conversation.enter("generateMenuConversation");
});
bot.hears("\u{1F4CB} Mon menu", handleMyMenu);
bot.hears("\u{1F6D2} Liste de courses", handleShoppingList);
bot.hears("\u{1F4CA} Mes stats", handleStats);
bot.hears("\u{1F464} Mon profil", handleProfile);

// Photo handler (for meal validation photos)
bot.on("message:photo", async (ctx, next) => {
  const handled = await handlePhotoMessage(ctx);
  if (!handled) await next();
});

// Callback query handlers for inline keyboards
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  // Gamification callbacks
  if (data.startsWith("validate:")) {
    await handleValidationCallbacks(ctx);
    return;
  }
  if (data.startsWith("badges:")) {
    await handleBadgesCallback(ctx);
    return;
  }
  if (data.startsWith("stats:")) {
    await handleStatsHistoryCallback(ctx) || await handleStatsBackCallback(ctx);
    return;
  }

  // Menu callbacks (existing)
  await handleMenuCallbacks(ctx);
});
