<?php

// Load environment variables
require_once __DIR__ . '/load_env.php';

// Start output buffering
ob_start();

// Disable displaying errors to prevent HTML output
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Database connection
    $host = getenv('MYSQL_HOST');
    $port = getenv('MYSQL_PORT') ?: '3306';
    $dbname = getenv('MYSQL_DATABASE');
    $username = getenv('MYSQL_USER');
    $password = getenv('MYSQL_PASSWORD');
    
    // Validate credentials
    if (!$host || !$dbname || !$username || !$password) {
        throw new Exception('Database credentials not found. Please check your .env file.');
    }

    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get limit from query parameter
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
        $limit = min($limit, 500); // Max 500 records
        
        // Check if email_notification_log table exists
        $stmt = $pdo->query("SHOW TABLES LIKE 'email_notification_log'");
        if ($stmt->rowCount() === 0) {
            // Table doesn't exist, create it
            $createTableSQL = "
                CREATE TABLE IF NOT EXISTS email_notification_log (
                    id INT(11) PRIMARY KEY AUTO_INCREMENT,
                    license_id CHAR(36) NOT NULL,
                    recipient_email VARCHAR(255) NOT NULL,
                    days_until_expiry INT(11) NOT NULL,
                    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_license_id (license_id),
                    INDEX idx_recipient_email (recipient_email),
                    INDEX idx_sent_at (sent_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ";
            $pdo->exec($createTableSQL);
        }

        // Fetch email notification history
        $sql = "SELECT 
                    enl.id,
                    enl.license_id,
                    enl.recipient_email,
                    enl.days_until_expiry,
                    enl.sent_at,
                    lp.tool_name,
                    lp.version,
                    lp.vendor,
                    lp.expiration_date,
                    c.name as client_name
                FROM email_notification_log enl
                LEFT JOIN license_purchases lp ON enl.license_id = lp.id
                LEFT JOIN clients c ON lp.client_id = c.id
                ORDER BY enl.sent_at DESC
                LIMIT :limit";
        
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $history = $stmt->fetchAll();

        // Format the history data
        $formattedHistory = array_map(function($record) {
            return [
                'id' => $record['id'],
                'license_id' => $record['license_id'],
                'tool_name' => $record['tool_name'] ?? 'Unknown',
                'version' => $record['version'] ?? 'N/A',
                'vendor' => $record['vendor'] ?? 'N/A',
                'client_name' => $record['client_name'] ?? 'Unknown',
                'recipient_email' => $record['recipient_email'],
                'days_until_expiry' => $record['days_until_expiry'],
                'sent_at' => $record['sent_at'],
                'expiration_date' => $record['expiration_date']
            ];
        }, $history);

        echo json_encode([
            'success' => true,
            'data' => $formattedHistory,
            'count' => count($formattedHistory),
            'message' => 'Email notification history retrieved successfully'
        ]);

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }

} 
catch (PDOException $e) {
    error_log("Notification History API Database Error: " . $e->getMessage());
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
} catch (Exception $e) {
    error_log("Notification History API Error: " . $e->getMessage());
    ob_clean();
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
