import { bot } from "./bot.js";

console.log("Starting MisterHealthy bot...");
bot.start({
  onStart: () => console.log("MisterHealthy bot is running!"),
});
