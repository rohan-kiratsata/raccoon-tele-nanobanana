import { BotContext } from "../types/index.js";

/**
 * /help command handler
 * Displays detailed help information about all available commands
 */
export async function helpCommand(ctx: BotContext): Promise<void> {
  const helpText = `
📖 *Command Reference*

*General Commands:*
/start - Initialize the bot and see welcome message
/help - Display this help message
/me - View your profile and account information

*Utility Commands:*
/echo <text> - Bot will echo back your message
/stats - View bot usage statistics
/prompt - Generate an image from a text description

*Settings Commands:*
/settings - View and manage your preferences
/image_settings - Configure image generation defaults (aspect ratio, size, model)
/notifications <on|off> - Toggle notifications

*Examples:*
\`/echo Hello World\` - Bot replies "Hello World"
\`/prompt\` - Start image generation (then send your description)
\`/image_settings\` - Configure default image generation settings
\`/notifications off\` - Disable notifications

💬 *Need Support?*
Contact the bot administrator for help.
  `.trim();

  await ctx.reply(helpText, { parse_mode: "Markdown" });
}

export default helpCommand;

