-- AlterTable
ALTER TABLE "survey_analyses" ADD COLUMN IF NOT EXISTS "diagnostics" JSONB;
