<?php
/**
 * License Notification Service
 * Handles checking for expiring licenses and sending email notifications
 */

require_once __DIR__ . '/../utils/EmailNotifications.php';
require_once __DIR__ . '/../config/database.php';

class LicenseNotificationService {
    
    private $pdo;
    private $adminEmail = 'accounts@cybaemtech.net';
    
    public function __construct() {
        try {
            // Get database connection from shared config
            $database = new Database();
            $this->pdo = $database->getConnection();
        } catch (Exception $e) {
            error_log("LicenseNotificationService DB Connection Error: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Send daily license expiration notifications
     * Called by cron job or manually
     * 
     * @return array Result with sent, failed, total counts and details
     */
    public function sendDailyNotifications() {
        $sent = 0;
        $failed = 0;
        $details = [];
        
        try {
            // Get notification settings - get first available settings
            $stmt = $this->pdo->prepare("SELECT * FROM notification_settings ORDER BY created_at DESC LIMIT 1");
            $stmt->execute();
            $settings = $stmt->fetch();
            
            if (!$settings || !$settings['email_notifications_enabled']) {
                return [
                    'sent' => 0,
                    'failed' => 0,
                    'total' => 0,
                    'details' => ['Notifications disabled in settings']
                ];
            }
            
            // Get notification days from settings
            $notificationDays = [];
            if (isset($settings['notify_45_days']) && $settings['notify_45_days']) $notificationDays[] = 45;
            if (isset($settings['notify_30_days']) && $settings['notify_30_days']) $notificationDays[] = 30;
            if (isset($settings['notify_15_days']) && $settings['notify_15_days']) $notificationDays[] = 15;
            if (isset($settings['notify_7_days']) && $settings['notify_7_days']) $notificationDays[] = 7;
            if (isset($settings['notify_5_days']) && $settings['notify_5_days']) $notificationDays[] = 5;
            if (isset($settings['notify_1_day']) && $settings['notify_1_day']) $notificationDays[] = 1;
            if (isset($settings['notify_0_days']) && $settings['notify_0_days']) $notificationDays[] = 0;
            
            // If no days selected, use default
            if (empty($notificationDays)) {
                $notificationDays = [45, 30, 15, 7, 5, 1, 0];
            }
            
            // Get maximum days for query optimization
            $maxDays = max($notificationDays);
            
            // Also check for recently expired licenses (up to 7 days ago)
            $minDays = -7; // Check up to 7 days after expiry
            
            // Get expiring AND recently expired SELLING licenses within notification window
            // IMPORTANT: We check SALES table (selling licenses), NOT license_purchases (our purchases)
            $sql = "SELECT 
                        s.id,
                        s.tool_name,
                        s.vendor,
                        s.quantity,
                        s.sale_date as purchase_date,
                        s.expiry_date as expiration_date,
                        s.selling_amount as cost_per_user,
                        s.total_selling_price as total_cost,
                        s.invoice_no as version,
                        c.name as client_name,
                        c.email as client_email,
                        c.phone as client_contact,
                        c.gst as client_gst,
                        DATEDIFF(s.expiry_date, CURDATE()) as days_until_expiry,
                        CASE 
                            WHEN s.client_id IS NULL OR s.client_id = '' THEN 'NO_CLIENT'
                            WHEN c.email IS NULL OR c.email = '' THEN 'NO_EMAIL'
                            ELSE 'OK'
                        END as notification_status
                    FROM sales s
                    LEFT JOIN clients c ON s.client_id = c.id
                    WHERE s.expiry_date IS NOT NULL
                        AND DATEDIFF(s.expiry_date, CURDATE()) >= ?
                        AND DATEDIFF(s.expiry_date, CURDATE()) <= ?
                    ORDER BY s.expiry_date ASC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$minDays, $maxDays]);
            $expiringLicenses = $stmt->fetchAll();
            
            // Process each license
            foreach ($expiringLicenses as $license) {
                $daysUntilExpiry = (int)$license['days_until_expiry'];
                
                // Check if we should send notification for this license based on notification days
                if (!in_array($daysUntilExpiry, $notificationDays)) {
                    continue;
                }
                
                // Check if license has a client with email
                if ($license['notification_status'] == 'NO_CLIENT') {
                    $details[] = "⚠️ Skipped: {$license['tool_name']} - No client assigned (Please assign client in License Details)";
                    $failed++;
                    continue;
                }
                
                if ($license['notification_status'] == 'NO_EMAIL') {
                    $details[] = "⚠️ Skipped: {$license['tool_name']} - Client '{$license['client_name']}' has no email address";
                    $failed++;
                    continue;
                }
                
                // Check if notification was already sent today for this license and recipient
                if ($this->wasNotificationSentToday($license['id'], $license['client_email'], $daysUntilExpiry)) {
                    $details[] = "Skipped: Notification already sent today for license {$license['tool_name']} to {$license['client_email']}";
                    continue;
                }
                
                // Prepare license data
                $licenseData = [
                    'id' => $license['id'],
                    'tool_name' => $license['tool_name'],
                    'version' => $license['version'],
                    'vendor' => $license['vendor'],
                    'quantity' => $license['quantity'],
                    'purchase_date' => $license['purchase_date'],
                    'expiration_date' => $license['expiration_date'],
                    'cost_per_user' => $license['cost_per_user'],
                    'total_cost' => $license['total_cost']
                ];
                
                // Prepare client data
                $clientData = [
                    'name' => $license['client_name'],
                    'email' => $license['client_email'],
                    'contact' => $license['client_contact'],
                    'gst' => $license['client_gst']
                ];
                
                // Send notification
                try {
                    $emailSent = sendLicenseExpirationNotification($licenseData, $clientData, $daysUntilExpiry);
                    
                    if ($emailSent) {
                        $sent++;
                        $details[] = "✅ Sent to {$clientData['email']} for {$license['tool_name']} (expires in {$daysUntilExpiry} days)";
                        
                        // Log the notification
                        $this->logNotification($license['id'], $clientData['email'], $daysUntilExpiry);
                    } else {
                        $failed++;
                        $details[] = "❌ Failed to send to {$clientData['email']} for {$license['tool_name']}";
                    }
                } catch (Exception $e) {
                    $failed++;
                    $details[] = "❌ Error sending to {$clientData['email']}: " . $e->getMessage();
                    error_log("Error sending notification: " . $e->getMessage());
                }
            }
            
            $total = $sent + $failed;
            
            return [
                'sent' => $sent,
                'failed' => $failed,
                'total' => $total,
                'details' => $details,
                'notification_days' => $notificationDays,
                'timestamp' => date('Y-m-d H:i:s')
            ];
            
        } catch (Exception $e) {
            error_log("SendDailyNotifications Error: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Check if notification was already sent today for this license and recipient
     * 
     * @param string $licenseId License ID
     * @param string $recipientEmail Recipient email address
     * @param int $daysUntilExpiry Days until expiry
     * @return bool True if notification was sent today
     */
    private function wasNotificationSentToday($licenseId, $recipientEmail, $daysUntilExpiry) {
        try {
            // Check if email_notification_log table exists
            $stmt = $this->pdo->query("SHOW TABLES LIKE 'email_notification_log'");
            if ($stmt->rowCount() === 0) {
                // Table doesn't exist, create it
                $this->createNotificationLogTable();
                return false;
            }
            
            // Check if notification was sent today
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as count 
                FROM email_notification_log 
                WHERE license_id = ? 
                    AND recipient_email = ? 
                    AND days_until_expiry = ?
                    AND DATE(sent_at) = CURDATE()
            ");
            $stmt->execute([$licenseId, $recipientEmail, $daysUntilExpiry]);
            $result = $stmt->fetch();
            
            return $result['count'] > 0;
            
        } catch (Exception $e) {
            error_log("Error checking notification log: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Log sent notification
     * 
     * @param string $licenseId License ID
     * @param string $recipientEmail Recipient email
     * @param int $daysUntilExpiry Days until expiry
     */
    private function logNotification($licenseId, $recipientEmail, $daysUntilExpiry) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO email_notification_log 
                (license_id, recipient_email, days_until_expiry, sent_at) 
                VALUES (?, ?, ?, NOW())
            ");
            $stmt->execute([$licenseId, $recipientEmail, $daysUntilExpiry]);
            
        } catch (Exception $e) {
            // Log error but don't throw - logging failure shouldn't break email sending
            error_log("Email log error: " . $e->getMessage());
        }
    }
    
    /**
     * Create email notification log table
     */
    private function createNotificationLogTable() {
        try {
            $sql = "CREATE TABLE IF NOT EXISTS email_notification_log (
                id INT(11) PRIMARY KEY AUTO_INCREMENT,
                license_id CHAR(36) NOT NULL,
                recipient_email VARCHAR(255) NOT NULL,
                days_until_expiry INT(11) NOT NULL,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_license_id (license_id),
                INDEX idx_recipient_email (recipient_email),
                INDEX idx_sent_at (sent_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
            
            $this->pdo->exec($sql);
            error_log("Created email_notification_log table");
            
        } catch (Exception $e) {
            error_log("Error creating notification log table: " . $e->getMessage());
        }
    }
    
    /**
     * Send test email
     * 
     * @param string $toEmail Recipient email address
     * @param string $subject Email subject
     * @param string $message Custom message
     * @return array Result with success status
     */
    public function sendTestEmail($toEmail, $subject = null, $message = null) {
        try {
            $result = sendTestEmail(
                $toEmail, 
                $subject ?? 'Test Email from LicenseHub Enterprise',
                $message ?? 'This is a test email to verify that the PHP email system is working correctly for all email domains including corporate emails.'
            );
            
            return $result;
            
        } catch (Exception $e) {
            error_log("SendTestEmail Error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ];
        }
    }
    
    /**
     * Get notification statistics
     * 
     * @return array Statistics about sent notifications
     */
    public function getNotificationStats() {
        try {
            // Check if table exists
            $stmt = $this->pdo->query("SHOW TABLES LIKE 'email_notification_log'");
            if ($stmt->rowCount() === 0) {
                return [
                    'total_sent' => 0,
                    'sent_today' => 0,
                    'sent_this_week' => 0,
                    'sent_this_month' => 0
                ];
            }
            
            $stats = [];
            
            // Total sent
            $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM email_notification_log");
            $stats['total_sent'] = $stmt->fetch()['count'];
            
            // Sent today
            $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM email_notification_log WHERE DATE(sent_at) = CURDATE()");
            $stats['sent_today'] = $stmt->fetch()['count'];
            
            // Sent this week
            $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM email_notification_log WHERE YEARWEEK(sent_at) = YEARWEEK(NOW())");
            $stats['sent_this_week'] = $stmt->fetch()['count'];
            
            // Sent this month
            $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM email_notification_log WHERE YEAR(sent_at) = YEAR(NOW()) AND MONTH(sent_at) = MONTH(NOW())");
            $stats['sent_this_month'] = $stmt->fetch()['count'];
            
            return $stats;
            
        } catch (Exception $e) {
            error_log("GetNotificationStats Error: " . $e->getMessage());
            return [
                'total_sent' => 0,
                'sent_today' => 0,
                'sent_this_week' => 0,
                'sent_this_month' => 0,
                'error' => $e->getMessage()
            ];
        }
    }
}
?>
