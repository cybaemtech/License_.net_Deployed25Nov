<?php
/**
 * Test database connection and .env loading
 */

// Load environment variables
require_once __DIR__ . '/load_env.php';

header('Content-Type: application/json');

$debug = [];

// Check if .env variables are loaded
$debug['env_loaded'] = [
    'MYSQL_HOST' => getenv('MYSQL_HOST') ? 'LOADED' : 'NOT FOUND',
    'MYSQL_USER' => getenv('MYSQL_USER') ? 'LOADED' : 'NOT FOUND',
    'MYSQL_PASSWORD' => getenv('MYSQL_PASSWORD') ? '***HIDDEN***' : 'NOT FOUND',
    'MYSQL_DATABASE' => getenv('MYSQL_DATABASE') ? 'LOADED' : 'NOT FOUND',
];

// Get actual values (for debugging)
$host = getenv('MYSQL_HOST');
$port = getenv('MYSQL_PORT') ?: '3306';
$dbname = getenv('MYSQL_DATABASE');
$username = getenv('MYSQL_USER');
$password = getenv('MYSQL_PASSWORD');

$debug['connection_params'] = [
    'host' => $host,
    'port' => $port,
    'database' => $dbname,
    'username' => $username,
    'password' => $password ? '***HIDDEN***' : 'EMPTY'
];

// Test connection
try {
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
    $debug['dsn'] = str_replace($password, '***HIDDEN***', $dsn);
    
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_TIMEOUT => 5, // 5 second timeout
    ]);
    
    $debug['connection_status'] = 'SUCCESS';
    $debug['server_version'] = $pdo->getAttribute(PDO::ATTR_SERVER_VERSION);
    
    // Test query
    $stmt = $pdo->query("SELECT 1 as test");
    $result = $stmt->fetch();
    $debug['test_query'] = $result ? 'SUCCESS' : 'FAILED';
    
} catch (PDOException $e) {
    $debug['connection_status'] = 'FAILED';
    $debug['error_message'] = $e->getMessage();
    $debug['error_code'] = $e->getCode();
    $debug['error_info'] = $e->errorInfo;
}

echo json_encode($debug, JSON_PRETTY_PRINT);
?>
