# Email Notifications for SELLING Licenses

## 🎯 Important: System Checks SELLING Licenses Only

Email notification system **ONLY checks SELLING licenses** (sales table), NOT purchase licenses.

### ✅ What Gets Checked:
- **Selling Licenses** (from `sales` table) - Licenses you sold to clients
- Client expiry dates
- Client email addresses

### ❌ What Does NOT Get Checked:
- **Purchase Licenses** (from `license_purchases` table) - Licenses you bought for inventory
- Your internal purchase records

## 📊 Current Selling Licenses Status

Based on latest data, you have selling licenses expiring:

| Tool Name | Client | Email | Expiry Date | Days Left | Status |
|-----------|--------|-------|-------------|-----------|--------|
| keyboard | Akshay Divate | kadamprajwal358@gmail.com | 2025-12-02 | 6 days | ✅ OK |
| tab | Akshay Divate | kadamprajwal358@gmail.com | 2025-11-28 | 2 days | ⚠️ Soon |
| keyboard | Akshay Divate | kadamprajwal358@gmail.com | 2025-11-28 | 2 days | ⚠️ Soon |
| laptop | Akshay Divate | kadamprajwal358@gmail.com | 2025-11-27 | 1 day | 🚨 Urgent |

## 🔧 How It Works

### Database Query:
```sql
SELECT 
    s.id,
    s.tool_name,
    s.expiry_date,
    c.name as client_name,
    c.email as client_email,
    DATEDIFF(s.expiry_date, CURDATE()) as days_until_expiry
FROM sales s
LEFT JOIN clients c ON s.client_id = c.id
WHERE s.expiry_date IS NOT NULL
    AND DATEDIFF(s.expiry_date, CURDATE()) BETWEEN -7 AND 45
ORDER BY s.expiry_date ASC
```

### Email Sending Logic:
1. Check **sales table** for expiring licenses
2. Get client email from **clients table** via `client_id`
3. Send notification if:
   - License expiry matches notification day (0, 1, 5, 7, 15, 30, 45)
   - Client has valid email address
   - Email not already sent today

## ✅ Setup Instructions (cPanel)

### Step 1: Update .env File

```env
EMAIL_MODE=production
```

### Step 2: Enable Notification Settings

Dashboard → **Notifications** page:
- ☑ Enable Email Notifications
- ☑ Select notification days: 45, 30, 15, 7, 5, 1, 0 days
- ⏰ Set notification time: 11:01 AM
- 💾 Save Settings

### Step 3: Verify Client Emails

Make sure all clients in selling licenses have email addresses:
- Dashboard → **Clients**
- Edit each client
- Verify email field is filled

**Current Client:**
- Akshay Divate → kadamprajwal358@gmail.com ✅

### Step 4: Manual Test

Dashboard → **Notifications** → **"Send Now (Manual)"**

**Expected Output:**
```json
{
  "success": true,
  "emails_sent": 4,
  "emails_failed": 0,
  "details": [
    "✅ Sent to kadamprajwal358@gmail.com for keyboard (expires in 6 days)",
    "✅ Sent to kadamprajwal358@gmail.com for tab (expires in 2 days)",
    "✅ Sent to kadamprajwal358@gmail.com for keyboard (expires in 2 days)",
    "✅ Sent to kadamprajwal358@gmail.com for laptop (expires in 1 day)"
  ]
}
```

### Step 5: Setup Cron Job

cPanel → **Cron Jobs**:

**Time:** Daily at 11:01 AM
```
1 11 * * *
```

**Command:**
```bash
/usr/bin/php /home/username/public_html/License/api/auto_send_notifications.php
```

**OR (HTTP method):**
```bash
curl -X GET "https://cybaemtech.net/License/api/auto_send_notifications.php"
```

## 📧 Email Template

Clients will receive professional HTML emails like:

```
Subject: ⏰ License Expiration Alert: keyboard - Expires in 2 days

Dear Akshay Divate,

Your software license for keyboard is expiring soon.

License Details:
- Tool: keyboard
- Vendor: [Vendor Name]
- Quantity: 1
- Expiry Date: November 28, 2025
- Days Remaining: 2 days

Please renew your license before expiration to avoid service interruption.

Thanks,
LicenseHub Enterprise Team
```

## 🚨 Important Notes

### 1. **Selling vs Purchase Licenses**

| Type | Table | Purpose | Notifications |
|------|-------|---------|---------------|
| Selling | `sales` | Sold to clients | ✅ YES |
| Purchase | `license_purchases` | Bought for inventory | ❌ NO |

### 2. **Client Assignment**

ALL selling licenses in `sales` table **already have clients assigned** because:
- Sales record creates when you sell to a client
- `client_id` is required field
- Client email comes from `clients` table

### 3. **Expired License Support**

System sends notifications for:
- ✅ Licenses expiring within 45 days
- ✅ Licenses expired within last 7 days
- ✅ Licenses expiring today (0 days)

### 4. **Duplicate Prevention**

Same license + same recipient + same day = **No duplicate emails**

System logs all sent emails in `email_notification_log` table.

## 🔍 Debug & Testing

### Check Selling Licenses:
```bash
curl "https://cybaemtech.net/License/api/debug_notifications.php"
```

### Manual Test:
```bash
curl "https://cybaemtech.net/License/api/check_expiring_licenses.php"
```

### View Logs:
```bash
tail -50 /home/username/public_html/License/logs/auto_email_log.txt
```

## 📊 Expected Results

With current data (4 selling licenses expiring):

**Manual Test Output:**
```json
{
  "emails_sent": 4,
  "total_processed": 4,
  "notification_days": [45, 30, 15, 7, 5, 1, 0],
  "details": [
    "✅ Sent to kadamprajwal358@gmail.com for keyboard (expires in 6 days)",
    "✅ Sent to kadamprajwal358@gmail.com for tab (expires in 2 days)",
    "✅ Sent to kadamprajwal358@gmail.com for keyboard (expires in 2 days)",
    "✅ Sent to kadamprajwal358@gmail.com for laptop (expires in 1 day)"
  ]
}
```

## ✅ Verification Checklist

Before going live:

- [x] System checks **sales** table (selling licenses) ✅
- [x] System does NOT check **license_purchases** table ✅
- [x] Clients have valid email addresses ✅
- [x] `.env` file has `EMAIL_MODE=production`
- [x] Notification settings enabled
- [x] Notification days selected (0, 1, 5, 7, 15, 30, 45)
- [x] Manual test successful
- [x] Cron job configured

## 💡 Pro Tips

1. **Test on Localhost/Replit:** Emails will save to `logs/emails/` folder
2. **Production cPanel:** Emails will actually send via mail()
3. **Check Spam:** First emails might go to spam folder
4. **Email Timing:** Morning time (9-11 AM) best for visibility
5. **Monitor Logs:** Check `logs/auto_email_log.txt` for cron job execution

---

**Last Updated:** November 26, 2025  
**Status:** ✅ Working - Checks SELLING licenses only (sales table)
