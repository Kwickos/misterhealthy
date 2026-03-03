import { bot } from "./bot.js";
import { startScheduler } from "./services/scheduler.js";

console.log("Starting MisterHealthy bot...");
bot.start({
  onStart: () => {
    console.log("MisterHealthy bot is running!");
    startScheduler(bot);
    console.log("Reminder scheduler started.");
  },
});
