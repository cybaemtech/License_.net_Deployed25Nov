<?php
/**
 * Login API Endpoint - Simple Direct Database Connection
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
    // Database connection using environment variables (secure approach)
    $host = getenv('MYSQL_HOST');
    $dbname = getenv('MYSQL_DATABASE');
    $username = getenv('MYSQL_USER');
    $password = getenv('MYSQL_PASSWORD');
    
    if (!$host || !$dbname || !$username || !$password) {
        throw new Exception('Database credentials not configured. Please set MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, and MYSQL_PASSWORD environment variables.');
    }

    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    // Get POST data
    $rawData = file_get_contents('php://input');
    $data = json_decode($rawData, true);
    
    error_log("Login - Raw data: " . $rawData);
    error_log("Login - Decoded data: " . print_r($data, true));
    
    // Accept both 'email' and 'username' fields (for flexibility)
    $email = isset($data['email']) ? trim($data['email']) : (isset($data['username']) ? trim($data['username']) : '');
    $password = isset($data['password']) ? trim($data['password']) : '';
    
    if (!$data || empty($email) || empty($password)) {
        error_log("Login - Missing fields. Email: '$email', Password present: " . (!empty($password) ? 'yes' : 'no'));
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Email and password are required'
        ]);
        exit;
    }
    
    error_log("Login - Attempting login for: $email");

    // Check if users table exists, create if not
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    if ($stmt->rowCount() === 0) {
        // Create users table
        $createTable = "
            CREATE TABLE users (
                id CHAR(36) PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'accounts', 'user') NOT NULL DEFAULT 'user',
                permissions JSON DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ";
        $pdo->exec($createTable);
        
        // Insert default admin user
        $hashedPassword = password_hash('admin123', PASSWORD_DEFAULT);
        $userId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
        $stmt = $pdo->prepare("INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)");
        $stmt->execute([$userId, 'admin@example.com', $hashedPassword, 'admin']);
    }

    // Find user by email
    $stmt = $pdo->prepare("SELECT id, email, password, role, permissions FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        error_log("Login - User not found: $email");
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid email or password'
        ]);
        exit;
    }
    
    error_log("Login - User found: $email");
    error_log("Login - Password hash from DB: " . substr($user['password'], 0, 30) . "...");
    error_log("Login - Verifying password...");
    
    if (!password_verify($password, $user['password'])) {
        error_log("Login - Password verification failed for: $email");
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid email or password'
        ]);
        exit;
    }
    
    error_log("Login - Password verified successfully for: $email");

    // Generate a simple session token (in production, use proper JWT or sessions)
    $token = bin2hex(random_bytes(32));
    
    // Store session (you might want to create a sessions table for this)
    
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
        'message' => 'Login successful',
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'permissions' => $permissions
        ],
        'token' => $token
    ]);

} catch (PDOException $e) {
    error_log("Login API Database Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed',
        'message' => $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Login API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}
?>