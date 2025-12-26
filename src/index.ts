import { createBot, setBotCommands } from "./bot.js";
import { disconnectDb } from "./db.js";
import logger from "./utils/logger.js";
import { config } from "./config.js";

/**
 * Main entry point
 */
async function main(): Promise<void> {
  logger.info("Starting Telegram bot...", {
    environment: config.nodeEnv,
  });

  // Create bot instance
  const bot = createBot();

  // Set up bot commands in Telegram
  await setBotCommands(bot);

  // Launch bot
  if (config.nodeEnv === "production") {
    // Use webhook in production (recommended for high-traffic bots)
    // You'll need to configure WEBHOOK_URL and WEBHOOK_PORT
    logger.info("Production mode - using long polling");
    await bot.launch();
  } else {
    // Use long polling in development
    logger.info("Development mode - using long polling");
    await bot.launch();
  }

  logger.info("🤖 Bot is running!");

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down...`);
    
    bot.stop(signal);
    await disconnectDb();
    
    logger.info("Shutdown complete");
    process.exit(0);
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

// Run the bot
main().catch((error) => {
  logger.error("Failed to start bot", { error });
  process.exit(1);
});

