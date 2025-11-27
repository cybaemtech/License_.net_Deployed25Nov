<?php
/**
 * Debug Notification System
 * Check karo ki notifications kyu nahi ja rahe
 */

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/load_env.php';
require_once __DIR__ . '/config/database.php';

$debug = [];

try {
    // 1. Check Email Configuration
    $debug['email_mode'] = getenv('EMAIL_MODE');
    
    require_once __DIR__ . '/utils/EmailNotifications.php';
    $debug['mail_server_available'] = isMailServerAvailable();
    
    // 2. Get Database Connection
    $database = new Database();
    $pdo = $database->getConnection();
    $debug['database_connected'] = true;
    
    // 3. Check Notification Settings
    $stmt = $pdo->prepare("SELECT * FROM notification_settings ORDER BY created_at DESC LIMIT 1");
    $stmt->execute();
    $settings = $stmt->fetch();
    
    if (!$settings) {
        $debug['notification_settings'] = "NO SETTINGS FOUND!";
    } else {
        $debug['notification_settings'] = [
            'enabled' => $settings['email_notifications_enabled'],
            'notify_45_days' => $settings['notify_45_days'] ?? 0,
            'notify_30_days' => $settings['notify_30_days'] ?? 0,
            'notify_15_days' => $settings['notify_15_days'] ?? 0,
            'notify_7_days' => $settings['notify_7_days'] ?? 0,
            'notify_5_days' => $settings['notify_5_days'] ?? 0,
            'notify_1_day' => $settings['notify_1_day'] ?? 0,
            'notify_0_days' => $settings['notify_0_days'] ?? 0,
            'notification_time' => $settings['notification_time'] ?? 'NOT SET'
        ];
        
        // Get notification days
        $notificationDays = [];
        if (isset($settings['notify_45_days']) && $settings['notify_45_days']) $notificationDays[] = 45;
        if (isset($settings['notify_30_days']) && $settings['notify_30_days']) $notificationDays[] = 30;
        if (isset($settings['notify_15_days']) && $settings['notify_15_days']) $notificationDays[] = 15;
        if (isset($settings['notify_7_days']) && $settings['notify_7_days']) $notificationDays[] = 7;
        if (isset($settings['notify_5_days']) && $settings['notify_5_days']) $notificationDays[] = 5;
        if (isset($settings['notify_1_day']) && $settings['notify_1_day']) $notificationDays[] = 1;
        if (isset($settings['notify_0_days']) && $settings['notify_0_days']) $notificationDays[] = 0;
        
        if (empty($notificationDays)) {
            $notificationDays = [45, 30, 15, 7, 5, 1, 0];
        }
        
        $debug['active_notification_days'] = $notificationDays;
    }
    
    // 4. Check for Expiring SELLING Licenses (from sales table)
    $maxDays = 45;
    $minDays = -7; // Include expired licenses
    
    $sql = "SELECT 
                s.id,
                s.tool_name,
                s.expiry_date as expiration_date,
                c.name as client_name,
                c.email as client_email,
                DATEDIFF(s.expiry_date, CURDATE()) as days_until_expiry
            FROM sales s
            LEFT JOIN clients c ON s.client_id = c.id
            WHERE s.expiry_date IS NOT NULL
                AND DATEDIFF(s.expiry_date, CURDATE()) >= ?
                AND DATEDIFF(s.expiry_date, CURDATE()) <= ?
            ORDER BY s.expiry_date ASC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$minDays, $maxDays]);
    $licenses = $stmt->fetchAll();
    
    $debug['total_licenses_found'] = count($licenses);
    $debug['licenses'] = [];
    
    foreach ($licenses as $license) {
        $daysUntilExpiry = (int)$license['days_until_expiry'];
        $shouldNotify = in_array($daysUntilExpiry, $notificationDays ?? []);
        
        $debug['licenses'][] = [
            'id' => $license['id'],
            'tool_name' => $license['tool_name'],
            'client_email' => $license['client_email'],
            'expiration_date' => $license['expiration_date'],
            'days_until_expiry' => $daysUntilExpiry,
            'should_notify' => $shouldNotify,
            'status' => $daysUntilExpiry < 0 ? 'EXPIRED' : ($daysUntilExpiry == 0 ? 'EXPIRES TODAY' : 'EXPIRING SOON')
        ];
    }
    
    // 5. Check email_notification_log table
    $stmt = $pdo->query("SHOW TABLES LIKE 'email_notification_log'");
    $debug['notification_log_table_exists'] = $stmt->rowCount() > 0;
    
    if ($debug['notification_log_table_exists']) {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM email_notification_log WHERE DATE(sent_at) = CURDATE()");
        $result = $stmt->fetch();
        $debug['emails_sent_today'] = $result['count'];
    }
    
    // 6. Test Email Function
    $debug['test_email_function'] = "Testing...";
    
    if (isset($licenses[0])) {
        $testLicense = $licenses[0];
        
        require_once __DIR__ . '/utils/EmailNotifications.php';
        
        $licenseData = [
            'id' => $testLicense['id'],
            'tool_name' => $testLicense['tool_name'],
            'expiration_date' => $testLicense['expiration_date']
        ];
        
        $clientData = [
            'name' => $testLicense['client_name'],
            'email' => $testLicense['client_email']
        ];
        
        $daysUntilExpiry = (int)$testLicense['days_until_expiry'];
        
        // Try sending (in production, will actually send; in dev, will save to file)
        try {
            $result = sendLicenseExpirationNotification($licenseData, $clientData, $daysUntilExpiry);
            $debug['test_email_function'] = $result ? 'SUCCESS' : 'FAILED';
            $debug['test_email_details'] = [
                'to' => $clientData['email'],
                'license' => $testLicense['tool_name'],
                'days' => $daysUntilExpiry
            ];
        } catch (Exception $e) {
            $debug['test_email_function'] = 'ERROR: ' . $e->getMessage();
        }
    } else {
        $debug['test_email_function'] = 'No licenses found to test';
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'debug' => $debug,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'debug' => $debug ?? []
    ], JSON_PRETTY_PRINT);
}
?>
