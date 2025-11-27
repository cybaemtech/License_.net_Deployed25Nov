# 🗄️ MySQL Database Migration Guide

## ✅ **Ab Kya Karna Hai**

Main ne **PostgreSQL support remove** kar diya hai aur **MySQL ko default** bana diya hai.

---

## 📋 **Step-by-Step Instructions**

### **Step 1: cPanel phpMyAdmin Open Karein**

1. **cPanel login** karein
2. **Databases** section mein **phpMyAdmin** dhundein
3. Click karke **phpMyAdmin** open karein

### **Step 2: Database Select Karein**

Left sidebar mein **`cybaemtechnet_LMS_Project`** database select karein

### **Step 3: SQL Tab Open Karein**

Top menu mein **"SQL"** tab click karein

### **Step 4: Migration Script Run Karein**

`MYSQL_MIGRATION.sql` file ka **complete content** copy karke SQL box mein paste karein aur **"Go"** button click karein.

**Ya step-by-step bhi kar sakte ho:**

---

## 🎯 **Quick Fix - Sirf Permissions Column Add Karein**

Agar sirf permissions column add karna hai, to yeh single query run karein:

```sql
USE cybaemtechnet_LMS_Project;

-- Add permissions column
ALTER TABLE users 
ADD COLUMN permissions JSON DEFAULT NULL;

-- Set permissions for admin users
UPDATE users 
SET permissions = JSON_OBJECT(
    'dashboard', JSON_OBJECT('access', true),
    'licenses', JSON_OBJECT('access', true, 'actions', JSON_OBJECT('create', true, 'read', true, 'update', true, 'delete', true)),
    'sales', JSON_OBJECT('access', true, 'actions', JSON_OBJECT('create', true, 'read', true, 'update', true, 'delete', true)),
    'clients', JSON_OBJECT('access', true, 'actions', JSON_OBJECT('create', true, 'read', true, 'update', true, 'delete', true)),
    'vendors', JSON_OBJECT('access', true, 'actions', JSON_OBJECT('create', true, 'read', true, 'update', true, 'delete', true)),
    'reports', JSON_OBJECT('access', true),
    'teams', JSON_OBJECT('access', true),
    'settings', JSON_OBJECT('access', true),
    'notifications', JSON_OBJECT('access', true)
)
WHERE role = 'admin';

-- Verify
DESCRIBE users;
```

---

## ✅ **Verification**

Migration complete hone ke baad verify karein:

```sql
-- Check users table structure
DESCRIBE users;

-- View all users with permissions
SELECT id, email, role, permissions FROM users;
```

Aapko `permissions` column **JSON** type mein dikhna chahiye.

---

## 🚀 **Localhost Par Application Run Karein**

Migration complete hone ke baad:

```bash
npm run dev
```

**Ab sab kaam karega!** ✅

---

## 📝 **What Changed?**

### **Database Configuration (api/config/database.php):**
- ❌ **Removed:** PostgreSQL auto-detection
- ✅ **Now:** MySQL ONLY - Simple and direct
- ✅ **Default:** Uses `.env` file credentials

### **Users Table:**
- ✅ **Added:** `permissions` column (JSON type)
- ✅ **Added:** Default permissions for all user roles
- ✅ **Structure:** Proper granular permission system

---

## 🔍 **Troubleshooting**

### **Error: "Column 'permissions' already exists"**

**Matlab:** Column already hai, skip karein yeh step.

**Fix:**
```sql
-- Just verify it exists
DESCRIBE users;
```

### **Error: "Unknown column 'permissions'"**

**Matlab:** Migration abhi run nahi hua.

**Fix:** `MYSQL_MIGRATION.sql` run karein.

### **JSON Type Not Supported**

**Kuch older MySQL versions mein JSON nahi hota.**

**Fix:** TEXT use karein instead:
```sql
ALTER TABLE users 
ADD COLUMN permissions TEXT DEFAULT NULL;
```

---

## 📂 **Files Created/Updated**

1. ✅ **api/config/database.php** - MySQL only, simplified
2. ✅ **MYSQL_MIGRATION.sql** - Complete migration script
3. ✅ **MYSQL_SETUP_INSTRUCTIONS.md** - Yeh guide
4. ✅ **.env** - Already correct configuration

---

## 🎉 **Summary**

**Bas yeh karo:**

1. **cPanel → phpMyAdmin** open karein
2. **SQL tab** mein `MYSQL_MIGRATION.sql` run karein
3. **localhost** par `npm run dev` run karein

**Done!** 🚀

---

**Questions?**

Koi error aayi to terminal logs check karein:
- `[PHP]` prefix wale errors backend se hain
- Browser console wale errors frontend se hain
