-- Fix alerts table foreign key constraint
-- The org_id was incorrectly referencing users(id) instead of organizations(id)

-- Drop the incorrect constraint
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_org_id_fkey;

-- Add the correct constraint
ALTER TABLE alerts ADD CONSTRAINT alerts_org_id_fkey 
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
