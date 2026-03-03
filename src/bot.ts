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

type SessionData = Record<string, never>;
export type BotContext = ConversationFlavor<Context & SessionFlavor<SessionData>>;
export type BotConversation = Conversation<BotContext, BotContext>;

export const bot = new Bot<BotContext>(config.telegramBotToken);

// Session and conversations
bot.use(session({ initial: () => ({}) }));
bot.use(conversations());
bot.use(createConversation(onboarding));
bot.use(createConversation(generateMenuConversation));

// /start command
bot.command("start", async (ctx) => {
  const { getProfile } = await import("./services/supabase.js");
  const profile = await getProfile(ctx.from!.id);

  if (!profile) {
    await ctx.reply(
      "Bienvenue sur MisterHealthy ! \u{1F957}\nJe vais t'aider \u00e0 cr\u00e9er ton profil pour g\u00e9n\u00e9rer des menus personnalis\u00e9s."
    );
    await ctx.conversation.enter("onboarding");
  } else {
    await ctx.reply(`Re-bonjour ${profile.username ?? ""}! Que veux-tu faire ?`, {
      reply_markup: mainKeyboard(),
      parse_mode: "HTML",
    });
  }
});

// Main menu button handlers
bot.hears("\u{1F37D} G\u00e9n\u00e9rer menu", async (ctx) => {
  await ctx.conversation.enter("generateMenuConversation");
});
bot.hears("\u{1F4CB} Mon menu", handleMyMenu);
bot.hears("\u{1F6D2} Liste de courses", handleShoppingList);
bot.hears("\u{1F464} Mon profil", handleProfile);

// Callback query handlers for inline keyboards
bot.on("callback_query:data", handleMenuCallbacks);
