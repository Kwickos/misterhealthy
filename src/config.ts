import "dotenv/config";

export const config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN!,
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY!,
  geminiApiKey: process.env.GEMINI_API_KEY!,
  inviteCode: process.env.INVITE_CODE ?? "",
} as const;
