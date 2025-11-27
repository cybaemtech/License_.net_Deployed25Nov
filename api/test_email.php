<?php
/**
 * Email Test Endpoint
 * Test if PHP email system is working
 * 
 * Usage:
 * GET/POST: /api/test_email.php?to=email@example.com
 * GET/POST: /api/test_email.php?to=email@example.com&subject=Custom Subject&message=Custom Message
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
    // Get email address from request
    $toEmail = $_GET['to'] ?? $_POST['to'] ?? null;
    
    if (!$toEmail) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Please provide email address in "to" parameter',
            'usage' => 'GET/POST: /api/test_email.php?to=email@example.com'
        ]);
        exit;
    }
    
    // Validate email
    if (!filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid email address format'
        ]);
        exit;
    }
    
    $subject = $_GET['subject'] ?? $_POST['subject'] ?? null;
    $message = $_GET['message'] ?? $_POST['message'] ?? null;
    
    // Send test email
    $notificationService = new LicenseNotificationService();
    $result = $notificationService->sendTestEmail($toEmail, $subject, $message);
    
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
            'error' => $result['error'] ?? 'Failed to send email',
            'details' => $result
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
