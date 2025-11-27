<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Auth.php';
require_once __DIR__ . '/../utils/PermissionHelper.php';

class UserManagementController {
    private $conn;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    public function getAllUsers() {
        try {
            $currentUserId = Auth::getUserId();
            if (!$currentUserId) {
                Response::unauthorized('Authentication required');
                return;
            }
            
            $currentUser = Auth::getCurrentUser($this->conn);
            if ($currentUser['role'] !== 'admin') {
                Response::forbidden('Only administrators can view users');
                return;
            }
            
            $sql = "SELECT id, email, role, permissions, created_at, updated_at 
                    FROM users 
                    ORDER BY created_at DESC";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($users as &$user) {
                if ($user['permissions']) {
                    $user['permissions'] = json_decode($user['permissions'], true);
                }
                
                if (!$user['permissions'] || empty($user['permissions'])) {
                    $user['permissions'] = PermissionHelper::getDefaultPermissions($user['role']);
                    
                    $updateSql = "UPDATE users SET permissions = :permissions WHERE id = :user_id";
                    $updateStmt = $this->conn->prepare($updateSql);
                    $permissionsJson = json_encode($user['permissions']);
                    $updateStmt->bindParam(':permissions', $permissionsJson);
                    $updateStmt->bindParam(':user_id', $user['id']);
                    $updateStmt->execute();
                }
                
                unset($user['password']);
            }
            
            Response::success($users, 'Users retrieved successfully');
        } catch (PDOException $e) {
            Response::error('Failed to fetch users: ' . $e->getMessage());
        }
    }
    
    public function createUser() {
        try {
            $currentUserId = Auth::getUserId();
            if (!$currentUserId) {
                Response::unauthorized('Authentication required');
                return;
            }
            
            $currentUser = Auth::getCurrentUser($this->conn);
            if ($currentUser['role'] !== 'admin') {
                Response::forbidden('Only administrators can create users');
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['email']) || !isset($data['password'])) {
                Response::badRequest('Email and password are required');
                return;
            }
            
            $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
            $password = $data['password'];
            $role = $data['role'] ?? 'user';
            $permissions = $data['permissions'] ?? PermissionHelper::getDefaultPermissions($role);
            
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                Response::badRequest('Invalid email address');
                return;
            }
            
            $checkSql = "SELECT id FROM users WHERE email = :email";
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->bindParam(':email', $email);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() > 0) {
                Response::badRequest('Email already exists');
                return;
            }
            
            $userId = $this->generateUUID();
            $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
            $permissionsJson = json_encode($permissions);
            
            error_log("Creating user: " . $email);
            error_log("Password hash generated: " . substr($hashedPassword, 0, 30) . "...");
            error_log("Password hash starts with: " . substr($hashedPassword, 0, 7));
            
            $sql = "INSERT INTO users (id, email, password, role, permissions) 
                    VALUES (:id, :email, :password, :role, :permissions)";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':id', $userId);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':password', $hashedPassword);
            $stmt->bindParam(':role', $role);
            $stmt->bindParam(':permissions', $permissionsJson);
            
            if ($stmt->execute()) {
                error_log("User created successfully: " . $email . " with ID: " . $userId);
                Response::success([
                    'id' => $userId,
                    'email' => $email,
                    'role' => $role,
                    'permissions' => $permissions
                ], 'User created successfully', 201);
            } else {
                error_log("Failed to create user: " . $email);
                Response::error('Failed to create user');
            }
        } catch (PDOException $e) {
            Response::error('Database error: ' . $e->getMessage());
        }
    }
    
    public function updateUser($userId) {
        try {
            $currentUserId = Auth::getUserId();
            if (!$currentUserId) {
                Response::unauthorized('Authentication required');
                return;
            }
            
            $currentUser = Auth::getCurrentUser($this->conn);
            if ($currentUser['role'] !== 'admin' && $currentUserId !== $userId) {
                Response::forbidden('You can only update your own profile or you must be an administrator');
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            $updates = [];
            $params = [':user_id' => $userId];
            
            if (isset($data['email'])) {
                $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    Response::badRequest('Invalid email address');
                    return;
                }
                $updates[] = "email = :email";
                $params[':email'] = $email;
            }
            
            if (isset($data['password']) && !empty($data['password'])) {
                $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);
                $updates[] = "password = :password";
                $params[':password'] = $hashedPassword;
            }
            
            if (isset($data['role']) && $currentUser['role'] === 'admin') {
                $updates[] = "role = :role";
                $params[':role'] = $data['role'];
            }
            
            if (isset($data['permissions']) && $currentUser['role'] === 'admin') {
                $updates[] = "permissions = :permissions";
                $params[':permissions'] = json_encode($data['permissions']);
            }
            
            if (empty($updates)) {
                Response::badRequest('No valid fields to update');
                return;
            }
            
            $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = :user_id";
            $stmt = $this->conn->prepare($sql);
            
            if ($stmt->execute($params)) {
                Response::success(['id' => $userId], 'User updated successfully');
            } else {
                Response::error('Failed to update user');
            }
        } catch (PDOException $e) {
            Response::error('Database error: ' . $e->getMessage());
        }
    }
    
    public function deleteUser($userId) {
        try {
            $currentUserId = Auth::getUserId();
            if (!$currentUserId) {
                Response::unauthorized('Authentication required');
                return;
            }
            
            $currentUser = Auth::getCurrentUser($this->conn);
            if ($currentUser['role'] !== 'admin') {
                Response::forbidden('Only administrators can delete users');
                return;
            }
            
            if ($currentUserId === $userId) {
                Response::badRequest('You cannot delete your own account');
                return;
            }
            
            $sql = "DELETE FROM users WHERE id = :user_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':user_id', $userId);
            
            if ($stmt->execute()) {
                Response::success(null, 'User deleted successfully');
            } else {
                Response::error('Failed to delete user');
            }
        } catch (PDOException $e) {
            Response::error('Database error: ' . $e->getMessage());
        }
    }
    
    private function generateUUID() {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}
