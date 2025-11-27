-- ============================================
-- GRANULAR PERMISSIONS MIGRATION SCRIPT
-- License Management System
-- Created: November 19, 2025
-- ============================================

-- This script migrates existing boolean permissions to granular action-level permissions
-- New structure: {"module": {"access": true, "actions": {"create": true, "read": true, "update": true, "delete": true}}}

-- ============================================
-- BACKUP EXISTING DATA (RECOMMENDED)
-- ============================================
-- CREATE TABLE users_backup AS SELECT * FROM users;

-- ============================================
-- UPDATE EXISTING USERS TO NEW PERMISSION STRUCTURE
-- ============================================

-- Update Admin users - Full permissions
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
WHERE role = 'admin';

-- Update Accounts users - Limited permissions (no delete for sensitive modules)
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
WHERE role = 'accounts';

-- Update regular users - Basic permissions (read-only for most)
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
WHERE role = 'user';

-- ============================================
-- VERIFY MIGRATION
-- ============================================

SELECT 
    email,
    role,
    JSON_EXTRACT(permissions, '$.licenses.actions.create') as can_create_license,
    JSON_EXTRACT(permissions, '$.licenses.actions.delete') as can_delete_license,
    JSON_EXTRACT(permissions, '$.clients.actions.create') as can_create_client,
    JSON_EXTRACT(permissions, '$.vendors.actions.update') as can_update_vendor
FROM users
ORDER BY role, email;

-- ============================================
-- ROLLBACK INSTRUCTIONS (IF NEEDED)
-- ============================================
/*
-- To rollback to old permission structure:
UPDATE users u
JOIN users_backup ub ON u.id = ub.id
SET u.permissions = ub.permissions;
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
SELECT 'Granular permissions migration completed successfully!' as Status;
