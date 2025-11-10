-- AlterTable
ALTER TABLE "shows" ADD COLUMN     "converted_at" TIMESTAMP(3),
ADD COLUMN     "downloaded_at" TIMESTAMP(3),
ADD COLUMN     "processing_state" TEXT,
ADD COLUMN     "raw_audio_format" TEXT,
ADD COLUMN     "raw_audio_path" TEXT;
