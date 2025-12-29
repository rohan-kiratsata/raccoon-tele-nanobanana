import { BotContext } from "../types/index.js";

/**
 * /help command handler
 * Displays detailed help information about all available commands
 */
export async function helpCommand(ctx: BotContext): Promise<void> {
  const helpText = `
📖 *Command Reference*

*Available Commands:*
/help - Display this help message
/stats - View bot usage statistics
/prompt - Generate an image from a text description
/image\\_settings - Configure image generation defaults (aspect ratio, size, model)

*Examples:*
\`/prompt\` - Start image generation (then send your description)
\`/image_settings\` - Configure default image generation settings
\`/stats\` - View bot usage statistics

💬 *Need Support?*
Contact the bot administrator for help.
  `.trim();

  await ctx.reply(helpText, { parse_mode: "Markdown" });
}

export default helpCommand;
