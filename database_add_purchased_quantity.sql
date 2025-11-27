-- ============================================
-- ADD PURCHASED_QUANTITY COLUMN MIGRATION
-- License Management System
-- Created: November 20, 2025
-- ============================================

-- Add purchased_quantity column to license_purchases table
ALTER TABLE license_purchases 
ADD COLUMN IF NOT EXISTS purchased_quantity INT NOT NULL DEFAULT 1 AFTER quantity;

-- Update existing records: set purchased_quantity equal to current quantity
-- This preserves the original purchase amount for existing licenses
UPDATE license_purchases 
SET purchased_quantity = quantity 
WHERE purchased_quantity IS NULL OR purchased_quantity = 0;

-- Add index for better query performance
ALTER TABLE license_purchases 
ADD INDEX IF NOT EXISTS idx_license_purchases_purchased_qty (purchased_quantity);

-- ============================================
-- VERIFY MIGRATION
-- ============================================

-- Show the updated table structure
DESCRIBE license_purchases;

-- Show sample data to verify the update
SELECT id, tool_name, quantity, purchased_quantity, created_at 
FROM license_purchases 
LIMIT 5;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
SELECT 'purchased_quantity column added successfully!' as Status;
