CREATE EXTENSION IF NOT EXISTS vector;
-- AlterTable
ALTER TABLE "incidents" ADD COLUMN     "embedding" vector;
