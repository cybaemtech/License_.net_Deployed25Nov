# 🔧 Troubleshooting Guide - LicenseHub

## 🚨 Most Common Error: JSON Parsing Error

### Error Message:
```
SyntaxError: Unexpected token '<', "<br /> <b>"... is not valid JSON
```

### Kya Ho Raha Hai?
- Browser JSON data expect kar raha hai
- Lekin PHP backend HTML error page bhej raha hai
- Matlab: **Database se connect nahi ho pa raha**

---

## ✅ Step-by-Step Fix

### Step 1: Check Database Service

**MySQL:**
```bash
# Windows
net start mysql80

# Mac
brew services start mysql

# Linux
sudo systemctl start mysql
```

**PostgreSQL:**
```bash
# Windows
net start postgresql-x64-14

# Mac
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### Step 2: Verify Database Exists

**MySQL:**
```bash
mysql -u root -p
```
```sql
SHOW DATABASES;
-- Agar "license_management" nahi dikh raha to:
CREATE DATABASE license_management;
USE license_management;
SOURCE database_schema.sql;
```

**PostgreSQL:**
```bash
psql -U postgres
```
```sql
\l
-- Agar "license_management" nahi hai to:
CREATE DATABASE license_management;
\c license_management
\i api/postgres_setup.sql
```

### Step 3: Check .env File

**Zaroori hai:** `.env` file project root mein honi chahiye

```env
# MySQL ke liye
DB_DRIVER=mysql
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password  # ❗ Apna actual password yahan
MYSQL_DATABASE=license_management

# PostgreSQL ke liye (agar MySQL nahi use kar rahe)
DB_DRIVER=pgsql
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=your_password  # ❗ Apna actual password yahan
PGDATABASE=license_management
```

### Step 4: Test Database Connection

**Quick Test Script:**

Create `test-db.php` in `api/` folder:

```php
<?php
require_once __DIR__ . '/config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    echo "✅ Database connected successfully!\n";
} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
}
?>
```

Run:
```bash
php api/test-db.php
```

### Step 5: Check PHP Errors

**Enable Error Display:**

Edit `api/config/database.php` temporarily:
```php
ini_set('display_errors', 1);
error_reporting(E_ALL);
```

Restart server and check browser console.

---

## 🔍 Other Common Issues

### Issue: "Port 8000 already in use"

**Solution:**
```bash
# Windows: Find and kill process
netstat -ano | findstr :8000
taskkill /PID <process_id> /F

# Mac/Linux
lsof -ti:8000 | xargs kill -9
```

### Issue: "Port 5000 already in use"

**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <process_id> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

### Issue: PHP command not found

**Check PHP Installation:**
```bash
php -v
```

**If not installed:**
- Windows: Download from [php.net](https://windows.php.net/download/)
- Mac: `brew install php`
- Linux: `sudo apt install php8.2` or `sudo yum install php`

**Add to PATH:**
- Windows: System Properties → Environment Variables → PATH → Add PHP folder path
- Mac/Linux: Add to `.bashrc` or `.zshrc`:
  ```bash
  export PATH="/path/to/php:$PATH"
  ```

### Issue: npm packages not installing

**Solution:**
```bash
# Clear cache
npm cache clean --force

# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Database exists but tables are empty

**Re-import Schema:**

**MySQL:**
```bash
mysql -u root -p license_management < database_schema.sql
```

**PostgreSQL:**
```bash
psql -U postgres -d license_management -f api/postgres_setup.sql
```

---

## 🎯 Debugging Checklist

Agar problem solve nahi ho raha, yeh sab check karein:

- [ ] Database service running hai?
- [ ] Database create kiya hai?
- [ ] Tables import kiye hain?
- [ ] `.env` file exists and correctly configured?
- [ ] Database credentials sahi hain?
- [ ] PHP installed and in PATH?
- [ ] Node.js installed?
- [ ] npm packages installed (`node_modules` folder exists)?
- [ ] No other process using port 5000 or 8000?
- [ ] Browser cache cleared?

---

## 📊 Log Files Check Karein

### Backend (PHP) Logs:
Terminal mein `[PHP]` prefix ke saath dikhenge:
```
[PHP] Database connection failed
[PHP] SQLSTATE[HY000] [1045] Access denied
```

### Frontend (React) Logs:
Terminal mein `[React]` prefix ke saath:
```
[React] Failed to load resource: 500 (Internal Server Error)
```

### Browser Console:
F12 press karein → Console tab:
```
SyntaxError: Unexpected token '<'
```

---

## 💡 Pro Tips

1. **Always check Backend logs first** - Frontend errors usually backend ki wajah se hote hain

2. **Database credentials test karein manually**:
   ```bash
   mysql -u root -p
   # Ya
   psql -U postgres
   ```

3. **Clear browser cache** kar ke try karein

4. **Restart everything**:
   ```bash
   # Stop running servers (Ctrl+C)
   # Then:
   npm run dev
   ```

---

## 🆘 Still Having Issues?

### Check These Files:

1. **Backend Database Config:**
   ```
   api/config/database.php
   ```

2. **Environment Loader:**
   ```
   api/load_env.php
   ```

3. **Frontend API Config:**
   ```
   src/config/index.ts
   ```

### Get More Help:

1. Check error logs in terminal
2. Check browser DevTools console
3. Enable PHP error display
4. Test database connection manually

---

**Remember:** 90% errors localhost par database configuration ki wajah se hote hain! 🎯
