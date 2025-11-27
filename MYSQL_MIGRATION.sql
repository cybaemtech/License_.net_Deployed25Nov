-- ============================================
-- MYSQL DATABASE MIGRATION SCRIPT
-- LicenseHub - Complete Schema Update
-- Run this in cPanel phpMyAdmin
-- ============================================

-- Use your database
USE cybaemtechnet_LMS_Project;

-- ============================================
-- STEP 1: ADD PERMISSIONS COLUMN TO USERS TABLE
-- ============================================

-- Check if permissions column exists, if not add it
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS permissions JSON DEFAULT NULL;

-- ============================================
-- STEP 2: ENSURE ALL REQUIRED COLUMNS EXIST
-- ============================================

-- Update users table structure (if needed)
ALTER TABLE users 
MODIFY COLUMN id CHAR(36) NOT NULL,
MODIFY COLUMN email VARCHAR(255) NOT NULL,
MODIFY COLUMN password VARCHAR(255) NOT NULL,
MODIFY COLUMN role ENUM('admin', 'accounts', 'user') NOT NULL DEFAULT 'user';

-- Add created_at and updated_at if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ============================================
-- STEP 3: SET DEFAULT PERMISSIONS FOR EXISTING USERS
-- ============================================

-- Update Admin users with full permissions
UPDATE users 
SET permissions = JSON_OBJECT(
    'dashboard', JSON_OBJECT('access', true),
    'licenses', JSON_OBJECT(
        'access', true,
        'actions', JSON_OBJECT('create', true, 'read', true, 'update', true, 'delete', true)
    ),
    'sales', JSON_OBJECT(
        'access', true,
        'actions', JSON_OBJECT('create', true, 'read', true, 'update', true, 'delete', true)
    ),
    'clients', JSON_OBJECT(
        'access', true,
        'actions', JSON_OBJECT('create', true, 'read', true, 'update', true, 'delete', true)
    ),
    'vendors', JSON_OBJECT(
        'access', true,
        'actions', JSON_OBJECT('create', true, 'read', true, 'update', true, 'delete', true)
    ),
    'reports', JSON_OBJECT('access', true),
    'teams', JSON_OBJECT('access', true),
    'settings', JSON_OBJECT('access', true),
    'notifications', JSON_OBJECT('access', true)
)
WHERE role = 'admin' AND permissions IS NULL;

-- Update Accounts users with limited permissions
UPDATE users 
SET permissions = JSON_OBJECT(
    'dashboard', JSON_OBJECT('access', true),
    'licenses', JSON_OBJECT(
        'access', true,
        'actions', JSON_OBJECT('create', true, 'read', true, 'update', true, 'delete', false)
    ),
    'sales', JSON_OBJECT(
        'access', true,
        'actions', JSON_OBJECT('create', true, 'read', true, 'update', true, 'delete', false)
    ),
    'clients', JSON_OBJECT(
        'access', true,
        'actions', JSON_OBJECT('create', true, 'read', true, 'update', true, 'delete', false)
    ),
    'vendors', JSON_OBJECT(
        'access', true,
        'actions', JSON_OBJECT('create', true, 'read', true, 'update', true, 'delete', false)
    ),
    'reports', JSON_OBJECT('access', true),
    'teams', JSON_OBJECT('access', true),
    'settings', JSON_OBJECT('access', false),
    'notifications', JSON_OBJECT('access', true)
)
WHERE role = 'accounts' AND permissions IS NULL;

-- Update regular users with read-only permissions
UPDATE users 
SET permissions = JSON_OBJECT(
    'dashboard', JSON_OBJECT('access', true),
    'licenses', JSON_OBJECT(
        'access', true,
        'actions', JSON_OBJECT('create', false, 'read', true, 'update', false, 'delete', false)
    ),
    'sales', JSON_OBJECT(
        'access', true,
        'actions', JSON_OBJECT('create', false, 'read', true, 'update', false, 'delete', false)
    ),
    'clients', JSON_OBJECT(
        'access', true,
        'actions', JSON_OBJECT('create', false, 'read', true, 'update', false, 'delete', false)
    ),
    'vendors', JSON_OBJECT(
        'access', true,
        'actions', JSON_OBJECT('create', false, 'read', true, 'update', false, 'delete', false)
    ),
    'reports', JSON_OBJECT('access', true),
    'teams', JSON_OBJECT('access', false),
    'settings', JSON_OBJECT('access', false),
    'notifications', JSON_OBJECT('access', true)
)
WHERE role = 'user' AND permissions IS NULL;

-- ============================================
-- STEP 4: VERIFY MIGRATION
-- ============================================

-- Check if permissions column exists
DESCRIBE users;

-- View all users with their permissions
SELECT 
    id,
    email,
    role,
    JSON_EXTRACT(permissions, '$.licenses.actions.create') as can_create_license,
    JSON_EXTRACT(permissions, '$.licenses.actions.delete') as can_delete_license,
    created_at,
    updated_at
FROM users
ORDER BY role, email;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

SELECT 'MySQL Database Migration Completed Successfully!' as Status;
