# 🔥 LOCALHOST MySQL Setup - Complete Fix Guide

## ⚠️ Problem: "Database connection failed" error on localhost

Agar aapko yeh error aa raha hai:
```
Database error: Error: Database connection failed
```

Toh yeh guide aapko **step-by-step** solve karega!

---

## 📋 Step 1: Check Prerequisites

### Windows Users:
- **XAMPP** ya **WAMP** install hona chahiye
- MySQL service running hona chahiye

### Mac Users:
- **MAMP** ya **Homebrew MySQL** install hona chahiye  
- MySQL service running hona chahiye

### Linux Users:
- MySQL Server install hona chahiye:
  ```bash
  sudo apt-get install mysql-server
  ```

---

## 🔧 Step 2: Verify MySQL is Running

### Windows (XAMPP):
1. XAMPP Control Panel open karein
2. **MySQL** ke samne **Start** button click karein
3. Green light dikhe toh chal raha hai ✅

### Windows (Command):
```cmd
net start mysql80
```

### Mac:
```bash
mysql.server start
```

### Linux:
```bash
sudo systemctl start mysql
sudo systemctl status mysql
```

---

## 📝 Step 3: Create .env File (MOST IMPORTANT!)

### Option A: Windows (Copy command):
```cmd
copy .env.example .env
```

### Option B: Mac/Linux:
```bash
cp .env.example .env
```

### Option C: Manual method:
1. Project root folder mein jaayein
2. `.env.example` file ko right-click karein
3. **"Copy"** karein
4. Same folder mein right-click → **"Paste"**
5. Naam badal ke **`.env`** kar dein (dot se shuru hona chahiye!)

---

## ⚙️ Step 4: Edit .env File with YOUR Credentials

**.env** file ko open karein (Notepad ya VS Code se) aur yeh lines add/edit karein:

### For XAMPP (Default):
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=license_management

APP_URL=http://localhost:5000
EMAIL_MODE=disabled
SESSION_SECRET=local_dev_secret_123
TZ=Asia/Kolkata
```

### For MAMP (Mac):
```env
MYSQL_HOST=localhost
MYSQL_PORT=8889
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_DATABASE=license_management

APP_URL=http://localhost:5000
EMAIL_MODE=disabled
SESSION_SECRET=local_dev_secret_123
TZ=Asia/Kolkata
```

### For Custom MySQL:
Agar aapne custom password set kiya hai:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_actual_password_here
MYSQL_DATABASE=license_management

APP_URL=http://localhost:5000
EMAIL_MODE=disabled
SESSION_SECRET=local_dev_secret_123
TZ=Asia/Kolkata
```

**💡 Important Notes:**
- `MYSQL_PASSWORD=` ke baad agar koi password nahi hai toh empty rakhein
- Agar password hai toh exactly wahi likhen (spaces/special characters bhi)
- `localhost` ko exactly aise hi likhen
- File save karna mat bhoolna!

---

## 🗄️ Step 5: Create Database

### Method 1: Using phpMyAdmin (Easiest):
1. Browser mein open karein: `http://localhost/phpmyadmin`
2. **"New"** button click karein (left side)
3. Database name: `license_management`
4. Collation: `utf8mb4_unicode_ci`
5. **"Create"** button click karein ✅

### Method 2: Using MySQL Command Line:
```bash
mysql -u root -p
```
Then run:
```sql
CREATE DATABASE license_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

---

## 📥 Step 6: Import Database Schema

### Method 1: Using phpMyAdmin:
1. `http://localhost/phpmyadmin` open karein
2. Left side se **`license_management`** database select karein
3. **"Import"** tab click karein
4. **"Choose File"** → `database_schema.sql` select karein
5. Scroll down → **"Go"** button click karein
6. "Import has been successfully finished" dikhe toh done! ✅

### Method 2: Using Command Line:
```bash
cd path/to/your/project
mysql -u root -p license_management < database_schema.sql
```

**Password puchega toh:**
- XAMPP: Just Enter press karein (no password)
- MAMP: `root` type karein
- Custom: Apna password type karein

---

## ✅ Step 7: Test MySQL Connection

Browser mein yeh URL open karein:
```
http://localhost:8000/test_connection.php
```

Agar sab theek hai toh aapko yeh dikhenga:
```json
{
  "connection_status": "SUCCESS",
  "test_query": "SUCCESS"
}
```

Agar error dikhe:
1. Check karein MySQL chal raha hai ya nahi
2. .env file mein credentials sahi hain ya nahi
3. Database create kiya hai ya nahi

---

## 🚀 Step 8: Start Application

Ab finally application run karein:

```bash
npm run dev
```

Yeh automatically **dono servers** start kar dega:
- ✅ **PHP Backend** → `http://localhost:8000`
- ✅ **React Frontend** → `http://localhost:5000`

Browser mein open karein:
```
http://localhost:5000
```

---

## 🔑 Step 9: Login

Default credentials:

**Admin Account:**
- Email: `rohan.bhosale@cybaemtech.com`
- Password: `password`

**Accounts User:**
- Email: `accounts@cybaemtech.com`
- Password: `password`

---

## 🐛 Common Errors & Solutions

### Error 1: "MYSQL_DATABASE not found"
**Solution:** .env file properly save nahi hui. Check karein:
- File ka naam exactly `.env` hai (not `.env.txt`)
- Notepad++ ya VS Code use karke save karein
- File root folder mein hai

### Error 2: "Access denied for user"
**Solution:** Password galat hai
- XAMPP: Password empty rakhein `MYSQL_PASSWORD=`
- MAMP: Password `root` hota hai `MYSQL_PASSWORD=root`

### Error 3: "Can't connect to MySQL server"
**Solution:** MySQL service band hai
- XAMPP Control Panel se MySQL start karein
- Ya command: `net start mysql80`

### Error 4: "Unknown database 'license_management'"
**Solution:** Database create nahi kiya
- Step 5 aur 6 dobara follow karein

### Error 5: Port 5000 already in use
**Solution:**
```bash
# Kill process on port 5000
npx kill-port 5000
# Then restart
npm run dev
```

---

## 📞 Still Having Issues?

1. **Check logs:** Terminal mein jo errors aa rahe hain wo screenshot lein
2. **Test connection:** `http://localhost:8000/test_connection.php` open karein
3. **Verify .env:** Double-check sab credentials sahi hain

**Common mistakes:**
- ❌ `.env` file nahi banayi
- ❌ MySQL service nahi chal rahi
- ❌ Database import nahi kiya
- ❌ Password mein space ya typo hai

---

## ✅ Success Checklist

Before running the app, verify:
- [x] MySQL service is running
- [x] `.env` file exists in project root
- [x] All MYSQL_* variables are set in .env
- [x] Database `license_management` is created
- [x] Schema is imported (tables exist)
- [x] `npm install` is complete
- [x] Both PHP and Node.js are installed

Agar sab tick hain, toh `npm run dev` 100% kaam karega! 🎉

---

**Happy Coding! 🚀**
