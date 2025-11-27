<?php
/**
 * Database Verification Script
 * Check if database tables exist and have data
 */

// Load environment variables
require_once __DIR__ . '/api/load_env.php';

echo "=== Database Connection Test ===\n\n";

// Get database credentials
$host = getenv('MYSQL_HOST') ?: 'localhost';
$port = getenv('MYSQL_PORT') ?: '3306';
$database = getenv('MYSQL_DATABASE');
$username = getenv('MYSQL_USER');
$password = getenv('MYSQL_PASSWORD');

echo "Connecting to database...\n";
echo "Host: $host:$port\n";
echo "Database: $database\n";
echo "User: $username\n\n";

try {
    // Connect to database
    $dsn = "mysql:host=$host;port=$port;dbname=$database;charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "✅ Database connection successful!\n\n";
    
    // Expected tables
    $expectedTables = [
        'users',
        'license_purchases',
        'clients',
        'vendors',
        'tools',
        'currencies',
        'sales',
        'license_allocations',
        'email_notifications',
        'notification_settings',
        'email_notification_log',
        'license_usage_logs',
        'company_settings'
    ];
    
    echo "=== Checking Tables ===\n\n";
    
    // Get all tables
    $stmt = $pdo->query("SHOW TABLES");
    $existingTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($existingTables)) {
        echo "❌ ERROR: No tables found in database!\n";
        echo "\n📋 ACTION REQUIRED:\n";
        echo "   You need to import the database schema.\n";
        echo "   See DATABASE_IMPORT_GUIDE.md for instructions.\n\n";
        exit(1);
    }
    
    echo "Found " . count($existingTables) . " tables:\n";
    
    $missingTables = [];
    foreach ($expectedTables as $table) {
        $exists = in_array($table, $existingTables);
        $status = $exists ? '✅' : '❌';
        echo "$status $table";
        
        if ($exists) {
            // Count rows
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
            $count = $stmt->fetch()['count'];
            echo " ($count rows)";
        } else {
            $missingTables[] = $table;
        }
        echo "\n";
    }
    
    if (!empty($missingTables)) {
        echo "\n⚠️  WARNING: Missing tables: " . implode(', ', $missingTables) . "\n";
        echo "   Please import database_schema.sql\n\n";
    }
    
    // Check for data in key tables
    echo "\n=== Data Check ===\n\n";
    
    $keyTables = ['users', 'currencies', 'company_settings'];
    foreach ($keyTables as $table) {
        if (in_array($table, $existingTables)) {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
            $count = $stmt->fetch()['count'];
            
            if ($count > 0) {
                echo "✅ $table has $count records\n";
            } else {
                echo "⚠️  $table is EMPTY (need to import data)\n";
            }
        }
    }
    
    echo "\n=== Summary ===\n\n";
    
    if (count($existingTables) === count($expectedTables) && empty($missingTables)) {
        echo "✅ All tables exist!\n";
        
        // Check if users table has data
        if (in_array('users', $existingTables)) {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
            $userCount = $stmt->fetch()['count'];
            
            if ($userCount > 0) {
                echo "✅ Database is ready to use!\n";
            } else {
                echo "⚠️  Users table is empty. Please import database_schema.sql to get default admin user.\n";
            }
        }
    } else {
        echo "❌ Database setup is incomplete.\n";
        echo "   Please import database_schema.sql into your database.\n";
        echo "   See DATABASE_IMPORT_GUIDE.md for detailed instructions.\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Database connection failed!\n";
    echo "Error: " . $e->getMessage() . "\n\n";
    echo "Please check your .env file configuration:\n";
    echo "- MYSQL_HOST\n";
    echo "- MYSQL_PORT\n";
    echo "- MYSQL_DATABASE\n";
    echo "- MYSQL_USER\n";
    echo "- MYSQL_PASSWORD\n";
    exit(1);
}
