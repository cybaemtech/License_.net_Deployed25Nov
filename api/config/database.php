<?php
// Load environment variables from .env file
require_once __DIR__ . '/../load_env.php';

// Never display errors as HTML - error_handler.php handles all errors as JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

class Database {
    // MySQL ONLY Configuration
    private $host;
    private $port;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function __construct() {
        // Load MySQL credentials from environment variables
        $this->host = getenv('MYSQL_HOST') ?: 'localhost';
        $this->port = getenv('MYSQL_PORT') ?: '3306';
        $this->db_name = getenv('MYSQL_DATABASE');
        $this->username = getenv('MYSQL_USER');
        $this->password = getenv('MYSQL_PASSWORD');
        
        // Validate required MySQL credentials
        // Note: password can be empty (common for localhost/XAMPP), but must be set
        if (!$this->db_name || !$this->username || $this->password === false) {
            $missing = [];
            if (!$this->db_name) $missing[] = 'MYSQL_DATABASE';
            if (!$this->username) $missing[] = 'MYSQL_USER';
            if ($this->password === false) $missing[] = 'MYSQL_PASSWORD';
            
            $envPath = realpath(__DIR__ . '/../../.env');
            $message = 'Missing MySQL credentials: ' . implode(', ', $missing) . '. ';
            $message .= '.env file ' . ($envPath ? 'found at: ' . $envPath : 'NOT FOUND! Please create .env file in project root.');
            
            throw new Exception($message);
        }
        
        // Convert password to string (allow empty string for localhost)
        $this->password = (string)$this->password;
    }

    public function getConnection() {
        $this->conn = null;
        try {
            // MySQL connection with localhost support
            $dsn = "mysql:host={$this->host};port={$this->port};charset=utf8mb4";
            
            // First, connect to MySQL server without specifying database
            $tempConn = new PDO($dsn, $this->username, $this->password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 30
            ]);
            
            // Set charset
            $tempConn->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            
            // Check if database exists, create if not
            $stmt = $tempConn->query("SHOW DATABASES LIKE '{$this->db_name}'");
            if ($stmt->rowCount() === 0) {
                $tempConn->exec("CREATE DATABASE IF NOT EXISTS `{$this->db_name}` 
                    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                error_log("Database '{$this->db_name}' created successfully");
            }
            
            // Now connect to the specific database
            $this->conn = new PDO(
                $dsn . ";dbname={$this->db_name}",
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_TIMEOUT => 30,
                    PDO::ATTR_PERSISTENT => true
                ]
            );
            
            // Set connection charset
            $this->conn->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            $this->conn->exec("SET CHARACTER SET utf8mb4");
            
            // Check if tables exist, create them if not
            $stmt = $this->conn->query("SHOW TABLES LIKE 'users'");
            if ($stmt->rowCount() === 0) {
                $this->setupDatabase();
            }
            
            return $this->conn;
        } catch(PDOException $e) {
            // Log the actual error
            error_log("Database connection failed: " . $e->getMessage());
            
            // Return user-friendly error
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode([
                "error" => "Database connection failed", 
                "message" => "Cannot connect to MySQL database. Please check your database credentials in .env file.",
                "details" => $e->getMessage(),
                "host" => $this->host,
                "port" => $this->port,
                "database" => $this->db_name,
                "user" => $this->username
            ]);
            exit;
        }
    }
    
    private function setupDatabase() {
        // MySQL schema setup from SQL file
        $sqlFile = __DIR__ . '/../../database_schema.sql';
        
        if (file_exists($sqlFile)) {
            try {
                $sql = file_get_contents($sqlFile);
                
                // Split SQL statements by semicolons
                $statements = array_filter(array_map('trim', explode(';', $sql)));
                
                foreach ($statements as $statement) {
                    // Skip empty statements and comments
                    if (!empty($statement) && !preg_match('/^(USE |--)/i', $statement)) {
                        try {
                            $this->conn->exec($statement);
                        } catch (PDOException $e) {
                            // Log but continue - some statements might fail if tables already exist
                            error_log("SQL Statement warning: " . $e->getMessage());
                        }
                    }
                }
                error_log("Database tables created/updated successfully");
            } catch (PDOException $e) {
                error_log("Error setting up database: " . $e->getMessage());
                throw $e;
            }
        } else {
            error_log("SQL setup file not found: {$sqlFile}");
            throw new Exception("Database schema file not found");
        }
    }
}
