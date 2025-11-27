<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Auth.php';
require_once __DIR__ . '/../utils/CSVImporter.php';
require_once __DIR__ . '/../utils/PermissionHelper.php';

class SalesController {
    private $conn;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
        $this->ensureSalesTable();
    }
    
    private function ensureSalesTable() {
        // Database setup is now handled automatically by Database class
        // This method is kept for backward compatibility but does nothing
    }
    
    public function index() {
        try {
            $userId = Auth::getUserId();
            if (!$userId) {
                Response::unauthorized('Authentication required');
                return;
            }
            
            $sql = "SELECT s.*, c.name as client_name, c.email as client_email, c.phone as client_phone
                    FROM sales s
                    LEFT JOIN clients c ON s.client_id = c.id
                    WHERE s.user_id = :user_id
                    ORDER BY s.created_at DESC";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();
            $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::success($sales, 'Sales retrieved successfully');
        } catch (PDOException $e) {
            error_log("Get sales error: " . $e->getMessage());
            Response::error('Failed to fetch sales: ' . $e->getMessage());
        }
    }
    
    public function show($id) {
        try {
            $userId = Auth::getUserId();
            if (!$userId) {
                Response::unauthorized('Authentication required');
                return;
            }
            
            $sql = "SELECT s.*, c.name as client_name, c.email as client_email, c.phone as client_phone
                    FROM sales s
                    LEFT JOIN clients c ON s.client_id = c.id
                    WHERE s.id = :id AND s.user_id = :user_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();
            $sale = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($sale) {
                Response::success($sale, 'Sale retrieved successfully');
            } else {
                Response::notFound('Sale not found');
            }
        } catch (PDOException $e) {
            error_log("Get sale error: " . $e->getMessage());
            Response::error('Failed to fetch sale: ' . $e->getMessage());
        }
    }
    
    public function store() {
        try {
            $userId = Auth::getUserId();
            if (!$userId) {
                Response::unauthorized('Authentication required');
                return;
            }
            
            $data = json_decode(file_get_contents("php://input"), true);
            
            error_log("Sale creation request data: " . json_encode($data));
            
            // Validate required fields
            if (!isset($data['purchase_id']) || !isset($data['selling_amount']) || !isset($data['quantity'])) {
                Response::error('Missing required fields: purchase_id, selling_amount, quantity');
                return;
            }
            
            // client_id is NOT NULL in database, so we need to ensure it's provided
            if (empty($data['client_id'])) {
                Response::error('Client is required for sale');
                return;
            }
            
            $this->conn->beginTransaction();
            
            $checkPurchaseSql = "SELECT * FROM license_purchases WHERE id = :purchase_id AND user_id = :user_id";
            $checkStmt = $this->conn->prepare($checkPurchaseSql);
            $checkStmt->bindParam(':purchase_id', $data['purchase_id']);
            $checkStmt->bindParam(':user_id', $userId);
            $checkStmt->execute();
            $purchase = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$purchase) {
                $this->conn->rollBack();
                Response::error('Purchase not found');
                return;
            }
            
            if ($purchase['quantity'] < $data['quantity']) {
                $this->conn->rollBack();
                Response::error('Insufficient quantity in stock. Available: ' . $purchase['quantity']);
                return;
            }
            
            $saleId = $this->generateUUID();
            $sql = "INSERT INTO sales (
                        id, user_id, client_id, purchase_id, tool_name, vendor, invoice_no,
                        quantity, purchase_amount, purchase_gst, total_purchase_cost,
                        selling_amount, selling_gst, total_selling_price, net_gst_paid,
                        margin, sale_date, expiry_date, created_at, updated_at
                    ) VALUES (
                        :id, :user_id, :client_id, :purchase_id, :tool_name, :vendor, :invoice_no,
                        :quantity, :purchase_amount, :purchase_gst, :total_purchase_cost,
                        :selling_amount, :selling_gst, :total_selling_price, :net_gst_paid,
                        :margin, :sale_date, :expiry_date, NOW(), NOW()
                    )";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':id', $saleId);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':client_id', $data['client_id']);
            $stmt->bindParam(':purchase_id', $data['purchase_id']);
            
            // Set defaults from purchase if not provided
            $toolName = $data['tool_name'] ?? $purchase['tool_name'];
            $vendor = $data['vendor'] ?? $purchase['vendor'] ?? '';
            $stmt->bindParam(':tool_name', $toolName);
            $stmt->bindParam(':vendor', $vendor);
            
            $invoiceNo = $data['invoice_no'] ?? null;
            $stmt->bindParam(':invoice_no', $invoiceNo);
            $stmt->bindParam(':quantity', $data['quantity']);
            
            // Set defaults for financial fields
            $purchaseAmount = $data['purchase_amount'] ?? 0;
            $purchaseGst = $data['purchase_gst'] ?? 0;
            $totalPurchaseCost = $data['total_purchase_cost'] ?? 0;
            $sellingGst = $data['selling_gst'] ?? 0;
            $totalSellingPrice = $data['total_selling_price'] ?? 0;
            $netGstPaid = $data['net_gst_paid'] ?? 0;
            $margin = $data['margin'] ?? 0;
            
            $stmt->bindParam(':purchase_amount', $purchaseAmount);
            $stmt->bindParam(':purchase_gst', $purchaseGst);
            $stmt->bindParam(':total_purchase_cost', $totalPurchaseCost);
            $stmt->bindParam(':selling_amount', $data['selling_amount']);
            $stmt->bindParam(':selling_gst', $sellingGst);
            $stmt->bindParam(':total_selling_price', $totalSellingPrice);
            $stmt->bindParam(':net_gst_paid', $netGstPaid);
            $stmt->bindParam(':margin', $margin);
            
            $saleDate = $data['sale_date'] ?? date('Y-m-d');
            $stmt->bindParam(':sale_date', $saleDate);
            
            // Default expiry_date to purchase's expiration_date if not provided
            $expiryDate = $data['expiry_date'] ?? $purchase['expiration_date'] ?? null;
            $stmt->bindParam(':expiry_date', $expiryDate);
            
            error_log("Executing sale insert with data: ID=$saleId, Client={$data['client_id']}, Purchase={$data['purchase_id']}");
            $stmt->execute();
            
            $newQuantity = $purchase['quantity'] - $data['quantity'];
            $updatePurchaseSql = "UPDATE license_purchases SET quantity = :quantity, updated_at = NOW() WHERE id = :id";
            $updateStmt = $this->conn->prepare($updatePurchaseSql);
            $updateStmt->bindParam(':quantity', $newQuantity);
            $updateStmt->bindParam(':id', $data['purchase_id']);
            $updateStmt->execute();
            
            $this->conn->commit();
            
            Response::success(['id' => $saleId], 'Sale created successfully', 201);
        } catch (PDOException $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            error_log("Create sale error: " . $e->getMessage());
            Response::error('Failed to create sale: ' . $e->getMessage());
        }
    }
    
    public function update($id) {
        try {
            $userId = Auth::getUserId();
            if (!$userId) {
                Response::unauthorized('Authentication required');
                return;
            }
            
            $data = json_decode(file_get_contents("php://input"), true);
            
            $checkSql = "SELECT * FROM sales WHERE id = :id AND user_id = :user_id";
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->bindParam(':id', $id);
            $checkStmt->bindParam(':user_id', $userId);
            $checkStmt->execute();
            $sale = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$sale) {
                Response::notFound('Sale not found');
                return;
            }
            
            $fields = [];
            $params = [':id' => $id, ':user_id' => $userId];
            
            $allowedFields = ['client_id', 'invoice_no', 'selling_amount', 'selling_gst', 
                            'total_selling_price', 'net_gst_paid', 'margin', 'sale_date'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = :$field";
                    $params[":$field"] = $data[$field];
                }
            }
            
            if (empty($fields)) {
                Response::error('No fields to update');
                return;
            }
            
            $fields[] = "updated_at = NOW()";
            
            $sql = "UPDATE sales SET " . implode(', ', $fields) . " WHERE id = :id AND user_id = :user_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);
            
            Response::success(null, 'Sale updated successfully');
        } catch (PDOException $e) {
            error_log("Update sale error: " . $e->getMessage());
            Response::error('Failed to update sale: ' . $e->getMessage());
        }
    }
    
    public function destroy($id) {
        try {
            $userId = Auth::getUserId();
            if (!$userId) {
                Response::unauthorized('Authentication required');
                return;
            }
            
            $this->conn->beginTransaction();
            
            $getSaleSql = "SELECT * FROM sales WHERE id = :id AND user_id = :user_id";
            $getStmt = $this->conn->prepare($getSaleSql);
            $getStmt->bindParam(':id', $id);
            $getStmt->bindParam(':user_id', $userId);
            $getStmt->execute();
            $sale = $getStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$sale) {
                $this->conn->rollBack();
                Response::notFound('Sale not found');
                return;
            }
            
            $updatePurchaseSql = "UPDATE licenses SET quantity = quantity + :quantity, updated_at = NOW() WHERE id = :purchase_id";
            $updateStmt = $this->conn->prepare($updatePurchaseSql);
            $updateStmt->bindParam(':quantity', $sale['quantity']);
            $updateStmt->bindParam(':purchase_id', $sale['purchase_id']);
            $updateStmt->execute();
            
            $sql = "DELETE FROM sales WHERE id = :id AND user_id = :user_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();
            
            $this->conn->commit();
            
            Response::success(null, 'Sale deleted successfully');
        } catch (PDOException $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            error_log("Delete sale error: " . $e->getMessage());
            Response::error('Failed to delete sale: ' . $e->getMessage());
        }
    }
    
    public function getNextInvoiceNumber() {
        try {
            $userId = Auth::getUserId();
            if (!$userId) {
                Response::unauthorized('Authentication required');
                return;
            }
            
            $sql = "SELECT invoice_no FROM sales 
                    WHERE user_id = :user_id 
                    AND invoice_no LIKE 'CYB%' 
                    AND LENGTH(invoice_no) = 7
                    AND SUBSTRING(invoice_no, 4) REGEXP '^[0-9]+$'
                    ORDER BY CAST(SUBSTRING(invoice_no, 4) AS UNSIGNED) DESC 
                    LIMIT 1";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':user_id', $userId);
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
            if (!PermissionHelper::hasPermission($currentUser['permissions'], 'selling_licenses', 'import_csv')) {
                Response::forbidden('You do not have permission to import selling licenses');
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
                    
                    // Validate required fields
                    $tool_name = isset($row['tool_name']) ? trim($row['tool_name']) : null;
                    if (empty($tool_name)) {
                        $errors[] = "Line $lineNumber: Tool name is required";
                        $failed++;
                        continue;
                    }

                    $saleId = $this->generateUUID();
                    
                    // Extract fields from CSV
                    $vendor = isset($row['vendor']) && trim($row['vendor']) !== '' ? trim($row['vendor']) : null;
                    $quantity = isset($row['quantity']) ? intval($row['quantity']) : 1;
                    $selling_amount = isset($row['selling_amount']) ? $csvImporter->parseNumber($row['selling_amount']) : null;
                    $selling_gst = isset($row['selling_gst']) ? $csvImporter->parseNumber($row['selling_gst']) : 0;
                    $total_selling_price = isset($row['total_selling_price']) ? $csvImporter->parseNumber($row['total_selling_price']) : null;
                    $margin = isset($row['margin']) ? $csvImporter->parseNumber($row['margin']) : 0;
                    $sale_date = isset($row['sale_date']) ? $csvImporter->parseDate($row['sale_date']) : date('Y-m-d');
                    $expiry_date = isset($row['expiry_date']) ? $csvImporter->parseDate($row['expiry_date']) : null;
                    $invoice_no = isset($row['invoice_no']) && trim($row['invoice_no']) !== '' ? trim($row['invoice_no']) : null;
                    
                    // Lookup client by name
                    $client_id = null;
                    if (isset($row['client_name']) && trim($row['client_name']) !== '') {
                        $clientName = trim($row['client_name']);
                        $clientStmt = $this->conn->prepare("SELECT id FROM clients WHERE name = ? LIMIT 1");
                        $clientStmt->execute([$clientName]);
                        $client = $clientStmt->fetch(PDO::FETCH_ASSOC);
                        if ($client) {
                            $client_id = $client['id'];
                        } else {
                            $errors[] = "Line $lineNumber: Client '$clientName' not found";
                            $failed++;
                            continue;
                        }
                    } else {
                        $errors[] = "Line $lineNumber: Client name is required";
                        $failed++;
                        continue;
                    }
                    
                    // Lookup or find a purchase matching this tool (if purchase_id not in CSV)
                    $purchase_id = null;
                    if (isset($row['purchase_id']) && trim($row['purchase_id']) !== '') {
                        $purchase_id = trim($row['purchase_id']);
                        // Verify purchase exists
                        $purchaseStmt = $this->conn->prepare("SELECT id FROM license_purchases WHERE id = ? LIMIT 1");
                        $purchaseStmt->execute([$purchase_id]);
                        if (!$purchaseStmt->fetch(PDO::FETCH_ASSOC)) {
                            $errors[] = "Line $lineNumber: Purchase ID not found";
                            $failed++;
                            continue;
                        }
                    } else {
                        // Try to find purchase by tool_name
                        $purchaseStmt = $this->conn->prepare("SELECT id FROM license_purchases WHERE tool_name = ? AND user_id = ? LIMIT 1");
                        $purchaseStmt->execute([$tool_name, $userId]);
                        $purchase = $purchaseStmt->fetch(PDO::FETCH_ASSOC);
                        if ($purchase) {
                            $purchase_id = $purchase['id'];
                        } else {
                            $errors[] = "Line $lineNumber: No purchase found for '$tool_name'. Please include purchase_id or ensure the tool exists in purchases";
                            $failed++;
                            continue;
                        }
                    }

                    // Calculate purchase amounts (if not provided)
                    $purchase_amount = $selling_amount;
                    $purchase_gst = $selling_gst;
                    $total_purchase_cost = $total_selling_price;
                    if (isset($row['purchase_amount'])) {
                        $purchase_amount = $csvImporter->parseNumber($row['purchase_amount']);
                    }
                    if (isset($row['purchase_gst'])) {
                        $purchase_gst = $csvImporter->parseNumber($row['purchase_gst']);
                    }
                    if (isset($row['total_purchase_cost'])) {
                        $total_purchase_cost = $csvImporter->parseNumber($row['total_purchase_cost']);
                    }
                    
                    // Calculate net GST paid
                    $net_gst_paid = floatval($selling_gst) - floatval($purchase_gst);

                    // Insert into sales table
                    $sql = "INSERT INTO sales (
                        id, user_id, client_id, purchase_id, tool_name, vendor, invoice_no,
                        quantity, purchase_amount, purchase_gst, total_purchase_cost,
                        selling_amount, selling_gst, total_selling_price, net_gst_paid,
                        margin, sale_date, expiry_date, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
                    
                    $stmt = $this->conn->prepare($sql);
                    $stmt->execute([
                        $saleId,
                        $userId,
                        $client_id,
                        $purchase_id,
                        $tool_name,
                        $vendor,
                        $invoice_no,
                        $quantity,
                        $purchase_amount,
                        $purchase_gst,
                        $total_purchase_cost,
                        $selling_amount,
                        $selling_gst,
                        $total_selling_price,
                        $net_gst_paid,
                        $margin,
                        $sale_date,
                        $expiry_date
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
                Response::success($result, "Successfully imported $imported sales", 200);
            }
        } catch (Exception $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            error_log("Sales Import CSV error: " . $e->getMessage());
            Response::error('Failed to import CSV: ' . $e->getMessage());
        }
    }
    
    public function downloadTemplate() {
        $columns = [
            'tool_name',
            'vendor',
            'client_name',
            'quantity',
            'purchase_amount',
            'purchase_gst',
            'total_purchase_cost',
            'selling_amount',
            'selling_gst',
            'total_selling_price',
            'margin',
            'sale_date',
            'expiry_date',
            'invoice_no',
            'purchase_id'
        ];
        
        $csvContent = CSVImporter::generateTemplate($columns);
        
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="import_selling_licenses_template.csv"');
        header('Pragma: no-cache');
        header('Expires: 0');
        
        echo $csvContent;
        exit;
    }

    private function generateUUID() {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}
