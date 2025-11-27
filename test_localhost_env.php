<?php
/**
 * Localhost .env Test Script
 * Run this to check if .env file is being loaded properly
 */

echo "=== Localhost Environment Test ===\n\n";

// Check if .env file exists
$envPath = __DIR__ . '/.env';
echo "1. Checking .env file...\n";
echo "   Looking for: $envPath\n";

if (file_exists($envPath)) {
    echo "   ✅ .env file EXISTS\n\n";
    
    // Show .env contents (first few lines)
    echo "2. .env file contents:\n";
    $lines = file($envPath, FILE_IGNORE_NEW_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue;
        
        // Hide password
        if (strpos($line, 'PASSWORD') !== false) {
            echo "   " . preg_replace('/=.+/', '=***hidden***', $line) . "\n";
        } else {
            echo "   $line\n";
        }
    }
    echo "\n";
} else {
    echo "   ❌ .env file NOT FOUND!\n";
    echo "   You need to create .env file in project root\n\n";
    echo "   Quick fix:\n";
    echo "   - Windows: copy .env.example .env\n";
    echo "   - Mac/Linux: cp .env.example .env\n\n";
    exit(1);
}

// Try loading environment
echo "3. Loading environment variables...\n";
require_once __DIR__ . '/api/load_env.php';

// Check if variables are loaded
$required = ['MYSQL_HOST', 'MYSQL_DATABASE', 'MYSQL_USER', 'MYSQL_PASSWORD'];
$loaded = [];
$missing = [];

// Treat variables as missing only if getenv returns false (unset). Empty string is allowed (blank password).
foreach ($required as $var) {
    $value = getenv($var);
    if ($value !== false) {
        $loaded[] = $var;
        if (strpos($var, 'PASSWORD') !== false) {
            echo "   ✅ $var = ***hidden***\n";
        } else {
            echo "   ✅ $var = $value\n";
        }
    } else {
        $missing[] = $var;
        echo "   ❌ $var = NOT SET\n";
    }
}

echo "\n";

if (!empty($missing)) {
    echo "❌ ERROR: Missing environment variables: " . implode(', ', $missing) . "\n";
    echo "   Please add these to your .env file\n\n";
    exit(1);
}

// Test database connection
echo "4. Testing database connection...\n";

$host = getenv('MYSQL_HOST');
$port = getenv('MYSQL_PORT') ?: '3306';
$database = getenv('MYSQL_DATABASE');
$username = getenv('MYSQL_USER');
$password = getenv('MYSQL_PASSWORD');

echo "   Host: $host:$port\n";
echo "   Database: $database\n";
echo "   User: $username\n\n";

try {
    $dsn = "mysql:host=$host;port=$port;dbname=$database;charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 10
    ]);
    
    echo "   ✅ Database connection SUCCESSFUL!\n\n";
    
    // Test query
    echo "5. Testing database query...\n";
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "   ✅ Found {$result['count']} users in database\n\n";
    
    echo "=== ALL TESTS PASSED ===\n";
    echo "Your localhost environment is configured correctly!\n";
    echo "You can now run: npm run dev\n\n";
    
} catch (PDOException $e) {
    echo "   ❌ Database connection FAILED!\n\n";
    echo "Error details:\n";
    echo "  " . $e->getMessage() . "\n\n";
    
    echo "Common fixes:\n";
    echo "  1. Make sure MySQL is running on your computer\n";
    echo "  2. Check if host/port/username/password are correct in .env\n";
    echo "  3. For remote database (82.25.105.94), check internet connection\n";
    echo "  4. Verify database user has remote access permission\n\n";
    
    exit(1);
}
