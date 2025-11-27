<?php
/**
 * cPanel Database Configuration
 * Update these settings with your actual cPanel database credentials
 */

class CPanelDatabase {
    private static $instance = null;
    private $pdo;
    
    // cPanel Database configuration
    // Update these with your actual cPanel settings
    private $config = [
        'host' => 'localhost',  // Usually localhost for cPanel
        'port' => '3306',       // Default MySQL port
        'dbname' => 'cpanel_username_dbname',  // Your cPanel database name
        'user' => 'cpanel_username_dbuser',    // Your cPanel database user
        'password' => 'your_secure_password',   // Your database password
        'charset' => 'utf8mb4'
    ];
    
    // Alternative: Using environment variables (recommended)
    /*
    private $config = [
        'host' => $_ENV['DB_HOST'] ?? 'localhost',
        'port' => $_ENV['DB_PORT'] ?? '3306',
        'dbname' => $_ENV['DB_NAME'] ?? '',
        'user' => $_ENV['DB_USER'] ?? '',
        'password' => $_ENV['DB_PASSWORD'] ?? '',
        'charset' => 'utf8mb4'
    ];
    */
    
    private function __construct() {
        $this->connect();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function connect() {
        try {
            $dsn = sprintf(
                "mysql:host=%s;port=%s;dbname=%s;charset=%s",
                $this->config['host'],
                $this->config['port'],
                $this->config['dbname'],
                $this->config['charset']
            );
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];
            
            $this->pdo = new PDO(
                $dsn,
                $this->config['user'],
                $this->config['password'],
                $options
            );
            
        } catch (PDOException $e) {
            // Log error (don't expose sensitive info)
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed. Please check your configuration.");
        }
    }
    
    public function getConnection() {
        return $this->pdo;
    }
    
    public function testConnection() {
        try {
            $stmt = $this->pdo->query('SELECT 1');
            return $stmt !== false;
        } catch (Exception $e) {
            return false;
        }
    }
}