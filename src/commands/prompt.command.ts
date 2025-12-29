import { BotContext } from "../types/index.js";
import imageGenerationService from "../services/image-generation.service.js";
import userService from "../services/user.service.js";
import logger from "../utils/logger.js";

// Track users waiting for prompt input
const waitingForPrompt = new Set<number>();

/**
 * /prompt command handler
 * Initiates a conversation to get a prompt and generate an image
 */
export async function promptCommand(ctx: BotContext): Promise<void> {
  const user = ctx.from;

  if (!user) {
    return;
  }

  // Check if service is available
  if (!imageGenerationService.isAvailable()) {
    await ctx.reply(
      "❌ Image generation is not available. Please configure GEMINI_API_KEY in your environment variables."
    );
    return;
  }

  // Mark user as waiting for prompt
  waitingForPrompt.add(user.id);

  // Get user's current settings to show in the message
  const defaults = await userService.getImageDefaults(user.id);
  const modelDisplay =
    defaults.model === "gemini-3-pro-image-preview"
      ? "Gemini 3 Pro"
      : "Gemini 2.5 Flash";

  await ctx.reply(
    "🎨 *Image Generation*\n\n" +
      "Please send me a description of the image you'd like me to generate.\n\n" +
      "Example: A futuristic banana with neon lights in a cyberpunk city\n\n" +
      `*Current Settings:*\n` +
      `├ Aspect Ratio: \`${defaults.aspectRatio}\`\n` +
      `├ Image Size: \`${defaults.imageSize}\`\n` +
      `└ Model: \`${modelDisplay}\`\n\n` +
      `💡 Change settings with /image_settings\n` +
      `Type /cancel to cancel.`,
    { parse_mode: "Markdown" }
  );

  logger.info("Prompt command initiated", { userId: user.id });
}

/**
 * Handle prompt input from user
 * This should be called when a user sends a message while waiting for prompt
 */
export async function handlePromptInput(ctx: BotContext): Promise<boolean> {
  const user = ctx.from;
  const message = ctx.message;

  if (!user || !message || !("text" in message)) {
    return false;
  }

  // Check if user is waiting for prompt
  if (!waitingForPrompt.has(user.id)) {
    return false;
  }

  // Don't process commands as prompts
  if (message.text.startsWith("/")) {
    return false;
  }

  const prompt = message.text.trim();

  if (prompt.length === 0) {
    await ctx.reply("❌ Please provide a valid prompt description.");
    return true;
  }

  // Remove user from waiting list
  waitingForPrompt.delete(user.id);

  // Send "generating" message
  const statusMessage = await ctx.reply(
    "⏳ Generating your image... This may take a few moments."
  );

  try {
    // Get user's default image generation settings
    const defaults = await userService.getImageDefaults(user.id);

    logger.info("Generating image for user", {
      userId: user.id,
      prompt,
      ...defaults,
    });

    // Generate the image using user's default settings
    const image = await imageGenerationService.generateImage({
      prompt,
      aspectRatio: defaults.aspectRatio,
      imageSize: defaults.imageSize,
      model: defaults.model,
    });

    if (!image) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        statusMessage.message_id,
        undefined,
        "❌ Failed to generate image. Please try again with a different prompt."
      );
      return true;
    }

    // Delete the status message
    await ctx.telegram.deleteMessage(ctx.chat!.id, statusMessage.message_id);

    // Escape markdown special characters in prompt for safety
    const escapedPrompt = prompt
      .replace(/_/g, "\\_")
      .replace(/\*/g, "\\*")
      .replace(/\[/g, "\\[")
      .replace(/\]/g, "\\]")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/~/g, "\\~")
      .replace(/`/g, "\\`")
      .replace(/>/g, "\\>")
      .replace(/#/g, "\\#")
      .replace(/\+/g, "\\+")
      .replace(/-/g, "\\-")
      .replace(/=/g, "\\=")
      .replace(/\|/g, "\\|")
      .replace(/\{/g, "\\{")
      .replace(/\}/g, "\\}")
      .replace(/\./g, "\\.")
      .replace(/!/g, "\\!");

    // Send the generated image
    await ctx.replyWithPhoto(
      {
        source: image.buffer,
        filename: `generated-image.${image.extension}`,
      },
      {
        caption: `🎨 *Generated Image*\n\n_Prompt:_ ${escapedPrompt}`,
        parse_mode: "Markdown",
      }
    );

    logger.info("Image sent successfully", { userId: user.id });
  } catch (error) {
    logger.error("Error generating image", { error, userId: user.id });

    // Try to update status message or send new error message
    try {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        statusMessage.message_id,
        undefined,
        "❌ An error occurred while generating the image. Please try again later."
      );
    } catch {
      await ctx.reply(
        "❌ An error occurred while generating the image. Please try again later."
      );
    }
  }

  return true;
}

/**
 * Cancel prompt request
 */
export async function cancelPromptCommand(ctx: BotContext): Promise<void> {
  const user = ctx.from;

  if (!user) {
    return;
  }

  if (waitingForPrompt.has(user.id)) {
    waitingForPrompt.delete(user.id);
    await ctx.reply("✅ Image generation cancelled.");
  } else {
    await ctx.reply("ℹ️ You don't have any pending image generation requests.");
  }
}

/**
 * Check if user is waiting for prompt
 */
export function isWaitingForPrompt(userId: number): boolean {
  return waitingForPrompt.has(userId);
}

export default promptCommand;
