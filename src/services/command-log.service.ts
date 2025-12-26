import prisma from "../db.js";
import logger from "../utils/logger.js";

export interface CommandLogData {
  userId: number;
  command: string;
  args?: string;
  chatId: number;
  chatType: string;
}

export class CommandLogService {
  /**
   * Log a command execution
   */
  async logCommand(data: CommandLogData): Promise<void> {
    try {
      // First get the database user ID
      const user = await prisma.user.findUnique({
        where: { telegramId: BigInt(data.userId) },
        select: { id: true },
      });

      if (!user) {
        logger.warn("Cannot log command - user not found", {
          telegramId: data.userId,
        });
        return;
      }

      await prisma.commandLog.create({
        data: {
          userId: user.id,
          command: data.command,
          args: data.args,
          chatId: BigInt(data.chatId),
          chatType: data.chatType,
        },
      });

      logger.debug("Command logged", {
        command: data.command,
        userId: data.userId,
      });
    } catch (error) {
      logger.error("Failed to log command", { error, data });
    }
  }

  /**
   * Get command statistics
   */
  async getCommandStats(
    days: number = 7
  ): Promise<{ command: string; count: number }[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const stats = await prisma.commandLog.groupBy({
      by: ["command"],
      _count: { command: true },
      where: {
        createdAt: { gte: since },
      },
      orderBy: {
        _count: { command: "desc" },
      },
    });

    return stats.map((s) => ({
      command: s.command,
      count: s._count.command,
    }));
  }

  /**
   * Get user's command history
   */
  async getUserCommandHistory(
    telegramId: number,
    limit: number = 10
  ): Promise<{ command: string; createdAt: Date }[]> {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      select: { id: true },
    });

    if (!user) {
      return [];
    }

    return prisma.commandLog.findMany({
      where: { userId: user.id },
      select: { command: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}

export const commandLogService = new CommandLogService();
export default commandLogService;
