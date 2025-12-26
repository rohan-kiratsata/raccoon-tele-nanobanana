import { BotContext } from "../types/index.js";
import prisma from "../db.js";
import userService from "../services/user.service.js";
import { Markup } from "telegraf";

/**
 * /image_settings command handler
 * Displays and allows editing of image generation preferences
 */
export async function imageSettingsCommand(ctx: BotContext): Promise<void> {
  const user = ctx.from;

  if (!user) {
    return;
  }

  const dbUser = await prisma.user.findUnique({
    where: { telegramId: BigInt(user.id) },
    include: { settings: true },
  });

  if (!dbUser) {
    await ctx.reply("❌ Please run /start first to initialize your account.");
    return;
  }

  const settings = dbUser.settings;
  const aspectRatio = settings?.defaultAspectRatio || "1:1";
  const imageSize = settings?.defaultImageSize || "1K";
  const model = settings?.defaultModel || "gemini-3-pro-image-preview";

  // Format model name for display
  const modelDisplay =
    model === "gemini-3-pro-image-preview"
      ? "Gemini 3 Pro (High Quality)"
      : "Gemini 2.5 Flash (Fast)";

  const settingsText = `
🎨 *Image Generation Settings*

These settings will be used as defaults when generating images with /prompt

*Current Settings:*
├ Aspect Ratio: \`${aspectRatio}\`
├ Image Size: \`${imageSize}\`
└ Model: \`${modelDisplay}\`

*Available Options:*
• Aspect Ratio: 1:1, 9:16, 16:9, 4:3, 3:4
• Image Size: 1K (faster), 2K (higher quality)
• Model: Gemini 2.5 Flash (fast) or Gemini 3 Pro (high quality)

Use the buttons below to change your preferences.
  `.trim();

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback("📐 Aspect Ratio", "img:aspect"),
      Markup.button.callback("📏 Image Size", "img:size"),
    ],
    [Markup.button.callback("🤖 Model", "img:model")],
    [Markup.button.callback("🔄 Refresh", "img:refresh")],
    [Markup.button.callback("◀️ Back to Settings", "settings:back")],
  ]);

  await ctx.reply(settingsText, {
    parse_mode: "Markdown",
    ...keyboard,
  });
}

/**
 * Handle image settings callback queries
 */
export async function handleImageSettingsCallback(
  ctx: BotContext,
  action: string
): Promise<void> {
  const user = ctx.from;
  if (!user) return;

  const dbUser = await prisma.user.findUnique({
    where: { telegramId: BigInt(user.id) },
    include: { settings: true },
  });

  if (!dbUser) return;

  const settings = dbUser.settings;
  const currentAspectRatio = settings?.defaultAspectRatio || "1:1";
  const currentImageSize = settings?.defaultImageSize || "1K";
  const currentModel = settings?.defaultModel || "gemini-3-pro-image-preview";

  if (action === "aspect") {
    // Show aspect ratio selection
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          currentAspectRatio === "1:1" ? "✅ 1:1 (Square)" : "1:1 (Square)",
          "img:set:aspect:1:1"
        ),
      ],
      [
        Markup.button.callback(
          currentAspectRatio === "16:9" ? "✅ 16:9 (Wide)" : "16:9 (Wide)",
          "img:set:aspect:16:9"
        ),
      ],
      [
        Markup.button.callback(
          currentAspectRatio === "9:16"
            ? "✅ 9:16 (Portrait)"
            : "9:16 (Portrait)",
          "img:set:aspect:9:16"
        ),
      ],
      [
        Markup.button.callback(
          currentAspectRatio === "4:3"
            ? "✅ 4:3 (Landscape)"
            : "4:3 (Landscape)",
          "img:set:aspect:4:3"
        ),
      ],
      [
        Markup.button.callback(
          currentAspectRatio === "3:4" ? "✅ 3:4 (Portrait)" : "3:4 (Portrait)",
          "img:set:aspect:3:4"
        ),
      ],
      [Markup.button.callback("◀️ Back", "img:back")],
    ]);

    await ctx.editMessageText(
      "📐 *Select Aspect Ratio*\n\nChoose your preferred aspect ratio for generated images:",
      {
        parse_mode: "Markdown",
        ...keyboard,
      }
    );
  } else if (action === "size") {
    // Show image size selection
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          currentImageSize === "1K" ? "✅ 1K (Faster)" : "1K (Faster)",
          "img:set:size:1K"
        ),
      ],
      [
        Markup.button.callback(
          currentImageSize === "2K"
            ? "✅ 2K (Higher Quality)"
            : "2K (Higher Quality)",
          "img:set:size:2K"
        ),
      ],
      [Markup.button.callback("◀️ Back", "img:back")],
    ]);

    await ctx.editMessageText(
      "📏 *Select Image Size*\n\n• 1K: Faster generation, smaller file size\n• 2K: Higher quality, larger file size",
      {
        parse_mode: "Markdown",
        ...keyboard,
      }
    );
  } else if (action === "model") {
    // Show model selection
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          currentModel === "gemini-2.5-flash-image"
            ? "✅ Gemini 2.5 Flash (Fast)"
            : "Gemini 2.5 Flash (Fast)",
          "img:set:model:gemini-2.5-flash-image"
        ),
      ],
      [
        Markup.button.callback(
          currentModel === "gemini-3-pro-image-preview"
            ? "✅ Gemini 3 Pro (High Quality)"
            : "Gemini 3 Pro (High Quality)",
          "img:set:model:gemini-3-pro-image-preview"
        ),
      ],
      [Markup.button.callback("◀️ Back", "img:back")],
    ]);

    await ctx.editMessageText(
      "🤖 *Select Model*\n\n• Gemini 2.5 Flash: Faster generation, good quality\n• Gemini 3 Pro: Slower but higher quality with better text rendering",
      {
        parse_mode: "Markdown",
        ...keyboard,
      }
    );
  } else if (action === "refresh" || action === "back") {
    // Refresh the main settings view
    await imageSettingsCommand(ctx);
  }
}

/**
 * Apply image setting change
 */
export async function applyImageSetting(
  ctx: BotContext,
  setting: "aspect" | "size" | "model",
  value: string
): Promise<void> {
  const user = ctx.from;
  if (!user) return;

  try {
    let updateData: {
      defaultAspectRatio?: string;
      defaultImageSize?: string;
      defaultModel?: string;
    } = {};

    if (setting === "aspect") {
      updateData.defaultAspectRatio = value;
      await ctx.answerCbQuery(`✅ Aspect ratio set to ${value}`);
    } else if (setting === "size") {
      updateData.defaultImageSize = value;
      await ctx.answerCbQuery(`✅ Image size set to ${value}`);
    } else if (setting === "model") {
      updateData.defaultModel = value;
      const modelName =
        value === "gemini-3-pro-image-preview"
          ? "Gemini 3 Pro"
          : "Gemini 2.5 Flash";
      await ctx.answerCbQuery(`✅ Model set to ${modelName}`);
    }

    await userService.updateUserSettings(user.id, updateData);

    // Refresh the view
    await handleImageSettingsCallback(ctx, setting);
  } catch (error) {
    await ctx.answerCbQuery("❌ Failed to update setting");
  }
}

export default imageSettingsCommand;
