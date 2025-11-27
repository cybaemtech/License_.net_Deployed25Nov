# 🚀 Localhost Setup Guide - LicenseHub

Yeh guide aapko batayega ki project ko **localhost** par kaise setup karein.

---

## 📋 Prerequisites (Zaroori Cheezein)

Aapke system par yeh installed hona chahiye:

1. **Node.js** (v18 ya latest) - [Download](https://nodejs.org/)
2. **PHP 8.2+** - [Download](https://www.php.net/downloads)
3. **Database** (ek choose karein):
   - **Option A:** MySQL (8.0+) - [Download](https://dev.mysql.com/downloads/)
   - **Option B:** PostgreSQL (14+) - [Download](https://www.postgresql.org/download/)

---

## 🔧 Step-by-Step Setup

### Step 1: Project Clone/Download

```bash
# Agar git se clone kar rahe ho
git clone <your-repo-url>
cd license-procurement-system

# Ya folder ko extract karein agar download kiya hai
```

### Step 2: Install Dependencies

```bash
# NPM packages install karein
npm install
```

### Step 3: Database Setup

#### **Option A: MySQL Setup** (Recommended for localhost)

1. **MySQL Server Start karein**

2. **Database Create karein**:
   ```sql
   CREATE DATABASE license_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Import Schema**:
   ```bash
   # MySQL command line se:
   mysql -u root -p license_management < database_schema.sql
   ```

#### **Option B: PostgreSQL Setup**

1. **PostgreSQL Server Start karein**

2. **Database Create karein**:
   ```sql
   CREATE DATABASE license_management;
   ```

3. **Import Schema**:
   ```bash
   # Terminal se:
   psql -U postgres -d license_management -f api/postgres_setup.sql
   ```

### Step 4: Environment Configuration

1. **`.env.example` ko copy karein**:
   ```bash
   copy .env.example .env
   # Mac/Linux: cp .env.example .env
   ```

2. **`.env` file edit karein** apne database credentials ke saath:

   **Agar MySQL use kar rahe ho:**
   ```env
   DB_DRIVER=mysql
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=your_mysql_password
   MYSQL_DATABASE=license_management
   ```

   **Agar PostgreSQL use kar rahe ho:**
   ```env
   DB_DRIVER=pgsql
   PGHOST=localhost
   PGPORT=5432
   PGUSER=postgres
   PGPASSWORD=your_postgres_password
   PGDATABASE=license_management
   ```

### Step 5: Start Application

**Windows:**
```bash
npm run dev
```

**Mac/Linux:**
```bash
npm run dev
```

Yeh automatically **backend** (PHP) aur **frontend** (React) dono start kar dega.

---

## 🌐 Access Application

Browser mein open karein:
```
http://localhost:5000
```

### Default Login Credentials

**Admin Account:**
- Email: `rohan.bhosale@cybaemtech.com`
- Password: `password`

**Accounts User:**
- Email: `accounts@cybaemtech.com`
- Password: `password`

---

## ❌ Common Issues & Solutions

### Issue 1: "Unexpected token '<', "<br /> <b>"... is not valid JSON"

**Reason:** Database connect nahi ho raha

**Solution:**
1. Check karein database server chal raha hai ya nahi
2. `.env` file mein credentials sahi hain ya nahi verify karein
3. Database name create kiya hai ya nahi check karein
4. MySQL/PostgreSQL service start karein:
   ```bash
   # MySQL (Windows)
   net start mysql80
   
   # PostgreSQL (Windows)
   net start postgresql-x64-14
   ```

### Issue 2: Port Already in Use

**Solution:**
```bash
# Different port par run karein
# package.json mein script modify karein ya:
PORT=8080 npm run dev
```

### Issue 3: PHP Not Found

**Solution:**
1. PHP install karein aur PATH mein add karein
2. Command prompt mein verify karein:
   ```bash
   php -v
   ```

### Issue 4: npm install mein errors

**Solution:**
```bash
# Node modules delete karke reinstall karein
rm -rf node_modules package-lock.json
npm install
```

---

## 🗂️ Project Structure

```
license-procurement-system/
├── api/                    # PHP Backend
│   ├── config/            # Database config
│   ├── controllers/       # API controllers
│   └── postgres_setup.sql # PostgreSQL schema
├── src/                   # React Frontend
│   ├── components/        # UI components
│   ├── pages/            # Pages
│   └── utils/            # Helper functions
├── public/               # Static files
├── .env                  # Environment variables (create this)
├── package.json          # NPM dependencies
└── database_schema.sql   # MySQL schema
```

---

## 📞 Help & Support

Agar koi issue aa raha hai:

1. **Check Console Logs**: Browser ke DevTools console mein errors check karein
2. **Check Terminal**: PHP aur React dono ke logs check karein
3. **Database Connection**: Manually database connect kar ke verify karein

---

## 🎯 Next Steps

Setup ho jaane ke baad:

1. Dashboard explore karein
2. Currencies setup karein (Settings → Currencies)
3. Company Information update karein (Settings → Company Info)
4. License purchase add karein

---

**Happy Coding! 🚀**
