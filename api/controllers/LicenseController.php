<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Auth.php';
require_once __DIR__ . '/../utils/PermissionHelper.php';
require_once __DIR__ . '/../utils/CSVImporter.php';

class LicenseController {
    private $conn;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    public function index() {
        try {
            $userId = Auth::getUserId();
            if (!$userId) {
                Response::unauthorized('Authentication required');
                return;
            }

            $currentUser = Auth::getCurrentUser($this->conn);
            if (!PermissionHelper::hasPermission($currentUser['permissions'], 'licenses', 'read')) {
                Response::forbidden('You do not have permission to view licenses');
                return;
            }

            $sql = "SELECT 
                lp.*,
                c.name as client_name,
                c.email as client_email,
                c.phone as client_phone
            FROM license_purchases lp
            LEFT JOIN clients c ON lp.client_id = c.id
            ORDER BY lp.created_at DESC";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $licenses = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::success($licenses, 'Licenses retrieved successfully');
        } catch (PDOException $e) {
            error_log("Get licenses error: " . $e->getMessage());
            Response::error('Failed to fetch licenses: ' . $e->getMessage());
        }
    }
    
    public function show($id) {
        try {
            $userId = Auth::getUserId();
            if (!$userId) {
                Response::unauthorized('Authentication required');
                return;
            }

            $currentUser = Auth::getCurrentUser($this->conn);
            if (!PermissionHelper::hasPermission($currentUser['permissions'], 'licenses', 'read')) {
                Response::forbidden('You do not have permission to view license details');
                return;
            }

            $sql = "SELECT 
                lp.*,
                c.name as client_name
            FROM license_purchases lp
            LEFT JOIN clients c ON lp.client_id = c.id
            WHERE lp.id = ? LIMIT 1";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$id]);
            $license = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$license) {
                Response::notFound('License not found');
            }
            
            Response::success($license, 'License retrieved successfully');
        } catch (PDOException $e) {
            error_log("Get license error: " . $e->getMessage());
            Response::error('Failed to fetch license: ' . $e->getMessage());
        }
    }
    
    public function store() {
        try {
            $userId = Auth::getUserId();
            if (!$userId) {
                Response::unauthorized('Authentication required');
                return;
            }

            $currentUser = Auth::getCurrentUser($this->conn);
            if (!PermissionHelper::hasPermission($currentUser['permissions'], 'licenses', 'add_purchase_license')) {
                Response::forbidden('You do not have permission to purchase licenses');
                return;
            }

            // Check if this is a multipart/form-data request (file upload)
            $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
            
            if (strpos($contentType, 'multipart/form-data') !== false) {
                // Handle form data (file upload)
                $input = $_POST;
                error_log("Received form data: " . print_r($input, true));
            } else {
                // Handle JSON data
                $rawInput = file_get_contents('php://input');
                error_log("Raw input for license creation: " . $rawInput);
                
                $input = json_decode($rawInput, true);
                
                if (json_last_error() !== JSON_ERROR_NONE) {
                    error_log("JSON decode error: " . json_last_error_msg());
                    Response::badRequest('Invalid JSON input: ' . json_last_error_msg());
                    return;
                }
            }
            
            if (!$input || !is_array($input)) {
                error_log("Input is empty or not an array");
                Response::badRequest('Invalid JSON input: data is empty or not an object');
                return;
            }
            
            $userStmt = $this->conn->query("SELECT id FROM users LIMIT 1");
            $user = $userStmt->fetch(PDO::FETCH_ASSOC);
            $userId = $user ? $user['id'] : null;
            
            $licenseId = $this->generateUUID();
            
            // Handle file upload if present
            $billPath = null;
            if (isset($_FILES['bill_file']) && $_FILES['bill_file']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = __DIR__ . '/../../public/uploads/bills/';
                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                $extension = pathinfo($_FILES['bill_file']['name'], PATHINFO_EXTENSION);
                $filename = 'bill_' . $licenseId . '_' . time() . '.' . $extension;
                $uploadPath = $uploadDir . $filename;
                
                if (move_uploaded_file($_FILES['bill_file']['tmp_name'], $uploadPath)) {
                    $billPath = '/uploads/bills/' . $filename;
                    error_log("File uploaded successfully: " . $billPath);
                } else {
                    error_log("Failed to move uploaded file");
                }
            }
            
            $sql = "INSERT INTO license_purchases (
                id, client_id, user_id, tool_name, make, model, version, vendor,
                purchase_date, expiration_date, quantity, purchased_quantity, cost_per_user,
                total_cost, total_cost_inr, invoice_no, serial_no,
                currency_code, original_amount, bill_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            // Convert empty strings to NULL for unique fields to avoid duplicate key errors
            // Trim first, then check if empty to properly handle whitespace-only values
            $serialNoRaw = isset($input['serial_no']) ? trim($input['serial_no']) : '';
            $serialNo = ($serialNoRaw === '' || $serialNoRaw === null) ? null : $serialNoRaw;
            
            $invoiceNoRaw = isset($input['invoice_no']) ? trim($input['invoice_no']) : '';
            $invoiceNo = ($invoiceNoRaw === '' || $invoiceNoRaw === null) ? null : $invoiceNoRaw;
            
            // Get the quantity value - purchased_quantity will be set to this initial value
            $quantity = $input['quantity'] ?? 1;
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                $licenseId,
                $input['client_id'] ?? null,
                $userId,
                $input['tool_name'] ?? '',
                $input['make'] ?? '',
                $input['model'] ?? '',
                $input['version'] ?? '',
                $input['vendor'] ?? '',
                $input['purchase_date'] ?? null,
                $input['expiration_date'] ?? null,
                $quantity,
                $quantity,
                $input['cost_per_user'] ?? 0,
                $input['total_cost'] ?? 0,
                $input['total_cost_inr'] ?? 0,
                $invoiceNo,
                $serialNo,
                $input['currency_code'] ?? 'INR',
                $input['original_amount'] ?? 0,
                $billPath
            ]);
            
            $stmt = $this->conn->prepare("SELECT * FROM license_purchases WHERE id = ?");
            $stmt->execute([$licenseId]);
            $license = $stmt->fetch(PDO::FETCH_ASSOC);
            
            Response::success($license, 'License created successfully', 201);
        } catch (PDOException $e) {
            error_log("Create license error: " . $e->getMessage());
            Response::error('Failed to create license: ' . $e->getMessage());
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
    
    public function update($id) {
        try {
            $userId = Auth::getUserId();
            if (!$userId) {
                Response::unauthorized('Authentication required');
                return;
            }

            $currentUser = Auth::getCurrentUser($this->conn);
            if (!PermissionHelper::hasPermission($currentUser['permissions'], 'licenses', 'update')) {
                Response::forbidden('You do not have permission to update licenses');
                return;
            }

            $rawInput = file_get_contents('php://input');
            error_log("Raw input for license update: " . $rawInput);
            
            $input = json_decode($rawInput, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log("JSON decode error: " . json_last_error_msg());
                Response::badRequest('Invalid JSON input: ' . json_last_error_msg());
                return;
            }
            
            if (!$input || !is_array($input)) {
                error_log("Input is empty or not an array");
                Response::badRequest('Invalid JSON input: data is empty or not an object');
                return;
            }
            
            $sql = "UPDATE license_purchases SET 
                client_id = ?,
                tool_name = ?,
                make = ?,
                model = ?,
                version = ?,
                vendor = ?,
                purchase_date = ?,
                expiration_date = ?,
                cost_per_user = ?,
                total_cost = ?,
                total_cost_inr = ?,
                invoice_no = ?,
                serial_no = ?,
                currency_code = ?,
                original_amount = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?";
            
            // Convert empty strings to NULL for unique fields to avoid duplicate key errors
            // Trim first, then check if empty to properly handle whitespace-only values
            $serialNoRaw = isset($input['serial_no']) ? trim($input['serial_no']) : '';
            $serialNo = ($serialNoRaw === '' || $serialNoRaw === null) ? null : $serialNoRaw;
            
            $invoiceNoRaw = isset($input['invoice_no']) ? trim($input['invoice_no']) : '';
            $invoiceNo = ($invoiceNoRaw === '' || $invoiceNoRaw === null) ? null : $invoiceNoRaw;
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                $input['client_id'] ?? null,
                $input['tool_name'] ?? '',
                $input['make'] ?? '',
                $input['model'] ?? '',
                $input['version'] ?? '',
                $input['vendor'] ?? '',
                $input['purchase_date'] ?? null,
                $input['expiration_date'] ?? null,
                $input['cost_per_user'] ?? 0,
                $input['total_cost'] ?? 0,
                $input['total_cost_inr'] ?? 0,
                $invoiceNo,
                $serialNo,
                $input['currency_code'] ?? 'INR',
                $input['original_amount'] ?? 0,
                $id
            ]);
            
            $stmt = $this->conn->prepare("SELECT * FROM license_purchases WHERE id = ?");
            $stmt->execute([$id]);
            $license = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$license) {
                Response::notFound('License not found');
            }
            
            Response::success($license, 'License updated successfully');
        } catch (PDOException $e) {
            error_log("Update license error: " . $e->getMessage());
            Response::error('Failed to update license: ' . $e->getMessage());
        }
    }
    
    public function destroy($id) {
        try {
            $userId = Auth::getUserId();
            if (!$userId) {
                Response::unauthorized('Authentication required');
                return;
            }

            $currentUser = Auth::getCurrentUser($this->conn);
            if (!PermissionHelper::hasPermission($currentUser['permissions'], 'licenses', 'delete')) {
                Response::forbidden('You do not have permission to delete licenses');
                return;
            }

            $sql = "DELETE FROM license_purchases WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() === 0) {
                Response::notFound('License not found');
            }
            
            Response::success(null, 'License deleted successfully');
        } catch (PDOException $e) {
            error_log("Delete license error: " . $e->getMessage());
            Response::error('Failed to delete license: ' . $e->getMessage());
        }
    }
    
    public function getNextInvoiceNumber() {
        try {
            $sql = "SELECT invoice_no FROM license_purchases 
                    WHERE invoice_no LIKE 'CYB%' 
                    AND LENGTH(invoice_no) = 7
                    AND SUBSTRING(invoice_no, 4) REGEXP '^[0-9]+$'
                    ORDER BY CAST(SUBSTRING(invoice_no, 4) AS UNSIGNED) DESC 
                    LIMIT 1";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $lastInvoice = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($lastInvoice && $lastInvoice['invoice_no']) {
                $lastNumber = intval(substr($lastInvoice['invoice_no'], 3));
                $nextNumber = $lastNumber + 1;
            } else {
                $nextNumber = 1;
            }
            
            $nextInvoiceNo = 'CYB' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
            
            Response::success(['invoice_no' => $nextInvoiceNo], 'Next invoice number generated successfully');
        } catch (PDOException $e) {
            error_log("Get next invoice number error: " . $e->getMessage());
            Response::error('Failed to generate invoice number: ' . $e->getMessage());
        }
    }
    
    public function importCSV() {
        try {
            $userId = Auth::getUserId();
            if (!$userId) {
                Response::unauthorized('Authentication required');
                return;
            }

            $currentUser = Auth::getCurrentUser($this->conn);
            if (!PermissionHelper::hasPermission($currentUser['permissions'], 'purchase_licenses', 'import_csv')) {
                Response::forbidden('You do not have permission to import purchase licenses');
                return;
            }

            if (!isset($_FILES['csv_file']) || $_FILES['csv_file']['error'] !== UPLOAD_ERR_OK) {
                Response::badRequest('CSV file is required');
                return;
            }

            $csvImporter = new CSVImporter();
            $rows = $csvImporter->parseCSV($_FILES['csv_file']['tmp_name']);
            
            if ($csvImporter->hasErrors()) {
                Response::badRequest(implode(', ', $csvImporter->getErrors()));
                return;
            }

            $imported = 0;
            $failed = 0;
            $errors = [];

            $this->conn->beginTransaction();

            foreach ($rows as $row) {
                try {
                    $lineNumber = $row['_line_number'];
                    
                    $tool_name = isset($row['tool_name']) ? trim($row['tool_name']) : null;
                    if (empty($tool_name)) {
                        $errors[] = "Line $lineNumber: Tool name is required";
                        $failed++;
                        continue;
                    }

                    $licenseId = $this->generateUUID();
                    
                    $make = isset($row['make']) && trim($row['make']) !== '' ? trim($row['make']) : null;
                    $model = isset($row['model']) && trim($row['model']) !== '' ? trim($row['model']) : null;
                    $version = isset($row['version']) && trim($row['version']) !== '' ? trim($row['version']) : null;
                    $vendor = isset($row['vendor']) && trim($row['vendor']) !== '' ? trim($row['vendor']) : null;
                    $cost_per_user = isset($row['cost_per_user']) ? $csvImporter->parseNumber($row['cost_per_user']) : null;
                    $quantity = isset($row['quantity']) ? intval($row['quantity']) : 1;
                    $purchased_quantity = isset($row['purchased_quantity']) ? intval($row['purchased_quantity']) : $quantity;
                    $total_cost = isset($row['total_cost']) ? $csvImporter->parseNumber($row['total_cost']) : null;
                    $purchase_date = isset($row['purchase_date']) ? $csvImporter->parseDate($row['purchase_date']) : null;
                    $expiration_date = isset($row['expiration_date']) ? $csvImporter->parseDate($row['expiration_date']) : null;
                    $invoice_no = isset($row['invoice_no']) && trim($row['invoice_no']) !== '' ? trim($row['invoice_no']) : null;
                    $serial_no = isset($row['serial_no']) && trim($row['serial_no']) !== '' ? trim($row['serial_no']) : null;
                    $currency_code = isset($row['currency_code']) && trim($row['currency_code']) !== '' ? strtoupper(trim($row['currency_code'])) : 'INR';
                    
                    $currency_id = null;
                    if ($currency_code) {
                        $currencyStmt = $this->conn->prepare("SELECT id FROM currencies WHERE code = ? LIMIT 1");
                        $currencyStmt->execute([$currency_code]);
                        $currency = $currencyStmt->fetch(PDO::FETCH_ASSOC);
                        if ($currency) {
                            $currency_id = $currency['id'];
                        }
                    }
                    
                    $client_id = null;
                    if (isset($row['client_name']) && trim($row['client_name']) !== '') {
                        $clientName = trim($row['client_name']);
                        $clientStmt = $this->conn->prepare("SELECT id FROM clients WHERE name = ? LIMIT 1");
                        $clientStmt->execute([$clientName]);
                        $client = $clientStmt->fetch(PDO::FETCH_ASSOC);
                        if ($client) {
                            $client_id = $client['id'];
                        } else {
                            $csvImporter->addWarning("Line $lineNumber: Client '$clientName' not found, license will be created without client association");
                        }
                    }
                    
                    $total_cost_inr = $total_cost;
                    if ($currency_code !== 'INR' && $total_cost) {
                        $exchangeStmt = $this->conn->prepare("SELECT exchange_rate_to_inr FROM currencies WHERE code = ? LIMIT 1");
                        $exchangeStmt->execute([$currency_code]);
                        $currencyData = $exchangeStmt->fetch(PDO::FETCH_ASSOC);
                        if ($currencyData) {
                            $total_cost_inr = $total_cost * floatval($currencyData['exchange_rate_to_inr']);
                        }
                    }

                    $sql = "INSERT INTO license_purchases (
                        id, user_id, client_id, tool_name, make, model, version, vendor,
                        cost_per_user, quantity, purchased_quantity, total_cost, total_cost_inr,
                        purchase_date, expiration_date, invoice_no, serial_no, currency_code, original_amount
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                    
                    $stmt = $this->conn->prepare($sql);
                    $stmt->execute([
                        $licenseId,
                        $userId,
                        $client_id,
                        $tool_name,
                        $make,
                        $model,
                        $version,
                        $vendor,
                        $cost_per_user,
                        $quantity,
                        $purchased_quantity,
                        $total_cost,
                        $total_cost_inr,
                        $purchase_date,
                        $expiration_date,
                        $invoice_no,
                        $serial_no,
                        $currency_code,
                        $total_cost
                    ]);
                    
                    $imported++;
                } catch (Exception $e) {
                    $errors[] = "Line $lineNumber: " . $e->getMessage();
                    $failed++;
                }
            }

            $this->conn->commit();

            $result = [
                'imported' => $imported,
                'failed' => $failed,
                'total' => count($rows),
                'errors' => $errors,
                'warnings' => $csvImporter->getWarnings()
            ];

            if ($failed > 0) {
                Response::success($result, "Import completed with errors: $imported imported, $failed failed", 200);
            } else {
                Response::success($result, "Successfully imported $imported licenses", 200);
            }
        } catch (Exception $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            error_log("Import CSV error: " . $e->getMessage());
            Response::error('Failed to import CSV: ' . $e->getMessage());
        }
    }
    
    public function downloadTemplate() {
        $columns = [
            'tool_name',
            'make',
            'model',
            'version',
            'vendor',
            'cost_per_user',
            'quantity',
            'purchased_quantity',
            'total_cost',
            'purchase_date',
            'expiration_date',
            'invoice_no',
            'serial_no',
            'currency_code',
            'client_name'
        ];
        
        $csvContent = CSVImporter::generateTemplate($columns);
        
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="license_import_template.csv"');
        header('Cache-Control: max-age=0');
        
        echo $csvContent;
        exit;
    }
}
