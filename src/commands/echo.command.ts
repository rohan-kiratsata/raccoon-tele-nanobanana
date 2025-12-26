import { BotContext } from "../types/index.js";

/**
 * /echo command handler
 * Echoes back the user's message
 */
export async function echoCommand(ctx: BotContext): Promise<void> {
  const args = ctx.commandArgs;

  if (!args || args.length === 0) {
    await ctx.reply(
      "💡 *Usage:* `/echo <your message>`\n\nExample: `/echo Hello World`",
      { parse_mode: "Markdown" }
    );
    return;
  }

  const text = args.join(" ");
  
  // Escape markdown special characters for safety
  const safeText = text
    .replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");

  await ctx.reply(`🔊 ${safeText}`, { parse_mode: "MarkdownV2" });
}

export default echoCommand;

