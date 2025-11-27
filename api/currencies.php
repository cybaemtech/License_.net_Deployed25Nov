<?php
/**
 * Currencies API Endpoint
 * GET: Retrieve all currencies with exchange rates
 * POST: Add new currency
 * PUT: Update currency exchange rate
 */

require_once __DIR__ . '/error_handler.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Database connection using environment variables
    require_once __DIR__ . '/load_env.php';
    
    $host = getenv('MYSQL_HOST');
    $dbname = getenv('MYSQL_DATABASE');
    $username = getenv('MYSQL_USER');
    $password = getenv('MYSQL_PASSWORD');
    
    if (!$host || !$dbname || !$username || !$password) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Database configuration missing. Please check environment variables.'
        ]);
        exit;
    }

    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Handle GET request - fetch all currencies
        
        // Check if currencies table exists
        $stmt = $pdo->query("SHOW TABLES LIKE 'currencies'");
        if ($stmt->rowCount() === 0) {
            // Create currencies table if it doesn't exist
            $createTable = "
                CREATE TABLE currencies (
                    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                    code VARCHAR(10) NOT NULL UNIQUE,
                    name VARCHAR(100) NOT NULL,
                    symbol VARCHAR(10) NOT NULL,
                    exchange_rate_to_inr DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
                    is_default BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_currencies_code (code)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ";
            $pdo->exec($createTable);
            
            // Insert default currencies
            $insertCurrencies = "
                INSERT INTO currencies (code, name, symbol, exchange_rate_to_inr, is_default) VALUES
                ('INR', 'Indian Rupee', '₹', 1.0000, TRUE),
                ('USD', 'US Dollar', '$', 83.0000, FALSE),
                ('AED', 'UAE Dirham', 'AED', 22.6000, FALSE),
                ('EUR', 'Euro', '€', 90.0000, FALSE),
                ('GBP', 'British Pound', '£', 105.0000, FALSE),
                ('JPY', 'Japanese Yen', '¥', 0.56, FALSE),
                ('CNY', 'Chinese Yuan', '¥', 11.5000, FALSE),
                ('SGD', 'Singapore Dollar', 'S$', 62.0000, FALSE),
                ('AUD', 'Australian Dollar', 'A$', 54.0000, FALSE),
                ('CAD', 'Canadian Dollar', 'C$', 61.0000, FALSE)
            ";
            $pdo->exec($insertCurrencies);
        }

        // Get all currencies
        $sql = "
            SELECT 
                id,
                code,
                name,
                symbol,
                exchange_rate_to_inr,
                is_default,
                created_at,
                updated_at
            FROM currencies
            ORDER BY is_default DESC, code ASC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $currencies = $stmt->fetchAll();

        // Return success response
        echo json_encode([
            'success' => true,
            'data' => $currencies,
            'total_count' => count($currencies),
            'timestamp' => date('Y-m-d H:i:s'),
            'message' => 'Currencies retrieved successfully'
        ]);
        exit;
    } 
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Handle POST request - add new currency
        $rawData = file_get_contents('php://input');
        $data = json_decode($rawData, true);
        
        if (!$data || !isset($data['code']) || !isset($data['name']) || !isset($data['symbol'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Currency code, name, and symbol are required'
            ]);
            exit;
        }

        $code = strtoupper(trim($data['code']));
        $name = trim($data['name']);
        $symbol = trim($data['symbol']);
        $exchangeRate = floatval($data['exchange_rate_to_inr'] ?? 1.0);
        $isDefault = isset($data['is_default']) && $data['is_default'] ? 1 : 0;

        // Insert new currency
        $sql = "INSERT INTO currencies (code, name, symbol, exchange_rate_to_inr, is_default) 
                VALUES (:code, :name, :symbol, :exchange_rate, :is_default)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':code' => $code,
            ':name' => $name,
            ':symbol' => $symbol,
            ':exchange_rate' => $exchangeRate,
            ':is_default' => $isDefault
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Currency added successfully',
            'currency_id' => $pdo->lastInsertId()
        ]);
        exit;
    }
    elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Handle PUT request - update currency exchange rate
        $rawData = file_get_contents('php://input');
        $data = json_decode($rawData, true);
        
        if (!$data || !isset($data['id']) || !isset($data['exchange_rate_to_inr'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Currency ID and exchange rate are required'
            ]);
            exit;
        }

        $id = trim($data['id']);
        $exchangeRate = floatval($data['exchange_rate_to_inr']);

        $sql = "UPDATE currencies SET exchange_rate_to_inr = :exchange_rate WHERE id = :id";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':exchange_rate' => $exchangeRate,
            ':id' => $id
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Currency updated successfully'
        ]);
        exit;
    }
    else {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method not allowed'
        ]);
        exit;
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
