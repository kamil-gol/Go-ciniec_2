-- Make email optional and add deposit status
-- Remove unique constraint from Client.email
ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS "Client_email_key";
ALTER TABLE "Client" ALTER COLUMN "email" DROP NOT NULL;

-- Add status field to Deposit
ALTER TABLE "Deposit" ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) DEFAULT 'PENDING';

-- Create index on deposit status
CREATE INDEX IF NOT EXISTS "Deposit_status_idx" ON "Deposit"("status");

-- Add phone index for better client lookup
CREATE INDEX IF NOT EXISTS "Client_phone_idx" ON "Client"("phone");
