<?php
/**
 * Check Expiring Licenses Endpoint
 * Manually trigger email sending for expiring licenses
 */

// Disable error display and start clean output
ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);

// Start output buffering
ob_start();

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    ob_end_flush();
    exit;
}

try {
    require_once __DIR__ . '/../services/LicenseNotificationService.php';
    
    $notificationService = new LicenseNotificationService();
    $results = $notificationService->sendDailyNotifications();
    
    // Clear any accidental output
    ob_clean();
    
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
    ]);
    
} catch (Exception $e) {
    error_log("Check Expiring Licenses Error: " . $e->getMessage());
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to send notifications',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

ob_end_flush();
?>
