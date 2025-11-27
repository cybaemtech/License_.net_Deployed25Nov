<?php
/**
 * Email Notification History API Endpoint
 * GET: Retrieve email notification history
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
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    ob_end_flush();
    exit;
}

try {
    // Include database config
    require_once __DIR__ . '/../config/database.php';
    
    $database = new Database();
    $pdo = $database->getConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get limit from query parameter
        $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 500) : 100;
        
        // Check if table exists
        $stmt = $pdo->query("SHOW TABLES LIKE 'email_notification_log'");
        if ($stmt->rowCount() === 0) {
            // Create table if it doesn't exist
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

        // Fetch history
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

        // Format data
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

        // Clear any accidental output
        ob_clean();
        
        echo json_encode([
            'success' => true,
            'data' => $formattedHistory,
            'count' => count($formattedHistory),
            'message' => 'Email notification history retrieved successfully'
        ]);

    } else {
        ob_clean();
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    error_log("Notification History Error: " . $e->getMessage());
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch notification history',
        'message' => $e->getMessage()
    ]);
}

ob_end_flush();
?>
