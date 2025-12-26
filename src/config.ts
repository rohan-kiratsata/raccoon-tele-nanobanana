import dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface Config {
  // Bot configuration
  botToken: string;

  // Database
  databaseUrl: string;

  // Gemini API
  geminiApiKey?: string;

  // Environment
  nodeEnv: "development" | "production" | "test";

  // Logging
  logLevel: "debug" | "info" | "warn" | "error";
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config: Config = {
  botToken: getEnvVar("BOT_TOKEN"),
  databaseUrl: getEnvVar("DATABASE_URL", "file:./dev.db"),
  geminiApiKey: process.env.GEMINI_API_KEY,
  nodeEnv: (process.env.NODE_ENV as Config["nodeEnv"]) || "development",
  logLevel: (process.env.LOG_LEVEL as Config["logLevel"]) || "info",
};

export default config;
