import { BotContext } from "../types/index.js";
import prisma from "../db.js";

/**
 * /me command handler
 * Displays user's profile information from the database
 */
export async function meCommand(ctx: BotContext): Promise<void> {
  const user = ctx.from;
  const dbUser = ctx.dbUser;

  if (!user || !dbUser) {
    await ctx.reply("❌ Could not retrieve your profile. Please try /start first.");
    return;
  }

  // Get user with settings
  const fullUser = await prisma.user.findUnique({
    where: { telegramId: BigInt(user.id) },
    include: { 
      settings: true,
      _count: {
        select: { commandLogs: true }
      }
    },
  });

  if (!fullUser) {
    await ctx.reply("❌ User not found in database.");
    return;
  }

  const profileText = `
👤 *Your Profile*

*Basic Info:*
├ First Name: ${fullUser.firstName}
├ Last Name: ${fullUser.lastName || "Not set"}
├ Username: ${fullUser.username ? `@${fullUser.username}` : "Not set"}
└ Language: ${fullUser.languageCode || "Unknown"}

*Account:*
├ Telegram ID: \`${fullUser.telegramId.toString()}\`
├ Premium: ${fullUser.isPremium ? "✅ Yes" : "❌ No"}
├ Created: ${fullUser.createdAt.toLocaleDateString()}
└ Last Active: ${fullUser.lastSeenAt.toLocaleDateString()}

*Statistics:*
└ Commands Used: ${fullUser._count.commandLogs}

*Settings:*
├ Notifications: ${fullUser.settings?.notificationsEnabled ? "🔔 On" : "🔕 Off"}
└ Timezone: ${fullUser.settings?.timezone || "UTC"}
  `.trim();

  await ctx.reply(profileText, { parse_mode: "Markdown" });
}

export default meCommand;

