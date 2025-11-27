# cPanel File Upload Fix Guide

## Problem
Getting 500 Internal Server Error when uploading documents while adding Clients or Vendors on cPanel deployment.

## Quick Diagnosis

### Step 1: Check Upload Configuration
Open this URL in your browser (replace with your domain):
```
https://cybaemtech.net/License/api/check_upload_config.php
```

This will show you:
- PHP upload settings
- Directory permissions
- Whether directories exist and are writable

---

## Common Issues & Solutions

### Issue 1: Upload Directories Don't Exist

**Solution:**
1. Login to cPanel
2. Go to **File Manager**
3. Navigate to your `License/public/` folder
4. Create these directories if missing:
   ```
   public/
   └── uploads/
       ├── clients/
       ├── vendors/
       └── company/
   ```
4. Right-click each directory → **Change Permissions**
5. Set permissions to **755** (Read/Write/Execute for owner, Read/Execute for group/others)

### Issue 2: Directory Permissions Problem

**Solution:**
1. In cPanel File Manager, navigate to `License/public/uploads/`
2. Right-click the `uploads` folder → **Change Permissions**
3. Check these boxes:
   - ☑ Owner: Read, Write, Execute
   - ☑ Group: Read, Execute
   - ☑ World: Read, Execute
4. **Important:** Check "Recurse into subdirectories"
5. Click **Change Permissions**

### Issue 3: PHP Upload Size Limits Too Small

**Check Current Limits:**
Look at the diagnostic output from Step 1. If you see:
- `upload_max_filesize: 2M` (too small)
- `post_max_size: 8M` (too small)

**Solution:**
1. In cPanel, go to **Select PHP Version** or **MultiPHP INI Editor**
2. Find and update these settings:
   - `upload_max_filesize` = **50M**
   - `post_max_size` = **60M**
   - `max_execution_time` = **300**
   - `memory_limit` = **256M**
3. Save changes
4. Wait 2-3 minutes for changes to apply

### Issue 4: Missing fileinfo Extension

**Check:** In diagnostic output, look for `"finfo_available": false`

**Solution:**
1. In cPanel, go to **Select PHP Version**
2. Find **fileinfo** in the extensions list
3. Check the checkbox to enable it
4. Click **Save**

### Issue 5: Error Logs Not Accessible

**Solution:**
1. In cPanel, go to **Errors** (under Metrics section)
2. Look for recent PHP errors related to your domain
3. Common errors:
   - "Permission denied" → Fix directory permissions (Issue 2)
   - "failed to open stream" → Fix directory creation (Issue 1)
   - "File upload error" → Fix PHP settings (Issue 3)

---

## Step-by-Step Fix Process

### 1. Create Directories Manually
```bash
# Using cPanel File Manager or Terminal:
cd public_html/License/public
mkdir -p uploads/clients uploads/vendors uploads/company
chmod 755 uploads
chmod 755 uploads/clients
chmod 755 uploads/vendors
chmod 755 uploads/company
```

### 2. Verify PHP Settings
Create a test file: `public/test_upload.php`
```php
<?php
phpinfo();
?>
```

Visit: `https://cybaemtech.net/License/public/test_upload.php`

Search for these values:
- `upload_max_filesize` should be at least **10M**
- `post_max_size` should be at least **12M**
- `file_uploads` should be **On**
- `fileinfo` should be enabled

**Delete this file after checking!**

### 3. Check Error Logs

**Method 1: cPanel Error Log**
1. cPanel → **Metrics** → **Errors**
2. Select your domain
3. Look for errors from today

**Method 2: PHP Error Log**
1. In File Manager, check for these files:
   - `error_log` in your root directory
   - `error_log` in the `api` directory
2. Download and read them

### 4. Test Upload After Each Fix

1. Go to your application
2. Try adding a Client with a small PDF file (under 1MB)
3. If it fails, check error logs again
4. Repeat fixes as needed

---

## Still Getting Errors?

### Enable Detailed Error Logging

Add this to the top of `api/controllers/ClientController.php` and `api/controllers/VendorsController.php`:
```php
ini_set('display_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL);
```

This will give you more detailed error messages.

### Check .htaccess File

Make sure your `.htaccess` file in the `public` folder doesn't block uploads:
```apache
# Make sure these lines are NOT present or commented out:
# php_flag file_uploads Off
# php_value upload_max_filesize 0

# Make sure this IS present:
php_flag file_uploads On
```

---

## Common cPanel-Specific Issues

### 1. mod_security Blocking Uploads
Some cPanel servers have mod_security that blocks certain file uploads.

**Solution:**
1. Contact your hosting provider
2. Ask them to check mod_security logs
3. Request whitelisting for your upload directories

### 2. Suhosin Security Extension
Some servers have Suhosin that limits POST variables.

**Check:** Look for `suhosin` in `phpinfo()`

**Solution:**
Add to `.htaccess` or ask hosting provider:
```apache
<IfModule mod_suhosin.c>
    php_value suhosin.post.max_vars 2000
    php_value suhosin.request.max_vars 2000
</IfModule>
```

### 3. Open_basedir Restriction
Some servers restrict which directories PHP can access.

**Check Error Log For:** "open_basedir restriction in effect"

**Solution:**
1. Contact hosting provider
2. Ask them to add your `uploads` directory to open_basedir
3. Or move uploads to an allowed directory

---

## Final Checklist

Before contacting support, verify:
- ✅ Directories exist: `public/uploads/clients/`, `public/uploads/vendors/`
- ✅ Directory permissions: **755**
- ✅ PHP upload_max_filesize: **≥10M**
- ✅ PHP post_max_size: **≥12M**
- ✅ PHP file_uploads: **On**
- ✅ fileinfo extension: **Enabled**
- ✅ Error logs checked
- ✅ Test file uploaded successfully via diagnostic script

---

## Contact Support With This Information

If nothing works, contact your hosting provider with:
1. Screenshot of diagnostic output (`check_upload_config.php`)
2. Recent error log entries
3. PHP version from diagnostic
4. This specific error message

They should be able to help you resolve the permissions or PHP configuration issue.

---

## Prevention for Future Deployments

Add these lines to your `.htaccess` in the `public` folder:
```apache
# Enable file uploads
php_flag file_uploads On
php_value upload_max_filesize 50M
php_value post_max_size 60M
php_value max_execution_time 300
php_value memory_limit 256M

# Set proper permissions for upload directories
<Directory "uploads">
    Options +FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
```

This ensures the settings are always correct for your application.
