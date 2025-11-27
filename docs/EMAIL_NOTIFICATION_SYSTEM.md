# License Management System - Email Notification System
## Simple PHP Mail Implementation

यह documentation बताएगी कि email notification system कैसे काम करती है और कैसे use करें।

## 📋 Overview

यह system **simple PHP `mail()` function** का use करती है। कोई SMTP, Replit Mail, या Resend integration नहीं है। यह pure PHP implementation है जो आपके server के mail configuration का use करती है।

## 🗂️ File Structure

```
api/
├── utils/
│   └── EmailNotifications.php           # Email helper functions
├── services/
│   └── LicenseNotificationService.php   # Main notification service
├── check_expiring_licenses.php          # Manual email trigger endpoint
├── auto_send_notifications.php          # Automatic cron job endpoint
├── test_email.php                       # Test email endpoint
└── notification_history.php             # Email history endpoint
```

## 🔧 Core Functions

### 1. **EmailNotifications.php**
Helper functions for sending emails:
- `sendEmailNotification()` - PHP mail() wrapper
- `generateEmailTemplate()` - HTML email template generator
- `sendLicenseExpirationNotification()` - Send license expiry notification
- `sendTestEmail()` - Send test email
- `getUrgencyColor()` - Get color based on urgency
- `getUrgencyLevel()` - Get urgency level text

### 2. **LicenseNotificationService.php**
Main service class:
- `sendDailyNotifications()` - Check and send all notifications
- `sendTestEmail()` - Test email functionality
- `getNotificationStats()` - Get notification statistics

## 📧 Email Sending Logic

### Notification Days
System notification settings से days को check करती है:
- ✅ 45 days before expiry
- ✅ 30 days before expiry
- ✅ 15 days before expiry
- ✅ 7 days before expiry
- ✅ 5 days before expiry
- ✅ 1 day before expiry
- ✅ On expiry day (0 days)

### How It Works

1. **Notification Settings से days fetch करो**
   ```php
   notify_45_days, notify_30_days, notify_15_days, 
   notify_7_days, notify_5_days, notify_1_day, notify_0_days
   ```

2. **License_purchases table से expiring licenses query करो**
   ```sql
   SELECT * FROM license_purchases 
   WHERE DATEDIFF(expiration_date, CURDATE()) IN (45,30,15,7,5,1,0)
   AND client_email IS NOT NULL
   ```

3. **Check करो कि आज already email भेजी है या नहीं**
   - `email_notification_log` table में check करो
   - Duplicate notifications avoid करो

4. **Email भेजो और log करो**
   - Client को notification email भेजो
   - Log entry create करो

## 🚀 API Endpoints

### 1. Manual Email Trigger
**Endpoint:** `GET /api/check_expiring_licenses.php`

Frontend से manually emails trigger करने के लिए:

```javascript
const response = await fetch('/api/check_expiring_licenses.php');
const result = await response.json();

console.log(result);
// {
//   "success": true,
//   "emails_sent": 5,
//   "emails_failed": 0,
//   "total_processed": 5,
//   "details": ["✅ Sent to client@example.com for AutoCAD..."]
// }
```

### 2. Automatic Cron Job
**Endpoint:** `GET /api/auto_send_notifications.php`

**Setup cPanel Cron Job:**
```bash
# Daily at 9:00 AM IST
0 9 * * * /usr/bin/php /path/to/api/auto_send_notifications.php

# Or via curl
0 9 * * * curl -X GET https://your-domain.com/api/auto_send_notifications.php
```

यह endpoint:
- ✅ Notification time check करती है
- ✅ Settings में configured time match होने पर emails भेजती है
- ✅ 5-minute window allow करती है
- ✅ Log file maintain करती है: `logs/auto_email_log.txt`

### 3. Test Email
**Endpoint:** `GET /api/test_email.php?to=email@example.com`

Email system test करने के लिए:

```javascript
const response = await fetch('/api/test_email.php?to=test@example.com');
const result = await response.json();

// Custom subject and message
const response2 = await fetch(
  '/api/test_email.php?to=test@example.com&subject=Test&message=Hello'
);
```

### 4. Notification History
**Endpoint:** `GET /api/notification_history.php?limit=100`

Past sent emails का history देखने के लिए:

```javascript
const response = await fetch('/api/notification_history.php?limit=50');
const result = await response.json();

console.log(result.data);
// [{
//   license_id: "uuid",
//   tool_name: "AutoCAD",
//   client_name: "ABC Corp",
//   recipient_email: "client@example.com",
//   days_until_expiry: 7,
//   sent_at: "2025-10-30 09:00:00"
// }]
```

## 📊 Database Tables

### 1. notification_settings
```sql
CREATE TABLE notification_settings (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) UNIQUE,
    notify_45_days TINYINT(1) DEFAULT 1,
    notify_30_days TINYINT(1) DEFAULT 1,
    notify_15_days TINYINT(1) DEFAULT 1,
    notify_7_days TINYINT(1) DEFAULT 1,
    notify_5_days TINYINT(1) DEFAULT 1,
    notify_1_day TINYINT(1) DEFAULT 1,
    notify_0_days TINYINT(1) DEFAULT 1,
    email_notifications_enabled TINYINT(1) DEFAULT 1,
    notification_time TIME DEFAULT '09:00:00',
    timezone VARCHAR(50) DEFAULT 'UTC'
);
```

