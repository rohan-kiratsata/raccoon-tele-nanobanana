-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "defaultAspectRatio" TEXT NOT NULL DEFAULT '1:1',
ADD COLUMN     "defaultImageSize" TEXT NOT NULL DEFAULT '1K',
ADD COLUMN     "defaultModel" TEXT NOT NULL DEFAULT 'gemini-3-pro-image-preview';
