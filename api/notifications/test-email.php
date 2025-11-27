<?php
/**
 * Test Email Endpoint
 * Test if PHP email system is working
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
    
    // Get email from request
    $toEmail = $_GET['to'] ?? $_POST['to'] ?? null;
    
    if (!$toEmail) {
        ob_clean();
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Please provide email address in "to" parameter',
            'usage' => 'GET/POST: ?to=email@example.com'
        ]);
        ob_end_flush();
        exit;
    }
    
    // Validate email
    if (!filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
        ob_clean();
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid email address format'
        ]);
        ob_end_flush();
        exit;
    }
    
    $subject = $_GET['subject'] ?? $_POST['subject'] ?? null;
    $message = $_GET['message'] ?? $_POST['message'] ?? null;
    
    // Send test email
    $notificationService = new LicenseNotificationService();
    $result = $notificationService->sendTestEmail($toEmail, $subject, $message);
    
    // Clear any accidental output
    ob_clean();
    
    if ($result['success']) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Test email sent successfully!',
            'sent_to' => $toEmail,
            'timestamp' => date('Y-m-d H:i:s'),
            'note' => 'Check your inbox (and spam folder) for the test email'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to send test email',
            'details' => $result
        ]);
    }
    
} catch (Exception $e) {
    error_log("Test Email Error: " . $e->getMessage());
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

ob_end_flush();
?>
