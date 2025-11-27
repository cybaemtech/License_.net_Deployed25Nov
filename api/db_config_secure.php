<?php
/**
 * Secure Database Configuration
 * Uses environment variables instead of hardcoded credentials
 */

// Get database credentials from environment variables
$db_host = getenv('MYSQL_HOST') ?: 'localhost';
$db_name = getenv('MYSQL_DATABASE');
$db_user = getenv('MYSQL_USER');
$db_pass_env = getenv('MYSQL_PASSWORD');

// Validate that required credentials are set (allow empty password for local setups)
if ($db_name === false || $db_user === false) {
    header('Content-Type: application/json');
    http_response_code(503);
    echo json_encode([
        'error' => 'Database configuration error',
        'message' => 'Database credentials not configured. Please set MYSQL_DATABASE and MYSQL_USER environment variables. MYSQL_PASSWORD may be empty for local setups.'
    ]);
    exit;
}

// Treat an unset MYSQL_PASSWORD as an empty string (some local setups use blank passwords)
$db_pass = $db_pass_env === false ? '' : $db_pass_env;

try {
    $pdo = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
        $db_user,
        $db_pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    header('Content-Type: application/json');
    http_response_code(503);
    // Log the detailed error server-side for debugging, but don't expose sensitive details to clients
    error_log('[DB] Connection failed: ' . $e->getMessage());
    echo json_encode([
        'error' => 'Database connection failed',
        'message' => 'Unable to connect to database. Please check your configuration.'
    ]);
    exit;
}

return $pdo;
