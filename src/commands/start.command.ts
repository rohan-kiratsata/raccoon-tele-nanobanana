import { BotContext } from "../types/index.js";
import logger from "../utils/logger.js";

/**
 * /start command handler
 * Welcomes the user and provides basic information about the bot
 */
export async function startCommand(ctx: BotContext): Promise<void> {
  const user = ctx.from;
  const dbUser = ctx.dbUser;

  if (!user) {
    return;
  }

  const isNewUser = dbUser && 
    new Date().getTime() - dbUser.createdAt.getTime() < 5000;

  const welcomeMessage = isNewUser
    ? `🎉 Welcome, ${user.first_name}!\n\nYour account has been created successfully.`
    : `👋 Welcome back, ${user.first_name}!`;

  const helpText = `
${welcomeMessage}

I'm a bot built with TypeScript and Prisma ORM.

📚 *Available Commands:*
/start - Show this welcome message
/help - Display all available commands
/me - View your profile information
/stats - View bot statistics
/settings - Manage your settings
/echo <text> - Echo back your message
/prompt - Generate images from text descriptions

💡 *Tip:* Use /help for more details on each command.
  `.trim();

  await ctx.reply(helpText, { parse_mode: "Markdown" });
  
  logger.info("Start command executed", {
    userId: user.id,
    isNewUser,
  });
}

export default startCommand;

