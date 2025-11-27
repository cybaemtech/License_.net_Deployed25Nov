# 🔧 Localhost Database Error - Complete Fix

## ❌ Error You're Getting:
```
Database error: Error: Database connection failed
```

---

## ✅ Complete Fix - Step by Step

### Step 1: Create .env File

**Windows Command Prompt:**
```cmd
cd C:\path\to\your\project
copy .env.example .env
```

**Mac/Linux Terminal:**
```bash
cd /path/to/your/project
cp .env.example .env
```

⚠️ **IMPORTANT**: `.env` file **project root folder** mein honi chahiye, `api` folder mein nahi!

---

### Step 2: Verify .env File

Terminal mein run karein:
```bash
php test_localhost_env.php
```

Yeh script check karega:
- ✅ .env file exists karti hai ya nahi
- ✅ Environment variables load ho rahe hain ya nahi
- ✅ Database connection successful hai ya nahi

---

### Step 3: Fix Based on Test Results

#### If Test Says: ".env file NOT FOUND"
```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

#### If Test Says: "Missing environment variables"
Open `.env` file and add:
```env
MYSQL_HOST=82.25.105.94
MYSQL_PORT=3306
MYSQL_USER=cybaemtechnet_LMS_Project
MYSQL_PASSWORD=PrajwalAK12
MYSQL_DATABASE=cybaemtechnet_LMS_Project
```

#### If Test Says: "Database connection FAILED"
Check these:
1. **Internet connection** - Aapka database remote server (82.25.105.94) par hai
2. **Firewall** - Port 3306 blocked to nahi hai
3. **Database server** - cybaemtech.net server running hai ya nahi

---

### Step 4: Restart Application

```bash
npm run dev
```

Browser mein open karein: `http://localhost:5000`

---

## 🎯 Quick Verification Commands

### Check if .env exists:
```bash
# Windows
dir .env

# Mac/Linux
ls -la .env
```

### Check .env content:
```bash
# Windows
type .env

# Mac/Linux
cat .env
```

### Test full environment:
```bash
php test_localhost_env.php
```

---

## 🔍 Common Mistakes

### ❌ Mistake 1: .env file wrong location
```
project/
  api/
    .env  ❌ WRONG - api folder mein nahi
  .env    ✅ CORRECT - root folder mein
```

### ❌ Mistake 2: .env file empty
Check karo ki .env file mein database credentials hain

### ❌ Mistake 3: Wrong credentials
Make sure yeh exact credentials use karo:
- Host: `82.25.105.94` (not localhost!)
- User: `cybaemtechnet_LMS_Project`
- Password: `PrajwalAK12`
- Database: `cybaemtechnet_LMS_Project`

---

## 📝 After Fix - Login Credentials

**Admin:**
- Email: admin@cybearmtech.com
- Password: admin123

---

**Need more help?**
Run: `php test_localhost_env.php` and share the output
