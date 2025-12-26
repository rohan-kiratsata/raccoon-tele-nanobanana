import { BotMiddleware } from "../types/index.js";
import commandLogService from "../services/command-log.service.js";
import logger from "../utils/logger.js";

/**
 * Logging middleware - logs all incoming updates
 */
export const loggingMiddleware: BotMiddleware = async (ctx, next) => {
  const start = Date.now();
  
  // Log incoming update
  logger.debug("Incoming update", {
    updateType: ctx.updateType,
    chatId: ctx.chat?.id,
    userId: ctx.from?.id,
    username: ctx.from?.username,
  });

  await next();

  // Log response time
  const duration = Date.now() - start;
  logger.debug("Update processed", { duration: `${duration}ms` });
};

/**
 * Command logging middleware - logs command executions to database
 */
export const commandLoggingMiddleware: BotMiddleware = async (ctx, next) => {
  const message = ctx.message;
  
  if (message && "text" in message && message.text.startsWith("/")) {
    const text = message.text;
    const [commandWithBot, ...args] = text.split(/\s+/);
    const command = commandWithBot.split("@")[0]; // Remove @botname if present

    // Log command execution
    if (ctx.from && ctx.chat) {
      await commandLogService.logCommand({
        userId: ctx.from.id,
        command,
        args: args.length > 0 ? args.join(" ") : undefined,
        chatId: ctx.chat.id,
        chatType: ctx.chat.type,
      });
    }
  }

  return next();
};

export default loggingMiddleware;

