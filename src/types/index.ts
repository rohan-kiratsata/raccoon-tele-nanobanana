import { Context } from "telegraf";
import { Update } from "telegraf/types";
import { User } from "@prisma/client";

// Extended context with user data from database
export interface BotContext extends Context<Update> {
  // Database user (populated by middleware)
  dbUser?: User;
  
  // Command arguments
  commandArgs?: string[];
}

// Command handler type
export type CommandHandler = (ctx: BotContext) => Promise<void>;

// Middleware type
export type BotMiddleware = (
  ctx: BotContext,
  next: () => Promise<void>
) => Promise<void>;

// Command definition
export interface CommandDefinition {
  command: string;
  description: string;
  handler: CommandHandler;
}

export { User };

