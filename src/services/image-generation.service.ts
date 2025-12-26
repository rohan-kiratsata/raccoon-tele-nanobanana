import { GoogleGenAI } from "@google/genai";
import mime from "mime";
import { config } from "../config.js";
import logger from "../utils/logger.js";

export interface ImageGenerationOptions {
  prompt: string;
  aspectRatio?: "1:1" | "9:16" | "16:9" | "4:3" | "3:4";
  imageSize?: "1K" | "2K";
  model?: "gemini-2.5-flash-image" | "gemini-3-pro-image-preview";
}

export interface GeneratedImage {
  buffer: Buffer;
  mimeType: string;
  extension: string;
}

export class ImageGenerationService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (config.geminiApiKey) {
      this.ai = new GoogleGenAI({
        apiKey: config.geminiApiKey,
      });
    } else {
      logger.warn(
        "GEMINI_API_KEY not set - image generation will be unavailable"
      );
    }
  }

  /**
   * Generate an image from a text prompt using Gemini Nano Banana
   */
  async generateImage(
    options: ImageGenerationOptions
  ): Promise<GeneratedImage | null> {
    if (!this.ai) {
      throw new Error("Gemini API key not configured");
    }

    const {
      prompt,
      aspectRatio = "1:1",
      imageSize = "1K",
      model = "gemini-3-pro-image-preview",
    } = options;

    logger.info("Generating image", { prompt, model, aspectRatio, imageSize });

    try {
      const genConfig = {
        responseModalities: ["IMAGE", "TEXT"] as string[],
        imageConfig: {
          aspectRatio,
          imageSize,
        },
        tools: [
          {
            googleSearch: {},
          },
        ],
      };

      const contents = [
        {
          role: "user" as const,
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ];

      const response = await this.ai.models.generateContentStream({
        model,
        config: genConfig,
        contents,
      });

      // Process the stream to find the image
      for await (const chunk of response) {
        if (
          !chunk.candidates ||
          !chunk.candidates[0]?.content ||
          !chunk.candidates[0]?.content?.parts
        ) {
          continue;
        }

        const part = chunk.candidates[0].content.parts[0];

        if (part.inlineData) {
          const inlineData = part.inlineData;
          const mimeType = inlineData.mimeType || "image/png";
          const extension = mime.getExtension(mimeType) || "png";
          const buffer = Buffer.from(inlineData.data || "", "base64");

          logger.info("Image generated successfully", {
            size: buffer.length,
            mimeType,
            extension,
          });

          return {
            buffer,
            mimeType,
            extension,
          };
        }
      }

      logger.warn("No image found in response");
      return null;
    } catch (error) {
      logger.error("Failed to generate image", { error, prompt });
      throw error;
    }
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    return this.ai !== null;
  }
}

export const imageGenerationService = new ImageGenerationService();
export default imageGenerationService;
