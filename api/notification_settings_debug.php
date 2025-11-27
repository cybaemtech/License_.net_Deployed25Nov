<?php
/**
 * DEBUG VERSION - Notification Settings API
 * This version provides detailed error information for troubleshooting
 */

// Enable error display for debugging
ini_set('display_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Set headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$debugInfo = [
    'step' => '',
    'details' => [],
    'errors' => []
];

try {
    $debugInfo['step'] = 'Database Connection';
    
    // Database credentials
    $host = getenv('MYSQL_HOST') ?: 'localhost';
    $dbname = getenv('MYSQL_DATABASE') ?: 'cybaemtechnet_LMS_Project';
    $username = getenv('MYSQL_USER') ?: 'cybaemtechnet_LMS_Project';
    $password = getenv('MYSQL_PASSWORD') ?: 'PrajwalAK12';
    
    $debugInfo['details']['db_host'] = $host;
    $debugInfo['details']['db_name'] = $dbname;
    $debugInfo['details']['db_user'] = $username;
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    $debugInfo['details']['db_connected'] = true;
    $debugInfo['step'] = 'Get User ID';
    
    // Get user ID
    $userStmt = $pdo->query("SELECT id FROM users LIMIT 1");
    $userRow = $userStmt->fetch();
    $userId = $userRow ? $userRow['id'] : null;
    
    $debugInfo['details']['user_id'] = $userId;
    
    if (!$userId) {
        throw new Exception('No user found in database');
    }
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $debugInfo['step'] = 'Read POST Input';
        
        $rawInput = file_get_contents('php://input');
        $debugInfo['details']['raw_input'] = $rawInput;
        
        $input = json_decode($rawInput, true);
        $debugInfo['details']['decoded_input'] = $input;
        $debugInfo['details']['json_error'] = json_last_error_msg();
        
        if (!$input) {
            throw new Exception('Invalid JSON: ' . json_last_error_msg());
        }
        
        $debugInfo['step'] = 'Check Table Exists';
        
        // Check if table exists
        $stmt = $pdo->query("SHOW TABLES LIKE 'notification_settings'");
        $tableExists = $stmt->rowCount() > 0;
        $debugInfo['details']['table_exists'] = $tableExists;
        
        if (!$tableExists) {
            $debugInfo['step'] = 'Create Table';
            $createTableSQL = "
                CREATE TABLE IF NOT EXISTS notification_settings (
                    id CHAR(36) PRIMARY KEY,
                    user_id CHAR(36) UNIQUE,
                    email_notifications_enabled TINYINT(1) DEFAULT 1,
                    notification_days VARCHAR(50) DEFAULT '45,30,15,7,5,1,0',
                    notification_time TIME DEFAULT '09:00:00',
                    timezone VARCHAR(50) DEFAULT 'UTC',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_notification_settings_user_id (user_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ";
            $pdo->exec($createTableSQL);
            $debugInfo['details']['table_created'] = true;
        }
        
        $debugInfo['step'] = 'Validate Input';
        
        // Validate and prepare data
        $emailEnabled = isset($input['email_notifications_enabled']) ? (bool)$input['email_notifications_enabled'] : true;
        $notificationDays = isset($input['notification_days']) && is_array($input['notification_days']) 
            ? $input['notification_days'] 
            : [45, 30, 15, 7, 5, 1, 0];
        $notificationTime = trim($input['notification_time'] ?? '09:00');
        $timezone = trim($input['timezone'] ?? 'UTC');
        
        $debugInfo['details']['processed_data'] = [
            'email_enabled' => $emailEnabled,
            'notification_days' => $notificationDays,
            'notification_time' => $notificationTime,
            'timezone' => $timezone
        ];
        
        // Validate time format
        if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $notificationTime)) {
            throw new Exception('Invalid time format: ' . $notificationTime);
        }
        
        // Validate days
        foreach ($notificationDays as $day) {
            if (!is_int($day) || $day < 0 || $day > 365) {
                throw new Exception('Invalid notification day: ' . $day);
            }
        }
        
        $debugInfo['step'] = 'Check Existing Settings';
        
        // Check existing settings
        $stmt = $pdo->prepare("SELECT id FROM notification_settings WHERE user_id = ?");
        $stmt->execute([$userId]);
        $existingSettings = $stmt->fetch();
        
        $debugInfo['details']['existing_settings'] = $existingSettings ? true : false;
        
        $notificationDaysString = implode(',', $notificationDays);
        
        if ($existingSettings) {
            $debugInfo['step'] = 'Update Settings';
            
            $sql = "UPDATE notification_settings SET 
                        email_notifications_enabled = ?,
                        notification_days = ?,
                        notification_time = ?,
                        timezone = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = ?";
            
            $stmt = $pdo->prepare($sql);
            $params = [
                $emailEnabled ? 1 : 0,
                $notificationDaysString,
                $notificationTime . ':00',
                $timezone,
                $userId
            ];
            
            $debugInfo['details']['sql'] = $sql;
            $debugInfo['details']['params'] = $params;
            
            $result = $stmt->execute($params);
            $debugInfo['details']['update_result'] = $result;
            $debugInfo['details']['rows_affected'] = $stmt->rowCount();
            
        } else {
            $debugInfo['step'] = 'Insert Settings';
            
            // Generate UUID
            $settingsId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000,
                mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
            );
            
            $sql = "INSERT INTO notification_settings 
                        (id, user_id, email_notifications_enabled, notification_days, notification_time, timezone) 
                    VALUES (?, ?, ?, ?, ?, ?)";
            
            $stmt = $pdo->prepare($sql);
            $params = [
                $settingsId,
                $userId,
                $emailEnabled ? 1 : 0,
                $notificationDaysString,
                $notificationTime . ':00',
                $timezone
            ];
            
            $debugInfo['details']['sql'] = $sql;
            $debugInfo['details']['params'] = $params;
            
            $result = $stmt->execute($params);
            $debugInfo['details']['insert_result'] = $result;
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Settings saved successfully',
            'debug' => $debugInfo
        ]);
        
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Only POST method supported in debug mode',
            'debug' => $debugInfo
        ]);
    }
    
} catch (PDOException $e) {
    $debugInfo['errors'][] = [
        'type' => 'PDOException',
        'message' => $e->getMessage(),
        'code' => $e->getCode(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ];
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error',
        'debug' => $debugInfo
    ]);
    
} catch (Exception $e) {
    $debugInfo['errors'][] = [
        'type' => 'Exception',
        'message' => $e->getMessage(),
        'code' => $e->getCode(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ];
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'debug' => $debugInfo
    ]);
}
?>
