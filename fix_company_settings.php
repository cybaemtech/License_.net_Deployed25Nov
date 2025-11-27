<?php
/**
 * Fix Company Settings - Insert Default Data
 * Run this to fix empty company_settings table
 */

// Load environment variables
require_once __DIR__ . '/api/load_env.php';

echo "=== Company Settings Fix ===\n\n";

// Get database credentials
$host = getenv('MYSQL_HOST') ?: 'localhost';
$port = getenv('MYSQL_PORT') ?: '3306';
$database = getenv('MYSQL_DATABASE');
$username = getenv('MYSQL_USER');
$password = getenv('MYSQL_PASSWORD');

try {
    // Connect to database
    $dsn = "mysql:host=$host;port=$port;dbname=$database;charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "✅ Connected to database\n";
    
    // Check if company_settings already has data
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM company_settings");
    $count = $stmt->fetch()['count'];
    
    if ($count > 0) {
        echo "ℹ️  Company settings already exists ($count records)\n";
        echo "   Skipping insert.\n\n";
        
        // Show existing data
        $stmt = $pdo->query("SELECT * FROM company_settings LIMIT 1");
        $settings = $stmt->fetch();
        echo "Current settings:\n";
        echo "  Company Name: " . $settings['company_name'] . "\n";
        echo "  Email: " . ($settings['company_email'] ?: 'Not set') . "\n";
        echo "  Phone: " . ($settings['company_phone'] ?: 'Not set') . "\n";
        exit(0);
    }
    
    // Insert default company settings
    echo "📝 Inserting default company settings...\n";
    
    $sql = "INSERT INTO company_settings (
        company_name,
        company_email,
        company_phone,
        company_address,
        company_website,
        company_gst
    ) VALUES (
        'LicenseHub Enterprise',
        'info@licensehub.com',
        '+91-XXXXXXXXXX',
        'Your Company Address Here',
        'https://licensehub.com',
        NULL
    )";
    
    $pdo->exec($sql);
    
    echo "✅ Default company settings inserted successfully!\n\n";
    echo "Default values:\n";
    echo "  Company Name: LicenseHub Enterprise\n";
    echo "  Email: info@licensehub.com\n";
    echo "  Phone: +91-XXXXXXXXXX\n";
    echo "  Website: https://licensehub.com\n\n";
    echo "ℹ️  You can update these settings from the application:\n";
    echo "   Settings → Company Settings\n\n";
    
    echo "🎉 Fix completed! Now restart your application:\n";
    echo "   npm run dev\n\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
