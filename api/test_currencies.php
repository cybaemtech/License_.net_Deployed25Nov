<?php
// Test currency API directly
require_once __DIR__ . '/load_env.php';

$host = getenv('MYSQL_HOST');
$dbname = getenv('MYSQL_DATABASE');
$username = getenv('MYSQL_USER');
$password = getenv('MYSQL_PASSWORD');

echo "=== Testing Currencies API ===\n";
echo "Host: $host\n";
echo "Database: $dbname\n";
echo "User: $username\n\n";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    
    echo "✅ Database connected successfully\n\n";
    
    // Get all currencies
    $sql = "SELECT id, code, name, symbol, exchange_rate_to_inr, is_default FROM currencies ORDER BY is_default DESC, code ASC LIMIT 10";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $currencies = $stmt->fetchAll();
    
    echo "📊 Total currencies found: " . count($currencies) . "\n\n";
    echo "📋 Sample currencies:\n";
    echo "===================\n";
    
    foreach ($currencies as $currency) {
        echo sprintf(
            "ID: %s | Code: %s | Name: %s | Symbol: %s | Rate: %s | Default: %s\n",
            substr($currency['id'], 0, 8) . '...',
            $currency['code'],
            $currency['name'],
            $currency['symbol'],
            $currency['exchange_rate_to_inr'],
            $currency['is_default'] ? 'YES' : 'NO'
        );
    }
    
    echo "\n===================\n";
    echo "✅ Test completed successfully!\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
