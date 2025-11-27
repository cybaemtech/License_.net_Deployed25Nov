<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once __DIR__ . '/load_env.php';

$result = [
    'timestamp' => date('Y-m-d H:i:s'),
    'env_loaded' => false,
    'connection_test' => null,
    'error' => null
];

// Check environment variables
$host = getenv('MYSQL_HOST');
$dbname = getenv('MYSQL_DATABASE');
$username = getenv('MYSQL_USER');
$password = getenv('MYSQL_PASSWORD');

$result['env_loaded'] = !empty($host) && !empty($dbname) && !empty($username);
$result['config'] = [
    'host' => $host ? $host : 'NOT SET',
    'database' => $dbname ? $dbname : 'NOT SET',
    'username' => $username ? $username : 'NOT SET',
    'password_set' => !empty($password)
];

// Test connection with timeout
if ($result['env_loaded']) {
    $start = microtime(true);
    try {
        $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
        $pdo = new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 300
        ]);
        
        $result['connection_test'] = 'SUCCESS';
        $result['connection_time'] = round((microtime(true) - $start) * 1000, 2) . ' ms';
        
        // Test query
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        $result['user_count'] = $count['count'];
        
    } catch (PDOException $e) {
        $result['connection_test'] = 'FAILED';
        $result['connection_time'] = round((microtime(true) - $start) * 1000, 2) . ' ms';
        $result['error'] = $e->getMessage();
        $result['error_code'] = $e->getCode();
    }
}

echo json_encode($result, JSON_PRETTY_PRINT);
