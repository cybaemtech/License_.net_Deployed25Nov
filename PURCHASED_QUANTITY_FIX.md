# Purchased Quantity Fix - Implementation Summary

## Issue Fixed
Previously, when purchasing licenses, the original purchased quantity was not being saved separately. When selling licenses, the available quantity decreased, and you lost track of how many licenses were originally purchased.

## Solution Implemented

### 1. Database Changes
- **Added Column**: `purchased_quantity` to the `license_purchases` table
- **Migration**: Successfully ran migration on November 20, 2025
- **Existing Data**: Updated all existing records to set `purchased_quantity = quantity`

### 2. Backend Changes (PHP)
**File Modified**: `api/controllers/LicenseController.php`
- Updated `store()` method to save `purchased_quantity` when creating new licenses
- The `purchased_quantity` is set to the initial `quantity` value upon purchase
- When selling licenses (via `SalesController.php`), only the `quantity` field is reduced
- The `purchased_quantity` remains unchanged, preserving the original purchase amount

### 3. Frontend Changes
**No Changes Required** - The frontend was already configured correctly:
- TypeScript interface includes `purchased_quantity` field
- UI displays both "Purchased Qty" and "Available Qty" columns
- Dashboard calculations use `purchased_quantity` for accurate statistics

## How It Works

### When Purchasing Licenses
1. User enters quantity (e.g., 10 licenses)
2. System saves:
   - `quantity = 10` (available licenses)
   - `purchased_quantity = 10` (original purchase amount)

### When Selling Licenses
1. User sells some licenses (e.g., 3 licenses)
2. System updates:
   - `quantity = 7` (remaining available licenses)
   - `purchased_quantity = 10` (UNCHANGED - still shows original purchase)

### Result
You can always see:
- **Purchased Qty**: How many licenses were originally bought
- **Available Qty**: How many licenses are still available to sell

## Testing the Fix

### Login Credentials
- Email: `rohan.bhosale@cybaemtech.com`
- Password: `password`

### Test Steps
1. **Login** to the application
2. **Go to Licenses** page (Purchase Licenses tab)
3. **Create a new license** with quantity 5
4. **Verify** you can see:
   - Purchased Qty: 5
   - Available Qty: 5
5. **Sell 2 licenses** using the Sell License button
6. **Verify** after selling:
   - Purchased Qty: 5 (unchanged ✓)
   - Available Qty: 3 (reduced by 2 ✓)

## Files Changed
1. `api/controllers/LicenseController.php` - Updated to include purchased_quantity
2. `database_add_purchased_quantity.sql` - Migration SQL script (for reference)

## Database Migration Applied
```sql
ALTER TABLE license_purchases 
ADD COLUMN purchased_quantity INT NOT NULL DEFAULT 1 AFTER quantity;

UPDATE license_purchases 
SET purchased_quantity = quantity;
```

## Status
✅ **Fix Completed and Tested**
- Migration successful
- Backend updated
- Frontend already configured
- API returning `purchased_quantity` field confirmed via browser logs

---
**Date**: November 20, 2025  
**Issue**: Purchased quantity not being saved and preserved during sales  
**Resolution**: Added `purchased_quantity` column to preserve original purchase amount
