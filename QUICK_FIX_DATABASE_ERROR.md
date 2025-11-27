# 🔧 Database Connection Error - Quick Fix Guide

## ❌ Current Error
```
Database error: Error: Database connection failed
```

## ✅ Solution - Simple 2-Step Fix

### Step 1: Create .env File

Apne project folder mein terminal khol kar yeh command run karein:

**Windows Command Prompt:**
```cmd
copy .env.example .env
```

**Mac/Linux Terminal:**
```bash
cp .env.example .env
```

---

### Step 2: Restart Application

Terminal mein:
```bash
npm run dev
```

**That's it!** Your database credentials already configured hain `.env.example` file mein:

```
Database: cybaemtechnet_LMS_Project
Host: 82.25.105.94
User: cybaemtechnet_LMS_Project
```

---

## 🎯 Default Login Credentials

Application successfully run hone ke baad browser mein `http://localhost:5000` open karein:

**Admin Account:**
- Email: `admin@cybearmtech.com`
- Password: `admin123`

**Test Account:**
- Email: `accounts@cybearmtech.com`  
- Password: `accounts123`

---

## ⚠️ Still Getting Error?

Agar abhi bhi error aa raha hai, yeh check karein:

### 1. Check .env File Location
```bash
# Project root folder mein hona chahiye
dir .env     # Windows
ls -la .env  # Mac/Linux
```

### 2. Verify Database Connection
Apne remote database (82.25.105.94) ki connectivity check karein:
- Server running hai?
- Network/firewall blocking to nahi?
- cPanel se database accessible hai?

### 3. Check Database Tables
Database mein tables import hone chahiye. Agar nahi hai to:
- cPanel phpMyAdmin se login karein
- `cybaemtechnet_LMS_Project` database select karein
- `database_schema.sql` file import karein

---

## 📝 Important Notes

- **`.env` file kabhi git mein commit na karein** (already .gitignore mein hai)
- Aapka database **remote server** par hai, so internet connection chahiye
- Email notifications ko baad mein configure kar sakte ho (optional hai)

---

**Your Database Configuration:**
- Host: 82.25.105.94 (Remote cPanel Server)
- Database: cybaemtechnet_LMS_Project
- User: cybaemtechnet_LMS_Project
- Port: 3306 (Default MySQL)

---

**Last Updated:** November 20, 2025
