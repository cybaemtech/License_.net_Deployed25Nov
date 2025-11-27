<?php
/**
 * FIXED VERSION - Notification Settings API
 * Optimized for cPanel deployment
 */

// Prevent any output before headers
ob_start();

// Error handling - log but don't display
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Set headers first
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit;
}

/**
 * Send JSON response and exit
 */
function sendResponse($success, $data = null, $error = null, $httpCode = 200) {
    ob_clean();
    http_response_code($httpCode);
    
    $response = ['success' => $success];
    if ($data !== null) {
        $response['data'] = $data;
        if (is_string($data)) {
            $response['message'] = $data;
            unset($response['data']);
        }
    }
    if ($error !== null) {
        $response['error'] = $error;
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    ob_end_flush();
    exit;
}

try {
    // Database connection
    $host = getenv('MYSQL_HOST') ?: 'localhost';
    $dbname = getenv('MYSQL_DATABASE') ?: 'cybaemtechnet_LMS_Project';
    $username = getenv('MYSQL_USER') ?: 'cybaemtechnet_LMS_Project';
    $password = getenv('MYSQL_PASSWORD') ?: 'PrajwalAK12';
    
    // Create PDO connection
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
    ];
    
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Get user ID (first user for now)
    $stmt = $pdo->query("SELECT id FROM users ORDER BY created_at ASC LIMIT 1");
    $user = $stmt->fetch();
    
    if (!$user) {
        sendResponse(false, null, 'No user found. Please create a user first.', 404);
    }
    
    $userId = $user['id'];
    
    // Ensure table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'notification_settings'");
    if ($tableCheck->rowCount() === 0) {
        $createSQL = "CREATE TABLE notification_settings (
            id CHAR(36) NOT NULL PRIMARY KEY,
            user_id CHAR(36) NOT NULL,
            email_notifications_enabled TINYINT(1) NOT NULL DEFAULT 1,
            notification_days VARCHAR(100) NOT NULL DEFAULT '45,30,15,7,5,1,0',
            notification_time TIME NOT NULL DEFAULT '09:00:00',
            timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_id (user_id),
            KEY idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $pdo->exec($createSQL);
    }
    
    // Handle GET request
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->prepare("SELECT * FROM notification_settings WHERE user_id = ?");
        $stmt->execute([$userId]);
        $settings = $stmt->fetch();
        
        if (!$settings) {
            // Return defaults
            $defaultData = [
                'email_notifications_enabled' => true,
                'notification_days' => [45, 30, 15, 7, 5, 1, 0],
                'notification_time' => '09:00',
                'timezone' => 'UTC'
            ];
            sendResponse(true, $defaultData);
        }
        
        // Parse notification days
        $days = $settings['notification_days'];
        if (strpos($days, ',') !== false) {
            $notificationDays = array_map('intval', explode(',', $days));
        } else {
            $decoded = json_decode($days, true);
            $notificationDays = is_array($decoded) ? $decoded : [45, 30, 15, 7, 5, 1, 0];
        }
        
        $responseData = [
            'email_notifications_enabled' => (bool)$settings['email_notifications_enabled'],
            'notification_days' => $notificationDays,
            'notification_time' => substr($settings['notification_time'], 0, 5),
            'timezone' => $settings['timezone']
        ];
        
        sendResponse(true, $responseData);
    }
    
    // Handle POST request
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Read and parse input
        $rawInput = file_get_contents('php://input');
        
        if (empty($rawInput)) {
            sendResponse(false, null, 'Empty request body', 400);
        }
        
        $input = json_decode($rawInput, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            sendResponse(false, null, 'Invalid JSON: ' . json_last_error_msg(), 400);
        }
        
        // Extract and validate data
        $emailEnabled = isset($input['email_notifications_enabled']) 
            ? filter_var($input['email_notifications_enabled'], FILTER_VALIDATE_BOOLEAN) 
            : true;
        
        $notificationDays = isset($input['notification_days']) && is_array($input['notification_days'])
            ? $input['notification_days']
            : [45, 30, 15, 7, 5, 1, 0];
        
        $notificationTime = isset($input['notification_time']) 
            ? trim($input['notification_time']) 
            : '09:00';
        
        $timezone = isset($input['timezone']) 
            ? trim($input['timezone']) 
            : 'UTC';
        
        // Validate time format (HH:MM)
        if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $notificationTime)) {
            sendResponse(false, null, 'Invalid time format. Use HH:MM (e.g., 09:00)', 400);
        }
        
        // Validate notification days
        foreach ($notificationDays as $day) {
            if (!is_numeric($day) || $day < 0 || $day > 365) {
                sendResponse(false, null, "Invalid notification day value: $day", 400);
            }
        }
        
        // Convert days array to string
        $daysString = implode(',', array_map('intval', $notificationDays));
        
        // Add seconds to time
        $timeWithSeconds = $notificationTime . ':00';
        
        // Check if settings exist
        $checkStmt = $pdo->prepare("SELECT id FROM notification_settings WHERE user_id = ?");
        $checkStmt->execute([$userId]);
        $exists = $checkStmt->fetch();
        
        if ($exists) {
            // UPDATE existing record
            $updateSQL = "UPDATE notification_settings 
                         SET email_notifications_enabled = ?,
                             notification_days = ?,
                             notification_time = ?,
                             timezone = ?
                         WHERE user_id = ?";
            
            $updateStmt = $pdo->prepare($updateSQL);
            $success = $updateStmt->execute([
                $emailEnabled ? 1 : 0,
                $daysString,
                $timeWithSeconds,
                $timezone,
                $userId
            ]);
            
            if (!$success) {
                sendResponse(false, null, 'Failed to update settings', 500);
            }
            
        } else {
            // INSERT new record
            // Generate simple UUID
            $newId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000,
                mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
            );
            
            $insertSQL = "INSERT INTO notification_settings 
                         (id, user_id, email_notifications_enabled, notification_days, notification_time, timezone)
                         VALUES (?, ?, ?, ?, ?, ?)";
            
            $insertStmt = $pdo->prepare($insertSQL);
            $success = $insertStmt->execute([
                $newId,
                $userId,
                $emailEnabled ? 1 : 0,
                $daysString,
                $timeWithSeconds,
                $timezone
            ]);
            
            if (!$success) {
                sendResponse(false, null, 'Failed to insert settings', 500);
            }
        }
        
        // Return success with saved data
        $savedData = [
            'email_notifications_enabled' => $emailEnabled,
            'notification_days' => array_map('intval', $notificationDays),
            'notification_time' => $notificationTime,
            'timezone' => $timezone
        ];
        
        sendResponse(true, [
            'message' => 'Notification settings saved successfully!',
            'settings' => $savedData
        ]);
    }
    
    // Method not allowed
    sendResponse(false, null, 'Method not allowed', 405);
    
} catch (PDOException $e) {
    error_log("Notification Settings PDO Error: " . $e->getMessage());
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
    
} catch (Exception $e) {
    error_log("Notification Settings Error: " . $e->getMessage());
    sendResponse(false, null, 'Server error: ' . $e->getMessage(), 500);
}

ob_end_flush();
?>