### 2. email_notification_log
```sql
CREATE TABLE email_notification_log (
    id INT(11) PRIMARY KEY AUTO_INCREMENT,
    license_id CHAR(36) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    days_until_expiry INT(11) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎨 Email Template

Email template में शामिल है:
- ✅ Professional HTML design
- ✅ Urgency-based color coding (red, orange, yellow, blue)
- ✅ Complete license details
- ✅ Client information
- ✅ Direct link to license page
- ✅ Responsive design
- ✅ LicenseHub branding

### Urgency Colors
- **Red (#dc2626)**: Expires today
- **Dark Orange (#ea580c)**: 1-5 days
- **Orange (#f59e0b)**: 6-15 days
- **Yellow (#eab308)**: 16-30 days
- **Blue (#3b82f6)**: 31+ days

## 🔗 Frontend Integration

### 1. Notification Center में "Send Emails Now" Button

```typescript
const handleSendEmails = async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/check_expiring_licenses.php');
    const result = await response.json();
    
    if (result.success) {
      alert(`✅ Sent ${result.emails_sent} emails successfully!`);
    } else {
      alert(`❌ Error: ${result.message}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};
```

### 2. Test Email Functionality

```typescript
const handleTestEmail = async (email: string) => {
  const response = await fetch(`/api/test_email.php?to=${email}`);
  const result = await response.json();
  
  if (result.success) {
    alert('Test email sent! Check your inbox.');
  }
};
```

### 3. View Email History

```typescript
const fetchEmailHistory = async () => {
  const response = await fetch('/api/notification_history.php?limit=50');
  const result = await response.json();
  
  if (result.success) {
    setEmailHistory(result.data);
  }
};
```

## ⚙️ Server Configuration

### PHP Mail Configuration

आपके server पर PHP mail() function काम करना चाहिए। Check करें:

```bash
# Test PHP mail
php -r "mail('test@example.com', 'Test', 'Test message');"

# Check PHP mail settings
php -i | grep -i mail
```

### cPanel Setup

1. **Email Routing**: Make sure "Local Mail Exchanger" is enabled
2. **SPF Records**: Add proper SPF records to avoid spam
3. **DKIM**: Enable DKIM authentication
4. **Cron Jobs**: Set up daily cron for auto_send_notifications.php

## 📝 Logging

### Auto Email Log File
Location: `logs/auto_email_log.txt`

```
[2025-10-30 09:00:00] === Auto Email Check Started ===
[2025-10-30 09:00:01] Configured Time: 09:00, Current Time: 09:00
[2025-10-30 09:00:02] Time matched! Starting notification process...
[2025-10-30 09:00:03] ✅ Sent to client@example.com for AutoCAD (expires in 7 days)
[2025-10-30 09:00:04] ✅ Notifications sent: 5, Failed: 0, Total: 5
[2025-10-30 09:00:05] === Auto Email Check Completed ===
```

## 🔒 Security Features

1. **Email Header Injection Prevention**: Properly sanitized headers
2. **Input Validation**: All emails validated with `filter_var()`
3. **SQL Injection Protection**: Prepared statements used
4. **Duplicate Prevention**: Log table prevents duplicate emails
5. **Rate Limiting**: Time-based checks prevent spam

## 🧪 Testing

### 1. Test Email Sending
```bash
curl "https://your-domain.com/api/test_email.php?to=your-email@example.com"
```

### 2. Test Manual Trigger
```bash
curl "https://your-domain.com/api/check_expiring_licenses.php"
```

### 3. Test Cron Job
```bash
curl "https://your-domain.com/api/auto_send_notifications.php"
```

## 📈 Monitoring

### Check Email Stats
```php
$service = new LicenseNotificationService();
$stats = $service->getNotificationStats();

// Returns:
// [
//   'total_sent' => 150,
//   'sent_today' => 5,
//   'sent_this_week' => 35,
//   'sent_this_month' => 120
// ]
```

## 🐛 Troubleshooting

### Emails Not Sending

1. **Check PHP mail() is working:**
   ```bash
   php -r "var_dump(mail('test@example.com', 'Test', 'Test'));"
   ```

2. **Check notification settings:**
   - Email notifications enabled?
   - Correct notification days selected?

3. **Check logs:**
   - `logs/auto_email_log.txt`
   - PHP error logs
   - Server mail logs

4. **Check database:**
   - Are there licenses expiring?
   - Is email_notification_log preventing duplicates?

### Emails Going to Spam

1. Add SPF record to DNS
2. Enable DKIM authentication
3. Set up DMARC policy
4. Use proper "From" address
5. Check email content for spam triggers

## 🔄 Workflow

```
┌─────────────────────────────────────────┐
│  Notification Settings (Frontend)       │
│  - Enable/Disable                       │
│  - Select Days (45,30,15,7,5,1,0)      │
│  - Set Time (09:00 AM)                 │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Cron Job (Daily at 9 AM)               │
│  /api/auto_send_notifications.php       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  LicenseNotificationService             │
│  - Fetch notification settings          │
│  - Query expiring licenses              │
│  - Check if already sent today          │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  For Each License:                      │
│  - sendLicenseExpirationNotification()  │
│  - Log to email_notification_log        │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Email Sent to Client                   │
│  - HTML formatted                       │
│  - License details                      │
│  - Urgency-based styling                │
│  - Direct link to portal                │
└─────────────────────────────────────────┘
```

## 📞 Support

For questions or issues:
- Email: accounts@cybaemtech.net
- Documentation: Check `docs/EMAIL_NOTIFICATION_SYSTEM.md`
- Logs: `logs/auto_email_log.txt`

---

**Created:** October 30, 2025
**Version:** 1.0.0
**System:** LicenseHub Enterprise
