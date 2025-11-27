# cPanel Deployment Instructions

## 500 Internal Server Error Fix

Agar aapko cPanel par deploy karte waqt **500 Internal Server Error** aa raha hai, to neeche diye steps follow karein:

### Common Causes:
1. **php_flag/php_value directives** - Ye cPanel shared hosting par support nahi karte (FastCGI/PHP-FPM ke saath)
2. **.env file missing** - Database credentials nahi milte
3. **Wrong file permissions** - Files/folders ki permissions galat hain
4. **Wrong PHP version** - PHP 8.0+ required hai

---

## Steps to Deploy on cPanel

### Step 1: Build the Project

```bash
npm run build
```

Ye command `dist/` folder mein production-ready files create karega.

### Step 2: Upload to cPanel

#### Files to Upload:
1. **dist/** folder ki sari files → `public_html/License/` mein
2. **api/** folder → `public_html/License/api/` mein
3. **public/.htaccess** → `public_html/License/.htaccess` mein (IMPORTANT!)
4. **api/.htaccess** → `public_html/License/api/.htaccess` mein
5. **api/.user.ini** → `public_html/License/api/.user.ini` mein (PHP settings)

#### cPanel File Structure (Final):
```
public_html/
└── License/
    ├── index.html          (dist se)
    ├── assets/             (dist se)
    ├── .htaccess           (public/.htaccess se - IMPORTANT!)
    ├── api/                
    │   ├── index.php
    │   ├── .htaccess       (api/.htaccess se)
    │   ├── .user.ini       (PHP settings - IMPORTANT!)
    │   ├── .env            (DATABASE CREDENTIALS - CREATE THIS!)
    │   └── ...other PHP files
    └── uploads/            
        ├── clients/
        ├── vendors/
        ├── bills/
        └── company/
```

### Step 3: Create .env File on cPanel

**IMPORTANT:** cPanel par `public_html/License/api/.env` file banayein:

```env
# Database Configuration
MYSQL_HOST=localhost
MYSQL_DATABASE=your_database_name
MYSQL_USER=your_cpanel_username_dbuser
MYSQL_PASSWORD=your_database_password
MYSQL_PORT=3306

# App Configuration
APP_URL=https://cybaemtech.net/License
EMAIL_MODE=production
```

**Note:** cPanel mein database user format: `cpanel_username_dbuser` hota hai.

### Step 4: Set Correct Permissions

cPanel File Manager mein permissions set karein:

| File/Folder | Permission |
|-------------|------------|
| `License/` folder | 755 |
| `License/api/` folder | 755 |
| `License/uploads/` folder | 755 |
| All `.php` files | 644 |
| `.htaccess` files | 644 |
| `.user.ini` file | 644 |
| `.env` file | 600 |

### Step 5: Check PHP Version

cPanel mein jaake check karein:
1. **cPanel → Select PHP Version** ya **MultiPHP Manager**
2. PHP **8.0+** (preferably 8.2) select karein
3. **Save** karein

---

## Troubleshooting

### Issue 1: 500 Internal Server Error

**Check karein:**

1. **Error logs check karein:**
   - cPanel → Errors (under Metrics section)
   - Ya `public_html/License/api/error_log` file check karein

2. **Old .htaccess delete karein aur new upload karein:**
   - Purani .htaccess file delete karein
   - Fresh `public/.htaccess` upload karein `License/.htaccess` mein
   - Fresh `api/.htaccess` upload karein `License/api/.htaccess` mein

3. **.env file check karein:**
   ```
   public_html/License/api/.env
   ```
   Isme correct database credentials hone chahiye

4. **PHP Version check karein:**
   - cPanel → Select PHP Version → PHP 8.0+ select karein

### Issue 2: API Not Working / Database Error

**Check karein:**
1. Database credentials `.env` mein sahi hain
2. Database user ko database ka access diya hai (cPanel → MySQL Databases → Add User to Database)
3. cPanel username prefix: `cpaneluser_dbname`, `cpaneluser_dbuser`

### Issue 3: Documents/Files Not Loading

**Check karein:**
1. `uploads/` folder exist karta hai
2. Permissions 755 hain
3. File path sahi hai: `/License/uploads/...`

---

## Quick Fix Steps

Agar 500 error aaye to ye steps follow karein:

1. **Delete karein:**
   - `License/.htaccess` (purani)
   - `License/api/.htaccess` (purani)

2. **Upload karein:**
   - `public/.htaccess` → `License/.htaccess`
   - `api/.htaccess` → `License/api/.htaccess`
   - `api/.user.ini` → `License/api/.user.ini`

3. **Create karein:**
   - `License/api/.env` file with database credentials

4. **Permissions set karein:**
   - `.htaccess` files → 644
   - `.env` file → 600
   - Folders → 755
   - PHP files → 644

5. **PHP version check karein** → 8.0+

---

## Important Notes

1. **php_flag/php_value use mat karein** .htaccess mein - ye cPanel par work nahi karte
2. **PHP settings ke liye .user.ini use karein** - ye cPanel shared hosting par work karti hai
3. **.env file API folder mein honi chahiye** - `public_html/License/api/.env`
4. **Uploads folder preserve karein** - Deployment ke waqt backup lein

---

## Contact Support

Agar issue resolve nahi hota:
1. cPanel error logs check karein (actual error message ke liye)
2. Apache error logs hosting provider se maangein
