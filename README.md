# License Management System

A comprehensive software license tracking and management system built with React (Frontend) and PHP (Backend).

---

## 🚀 Quick Start

### For Local Development (Windows)

1. **Create `.env` file** in project root:
   ```env
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_DATABASE=license_db
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   APP_ENV=development
   ```

2. **Start Both Servers**:
   - Double-click `start-dev.bat` (recommended)
   - Or use `start-preview.bat` for production preview

3. **Access Application**:
   - Frontend: http://localhost:5000/License/
   - Backend API: http://localhost:8000

### For Replit

Both frontend and backend servers are already running!
- Frontend: Replit webview
- Backend: Port 8000

### For cPanel Deployment

See `CPANEL_DEPLOYMENT_COMPLETE_GUIDE.md` for detailed deployment instructions.

---

## 📁 Project Structure

```
├── src/              # React frontend source
├── api/              # PHP backend
├── docs/             # Documentation
├── dist/             # Production build (auto-generated)
├── public/           # Static assets
├── old_guides/       # Historical documentation (archived)
└── .env              # Environment config (create this)
```

---

## 🔧 Available Commands

```bash
# Install dependencies
npm install

# Development mode
npm run dev          # Frontend dev server (port 5000)

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Windows batch files (recommended for local)
start-dev.bat        # Starts both frontend + backend
start-preview.bat    # Starts production preview + backend
```

---

## 🌟 Key Features

- ✅ **License Tracking** - Comprehensive license management
- ✅ **Multi-Currency Support** - INR, USD, EUR, GBP
- ✅ **Client Management** - Track clients and licenses
- ✅ **Vendor Management** - Vendor information with GST validation
- ✅ **Email Notifications** - Automated expiry alerts
- ✅ **Reports & Analytics** - Dashboard with statistics
- ✅ **Role-based Access** - Admin, Accounts, User roles

---

## 📚 Essential Documentation

### Setup Guides:
- **[README_HINDI.md](README_HINDI.md)** - Complete Hindi setup guide
- **[LOCAL_SETUP_GUIDE.md](LOCAL_SETUP_GUIDE.md)** - Localhost setup (English + Hindi)
- **[CPANEL_DEPLOYMENT_COMPLETE_GUIDE.md](CPANEL_DEPLOYMENT_COMPLETE_GUIDE.md)** - cPanel deployment

### Configuration:
- **[SECURITY_IMPORTANT.md](SECURITY_IMPORTANT.md)** - Security guidelines
- **[docs/EMAIL_NOTIFICATION_GUIDE.md](docs/EMAIL_NOTIFICATION_GUIDE.md)** - Email setup
- **[docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)** - Environment variables

### Archive:
- **old_guides/** - Historical fixes and troubleshooting (archived)

---

## 🐛 Common Issues

### 1. ECONNREFUSED ::1:8000 (Localhost)
**Cause**: PHP backend not running  
**Fix**: Use `start-dev.bat` or manually run `php -S localhost:8000 -t api`

### 2. Database credentials not found
**Cause**: Missing `.env` file  
**Fix**: Create `.env` with MySQL credentials (see Quick Start)

### 3. Blank page or API errors
**Cause**: Backend server down or database not configured  
**Fix**: Check both servers are running and `.env` is configured

---

## 🔒 Security Notes

- Keep `.env` file secure - **never commit to git**
- Use strong passwords for production
- Change default credentials after setup
- Enable HTTPS in production

---

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Backend**: PHP 8.2+, MySQL
- **Deployment**: Replit, cPanel compatible
