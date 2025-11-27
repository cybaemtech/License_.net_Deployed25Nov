<?php
/**
 * Session Validation API Endpoint
 * Returns current user permissions from database
 */

require_once __DIR__ . '/load_env.php';
require_once __DIR__ . '/error_handler.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed'
    ]);
    exit;
}

try {
    // Database connection
    $host = getenv('MYSQL_HOST');
    $dbname = getenv('MYSQL_DATABASE');
    $username = getenv('MYSQL_USER');
    $password = getenv('MYSQL_PASSWORD');
    
    if (!$host || !$dbname || !$username || !$password) {
        throw new Exception('Database credentials not configured');
    }

    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    // Get POST data
    $rawData = file_get_contents('php://input');
    $data = json_decode($rawData, true);
    
    $userId = isset($data['userId']) ? trim($data['userId']) : '';
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'User ID required'
        ]);
        exit;
    }

    // Fetch current user with latest permissions from database
    $stmt = $pdo->prepare("SELECT id, email, role, permissions FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'User not found'
        ]);
        exit;
    }
    
    // Decode permissions if they exist
    $permissions = null;
    if (isset($user['permissions']) && $user['permissions']) {
        $permissions = json_decode($user['permissions'], true);
    }
    
    // If no permissions in DB, generate default ones based on role
    if (!$permissions) {
        require_once __DIR__ . '/utils/PermissionHelper.php';
        $permissions = PermissionHelper::getDefaultPermissions($user['role']);
    }
    
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'permissions' => $permissions
        ]
    ]);

} catch (PDOException $e) {
    error_log("Session Validation API Database Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error'
    ]);
} catch (Exception $e) {
    error_log("Session Validation API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error'
    ]);
}
?>
