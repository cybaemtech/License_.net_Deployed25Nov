# 📊 Database Import Guide - Complete Setup

## 🎯 Problem: Database Connection Successful But No Data

Agar aapka database connect ho raha hai but data fetch nahi ho raha, toh **database tables import nahi hue hain**.

---

## ✅ Solution: Database Schema Import (3 Methods)

### Method 1: cPanel phpMyAdmin (Easiest - Recommended)

Aapka database **remote cPanel server** par hai, toh yeh method use karein:

#### Step 1: cPanel Login
1. Apne cPanel login karein (https://yoursite.com:2083)
2. **phpMyAdmin** open karein

#### Step 2: Select Database
1. Left sidebar mein **`cybaemtechnet_LMS_Project`** database select karein
2. Agar tables already hain to pehle **Drop All Tables** karein (fresh import ke liye)

#### Step 3: Import SQL File
1. Top menu mein **Import** tab par click karein
2. **Choose File** button click karein
3. Project folder se **`database_schema.sql`** file select karein
4. Niche scroll karke **Go** button click karein
5. Wait karein... Import complete hone tak

#### Step 4: Verify
1. Left sidebar refresh karein
2. Aapko **13 tables** dikhne chahiye:
   - users
   - license_purchases
   - clients
   - vendors
   - tools
   - currencies
   - sales
   - license_allocations
   - email_notifications
   - notification_settings
   - email_notification_log
   - license_usage_logs
   - company_settings

---

### Method 2: MySQL Command Line (Advanced)

Agar aap command line prefer karte ho:

```bash
# Project folder se
mysql -h 82.25.105.94 -u cybaemtechnet_LMS_Project -p cybaemtechnet_LMS_Project < database_schema.sql
```

Password enter karein: `PrajwalAK12`

---

### Method 3: MySQL Workbench (GUI Tool)

1. MySQL Workbench download karein: https://dev.mysql.com/downloads/workbench/
2. New Connection create karein:
   - Connection Name: LicenseHub
   - Hostname: 82.25.105.94
   - Port: 3306
   - Username: cybaemtechnet_LMS_Project
   - Password: PrajwalAK12
3. Connect karein
4. Database select karein: `cybaemtechnet_LMS_Project`
5. File > Run SQL Script > `database_schema.sql` select karein
6. Execute karein

---

## 🔍 Verify Database Setup (Important!)

Database import ke baad, yeh verification script run karein:

```bash
php check_database.php
```

Yeh script check karega:
- ✅ Database connection successful hai ya nahi
- ✅ All 13 tables exist karte hain ya nahi
- ✅ Tables mein data hai ya nahi (users, currencies, etc.)

Expected output:
```
✅ Database connection successful!
✅ All tables exist!
✅ Database is ready to use!
```

---

## 📋 What Gets Imported

`database_schema.sql` file import karne se yeh create hoga:

### 1. **Tables** (13 total)
All required tables with proper structure

### 2. **Default Data**
- **Admin User**: admin@cybearmtech.com / admin123
- **Test User**: accounts@cybearmtech.com / accounts123
- **10 Currencies**: INR, USD, EUR, GBP, etc. with exchange rates
- **Company Settings**: Default configuration

### 3. **Indexes & Constraints**
- Foreign keys for data integrity
- Unique indexes for email, GST numbers
- Performance optimizations

---

## 🎯 After Import: Test Your Application

### Step 1: Start Application
```bash
npm run dev
```

### Step 2: Open Browser
```
http://localhost:5000
```

### Step 3: Login with Default Credentials
- **Email**: admin@cybearmtech.com
- **Password**: admin123

### Step 4: Verify Dashboard
- Dashboard should load without errors
- No "Database connection failed" errors
- Empty data is normal (add your own licenses/clients/vendors)

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Import Failed" Error
**Solution:** 
- Database already existing tables hain
- Pehle all tables drop karein
- Phir fresh import karein

### Issue 2: "Table already exists"
**Solution:**
```sql
-- phpMyAdmin mein run karein
DROP DATABASE cybaemtechnet_LMS_Project;
CREATE DATABASE cybaemtechnet_LMS_Project CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Then import `database_schema.sql` again

### Issue 3: Still No Data After Import
**Solution:**
1. Check ki sahi database select kiya hai (cybaemtechnet_LMS_Project)
2. Run verification: `php check_database.php`
3. Check browser console for API errors

### Issue 4: "Access Denied" Error
**Solution:**
- Check `.env` file credentials sahi hain
- Database user ko proper permissions hain
- Remote access allowed hai (cPanel mein)

---

## 🔒 Security Notes

- Default admin password **immediately change** karein after first login
- `.env` file ko **never** git mein commit na karein
- Production mein strong passwords use karein

---

## 📞 Need Help?

Agar phir bhi problem aa rahi hai:

1. ✅ Run: `php check_database.php`
2. ✅ Check browser console errors (F12)
3. ✅ Verify `.env` file credentials
4. ✅ Check cPanel database permissions

---

**Your Database Details:**
```
Host: 82.25.105.94
Database: cybaemtechnet_LMS_Project
User: cybaemtechnet_LMS_Project
Password: PrajwalAK12
Port: 3306
```

---

**Created:** November 20, 2025  
**For:** LicenseHub Enterprise System
