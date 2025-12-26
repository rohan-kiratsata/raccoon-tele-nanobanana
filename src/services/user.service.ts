import { User } from "@prisma/client";
import prisma from "../db.js";
import logger from "../utils/logger.js";

export interface TelegramUser {
  id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  language_code?: string;
  is_bot: boolean;
  is_premium?: boolean;
}

export class UserService {
  /**
   * Find or create a user based on Telegram user data
   */
  async findOrCreateUser(telegramUser: TelegramUser): Promise<User> {
    const existingUser = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramUser.id) },
    });

    if (existingUser) {
      // Update last seen and any changed fields
      return this.updateUser(telegramUser);
    }

    return this.createUser(telegramUser);
  }

  /**
   * Create a new user
   */
  async createUser(telegramUser: TelegramUser): Promise<User> {
    logger.info("Creating new user", { telegramId: telegramUser.id });

    const user = await prisma.user.create({
      data: {
        telegramId: BigInt(telegramUser.id),
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        languageCode: telegramUser.language_code,
        isBot: telegramUser.is_bot,
        isPremium: telegramUser.is_premium ?? false,
        settings: {
          create: {
            notificationsEnabled: true,
            timezone: "UTC",
            defaultAspectRatio: "1:1",
            defaultImageSize: "1K",
            defaultModel: "gemini-3-pro-image-preview",
          },
        },
      },
      include: {
        settings: true,
      },
    });

    return user;
  }

  /**
   * Update existing user
   */
  async updateUser(telegramUser: TelegramUser): Promise<User> {
    return prisma.user.update({
      where: { telegramId: BigInt(telegramUser.id) },
      data: {
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        languageCode: telegramUser.language_code,
        isPremium: telegramUser.is_premium ?? false,
        lastSeenAt: new Date(),
      },
    });
  }

  /**
   * Get user by Telegram ID
   */
  async getUserByTelegramId(telegramId: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      include: {
        settings: true,
      },
    });
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    activeToday: number;
    activeThisWeek: number;
  }> {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfWeek = new Date(
      startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000
    );

    const [totalUsers, activeToday, activeThisWeek] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { lastSeenAt: { gte: startOfDay } },
      }),
      prisma.user.count({
        where: { lastSeenAt: { gte: startOfWeek } },
      }),
    ]);

    return { totalUsers, activeToday, activeThisWeek };
  }

  /**
   * Update user settings
   */
  async updateUserSettings(
    telegramId: number,
    settings: {
      notificationsEnabled?: boolean;
      timezone?: string;
      defaultAspectRatio?: string;
      defaultImageSize?: string;
      defaultModel?: string;
    }
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });

    if (!user) {
      throw new Error("User not found");
    }

    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: settings,
      create: {
        userId: user.id,
        notificationsEnabled: true,
        timezone: "UTC",
        defaultAspectRatio: "1:1",
        defaultImageSize: "1K",
        defaultModel: "gemini-3-pro-image-preview",
        ...settings,
      },
    });
  }

  /**
   * Get user's image generation defaults
   */
  async getImageDefaults(telegramId: number): Promise<{
    aspectRatio: "1:1" | "9:16" | "16:9" | "4:3" | "3:4";
    imageSize: "1K" | "2K";
    model: "gemini-2.5-flash-image" | "gemini-3-pro-image-preview";
  }> {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      include: { settings: true },
    });
    const settings = user?.settings;

    return {
      aspectRatio:
        (settings?.defaultAspectRatio as "1:1" | "9:16" | "16:9" | "4:3" | "3:4") ||
        "1:1",
      imageSize: (settings?.defaultImageSize as "1K" | "2K") || "1K",
      model:
        (settings?.defaultModel as
          | "gemini-2.5-flash-image"
          | "gemini-3-pro-image-preview") || "gemini-3-pro-image-preview",
    };
  }
}

export const userService = new UserService();
export default userService;
