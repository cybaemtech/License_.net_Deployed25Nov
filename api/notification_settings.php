<?php
/**
 * Notification Settings API Endpoint
 * GET: Retrieve notification settings for current user
 * POST: Update notification settings for current user
 */

require_once __DIR__ . '/error_handler.php';

// Start output buffering to catch any stray output
ob_start();

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Database connection - read from environment variables (.env file)
    $host = getenv('MYSQL_HOST');
    $port = getenv('MYSQL_PORT') ?: '3306';
    $dbname = getenv('MYSQL_DATABASE');
    $username = getenv('MYSQL_USER');
    $password = getenv('MYSQL_PASSWORD');
    
    // Validate required credentials
    if (!$host || !$dbname || !$username || !$password) {
        throw new Exception('Database credentials not found. Please check your .env file.');
    }

    // Log connection attempt for debugging
    error_log("Attempting DB connection: host=$host:$port, db=$dbname, user=$username");

    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    // For now, we'll use a default user ID since we don't have session management
    // In a real implementation, you'd get this from the authenticated session
    // Get first user's UUID from database
    $userStmt = $pdo->query("SELECT id FROM users LIMIT 1");
    $userRow = $userStmt->fetch();
    $userId = $userRow ? $userRow['id'] : null;
    
    if (!$userId) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'No user found in database. Please create a user first.'
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Handle GET request - fetch notification settings
        
        // Check if notification_settings table exists
        $stmt = $pdo->query("SHOW TABLES LIKE 'notification_settings'");
        if ($stmt->rowCount() === 0) {
            // Table doesn't exist, create it with individual notification day columns
            $createTableSQL = "
                CREATE TABLE IF NOT EXISTS notification_settings (
                    id CHAR(36) PRIMARY KEY,
                    user_id CHAR(36) UNIQUE,
                    notify_45_days TINYINT(1) DEFAULT 1,
                    notify_30_days TINYINT(1) DEFAULT 1,
                    notify_15_days TINYINT(1) DEFAULT 1,
                    notify_7_days TINYINT(1) DEFAULT 1,
                    notify_5_days TINYINT(1) DEFAULT 1,
                    notify_1_day TINYINT(1) DEFAULT 1,
                    notify_0_days TINYINT(1) DEFAULT 1,
                    email_notifications_enabled TINYINT(1) DEFAULT 1,
                    notification_time TIME DEFAULT '09:00:00',
                    timezone VARCHAR(50) DEFAULT 'UTC',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_notification_settings_user_id (user_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ";
            
            $pdo->exec($createTableSQL);
        }

        // Get notification settings for user
        $stmt = $pdo->prepare("SELECT * FROM notification_settings WHERE user_id = :user_id");
        $stmt->execute([':user_id' => $userId]);
        $settings = $stmt->fetch();

        if (!$settings) {
            // Return default settings if none exist
            $defaultSettings = [
                'email_notifications_enabled' => true,
                'notification_days' => [45, 30, 15, 7, 5, 1, 0],
                'notification_time' => '09:00',
                'timezone' => 'UTC'
            ];
            
            echo json_encode([
                'success' => true,
                'data' => $defaultSettings,
                'message' => 'Default settings returned (no user settings found)'
            ]);
        } else {
            // Build notification_days array from individual columns (backward compatible)
            $notification_days = [];
            if (isset($settings['notify_45_days']) && $settings['notify_45_days']) $notification_days[] = 45;
            if (isset($settings['notify_30_days']) && $settings['notify_30_days']) $notification_days[] = 30;
            if (isset($settings['notify_15_days']) && $settings['notify_15_days']) $notification_days[] = 15;
            if (isset($settings['notify_7_days']) && $settings['notify_7_days']) $notification_days[] = 7;
            if (isset($settings['notify_5_days']) && $settings['notify_5_days']) $notification_days[] = 5;
            if (isset($settings['notify_1_day']) && $settings['notify_1_day']) $notification_days[] = 1;
            if (isset($settings['notify_0_days']) && $settings['notify_0_days']) $notification_days[] = 0;
            
            // If no days selected, use default
            if (empty($notification_days)) {
                $notification_days = [45, 30, 15, 7, 5, 1, 0];
            }
            
            $settingsData = [
                'id' => $settings['id'],
                'email_notifications_enabled' => (bool)$settings['email_notifications_enabled'],
                'notification_days' => $notification_days,
                'notification_time' => substr($settings['notification_time'], 0, 5), // Format as HH:MM
                'timezone' => $settings['timezone']
            ];
            
            echo json_encode([
                'success' => true,
                'data' => $settingsData,
                'message' => 'Settings retrieved successfully'
            ]);
        }

    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Handle POST request - update notification settings
        
        // Ensure table exists (in case GET wasn't called first)
        $stmt = $pdo->query("SHOW TABLES LIKE 'notification_settings'");
        if ($stmt->rowCount() === 0) {
            $createTableSQL = "
                CREATE TABLE IF NOT EXISTS notification_settings (
                    id CHAR(36) PRIMARY KEY,
                    user_id CHAR(36) UNIQUE,
                    notify_45_days TINYINT(1) DEFAULT 1,
                    notify_30_days TINYINT(1) DEFAULT 1,
                    notify_15_days TINYINT(1) DEFAULT 1,
                    notify_7_days TINYINT(1) DEFAULT 1,
                    notify_5_days TINYINT(1) DEFAULT 1,
                    notify_1_day TINYINT(1) DEFAULT 1,
                    notify_0_days TINYINT(1) DEFAULT 1,
                    email_notifications_enabled TINYINT(1) DEFAULT 1,
                    notification_time TIME DEFAULT '09:00:00',
                    timezone VARCHAR(50) DEFAULT 'UTC',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_notification_settings_user_id (user_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ";
            $pdo->exec($createTableSQL);
        }
        
        $rawInput = file_get_contents('php://input');
        $input = json_decode($rawInput, true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'error' => 'Invalid JSON input',
                'json_error' => json_last_error_msg()
            ]);
            exit;
        }

        // Validate input
        $emailEnabled = isset($input['email_notifications_enabled']) ? (bool)$input['email_notifications_enabled'] : true;
        $notificationDays = isset($input['notification_days']) && is_array($input['notification_days']) 
            ? $input['notification_days'] 
            : [45, 30, 15, 7, 5, 1, 0];
        $notificationTime = trim($input['notification_time'] ?? '09:00');
        $timezone = trim($input['timezone'] ?? 'UTC');

        // Validate notification time format
        if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $notificationTime)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid time format. Use HH:MM format.'
            ]);
            exit;
        }

        // Validate notification days (should be array of integers)
        foreach ($notificationDays as $day) {
            if (!is_int($day) || $day < 0 || $day > 365) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid notification days. Must be integers between 0-365.'
                ]);
                exit;
            }
        }

        // Check if settings exist for this user
        $stmt = $pdo->prepare("SELECT id FROM notification_settings WHERE user_id = :user_id");
        $stmt->execute([':user_id' => $userId]);
        $existingSettings = $stmt->fetch();

        // Convert notification_days array to individual column flags
        $notify45 = in_array(45, $notificationDays) ? 1 : 0;
        $notify30 = in_array(30, $notificationDays) ? 1 : 0;
        $notify15 = in_array(15, $notificationDays) ? 1 : 0;
        $notify7 = in_array(7, $notificationDays) ? 1 : 0;
        $notify5 = in_array(5, $notificationDays) ? 1 : 0;
        $notify1 = in_array(1, $notificationDays) ? 1 : 0;
        $notify0 = in_array(0, $notificationDays) ? 1 : 0;

        if ($existingSettings) {
            // Update existing settings using individual columns
            $sql = "UPDATE notification_settings SET 
                        email_notifications_enabled = :email_enabled,
                        notify_45_days = :notify_45,
                        notify_30_days = :notify_30,
                        notify_15_days = :notify_15,
                        notify_7_days = :notify_7,
                        notify_5_days = :notify_5,
                        notify_1_day = :notify_1,
                        notify_0_days = :notify_0,
                        notification_time = :notification_time,
                        timezone = :timezone,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = :user_id";
            
            $stmt = $pdo->prepare($sql);
            $result = $stmt->execute([
                ':user_id' => $userId,
                ':email_enabled' => $emailEnabled ? 1 : 0,
                ':notify_45' => $notify45,
                ':notify_30' => $notify30,
                ':notify_15' => $notify15,
                ':notify_7' => $notify7,
                ':notify_5' => $notify5,
                ':notify_1' => $notify1,
                ':notify_0' => $notify0,
                ':notification_time' => $notificationTime . ':00',
                ':timezone' => $timezone
            ]);
        } else {
            // Insert new settings with UUID using individual columns
            $settingsId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000,
                mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
            );
            
            $sql = "INSERT INTO notification_settings 
                        (id, user_id, email_notifications_enabled, 
                         notify_45_days, notify_30_days, notify_15_days, notify_7_days, 
                         notify_5_days, notify_1_day, notify_0_days,
                         notification_time, timezone) 
                    VALUES 
                        (:id, :user_id, :email_enabled, 
                         :notify_45, :notify_30, :notify_15, :notify_7, 
                         :notify_5, :notify_1, :notify_0,
                         :notification_time, :timezone)";
            
            $stmt = $pdo->prepare($sql);
            $result = $stmt->execute([
                ':id' => $settingsId,
                ':user_id' => $userId,
                ':email_enabled' => $emailEnabled ? 1 : 0,
                ':notify_45' => $notify45,
                ':notify_30' => $notify30,
                ':notify_15' => $notify15,
                ':notify_7' => $notify7,
                ':notify_5' => $notify5,
                ':notify_1' => $notify1,
                ':notify_0' => $notify0,
                ':notification_time' => $notificationTime . ':00',
                ':timezone' => $timezone
            ]);
        }

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Notification settings saved successfully!',
                'data' => [
                    'email_notifications_enabled' => $emailEnabled,
                    'notification_days' => $notificationDays,
                    'notification_time' => $notificationTime,
                    'timezone' => $timezone
                ]
            ]);
        } else {
            throw new Exception('Failed to save notification settings');
        }

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }

} catch (PDOException $e) {
    error_log("Notification Settings API Database Error: " . $e->getMessage());
    ob_clean(); // Clear any output buffer
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
} catch (Exception $e) {
    error_log("Notification Settings API Error: " . $e->getMessage());
    ob_clean(); // Clear any output buffer
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

// Flush output buffer
ob_end_flush();
?>