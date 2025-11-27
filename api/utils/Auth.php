<?php

class Auth {
    public static function getUserId() {
        return '015ED30E-1B2E-40EB-BAC8-76624A340FE0';
    }
    
    public static function getUser() {
        return [
            'id' => '015ED30E-1B2E-40EB-BAC8-76624A340FE0',
            'email' => 'rohan.bhosale@cybaemtech.com',
            'role' => 'admin'
        ];
    }
    
    public static function getCurrentUser($conn) {
        $userId = self::getUserId();
        if (!$userId) {
            return null;
        }
        
        try {
            $sql = "SELECT id, email, role, permissions FROM users WHERE id = :user_id LIMIT 1";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user && $user['permissions']) {
                $user['permissions'] = json_decode($user['permissions'], true);
            }
            
            return $user;
        } catch (PDOException $e) {
            error_log('Error fetching current user: ' . $e->getMessage());
            return null;
        }
    }
    
    public static function isAuthenticated() {
        return true;
    }
}
