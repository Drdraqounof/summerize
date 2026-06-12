-- Enhance CustomRule for automation features
ALTER TABLE "CustomRule" ADD COLUMN "conditions" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "CustomRule" ADD COLUMN "actions" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "CustomRule" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CustomRule" ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true;

-- Migrate existing data structure (only if old columns exist)
UPDATE "CustomRule" 
SET 
  conditions = jsonb_build_object(
    'type', "ruleType",
    'condition', "condition"
  ),
  actions = jsonb_build_object(
    'category', "targetCategory"
  )
WHERE "ruleType" IS NOT NULL;

-- Create index for performance
CREATE INDEX "CustomRule_userId_enabled" ON "CustomRule"("userId", "enabled");
