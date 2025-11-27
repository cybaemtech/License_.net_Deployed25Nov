# cPanel Email Notification Setup Guide

## Problem
Aapke cPanel par email notifications send nahi ho rahe hain kyunki **EMAIL_MODE** properly configure nahi hai.

## Solution (Step-by-Step)

### Step 1: Update .env File on cPanel

1. **cPanel File Manager** mein login karein
2. Navigate karein: `public_html/License/` folder mein
3. `.env` file ko edit karein (agar nahi hai to create karein)
4. Ye line add/update karein:
   ```
   EMAIL_MODE=production
   ```

### Step 2: Verify Email Settings

`.env` file mein ye settings honi chahiye:

```env
# Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_username_LMS_Project
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=your_username_LMS_Project

# Email Configuration - IMPORTANT!
EMAIL_MODE=production

# Application Settings
APP_URL=https://cybaemtech.net/License
APP_NAME=LicenseHub Enterprise
APP_VERSION=1.0.0

# Timezone
TZ=Asia/Kolkata
```

### Step 3: Enable Notifications in Dashboard

1. Login karein apne dashboard mein
2. Navigate karein: **Notifications** page par
3. **Email Notifications** enable karein
4. Select karein notification days:
   - ☑ 45 days before expiry
   - ☑ 30 days before expiry
   - ☑ 15 days before expiry
   - ☑ 7 days before expiry
   - ☑ 5 days before expiry
   - ☑ 1 day before expiry
   - ☑ On expiry day (0 days)
5. **Notification Time** set karein (example: 11:01 AM)
6. **Save Settings** par click karein

### Step 4: Manual Test

**"Send Now (Manual)"** button par click karein test karne ke liye.

Response check karein:
```json
{
  "success": true,
  "emails_sent": 2,
  "emails_failed": 0,
  "details": [
    "✅ Sent to client@example.com for Adobe Photoshop (expires in -2 days)"
  ]
}
```

### Step 5: Setup Cron Job for Automatic Sending

1. **cPanel** mein **Cron Jobs** section mein jaayein
2. Naya cron job add karein:
   
   **Settings:**
   - Minute: `1`
   - Hour: `11` (11 AM ke liye)
   - Day: `*`
   - Month: `*`
   - Weekday: `*`
   
   **Command:**
   ```bash
   /usr/bin/php /home/username/public_html/License/api/auto_send_notifications.php
   ```
   
   **OR (if above doesn't work):**
   ```bash
   wget -O - -q "https://cybaemtech.net/License/api/auto_send_notifications.php" > /dev/null 2>&1
   ```

3. **Add Cron Job** par click karein

## How It Works Now

### ✅ NEW FEATURE: Expired License Notifications

System ab **expired licenses** ke liye bhi notifications bhejega:
- Expired today (0 days ago)
- Expired 1 day ago (-1 days)
- Expired 2 days ago (-2 days)
- Up to 7 days after expiry

### Email Sending Logic

1. **Manual**: "Send Now" button se instantly check aur send
2. **Automatic**: Cron job daily configured time par automatically check aur send
3. **Duplicate Prevention**: Same day mein same license ke liye duplicate email nahi jayega

## Troubleshooting

### Problem 1: "0 Emails Sent" dikha raha hai

**Check karein:**
1. `.env` file mein `EMAIL_MODE=production` hai ya nahi
2. Notification settings enabled hain ya nahi
3. Client emails properly filled hain ya nahi
4. License expiry dates sahi hain ya nahi

**Solution:**
```bash
# File Manager mein check karein
cat public_html/License/.env | grep EMAIL_MODE
```

Expected output: `EMAIL_MODE=production`

### Problem 2: Emails send ho rahe hain but receive nahi ho rahe

**Possible Reasons:**
1. cPanel mail server properly configured nahi hai
2. Client email addresses galat hain
3. Emails spam folder mein ja rahe hain

**Solution:**
1. cPanel → **Email Deliverability** check karein
2. SPF, DKIM records properly configured hain ya nahi verify karein
3. Test email bhejein: `https://cybaemtech.net/License/api/notifications/test-email.php?to=your@email.com`

### Problem 3: Cron job run nahi ho raha

**Check karein:**
1. cPanel → **Cron Jobs** → Current cron jobs list
2. Path sahi hai ya nahi
3. PHP binary path: `/usr/bin/php` sahi hai ya nahi

**Alternative Command:**
```bash
curl -X GET https://cybaemtech.net/License/api/auto_send_notifications.php
```

## Important Notes

### 🚨 Email Mode Comparison

| Mode | Use Case | Where Emails Go |
|------|----------|----------------|
| `production` | **cPanel/Live Server** | ✅ Actually sent via mail() |
| `development` | Localhost/Replit | 💾 Saved to `logs/emails/` files |
| `disabled` | Testing without emails | ❌ No emails sent or saved |

### 📧 Email From Address

Default sender: `noreply@cybaemtech.net`
Reply-to: `accounts@cybaemtech.net`

Ye change karne ke liye edit karein: `api/utils/EmailNotifications.php` (line 48-50)

### ⏰ Best Practices

1. **Notification Time**: Morning time set karein (9 AM - 11 AM) for better visibility
2. **Cron Frequency**: Daily check sufficient hai
3. **Timezone**: `.env` mein `TZ=Asia/Kolkata` set karein
4. **Test First**: Pehle manual test karein, then cron setup karein

## Verification Checklist

- [x] `.env` file mein `EMAIL_MODE=production` set hai
- [x] Notification settings enabled hain dashboard mein
- [x] Notification days selected hain
- [x] Notification time set hai
- [x] Manual test successful hai ("Send Now" button)
- [x] Cron job cPanel mein configured hai
- [x] Client emails database mein properly filled hain

## Support

Agar issues aa rahe hain to check karein:
1. Browser console logs
2. `logs/auto_email_log.txt` file cPanel par
3. cPanel Error logs (Metrics → Errors)
