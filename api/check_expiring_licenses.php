<?php
/**
 * Check Expiring Licenses Endpoint
 * Manually trigger email sending for expiring licenses
 * This can be called manually from the frontend to send notifications
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/services/LicenseNotificationService.php';

try {
    $notificationService = new LicenseNotificationService();
    $results = $notificationService->sendDailyNotifications();
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Email check completed successfully',
        'emails_sent' => $results['sent'],
        'emails_failed' => $results['failed'],
        'total_processed' => $results['total'],
        'notification_days' => $results['notification_days'],
        'details' => $results['details'],
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    error_log("Check Expiring Licenses Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to send notifications',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
}
?>
