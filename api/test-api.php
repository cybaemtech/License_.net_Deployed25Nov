<?php
/**
 * API Test Endpoint
 * Quick test to verify API is working and returning JSON
 * Visit: https://cybaemtech.net/License/api/test-api.php
 */

// Start output buffering
ob_start();

// Disable error display
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Set JSON headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    // Test database connection
    $host = getenv('MYSQL_HOST') ?: 'localhost';
    $dbname = getenv('MYSQL_DATABASE') ?: 'cybaemtechnet_LMS_Project';
    $username = getenv('MYSQL_USER') ?: 'cybaemtechnet_LMS_Project';
    $password = getenv('MYSQL_PASSWORD') ?: 'PrajwalAK12';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    
    // Test query
    $stmt = $pdo->query("SELECT 1 as test");
    $result = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'message' => 'API is working correctly! ✅',
        'timestamp' => date('Y-m-d H:i:s'),
        'database' => [
            'connected' => true,
            'host' => $host,
            'database' => $dbname,
            'test_query' => $result ? 'passed' : 'failed'
        ],
        'php_version' => PHP_VERSION,
        'output_buffering' => ob_get_level() > 0 ? 'enabled' : 'disabled',
        'error_display' => ini_get('display_errors') == '0' ? 'disabled (good)' : 'enabled (bad)',
        'notes' => [
            'If you see this JSON, the API fix is working!',
            'No HTML errors should appear',
            'Database connection successful'
        ]
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s'),
        'notes' => [
            'Check database credentials in the PHP file',
            'Verify MySQL server is running',
            'If you see this JSON (not HTML), error handling is working correctly'
        ]
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'General error',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
}

ob_end_flush();
?>
