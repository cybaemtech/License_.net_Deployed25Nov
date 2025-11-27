# 🚀 Complete cPanel Deployment Guide

## Step 1: Database Setup in cPanel

### 1.1 Create MySQL Database
1. Log into your cPanel
2. Go to **MySQL Databases**
3. Create a new database: `your_username_lms`
4. Create a database user: `your_username_lmsuser`
5. Set a strong password
6. Add user to database with **ALL PRIVILEGES**

### 1.2 Import Database Schema
1. Go to **phpMyAdmin** in cPanel
2. Select your database
3. Go to **Import** tab
4. Upload `cpanel_setup.sql`
5. Click **Go** to execute

## Step 2: Email Configuration

### 2.1 SMTP Settings for cPanel Email
```php
// In EmailNotificationService.php, update:
private $smtp_config = [
    'host' => 'mail.yourdomain.com',    // Your domain's mail server
    'port' => 587,                      // Use 587 for TLS, 465 for SSL
    'username' => 'noreply@yourdomain.com', // Full email address
    'password' => 'your_email_password',     // Email account password
    'from_email' => 'noreply@yourdomain.com',
    'from_name' => 'Your Company License Management',
    'encryption' => 'tls'               // 'tls' or 'ssl'
];
```

### 2.2 Alternative: Use Gmail SMTP
```php
private $smtp_config = [
    'host' => 'smtp.gmail.com',
    'port' => 587,
    'username' => 'your-gmail@gmail.com',
    'password' => 'your-app-specific-password', // Not your Gmail password!
    'from_email' => 'noreply@yourdomain.com',
    'from_name' => 'License Management System',
    'encryption' => 'tls'
];
```

## Step 3: Upload Files

### 3.1 File Structure in cPanel
```
public_html/
├── license-system/
│   ├── backend/
│   │   ├── api/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── utils/
│   │   └── email_system/
│   ├── frontend/
│   │   ├── includes/
│   │   ├── pages/
│   │   └── assets/
│   └── .htaccess
```

### 3.2 Upload Process
1. Compress your PHP files into a ZIP
2. Use **File Manager** in cPanel
3. Upload to `public_html/license-system/`
4. Extract the ZIP file
5. Set correct permissions (755 for folders, 644 for files)

## Step 4: Environment Configuration

### 4.1 Create .env file (if supported)
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_username_lms
DB_USER=your_username_lmsuser
DB_PASSWORD=your_secure_password

SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_email_password
```

### 4.2 Update Database Configuration
Edit `backend/config/cpanel_config.php`:
```php
private $config = [
    'host' => 'localhost',
    'port' => '3306',
    'dbname' => 'your_actual_db_name',
    'user' => 'your_actual_db_user',
    'password' => 'your_actual_password',
    'charset' => 'utf8mb4'
];
```

## Step 5: Set Up Cron Jobs for Email Notifications

### 5.1 Create Cron Job in cPanel
1. Go to **Cron Jobs** in cPanel
2. Add new cron job:
   - **Minute**: `0`
   - **Hour**: `9` (9 AM)
   - **Day**: `*`
   - **Month**: `*`
   - **Weekday**: `*`
   - **Command**: `/usr/local/bin/php /home/username/public_html/license-system/backend/email_system/daily_notifications.php`

### 5.2 Alternative: Web-based Cron
If PHP CLI isn't available, use a web-based cron:
- **Command**: `wget -O - -q "https://yourdomain.com/license-system/backend/email_system/web_endpoint.php" > /dev/null 2>&1`

## Step 6: URL Rewrite (.htaccess)

Create `.htaccess` in your main directory:
```apache
RewriteEngine On

# API routes
RewriteRule ^api/(.*)$ backend/api/index.php [QSA,L]

# Frontend routes  
RewriteRule ^dashboard$ frontend/pages/dashboard.php [L]
RewriteRule ^licenses$ frontend/pages/licenses.php [L]
RewriteRule ^clients$ frontend/pages/clients.php [L]
RewriteRule ^login$ frontend/pages/login.php [L]

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
</IfModule>

# Deny access to sensitive files
<Files "*.env">
    Order allow,deny
    Deny from all
</Files>

<Files "config.php">
    Order allow,deny
    Deny from all
</Files>
```

## Step 7: Security Checklist

### 7.1 File Permissions
- Folders: 755
- PHP files: 644
- Config files: 600 (if possible)

### 7.2 Hide Sensitive Information
- Move config files outside public_html if possible
- Use environment variables
- Never commit passwords to version control

### 7.3 Database Security
- Use strong passwords
- Limit database user privileges
- Regular backups

## Step 8: Testing

### 8.1 Test Database Connection
Create `test_db.php`:
```php
<?php
require_once 'backend/config/cpanel_config.php';

try {
    $db = CPanelDatabase::getInstance();
    if ($db->testConnection()) {
        echo "✅ Database connection successful!";
    } else {
        echo "❌ Database connection failed!";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage();
}
?>
```

### 8.2 Test Email System
```bash
# Run this via cPanel File Manager or SSH
php backend/email_system/test_email.php
```

## Step 9: Go Live

1. Update all URLs to your domain
2. Test all functionality
3. Set up SSL certificate (Let's Encrypt in cPanel)
4. Update DNS settings if needed
5. Set up regular database backups

## 🔧 Troubleshooting

### Common Issues:
- **500 Internal Server Error**: Check file permissions and error logs
- **Database Connection Failed**: Verify database credentials
- **Email Not Sending**: Check SMTP settings and firewall
- **Missing Dependencies**: Install PHPMailer via composer or manually

### Debug Mode:
Add to top of your PHP files:
```php
ini_set('display_errors', 1);
error_reporting(E_ALL);
```

### Error Logs:
Check cPanel Error Logs for detailed error messages.