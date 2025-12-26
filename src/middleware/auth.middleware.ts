import { BotContext, BotMiddleware } from "../types/index.js";
import userService from "../services/user.service.js";
import logger from "../utils/logger.js";

/**
 * Authentication middleware - ensures user exists in database
 * and attaches user data to context
 */
export const authMiddleware: BotMiddleware = async (ctx, next) => {
  // Skip if no user (e.g., channel posts)
  if (!ctx.from) {
    return next();
  }

  try {
    // Find or create user in database
    const user = await userService.findOrCreateUser({
      id: ctx.from.id,
      username: ctx.from.username,
      first_name: ctx.from.first_name,
      last_name: ctx.from.last_name,
      language_code: ctx.from.language_code,
      is_bot: ctx.from.is_bot,
      is_premium: ctx.from.is_premium,
    });

    // Attach user to context
    ctx.dbUser = user;

    logger.debug("User authenticated", {
      telegramId: ctx.from.id,
      username: ctx.from.username,
    });
  } catch (error) {
    logger.error("Failed to authenticate user", {
      error,
      telegramId: ctx.from.id,
    });
  }

  return next();
};

/**
 * Extract command arguments middleware
 */
export const parseCommandArgs: BotMiddleware = async (
  ctx: BotContext,
  next
) => {
  const message = ctx.message;
  
  if (message && "text" in message) {
    const text = message.text;
    if (text.startsWith("/")) {
      // Extract arguments after the command
      const parts = text.split(/\s+/);
      ctx.commandArgs = parts.slice(1);
    }
  }

  return next();
};

export default authMiddleware;

