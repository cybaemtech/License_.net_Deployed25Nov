<?php
/**
 * Automatic Email Notification Sender
 * यह file automatically configured time पर emails भेजेगी
 * cPanel Cron Job से इसे call करें
 * 
 * Cron Setup Example:
 * 0 9 * * * /usr/bin/php /path/to/api/auto_send_notifications.php
 * 
 * Or hit this endpoint via cron:
 * 0 9 * * * curl -X GET https://your-domain.com/api/auto_send_notifications.php
 */

// Load environment variables (.env file) - CRITICAL for EMAIL_MODE
require_once __DIR__ . '/load_env.php';

// Set timezone
date_default_timezone_set('Asia/Kolkata');

// Include the notification service
require_once __DIR__ . '/services/LicenseNotificationService.php';

// Log file for debugging
$logFile = __DIR__ . '/../logs/auto_email_log.txt';

function writeLog($message) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[{$timestamp}] {$message}\n";
    
    // Create logs directory if it doesn't exist
    $logDir = dirname($logFile);
    if (!file_exists($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    
    @file_put_contents($logFile, $logMessage, FILE_APPEND);
}

try {
    writeLog("=== Auto Email Check Started ===");
    
    // Get database connection from shared config
    require_once __DIR__ . '/config/database.php';
    $database = new Database();
    $pdo = $database->getConnection();

    // Get notification settings - get first available settings
    $stmt = $pdo->prepare("SELECT * FROM notification_settings ORDER BY created_at DESC LIMIT 1");
    $stmt->execute();
    $settings = $stmt->fetch();

    if (!$settings) {
        writeLog("No notification settings found. Using defaults.");
        $settings = [
            'email_notifications_enabled' => 1,
            'notification_time' => '09:00:00',
            'timezone' => 'Asia/Kolkata'
        ];
    }

    // Check if email notifications are enabled
    if (!$settings['email_notifications_enabled']) {
        writeLog("Email notifications are disabled. Exiting.");
        echo json_encode([
            'success' => false,
            'message' => 'Email notifications are disabled in settings'
        ]);
        exit;
    }

    // Get configured notification time
    $configuredTime = substr($settings['notification_time'], 0, 5); // HH:MM format
    $currentTime = date('H:i');
    
    writeLog("Configured Time: {$configuredTime}, Current Time: {$currentTime}");

    // Check if current time matches configured time (within 5 minute window)
    $configTimestamp = strtotime($configuredTime);
    $currentTimestamp = strtotime($currentTime);
    $timeDifference = abs($currentTimestamp - $configTimestamp);
    
    // Allow 5 minute window (300 seconds)
    if ($timeDifference > 300) {
        writeLog("Not time to send emails yet. Time difference: {$timeDifference} seconds.");
        echo json_encode([
            'success' => false,
            'message' => 'Not the configured notification time',
            'configured_time' => $configuredTime,
            'current_time' => $currentTime,
            'time_difference' => $timeDifference
        ]);
        exit;
    }

    writeLog("Time matched! Starting notification process...");

    // Send notifications
    $notificationService = new LicenseNotificationService();
    $results = $notificationService->sendDailyNotifications();
    
    writeLog("✅ Notifications sent: {$results['sent']}, Failed: {$results['failed']}, Total: {$results['total']}");
    
    foreach ($results['details'] as $detail) {
        writeLog($detail);
    }
    
    writeLog("=== Auto Email Check Completed ===");
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Auto email check completed',
        'emails_sent' => $results['sent'],
        'emails_failed' => $results['failed'],
        'total_processed' => $results['total'],
        'notification_days' => $results['notification_days'],
        'details' => $results['details'],
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    writeLog("❌ Error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
}
?>
