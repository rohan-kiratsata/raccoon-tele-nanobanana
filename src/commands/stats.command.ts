import { BotContext } from "../types/index.js";
import userService from "../services/user.service.js";
import commandLogService from "../services/command-log.service.js";

/**
 * /stats command handler
 * Displays bot statistics
 */
export async function statsCommand(ctx: BotContext): Promise<void> {
  const [userStats, commandStats] = await Promise.all([
    userService.getUserStats(),
    commandLogService.getCommandStats(7),
  ]);

  const topCommands = commandStats
    .slice(0, 5)
    .map((c, i) => `${i + 1}. ${c.command} - ${c.count} uses`)
    .join("\n");

  const statsText = `
📊 *Bot Statistics*

*Users:*
├ Total Users: ${userStats.totalUsers}
├ Active Today: ${userStats.activeToday}
└ Active This Week: ${userStats.activeThisWeek}

*Top Commands (Last 7 Days):*
${topCommands || "No commands recorded yet"}

_Statistics are updated in real-time._
  `.trim();

  await ctx.reply(statsText, { parse_mode: "Markdown" });
}

export default statsCommand;

