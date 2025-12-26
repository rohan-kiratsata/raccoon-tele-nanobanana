import { Telegraf } from "telegraf";
import { config } from "./config.js";
import { BotContext } from "./types/index.js";
import { authMiddleware, parseCommandArgs } from "./middleware/auth.middleware.js";
import { loggingMiddleware, commandLoggingMiddleware } from "./middleware/logging.middleware.js";
import {
  startCommand,
  helpCommand,
  meCommand,
  statsCommand,
  echoCommand,
  settingsCommand,
  notificationsCommand,
  promptCommand,
  handlePromptInput,
  cancelPromptCommand,
  imageSettingsCommand,
  handleImageSettingsCallback,
  applyImageSetting,
} from "./commands/index.js";
import logger from "./utils/logger.js";
import userService from "./services/user.service.js";
import prisma from "./db.js";

/**
 * Create and configure the Telegram bot
 */
export function createBot(): Telegraf<BotContext> {
  const bot = new Telegraf<BotContext>(config.botToken);

  // Register middleware (order matters!)
  bot.use(loggingMiddleware);
  bot.use(authMiddleware);
  bot.use(parseCommandArgs);
  bot.use(commandLoggingMiddleware);

  // Register commands
  bot.command("start", startCommand);
  bot.command("help", helpCommand);
  bot.command("me", meCommand);
  bot.command("stats", statsCommand);
  bot.command("echo", echoCommand);
  bot.command("settings", settingsCommand);
  bot.command("notifications", notificationsCommand);
  bot.command("prompt", promptCommand);
  bot.command("cancel", cancelPromptCommand);
  bot.command("image_settings", imageSettingsCommand);

  // Handle callback queries (for inline keyboards)
  bot.on("callback_query", async (ctx) => {
    const data = "data" in ctx.callbackQuery ? ctx.callbackQuery.data : null;
    
    if (!data || !ctx.from) {
      return;
    }

    logger.debug("Callback query received", { data, userId: ctx.from.id });

    // Handle settings callbacks
    if (data.startsWith("settings:")) {
      const action = data.split(":")[1];
      const value = data.split(":")[2];

      if (action === "notif") {
        const enabled = value === "on";
        await userService.updateUserSettings(ctx.from.id, {
          notificationsEnabled: enabled,
        });
        
        await ctx.answerCbQuery(
          enabled ? "🔔 Notifications enabled" : "🔕 Notifications disabled"
        );

        // Refresh the settings message
        const dbUser = await prisma.user.findUnique({
          where: { telegramId: BigInt(ctx.from.id) },
          include: { settings: true },
        });

        if (dbUser && ctx.callbackQuery.message) {
          const settings = dbUser.settings;
          const notifStatus = settings?.notificationsEnabled ? "🔔 On" : "🔕 Off";

          const settingsText = `
⚙️ *Your Settings*

*Notifications:* ${notifStatus}
*Timezone:* ${settings?.timezone || "UTC"}

Use the buttons below to modify your settings.
          `.trim();

          await ctx.editMessageText(settingsText, {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: settings?.notificationsEnabled
                      ? "🔕 Turn Off Notifications"
                      : "🔔 Turn On Notifications",
                    callback_data: settings?.notificationsEnabled
                      ? "settings:notif:off"
                      : "settings:notif:on",
                  },
                ],
                [{ text: "🔄 Refresh", callback_data: "settings:refresh" }],
              ],
            },
          });
        }
      } else if (action === "refresh") {
        await ctx.answerCbQuery("Settings refreshed");
        // Trigger settings command to refresh
        await settingsCommand(ctx as unknown as BotContext);
      } else if (action === "back") {
        await ctx.answerCbQuery("Going back...");
        await settingsCommand(ctx as unknown as BotContext);
      }
    }
    // Handle image settings callbacks
    else if (data.startsWith("img:")) {
      const parts = data.split(":");
      const action = parts[1];

      if (action === "main") {
        await ctx.answerCbQuery("Opening image settings...");
        await imageSettingsCommand(ctx as unknown as BotContext);
      } else if (action === "aspect" || action === "size" || action === "model") {
        await handleImageSettingsCallback(ctx as unknown as BotContext, action);
      } else if (action === "set") {
        const setting = parts[2] as "aspect" | "size" | "model";
        const value = parts[3];
        await applyImageSetting(ctx as unknown as BotContext, setting, value);
      } else if (action === "refresh" || action === "back") {
        await handleImageSettingsCallback(ctx as unknown as BotContext, action);
      }
    }
  });

  // Handle plain text messages
  bot.on("text", async (ctx) => {
    // First check if user is waiting for prompt input
    const handled = await handlePromptInput(ctx);
    if (handled) {
      return; // Prompt input was handled
    }

    // This catches all other text that isn't a command
    logger.debug("Text message received", {
      text: ctx.message.text,
      userId: ctx.from?.id,
    });
  });

  // Error handling
  bot.catch((err, ctx) => {
    logger.error("Bot error", {
      error: err,
      updateType: ctx.updateType,
      userId: ctx.from?.id,
    });
    
    // Try to notify user of error
    ctx.reply("❌ An error occurred. Please try again later.").catch(() => {
      // Ignore if we can't send error message
    });
  });

  return bot;
}

/**
 * Set bot commands in Telegram (shown in command menu)
 */
export async function setBotCommands(bot: Telegraf<BotContext>): Promise<void> {
  await bot.telegram.setMyCommands([
    { command: "start", description: "Start the bot and see welcome message" },
    { command: "help", description: "Show available commands" },
    { command: "me", description: "View your profile information" },
    { command: "stats", description: "View bot statistics" },
    { command: "settings", description: "Manage your settings" },
    { command: "image_settings", description: "Configure image generation defaults" },
    { command: "echo", description: "Echo back your message" },
    { command: "prompt", description: "Generate an image from a text prompt" },
    { command: "notifications", description: "Toggle notifications on/off" },
  ]);

  logger.info("Bot commands registered");
}

export default createBot;

