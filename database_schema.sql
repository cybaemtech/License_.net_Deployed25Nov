-- ============================================
-- LICENSE MANAGEMENT SYSTEM - COMPLETE DATABASE SCHEMA
-- MySQL/MariaDB Compatible
-- Updated: November 19, 2025
-- ============================================

-- Use your database
-- USE cybaemtechnet_LMS_Project;

-- Drop tables if they exist (for clean setup)
-- Uncomment these lines only if you want to delete all data and start fresh
/*
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS license_usage_logs;
DROP TABLE IF EXISTS email_notification_log;
DROP TABLE IF EXISTS notification_settings;
DROP TABLE IF EXISTS email_notifications;
DROP TABLE IF EXISTS license_allocations;
DROP TABLE IF EXISTS license_purchases;
DROP TABLE IF EXISTS tools;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS currencies;
DROP TABLE IF EXISTS company_settings;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;
*/

-- ============================================
-- CREATE TABLES
-- ============================================

-- Table 1: users
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'accounts', 'user') NOT NULL DEFAULT 'user',
    permissions JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: currencies
CREATE TABLE IF NOT EXISTS currencies (
    id CHAR(36) PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    exchange_rate_to_inr DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_currencies_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: clients
CREATE TABLE IF NOT EXISTS clients (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    company_name VARCHAR(255),
    gst_treatment VARCHAR(100),
    source_of_supply VARCHAR(100),
    gst VARCHAR(50),
    currency_id CHAR(36),
    address TEXT,
    document_path VARCHAR(500),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_clients_user_id (user_id),
    INDEX idx_clients_name (name),
    INDEX idx_clients_currency_id (currency_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 4: vendors
CREATE TABLE IF NOT EXISTS vendors (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    company_name VARCHAR(255),
    gst_treatment VARCHAR(100),
    source_of_supply VARCHAR(100),
    gst VARCHAR(50),
    currency_id CHAR(36),
    mode_of_payment VARCHAR(100),
    amount DECIMAL(15,2),
    quantity INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vendors_name (name),
    INDEX idx_vendors_currency_id (currency_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 5: tools
CREATE TABLE IF NOT EXISTS tools (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    vendor VARCHAR(255),
    cost_per_user DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tools_name (name),
    INDEX idx_tools_vendor (vendor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 6: license_purchases
CREATE TABLE IF NOT EXISTS license_purchases (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36),
    client_id CHAR(36),
    tool_name VARCHAR(255) NOT NULL,
    make VARCHAR(255),
    model VARCHAR(255),
    version VARCHAR(100),
    vendor VARCHAR(255),
    cost_per_user DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_cost DECIMAL(10,2) NOT NULL,
    total_cost_inr DECIMAL(10,2),
    purchase_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiration_date TIMESTAMP NOT NULL,
    invoice_no VARCHAR(100),
    serial_no VARCHAR(255) UNIQUE,
    bill_path VARCHAR(500),
    currency_code VARCHAR(10) DEFAULT 'INR',
    original_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_license_purchases_user_id (user_id),
    INDEX idx_license_purchases_client_id (client_id),
    INDEX idx_license_purchases_tool_name (tool_name),
    INDEX idx_license_purchases_vendor (vendor),
    INDEX idx_license_purchases_expiration (expiration_date),
    INDEX idx_license_purchases_serial_no (serial_no),
    INDEX idx_license_purchases_bill_path (bill_path)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 7: sales
CREATE TABLE IF NOT EXISTS sales (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    client_id CHAR(36) NOT NULL,
    purchase_id CHAR(36) NOT NULL,
    tool_name VARCHAR(255) NOT NULL,
    vendor VARCHAR(255),
    invoice_no VARCHAR(100),
    quantity INT NOT NULL DEFAULT 1,
    purchase_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    purchase_gst DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_purchase_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    selling_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    selling_gst DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_selling_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    net_gst_paid DECIMAL(15,2) DEFAULT 0.00,
    margin DECIMAL(15,2) DEFAULT 0.00,
    sale_date DATE NOT NULL,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sales_user_id (user_id),
    INDEX idx_sales_client_id (client_id),
    INDEX idx_sales_purchase_id (purchase_id),
    INDEX idx_sales_tool_name (tool_name),
    INDEX idx_sales_sale_date (sale_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 8: license_allocations
CREATE TABLE IF NOT EXISTS license_allocations (
    id CHAR(36) PRIMARY KEY,
    purchase_id CHAR(36),
    assigned_to VARCHAR(255) NOT NULL,
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'revoked', 'expired') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_license_allocations_purchase_id (purchase_id),
    INDEX idx_license_allocations_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 9: email_notifications
CREATE TABLE IF NOT EXISTS email_notifications (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36),
    license_id CHAR(36),
    notification_type ENUM('30_days', '15_days', '5_days', '1_day', '0_days', 'expired') NOT NULL,
    email_sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_status ENUM('sent', 'failed', 'pending') NOT NULL DEFAULT 'sent',
    email_subject VARCHAR(500) NOT NULL,
    email_body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_notifications_user_id (user_id),
    INDEX idx_email_notifications_license_id (license_id),
    INDEX idx_email_notifications_type (notification_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 10: email_notification_log (used by notification system)
CREATE TABLE IF NOT EXISTS email_notification_log (
    id INT(11) PRIMARY KEY AUTO_INCREMENT,
    license_id CHAR(36) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    days_until_expiry INT(11) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_license_id (license_id),
    INDEX idx_recipient_email (recipient_email),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 11: notification_settings
CREATE TABLE IF NOT EXISTS notification_settings (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) UNIQUE,
    notify_45_days TINYINT(1) DEFAULT 1,
    notify_30_days TINYINT(1) DEFAULT 1,
    notify_15_days TINYINT(1) DEFAULT 1,
    notify_7_days TINYINT(1) DEFAULT 1,
    notify_5_days TINYINT(1) DEFAULT 1,
    notify_1_day TINYINT(1) DEFAULT 1,
    notify_0_days TINYINT(1) DEFAULT 1,
    email_notifications_enabled TINYINT(1) DEFAULT 1,
    notification_time TIME DEFAULT '09:00:00',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_notification_settings_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 12: license_usage_logs
CREATE TABLE IF NOT EXISTS license_usage_logs (
    id CHAR(36) PRIMARY KEY,
    license_id CHAR(36),
    user_id CHAR(36),
    ip_address VARCHAR(45),
    user_agent TEXT,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_license_usage_logs_license_id (license_id),
    INDEX idx_license_usage_logs_user_id (user_id),
    INDEX idx_license_usage_logs_accessed_at (accessed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 13: company_settings
CREATE TABLE IF NOT EXISTS company_settings (
    id INT(11) PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(255) NOT NULL DEFAULT 'LicenseHub Enterprise',
    company_email VARCHAR(255),
    company_phone VARCHAR(50),
    company_address TEXT,
    company_logo_path VARCHAR(500),
    company_website VARCHAR(255),
    company_gst VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Generate UUIDs manually (compatible with all MySQL versions)
SET @user1_id = CONCAT(
    LPAD(HEX(FLOOR(RAND() * 0xFFFF)), 4, '0'), 
    LPAD(HEX(FLOOR(RAND() * 0xFFFF)), 4, '0'), '-',
    LPAD(HEX(FLOOR(RAND() * 0xFFFF)), 4, '0'), '-',
    '4', LPAD(HEX(FLOOR(RAND() * 0x0FFF)), 3, '0'), '-',
    HEX(FLOOR(RAND() * 4 + 8)), LPAD(HEX(FLOOR(RAND() * 0x0FFF)), 3, '0'), '-',
    LPAD(HEX(FLOOR(RAND() * 0xFFFF)), 4, '0'),
    LPAD(HEX(FLOOR(RAND() * 0xFFFF)), 4, '0'),
    LPAD(HEX(FLOOR(RAND() * 0xFFFF)), 4, '0')
);

SET @user2_id = CONCAT(
    LPAD(HEX(FLOOR(RAND() * 0xFFFF)), 4, '0'), 
    LPAD(HEX(FLOOR(RAND() * 0xFFFF)), 4, '0'), '-',
    LPAD(HEX(FLOOR(RAND() * 0xFFFF)), 4, '0'), '-',
    '4', LPAD(HEX(FLOOR(RAND() * 0x0FFF)), 3, '0'), '-',
    HEX(FLOOR(RAND() * 4 + 8)), LPAD(HEX(FLOOR(RAND() * 0x0FFF)), 3, '0'), '-',
    LPAD(HEX(FLOOR(RAND() * 0xFFFF)), 4, '0'),
    LPAD(HEX(FLOOR(RAND() * 0xFFFF)), 4, '0'),
    LPAD(HEX(FLOOR(RAND() * 0xFFFF)), 4, '0')
);

-- Insert users (password is "password")
INSERT IGNORE INTO users (id, email, password, role, permissions) VALUES 
(@user1_id, 'rohan.bhosale@cybaemtech.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '{"dashboard":true,"licenses":true,"sales":true,"clients":true,"vendors":true,"reports":true,"teams":true,"settings":true,"notifications":true}'),
(@user2_id, 'accounts@cybaemtech.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'accounts', '{"dashboard":true,"licenses":true,"sales":true,"clients":true,"vendors":true,"reports":true,"teams":true,"settings":false,"notifications":true}');

-- Insert currencies with manually generated UUIDs
INSERT IGNORE INTO currencies (id, code, name, symbol, exchange_rate_to_inr, is_default) VALUES 
(CONCAT(SUBSTRING(MD5(RAND()), 1, 8), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 12)), 'INR', 'Indian Rupee', '₹', 1.0000, 1),
(CONCAT(SUBSTRING(MD5(RAND()), 1, 8), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 12)), 'USD', 'US Dollar', '$', 83.0000, 0),
(CONCAT(SUBSTRING(MD5(RAND()), 1, 8), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 12)), 'EUR', 'Euro', '€', 90.0000, 0),
(CONCAT(SUBSTRING(MD5(RAND()), 1, 8), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 12)), 'AED', 'UAE Dirham', 'د.إ', 22.6500, 0),
(CONCAT(SUBSTRING(MD5(RAND()), 1, 8), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 12)), 'GBP', 'British Pound', '£', 105.0000, 0),
(CONCAT(SUBSTRING(MD5(RAND()), 1, 8), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 12)), 'JPY', 'Japanese Yen', '¥', 0.5600, 0),
(CONCAT(SUBSTRING(MD5(RAND()), 1, 8), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 12)), 'CNY', 'Chinese Yuan', '¥', 11.5000, 0),
(CONCAT(SUBSTRING(MD5(RAND()), 1, 8), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 12)), 'SGD', 'Singapore Dollar', 'S$', 62.0000, 0),
(CONCAT(SUBSTRING(MD5(RAND()), 1, 8), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 12)), 'AUD', 'Australian Dollar', 'A$', 54.0000, 0),
(CONCAT(SUBSTRING(MD5(RAND()), 1, 8), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 4), '-', SUBSTRING(MD5(RAND()), 1, 12)), 'CAD', 'Canadian Dollar', 'C$', 61.0000, 0);

-- ============================================
-- VERIFY SETUP
-- ============================================

-- Show all tables
SELECT 'Tables created successfully!' as Status;
SHOW TABLES;

-- Count records
SELECT 'users' as `table`, COUNT(*) as records FROM users
UNION ALL
SELECT 'currencies', COUNT(*) FROM currencies
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'vendors', COUNT(*) FROM vendors
UNION ALL
SELECT 'tools', COUNT(*) FROM tools
UNION ALL
SELECT 'license_purchases', COUNT(*) FROM license_purchases
UNION ALL
SELECT 'sales', COUNT(*) FROM sales
UNION ALL
SELECT 'license_allocations', COUNT(*) FROM license_allocations
UNION ALL
SELECT 'email_notifications', COUNT(*) FROM email_notifications
UNION ALL
SELECT 'email_notification_log', COUNT(*) FROM email_notification_log
UNION ALL
SELECT 'notification_settings', COUNT(*) FROM notification_settings
UNION ALL
SELECT 'license_usage_logs', COUNT(*) FROM license_usage_logs
UNION ALL
SELECT 'company_settings', COUNT(*) FROM company_settings;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
