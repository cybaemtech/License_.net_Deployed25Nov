# Email Notification System Guide

## Overview

The LicenseHub Email Notification System automatically sends email alerts when software licenses are approaching expiration. The system uses Replit Mail for secure, reliable email delivery and includes an automated scheduler for daily checks.

## Features

### ✅ Automated Email Notifications
- **Notification Intervals**: 45, 30, 15, 5, 1, and 0 days before expiry
- **Rich HTML Emails**: Professional templates with urgency-based color coding
- **Dual Recipients**: Sends to both admin and client email addresses
- **Duplicate Prevention**: Tracks sent emails to avoid duplicate notifications

### ✅ Automatic Scheduling
- **Daily Checks**: Runs automatically at 09:00 (configurable)
- **Background Service**: No manual intervention required
- **Comprehensive Logging**: Tracks all sent/failed emails with timestamps

### ✅ Manual Controls
- **On-Demand Checks**: Manually trigger license checks via Notification Center
- **Test Emails**: Send test notifications to verify configuration
- **Settings Management**: Configure notification intervals and preferences

## Email Template

### Urgency-Based Color Coding
- **Critical (0 days)**: Red (#dc2626) - License expiring today
- **High (1-5 days)**: Orange (#ea580c) - Urgent action needed
- **Medium (15 days)**: Amber (#f59e0b) - Plan renewal
- **Low (30-45 days)**: Blue (#3b82f6) - Advance notice

### Email Content
Each notification email includes:
- License ID and tool name
- Client information
- Number of users/licenses
- Expiry date (formatted for readability)
- Urgency indicator
- Professional branding

## Configuration

### 1. Admin Email Setup
Set your admin email in the Secrets tab:
```
ADMIN_EMAIL=your-email@company.com
```

### 2. Notification Settings
Access via **Settings → Notification Settings** in the UI:
- Enable/disable email notifications
- Select notification intervals (45, 30, 15, 5, 1, 0 days)
- Configure notification time (default: 09:00)
- Set timezone

### 3. Client Email
Ensure clients have email addresses in their profiles:
- Go to **Clients** page
- Edit client details
- Add/update email address

## Using the System

### Manual Email Check
1. Navigate to **Notification Center**
2. Click **"Check & Send Emails Now"** button
3. View results showing:
   - Number of licenses checked
   - Emails sent successfully
   - Any failures

### Automatic Daily Checks
- The scheduler runs automatically at 09:00 daily
- No user intervention required
- Check server logs for confirmation:
  ```
  📧 Email notification scheduler started
  ⏰ Daily checks will run at 09:00
  📅 Next email check scheduled for: [date/time]
  ```

### Testing the System
1. Go to **Notification Center**
2. Use the **"Send Test Email"** feature
3. Enter your email address
4. Verify you receive the test notification

## Database Tables

### notification_settings
Stores user preferences for email notifications:
- `email_notifications_enabled`: Toggle email on/off
- `notify_45_days`, `notify_30_days`, etc.: Individual interval toggles
- `notification_time`: When to run daily checks
- `timezone`: User's timezone preference

### email_notifications
Tracks all sent notifications:
- `license_id`: Which license the notification is for
- `notification_type`: Interval type (45_days, 30_days, etc.)
- `email_status`: sent, failed, or pending
- `email_sent_at`: Timestamp of when email was sent
- `email_subject` and `email_body`: Email content

## Troubleshooting

### Emails Not Sending
1. **Check Admin Email**: Verify `ADMIN_EMAIL` is set in Secrets
2. **Check Client Email**: Ensure client has valid email address
3. **Check Settings**: Verify email notifications are enabled
4. **Check Logs**: Look for error messages in server logs

### Duplicate Emails
The system automatically prevents duplicates by:
- Checking if notification was already sent today
- Recording each sent email in `email_notifications` table
- Skipping licenses that already received notifications

### Scheduler Not Running
1. **Check Server Logs**: Look for scheduler initialization messages
2. **Restart Server**: Stop and restart the application
3. **Verify Database**: Ensure MySQL connection is active

## API Endpoints

### GET /api/notification-settings
Retrieve current notification settings

### POST /api/notification-settings
Update notification settings

### POST /api/notifications/check-expiring-licenses
Manually trigger license expiry check and send emails

### POST /api/notifications/send-test-email
Send a test email to verify configuration

## Email Scheduler Service

### Configuration
Located in `server/emailScheduler.ts`:
- Default check time: 09:00
- Check interval: Every 24 hours
- API endpoint: `/api/notifications/check-expiring-licenses`

### Logs
Scheduler logs include:
- `📧 Email notification scheduler started`
- `⏰ Daily checks will run at [time]`
- `📅 Next email check scheduled for: [date/time]`
- `✅ Email check completed: [results]`

## Production Deployment

### Environment Variables Required
```
MYSQL_HOST=your-mysql-host
MYSQL_USER=your-mysql-user
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=your-database-name
ADMIN_EMAIL=admin@your-company.com
```

### Replit Authentication
The system automatically uses Replit's built-in authentication:
- `REPL_IDENTITY` for development
- `WEB_REPL_RENEWAL` for deployed apps

No additional email API keys needed!

## Support

For issues or questions:
1. Check server logs for error messages
2. Verify all environment variables are set
3. Test with manual email check first
4. Review notification settings in UI

## Future Enhancements

Potential improvements:
- Custom email templates per client
- SMS notifications integration
- Webhook support for third-party integrations
- Multi-language email support
- Advanced scheduling options (multiple check times per day)
