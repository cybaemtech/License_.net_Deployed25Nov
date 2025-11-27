# Database Setup Guide - License Management System

## 📋 Complete Database Schema

Aapke **License Management System** ke liye **complete database schema** ready hai!

### 📁 File Location
- **File Name:** `database_schema.sql`
- **Location:** Project root directory mein
- **Ready for:** Direct cPanel upload via phpMyAdmin

---

## 🗄️ Database Tables (Total: 13 Tables)

### 1. **users** - User Management with Roles & Permissions
- User authentication
- Role-based access control (admin, accounts, user)
- **Granular permissions** for each user:
  - Dashboard access
  - Licenses management
  - Sales management
  - Clients management
  - Vendors management
  - Reports access
  - Teams management
  - Settings access
  - Notifications
- **Columns:**
  - `id` (CHAR(36)) - Primary Key
  - `email` (VARCHAR(255)) - Unique email
  - `password` (VARCHAR(255)) - Hashed password
  - `role` (ENUM) - admin, accounts, user
  - `permissions` (JSON) - Granular permission control ✨ **NEW**
  - `created_at`, `updated_at` - Timestamps

### 2. **currencies** - Multi-Currency Support
- Support for 10 major currencies
- Exchange rate management
- Default currency settings

### 3. **clients** - Client Management
- Client information
- Contact details
- GST and tax information
- Document storage paths

### 4. **vendors** - Vendor Management
- Vendor details
- Payment information
- GST details

### 5. **tools** - Software Tools/Licenses
- Tool/software information
- Pricing details
- Vendor relationships

### 6. **license_purchases** - License Purchase Records
- Purchase details
- Expiration tracking
- Invoice management
- Serial number tracking
- Multi-currency support

### 7. **sales** - Sales Transactions
- Sales records
- Profit margin calculation
- GST calculations
- Client-purchase relationships

### 8. **license_allocations** - License Assignment
- License assignment to users
- Status tracking (active, revoked, expired)

### 9. **email_notifications** - Email History
- Notification tracking
- Email status monitoring

### 10. **email_notification_log** - Notification Logs
- Detailed notification logs
- Days until expiry tracking

### 11. **notification_settings** - User Preferences
- Email notification preferences
- Notification timing (45, 30, 15, 7, 5, 1, 0 days)
- Timezone settings

### 12. **license_usage_logs** - Usage Tracking
- License access logs
- IP address tracking
- User agent information

### 13. **company_settings** - Company Information ✨ **NEW**
- Company details
- Logo management
- Contact information
- GST details

---

## 🔐 Default Login Credentials

Schema file mein 2 default users included hain:

### Admin User
- **Email:** `rohan.bhosale@cybaemtech.com`
- **Password:** `password`
- **Role:** Admin
- **Permissions:** Full access to all features

### Accounts User
- **Email:** `accounts@cybaemtech.com`
- **Password:** `password`
- **Role:** Accounts
- **Permissions:** Limited access (no settings access)

> ⚠️ **Security Note:** Login ke baad immediately passwords change kar lena!

---

## 💱 Pre-loaded Currencies

10 currencies with exchange rates already included:
1. INR (Indian Rupee) - ₹ - Default
2. USD (US Dollar) - $
3. EUR (Euro) - €
4. AED (UAE Dirham) - د.إ
5. GBP (British Pound) - £
6. JPY (Japanese Yen) - ¥
7. CNY (Chinese Yuan) - ¥
8. SGD (Singapore Dollar) - S$
9. AUD (Australian Dollar) - A$
10. CAD (Canadian Dollar) - C$

---

## 📥 cPanel Upload Instructions

### Step 1: Access phpMyAdmin
1. cPanel login karein
2. "Databases" section mein **phpMyAdmin** open karein

### Step 2: Create/Select Database
1. Agar database nahi hai to pehle create karein
2. Left sidebar se apna database select karein

### Step 3: Import Schema
1. Top menu mein **"Import"** tab click karein
2. **"Choose File"** button click karein
3. `database_schema.sql` file select karein (project root se)
4. Scroll down aur **"Go"** button click karein

### Step 4: Verify
- Import successful hone ke baad, aapko 13 tables dikhni chahiye
- "Browse" option se data check kar sakte hain
  - 2 users
  - 10 currencies

---

## 🔄 Database Configuration

Import ke baad, apni PHP config file mein database credentials update karein:

**File:** `api/config/database.php` or `api/config/cpanel_config.php`

```php
private $host = "localhost";           // Your cPanel DB host
private $db_name = "your_database";    // Your database name
private $username = "your_username";   // Your DB username
private $password = "your_password";   // Your DB password
```

---

## ✅ Features Included in Schema

### ✨ New Features Added
- [x] **Permissions System** - Granular user permissions (JSON format)
- [x] **Company Settings Table** - Company information management
- [x] **Default Users** with full permissions setup
- [x] **Multi-currency** support with exchange rates

### 🔧 Complete System Features
- [x] User authentication & authorization
- [x] Role-based access control
- [x] License management
- [x] Client management
- [x] Vendor management
- [x] Sales tracking
- [x] Email notifications
- [x] Notification settings
- [x] License usage tracking
- [x] Company settings

---

## 🎯 Ready for Production

Aapka database schema:
- ✅ **Production-ready** - Fully optimized with indexes
- ✅ **MySQL/MariaDB compatible** - Works on all versions
- ✅ **Security included** - Password hashing, role-based access
- ✅ **Complete data** - Default users and currencies included
- ✅ **Easy to import** - Single SQL file upload

---

## 📞 Post-Setup

Database setup ke baad:
1. ✅ Default admin credentials se login karein
2. ✅ Password change karein
3. ✅ Company settings update karein
4. ✅ Additional users create karein (Settings → User Management)
5. ✅ Permissions customize karein per user

---

**Created:** November 19, 2025  
**MySQL Version:** 5.7+  
**Character Set:** UTF8MB4 (Full Unicode support)  
**Engine:** InnoDB (ACID compliance, foreign key support)
