-- ============================================
-- MySQL Database Fix for Users Table
-- यह queries आपके existing MySQL database पर run करनी हैं
-- ============================================

-- Step 1: Check if users table exists
-- पहले देखें कि users table है या नहीं
SELECT TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'cybaemtechnet_LMS_Project' 
  AND TABLE_NAME = 'users';

-- Step 2: यदि users table already exist करती है, तो उसका structure check करें
DESCRIBE users;

-- Step 3: अगर users table में 'name' column है तो उसे हटा दें (OPTIONAL - केवल तभी करें जब आप sure हों)
-- ALTER TABLE users DROP COLUMN name;

-- Step 4: सुनिश्चित करें कि सभी required columns हैं
-- यदि कोई column missing है तो add करें:

-- Check if permissions column exists, if not add it:
-- ALTER TABLE users ADD COLUMN permissions JSON DEFAULT NULL;

-- ============================================
-- Verify Existing Users
-- ============================================

-- अपने existing users को check करें
SELECT id, email, role, created_at 
FROM users 
ORDER BY created_at DESC;

-- ============================================
-- Insert Test User (OPTIONAL)
-- ============================================

-- यदि आप test user create करना चाहते हैं:
-- Password: test123
/*
INSERT INTO users (id, email, password, role, permissions, created_at, updated_at)
VALUES (
    '12345678-1234-5678-1234-567812345678',
    'test@example.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'user',
    NULL,
    NOW(),
    NOW()
);
*/

-- ============================================
-- Verify Password Hash Format
-- ============================================

-- Check करें कि passwords properly hashed हैं
SELECT id, email, role, 
       LEFT(password, 7) as password_prefix,
       LENGTH(password) as password_length
FROM users;

-- Password hash should:
-- - Start with $2y$ (bcrypt)
-- - Be 60 characters long

-- ============================================
-- Grant Proper Permissions to Database User
-- ============================================

-- Ensure your database user has proper permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON cybaemtechnet_LMS_Project.* 
TO 'cybaemtechnet_LMS_Project'@'%';

FLUSH PRIVILEGES;
