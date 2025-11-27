<?php
/**
 * Debug endpoint to check environment configuration
 * Access: http://localhost:8000/debug.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Load environment variables
require_once __DIR__ . '/load_env.php';

$debug = [
    'env_file_exists' => file_exists(__DIR__ . '/../.env'),
    'env_file_path' => realpath(__DIR__ . '/../.env') ?: 'NOT FOUND',
    'current_dir' => __DIR__,
    'mysql_credentials' => [
        'MYSQL_HOST' => getenv('MYSQL_HOST') ?: 'NOT SET',
        'MYSQL_PORT' => getenv('MYSQL_PORT') ?: 'NOT SET',
        'MYSQL_DATABASE' => getenv('MYSQL_DATABASE') ?: 'NOT SET',
        'MYSQL_USER' => getenv('MYSQL_USER') ?: 'NOT SET',
        'MYSQL_PASSWORD' => getenv('MYSQL_PASSWORD') ? '***HIDDEN***' : 'NOT SET',
        'APP_ENV' => getenv('APP_ENV') ?: 'NOT SET',
    ],
    'database_test' => 'pending'
];

// Test database connection
try {
    $host = getenv('MYSQL_HOST');
    $db = getenv('MYSQL_DATABASE');
    $user = getenv('MYSQL_USER');
    $pass = getenv('MYSQL_PASSWORD');
    
    if (!$host || !$db || !$user) {
        throw new Exception('Missing database credentials in .env file');
    }
    
    $pdo = new PDO(
        "mysql:host=$host;dbname=$db;charset=utf8mb4",
        $user,
        $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    $debug['database_test'] = 'SUCCESS - Connected to database';
    $debug['database_info'] = [
        'server_version' => $pdo->getAttribute(PDO::ATTR_SERVER_VERSION),
        'connection_status' => $pdo->getAttribute(PDO::ATTR_CONNECTION_STATUS)
    ];
    
} catch (Exception $e) {
    $debug['database_test'] = 'FAILED';
    $debug['database_error'] = $e->getMessage();
}

echo json_encode($debug, JSON_PRETTY_PRINT);
?>
