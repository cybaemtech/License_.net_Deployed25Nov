# Email Notification System - Complete Setup Guide

## 🎯 Problem Solved!

Email notification system ab **perfectly working** hai! Testing se pata chala ki issue notification system mein nahi tha, issue ye tha ki **licenses ko clients assign nahi the**.

## ✅ What's Working Now

1. **Email Configuration** ✅ - EMAIL_MODE properly set
2. **Database Query** ✅ - Finding expiring licenses correctly
3. **Notification Settings** ✅ - All notification days enabled
4. **Expired License Support** ✅ - Ab expired licenses ke liye bhi notifications jayengi (up to 7 days after expiry)
5. **Helpful Error Messages** ✅ - Clear messages batate hain ki kya missing hai

## 📋 Step-by-Step Setup (cPanel)

### Step 1: Update .env File

cPanel File Manager → `public_html/License/.env`

```env
EMAIL_MODE=production
```

⚠️ **Important**: Agar ye line nahi hai to emails send nahi honge!

### Step 2: Assign Clients to Licenses

**Ye sabse important step hai!**

1. Login karein dashboard mein
2. **Licenses** page par jaayein
3. Expiring/Expired license par click karein
4. **Edit** button click karein
5. **Client** dropdown se client select karein
6. **Save Changes** karein

**Example:**
```
License: Adobe Photoshop
Client: Akshay Divate (kadamprajwal358@gmail.com)
Expiry: 2025-11-24
Status: EXPIRED (-2 days)
```

### Step 3: Verify Client Emails

1. **Clients** page par jaayein
2. Har client ko edit karke email verify karein
3. Email field empty nahi hona chahiye

**Current Clients with Emails:**
- Pranav Divate → client@reqgen.com
- Akshay Divate → kadamprajwal358@gmail.com
- Prajwal Kadam Prajwal Kadam → kadamprajwal358@gmail.com

### Step 4: Enable Notification Settings

1. **Notifications** page par jaayein
2. **Email Notifications** enable karein
3. Select notification days:
   - ☑ 45 days before expiry
   - ☑ 30 days before expiry
   - ☑ 15 days before expiry
   - ☑ 7 days before expiry
   - ☑ 5 days before expiry
   - ☑ 1 day before expiry
   - ☑ **On expiry day (0 days)** ← Important!
4. Set **Notification Time** (example: 11:01 AM)
5. **Save Settings**

### Step 5: Manual Test

**Notifications** page → **"Send Now (Manual)"** button click karein

**Expected Result:**
```json
{
  "success": true,
  "emails_sent": 4,
  "emails_failed": 0,
  "details": [
    "✅ Sent to client@email.com for tab (expires in 2 days)",
    "✅ Sent to client@email.com for keyboard (expires in 0 days)",
    "✅ Sent to client@email.com for laptop (expired -1 days ago)"
  ]
}
```

**If you see warnings like:**
```json
{
  "details": [
    "⚠️ Skipped: tab - No client assigned"
  ]
}
```

→ Go back to Step 2 and assign clients!

### Step 6: Setup Automatic Sending (Cron Job)

cPanel → **Cron Jobs**

**Settings:**
- Minute: `1`
- Hour: `11`
- Day: `*`
- Month: `*`
- Weekday: `*`

**Command:**
```bash
/usr/bin/php /home/username/public_html/License/api/auto_send_notifications.php
```

**Alternative (HTTP method):**
```bash
curl -X GET "https://cybaemtech.net/License/api/auto_send_notifications.php" > /dev/null 2>&1
```

## 🔍 How to Check What Licenses Need Clients

Run manual test and check the response:

**Dashboard** → **Notifications** → **Send Now (Manual)**

Response will show exactly which licenses need clients:
```json
{
  "details": [
    "⚠️ Skipped: tab - No client assigned (Please assign client in License Details)",
    "⚠️ Skipped: keyboard - No client assigned (Please assign client in License Details)"
  ]
}
```

## 📧 Email Sending Flow

```
1. Cron Job runs at configured time (11:01 AM)
   ↓
2. System checks licenses expiring within next 45 days
   ↓
3. System checks licenses expired within last 7 days
   ↓
4. For each license:
   - Check if notification day matches (0, 1, 5, 7, 15, 30, 45 days)
   - Check if license has client assigned ← IMPORTANT!
   - Check if client has email address
   - Check if email not already sent today
   ↓
5. Send email via cPanel mail() function
   ↓
6. Log notification in database
```

## 🚨 Common Issues & Solutions

### Issue 1: "0 Emails Sent, 0 Failed"

**Reason:** No licenses match notification days

**Solution:** Check if licenses are expiring on notification days (0, 1, 5, 7, 15, 30, 45)

### Issue 2: "Emails Failed: X, Details: No client assigned"

**Reason:** Licenses don't have clients assigned

**Solution:** 
1. Go to Licenses page
2. Edit each expiring license
3. Assign a client from dropdown
4. Save

### Issue 3: "Emails Failed: X, Details: Client has no email"

**Reason:** Client selected but email field is empty

**Solution:**
1. Go to Clients page
2. Edit the client
3. Add email address
4. Save

### Issue 4: Emails sent but not received

**Possible Reasons:**
1. Email in spam folder
2. cPanel mail server not configured
3. SPF/DKIM records missing

**Solution:**
1. Check spam/junk folder
2. cPanel → **Email Deliverability**
3. Verify SPF/DKIM records
4. Send test email: `https://cybaemtech.net/License/api/notifications/test-email.php?to=your@email.com`

## 📊 Notification Status Meanings

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| ✅ Sent | Email sent successfully | None |
| ⚠️ No client assigned | License doesn't have client | Assign client to license |
| ⚠️ Client has no email | Client exists but no email | Add email to client |
| ⏭️ Already sent today | Duplicate prevention | None (working correctly) |
| ❌ Failed to send | Email sending error | Check cPanel mail logs |

## 🎯 Quick Checklist

Before emails will send, verify:

- [x] `.env` file has `EMAIL_MODE=production`
- [x] Notification settings enabled in dashboard
- [x] Notification days selected (especially 0, 1, 5, 7)
- [x] **Licenses have clients assigned** ← MOST IMPORTANT!
- [x] Clients have valid email addresses
- [x] cPanel cron job configured (for automatic)

## 🔧 Debug Commands

### Check email configuration:
```bash
cd /home/username/public_html/License/api
php -r "require_once 'load_env.php'; echo 'EMAIL_MODE: ' . getenv('EMAIL_MODE');"
```

### Test notification system:
```bash
curl "https://cybaemtech.net/License/api/check_expiring_licenses.php"
```

### Check cron job logs:
```bash
tail -20 /home/username/public_html/License/logs/auto_email_log.txt
```

## 💡 Pro Tips

1. **First Time Setup**: Manually test karo pehle, then cron setup karo
2. **Email Timing**: Morning time (9-11 AM) best hai for visibility
3. **Duplicate Prevention**: Same day mein same license ke liye duplicate email nahi jayega (by design)
4. **Expired Notifications**: Ab expired licenses (up to 7 days ago) ke liye bhi notifications jayengi
5. **Client Assignment**: Jab bhi naya license create karo, immediately client assign kar do

## 📞 Support

Agar still issues aa rahe hain:

1. Check browser console for frontend errors
2. Check `logs/auto_email_log.txt` for cron job logs
3. Check cPanel Error Logs (Metrics → Errors)
4. Run debug script: `https://cybaemtech.net/License/api/debug_notifications.php`

---

**Last Updated:** November 26, 2025  
**Status:** ✅ Fully Working - Just needs client assignment to licenses
