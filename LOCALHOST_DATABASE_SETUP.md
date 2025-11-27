# Localhost MySQL Database Setup Guide

## Step-by-Step Setup for Localhost

### 1. Install MySQL on Your Computer

**For Windows:**
- Download XAMPP: https://www.apachefriends.org/
- Install XAMPP
- Start MySQL from XAMPP Control Panel

**For Mac:**
- Download MAMP: https://www.mamp.info/
- Install MAMP
- Start MySQL from MAMP

**For Linux:**
```bash
sudo apt-get install mysql-server
sudo service mysql start
```

### 2. Create Database

Open phpMyAdmin (usually at `http://localhost/phpmyadmin`) and:
1. Click "New" to create a new database
2. Database name: `license_management`
3. Collation: `utf8mb4_unicode_ci`
4. Click "Create"

**OR use MySQL Command Line:**
```bash
mysql -u root -p
CREATE DATABASE license_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 3. Update .env File

Edit the `.env` file in your project root:

```env
# For Localhost
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=license_management

# Other settings
DB_DRIVER=mysql
PORT=8000
NODE_ENV=production
FRONTEND_ORIGIN=*
EMAIL_MODE=development
APP_URL=http://localhost:5000
```

**Important Notes:**
- `MYSQL_USER` is usually `root` for localhost
- `MYSQL_PASSWORD` is usually empty for XAMPP/MAMP (leave it blank)
- If you set a password during MySQL installation, use that password

### 4. Import Database Schema (Optional - Auto-creates on first run)

The system will automatically create tables on first run, but if you want to manually import:

1. Open phpMyAdmin
2. Select your `license_management` database
3. Click "Import" tab
4. Choose file: `database_schema.sql`
5. Click "Go"

### 5. Start the Application

```bash
npm run dev
```

The application will:
- Connect to MySQL
- Create database if it doesn't exist
- Create tables automatically
- Run on http://localhost:5000

### 6. Login Credentials

```
Email: rohan.bhosale@cybaemtech.com
Password: password
```

## Troubleshooting

### Error: "Cannot connect to MySQL"

**Solution 1:** Make sure MySQL is running
- XAMPP: Check XAMPP Control Panel
- MAMP: Check MAMP
- Linux: `sudo service mysql status`

**Solution 2:** Check your credentials
- Open phpMyAdmin
- Try logging in with your username/password
- Update .env file with correct credentials

**Solution 3:** Check MySQL port
- Default port is 3306
- If using different port, update `MYSQL_PORT` in .env

### Error: "Access denied for user"

Your MySQL password is wrong. Try:
```bash
# Reset MySQL password (Windows/XAMPP)
# Go to phpMyAdmin → User Accounts → Edit root user → Set password

# Linux
sudo mysql -u root
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_new_password';
FLUSH PRIVILEGES;
EXIT;
```

### Error: "Unknown database"

Database doesn't exist. Create it:
```bash
mysql -u root -p
CREATE DATABASE license_management;
EXIT;
```

## Database Configuration Cleaned

✅ Removed PostgreSQL files and references
✅ Simplified to MySQL ONLY
✅ Added localhost default settings
✅ Better error messages

## What Was Changed

1. **Removed Files:**
   - `api/postgres_setup.sql` ❌ (deleted)

2. **Updated Files:**
   - `api/config/database.php` ✓ (MySQL only, localhost-friendly)
   - `.env` ✓ (simplified configuration)

3. **Database Type:**
   - MySQL ✅ (ONLY database supported)
   - PostgreSQL ❌ (removed)
   - JSON ❌ (not used)

## Production/cPanel Setup

For production, just update .env:

```env
MYSQL_HOST=your_cpanel_mysql_host
MYSQL_PORT=3306
MYSQL_USER=cpanel_mysql_username
MYSQL_PASSWORD=cpanel_mysql_password
MYSQL_DATABASE=cpanel_database_name
```

Everything else stays the same!
