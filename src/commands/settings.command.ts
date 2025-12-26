import { BotContext } from "../types/index.js";
import prisma from "../db.js";
import userService from "../services/user.service.js";
import { Markup } from "telegraf";

/**
 * /settings command handler
 * Displays user settings with inline keyboard for modifications
 */
export async function settingsCommand(ctx: BotContext): Promise<void> {
  const user = ctx.from;
  
  if (!user) {
    return;
  }

  const dbUser = await prisma.user.findUnique({
    where: { telegramId: BigInt(user.id) },
    include: { settings: true },
  });

  if (!dbUser) {
    await ctx.reply("❌ Please run /start first to initialize your account.");
    return;
  }

  const settings = dbUser.settings;
  const notifStatus = settings?.notificationsEnabled ? "🔔 On" : "🔕 Off";

  const aspectRatio = settings?.defaultAspectRatio || "1:1";
  const imageSize = settings?.defaultImageSize || "1K";
  const model =
    settings?.defaultModel === "gemini-3-pro-image-preview"
      ? "Gemini 3 Pro"
      : "Gemini 2.5 Flash";

  const settingsText = `
⚙️ *Your Settings*

*General:*
├ Notifications: ${notifStatus}
└ Timezone: ${settings?.timezone || "UTC"}

*Image Generation:*
├ Aspect Ratio: \`${aspectRatio}\`
├ Image Size: \`${imageSize}\`
└ Model: \`${model}\`

Use the buttons below to modify your settings.
  `.trim();

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback(
        settings?.notificationsEnabled ? "🔕 Turn Off Notifications" : "🔔 Turn On Notifications",
        settings?.notificationsEnabled ? "settings:notif:off" : "settings:notif:on"
      ),
    ],
    [Markup.button.callback("🎨 Image Settings", "img:main")],
    [Markup.button.callback("🔄 Refresh", "settings:refresh")],
  ]);

  await ctx.reply(settingsText, {
    parse_mode: "Markdown",
    ...keyboard,
  });
}

/**
 * /notifications command handler
 * Quick toggle for notifications
 */
export async function notificationsCommand(ctx: BotContext): Promise<void> {
  const user = ctx.from;
  const args = ctx.commandArgs;

  if (!user) {
    return;
  }

  if (!args || args.length === 0) {
    await ctx.reply(
      "💡 *Usage:* `/notifications <on|off>`\n\nExample: `/notifications off`",
      { parse_mode: "Markdown" }
    );
    return;
  }

  const value = args[0].toLowerCase();
  
  if (value !== "on" && value !== "off") {
    await ctx.reply("❌ Invalid option. Use `on` or `off`.", { parse_mode: "Markdown" });
    return;
  }

  const enabled = value === "on";

  try {
    await userService.updateUserSettings(user.id, {
      notificationsEnabled: enabled,
    });

    await ctx.reply(
      enabled
        ? "🔔 Notifications have been *enabled*."
        : "🔕 Notifications have been *disabled*.",
      { parse_mode: "Markdown" }
    );
  } catch {
    await ctx.reply("❌ Failed to update settings. Please try again.");
  }
}

export default settingsCommand;

