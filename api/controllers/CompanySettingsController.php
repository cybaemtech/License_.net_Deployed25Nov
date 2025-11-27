<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Auth.php';

class CompanySettingsController {
    private $conn;
    private $cacheFile = '/tmp/company_settings_cache.json';
    private $cacheTimeout = 300;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    private function getCache() {
        if (file_exists($this->cacheFile)) {
            $cacheData = json_decode(file_get_contents($this->cacheFile), true);
            if ($cacheData && (time() - $cacheData['timestamp']) < $this->cacheTimeout) {
                return $cacheData['data'];
            }
        }
        return null;
    }
    
    private function setCache($data) {
        $cacheData = [
            'timestamp' => time(),
            'data' => $data
        ];
        file_put_contents($this->cacheFile, json_encode($cacheData));
    }
    
    private function clearCache() {
        if (file_exists($this->cacheFile)) {
            unlink($this->cacheFile);
        }
    }
    
    public function getSettings() {
        try {
            $cachedSettings = $this->getCache();
            if ($cachedSettings) {
                Response::success($cachedSettings, 'Company settings retrieved successfully (cached)');
                return;
            }
            
            $sql = "SELECT * FROM company_settings LIMIT 1";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $settings = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$settings) {
                $settings = [
                    'company_name' => 'LicenseHub Enterprise',
                    'company_email' => '',
                    'company_phone' => '',
                    'company_address' => '',
                    'company_logo_path' => '',
                    'company_website' => '',
                    'company_gst' => ''
                ];
            }
            
            $this->setCache($settings);
            Response::success($settings, 'Company settings retrieved successfully');
        } catch (PDOException $e) {
            Response::error('Failed to fetch company settings: ' . $e->getMessage());
        }
    }
    
    public function updateSettings() {
        try {
            $currentUserId = Auth::getUserId();
            if (!$currentUserId) {
                Response::unauthorized('Authentication required');
                return;
            }
            
            $currentUser = Auth::getCurrentUser($this->conn);
            if ($currentUser['role'] !== 'admin') {
                Response::forbidden('Only administrators can update company settings');
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            $checkSql = "SELECT id FROM company_settings LIMIT 1";
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->execute();
            $exists = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($exists) {
                $updates = [];
                $params = [':id' => $exists['id']];
                
                if (isset($data['company_name'])) {
                    $updates[] = "company_name = :company_name";
                    $params[':company_name'] = $data['company_name'];
                }
                if (isset($data['company_email'])) {
                    $updates[] = "company_email = :company_email";
                    $params[':company_email'] = $data['company_email'];
                }
                if (isset($data['company_phone'])) {
                    $updates[] = "company_phone = :company_phone";
                    $params[':company_phone'] = $data['company_phone'];
                }
                if (isset($data['company_address'])) {
                    $updates[] = "company_address = :company_address";
                    $params[':company_address'] = $data['company_address'];
                }
                if (isset($data['company_logo_path'])) {
                    $updates[] = "company_logo_path = :company_logo_path";
                    $params[':company_logo_path'] = $data['company_logo_path'];
                }
                if (isset($data['company_website'])) {
                    $updates[] = "company_website = :company_website";
                    $params[':company_website'] = $data['company_website'];
                }
                if (isset($data['company_gst'])) {
                    $updates[] = "company_gst = :company_gst";
                    $params[':company_gst'] = $data['company_gst'];
                }
                
                if (!empty($updates)) {
                    $sql = "UPDATE company_settings SET " . implode(', ', $updates) . ", updated_at = CURRENT_TIMESTAMP WHERE id = :id";
                    $stmt = $this->conn->prepare($sql);
                    $stmt->execute($params);
                }
            } else {
                $sql = "INSERT INTO company_settings (
                    company_name, company_email, company_phone, company_address, 
                    company_logo_path, company_website, company_gst
                ) VALUES (
                    :company_name, :company_email, :company_phone, :company_address,
                    :company_logo_path, :company_website, :company_gst
                )";
                
                $stmt = $this->conn->prepare($sql);
                $stmt->bindParam(':company_name', $data['company_name']);
                $stmt->bindParam(':company_email', $data['company_email']);
                $stmt->bindParam(':company_phone', $data['company_phone']);
                $stmt->bindParam(':company_address', $data['company_address']);
                $stmt->bindParam(':company_logo_path', $data['company_logo_path']);
                $stmt->bindParam(':company_website', $data['company_website']);
                $stmt->bindParam(':company_gst', $data['company_gst']);
                $stmt->execute();
            }
            
            $this->clearCache();
            Response::success($data, 'Company settings updated successfully');
        } catch (PDOException $e) {
            Response::error('Database error: ' . $e->getMessage());
        }
    }
    
    public function uploadLogo() {
        try {
            $currentUserId = Auth::getUserId();
            if (!$currentUserId) {
                Response::unauthorized('Authentication required');
                return;
            }
            
            $currentUser = Auth::getCurrentUser($this->conn);
            if ($currentUser['role'] !== 'admin') {
                Response::forbidden('Only administrators can upload company logo');
                return;
            }
            
            if (!isset($_FILES['logo'])) {
                Response::badRequest('No file uploaded');
                return;
            }
            
            $file = $_FILES['logo'];
            $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
            $maxSize = 50 * 1024 * 1024; // 50MB - Increased limit
            
            if (!in_array($file['type'], $allowedTypes)) {
                Response::badRequest('Invalid file type. Only JPEG, PNG, GIF, and SVG are allowed');
                return;
            }
            
            if ($file['size'] > $maxSize) {
                Response::badRequest('File size exceeds 50MB limit');
                return;
            }
            
            $uploadDir = __DIR__ . '/../../public/uploads/company/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = 'logo_' . time() . '.' . $extension;
            $uploadPath = $uploadDir . $filename;
            
            if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
                // Include base path for proper access in cPanel environment
                $basePath = getenv('BASE_PATH') ?: '/License/';
                $logoPath = $basePath . 'uploads/company/' . $filename;
                
                $sql = "UPDATE company_settings SET company_logo_path = :logo_path, updated_at = CURRENT_TIMESTAMP";
                $stmt = $this->conn->prepare($sql);
                $stmt->bindParam(':logo_path', $logoPath);
                $stmt->execute();
                
                $this->clearCache();
                Response::success(['logo_path' => $logoPath], 'Logo uploaded successfully');
            } else {
                Response::error('Failed to upload logo');
            }
        } catch (Exception $e) {
            Response::error('Upload error: ' . $e->getMessage());
        }
    }
}
