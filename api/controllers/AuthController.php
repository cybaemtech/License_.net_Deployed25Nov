<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';

class AuthController {
    private $db;
    private $conn;
    
    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }
    
    public function login() {
        try {
            $rawInput = file_get_contents('php://input');
            error_log("Login - Raw input received: " . $rawInput);
            
            $input = json_decode($rawInput, true);
            error_log("Login - JSON decoded: " . print_r($input, true));
            
            if (!$input) {
                error_log("Login - Invalid JSON input");
                Response::badRequest('Invalid JSON input');
            }
            
            $username = $input['username'] ?? '';
            $password = $input['password'] ?? '';
            
            error_log("Login - Username: $username, Password length: " . strlen($password));
            
            if (empty($username) || empty($password)) {
                error_log("Login - Empty username or password");
                Response::unauthorized('Username and password are required');
            }
            
            $sql = "SELECT * FROM users WHERE email = ? LIMIT 1";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                error_log("Login failed: No user found for email: " . $username);
                Response::unauthorized('Invalid credentials');
            }
            
            error_log("Login attempt for user: " . $username);
            error_log("Stored password hash: " . substr($user['password'], 0, 30) . "...");
            error_log("Password hash starts with: " . substr($user['password'], 0, 7));
            
            // Check password (assuming bcrypt or plain text)
            $passwordMatch = false;
            if (password_verify($password, $user['password'])) {
                error_log("Password verified successfully with password_verify");
                $passwordMatch = true;
            } elseif ($password === $user['password']) {
                error_log("Password matched with plain text comparison");
                // Plain text fallback (not recommended)
                $passwordMatch = true;
            }
            
            if (!$passwordMatch) {
                error_log("Login failed: Password did not match for user: " . $username);
                Response::unauthorized('Invalid credentials');
            }
            
            error_log("Login successful for user: " . $username);
            
            Response::success([
                'id' => $user['id'],
                'username' => $user['email'],
                'email' => $user['email'],
                'role' => $user['role'] ?? 'user'
            ], 'Login successful');
        } catch (PDOException $e) {
            error_log("Login error: " . $e->getMessage());
            Response::error('Login failed: ' . $e->getMessage());
        }
    }
    
    public function register() {
        try {
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);
            
            if (!$input) {
                Response::badRequest('Invalid JSON input');
            }
            
            $email = $input['email'] ?? '';
            $password = $input['password'] ?? '';
            
            if (empty($email) || empty($password)) {
                Response::badRequest('Email and password are required');
            }
            
            // Hash the password
            $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
            
            $sql = "INSERT INTO users (email, password, role) VALUES (?, ?, ?)";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$email, $hashedPassword, 'user']);
            
            $userId = $this->conn->lastInsertId();
            
            Response::success([
                'id' => $userId,
                'email' => $email,
                'role' => 'user'
            ], 'User registered successfully', 201);
        } catch (PDOException $e) {
            error_log("Register error: " . $e->getMessage());
            Response::error('Registration failed: ' . $e->getMessage());
        }
    }
    
    public function me() {
        Response::success([
            'id' => 1,
            'username' => 'admin',
            'email' => 'admin@example.com',
            'role' => 'admin'
        ], 'User retrieved successfully');
    }
    
    public function status() {
        Response::success(['status' => 'authenticated'], 'Authentication status');
    }
    
    public function changePassword() {
        try {
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);
            
            if (!$input) {
                Response::badRequest('Invalid JSON input');
            }
            
            $userId = $input['user_id'] ?? null;
            $newPassword = $input['new_password'] ?? '';
            
            if (!$userId || empty($newPassword)) {
                Response::badRequest('User ID and new password are required');
            }
            
            $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
            
            $sql = "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$hashedPassword, $userId]);
            
            Response::success(null, 'Password changed successfully');
        } catch (PDOException $e) {
            error_log("Change password error: " . $e->getMessage());
            Response::error('Failed to change password: ' . $e->getMessage());
        }
    }
}
