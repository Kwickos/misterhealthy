import "dotenv/config";

export const config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN!,
  geminiApiKey: process.env.GEMINI_API_KEY!,
  inviteCode: process.env.INVITE_CODE ?? "",
  databasePath: process.env.DATABASE_PATH ?? "./data/misterhealthy.db",
} as const;
