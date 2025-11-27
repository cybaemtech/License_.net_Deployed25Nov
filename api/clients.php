<?php
/**
 * Clients API Endpoint
 * Returns all clients with proper CORS headers
 */

require_once __DIR__ . '/error_handler.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Load environment variables
    require_once __DIR__ . '/load_env.php';
    
    // Database connection using environment variables (secure approach)
    $host = getenv('MYSQL_HOST') ?: '82.25.105.94';
    $dbname = getenv('MYSQL_DATABASE') ?: 'cybaemtechnet_LMS_Project';
    $username = getenv('MYSQL_USER') ?: 'cybaemtechnet_LMS_Project';
    $password = getenv('MYSQL_PASSWORD') ?: 'PrajwalAK12';

    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Check if this is a request for a specific client (GET /api/clients/{id})
        $clientId = null;
        if (preg_match('#/clients/([^/]+)$#', $_SERVER['REQUEST_URI'], $matches)) {
            $clientId = $matches[1];
        }
        
        if ($clientId) {
            // Handle GET request for specific client with licenses and stats
            
            // Fetch client data
            $stmt = $pdo->prepare("SELECT * FROM clients WHERE id = ? LIMIT 1");
            $stmt->execute([$clientId]);
            $client = $stmt->fetch();
            
            if (!$client) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Client not found'
                ]);
                exit;
            }
            
            // Build enhanced client data with additional fields
            $enhancedClient = $client;
            $enhancedClient['currency_name'] = 'Indian Rupee';
            $enhancedClient['currency_symbol'] = '₹';
            $enhancedClient['currency_code'] = 'INR';
            $enhancedClient['display_name'] = $client['name'];
            $enhancedClient['test_field'] = 'TEST';
            
            // Fetch client's licenses with currency info
            $stmt = $pdo->prepare("
                SELECT 
                    lp.*,
                    c.symbol as currency_symbol
                FROM license_purchases lp
                LEFT JOIN currencies c ON lp.currency_code = c.code
                WHERE lp.client_id = ?
                ORDER BY lp.created_at DESC
            ");
            $stmt->execute([$clientId]);
            $licensesRaw = $stmt->fetchAll();
            
            // Transform licenses and calculate stats
            $licenses = [];
            $activeLicenses = 0;
            $expiredLicenses = 0;
            $totalCostInr = 0;
            $now = new DateTime();
            
            foreach ($licensesRaw as $l) {
                $expirationDate = $l['expiration_date'] ? new DateTime($l['expiration_date']) : null;
                $isExpired = $expirationDate ? $expirationDate <= $now : false;
                
                // Calculate total cost in INR (simplified conversion)
                $originalTotal = floatval($l['total_cost'] ?? 0);
                $totalCostInrLicense = floatval($l['total_cost_inr'] ?? $originalTotal);
                
                // Get quantity, default to 1 if 0 or null
                $quantity = intval($l['quantity'] ?? 1);
                if ($quantity <= 0) {
                    $quantity = 1;
                }
                
                $license = [
                    'id' => $l['id'],
                    'tool_name' => $l['tool_name'] ?? 'N/A',
                    'tool_description' => $l['model'] ?? $l['version'] ?? null,
                    'tool_vendor' => $l['vendor'] ?? 'N/A',
                    'purchase_date' => $l['purchase_date'],
                    'expiry_date' => $l['expiration_date'],
                    'number_of_users' => $quantity,
                    'cost_per_user' => floatval($l['cost_per_user'] ?? 0),
                    'total_cost' => $originalTotal,
                    'total_cost_inr' => $totalCostInrLicense,
                    'currency_code' => $l['currency_code'] ?? 'INR',
                    'currency_symbol' => $l['currency_symbol'] ?? '₹',
                    'status' => $isExpired ? 'expired' : 'active'
                ];
                
                $licenses[] = $license;
                
                if ($isExpired) {
                    $expiredLicenses++;
                } else {
                    $activeLicenses++;
                }
                
                $totalCostInr += $totalCostInrLicense;
            }
            
            // Return client details with licenses and stats
            echo json_encode([
                'success' => true,
                'data' => [
                    'client' => $enhancedClient,
                    'licenses' => $licenses,
                    'stats' => [
                        'total_licenses' => count($licenses),
                        'active_licenses' => $activeLicenses,
                        'expired_licenses' => $expiredLicenses,
                        'total_cost' => $totalCostInr
                    ]
                ],
                'message' => 'Client retrieved successfully',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            exit;
        }
        
        // Handle GET request - fetch all clients
        
        // Check if clients table exists
        $stmt = $pdo->query("SHOW TABLES LIKE 'clients'");
        if ($stmt->rowCount() === 0) {
            throw new Exception('clients table does not exist');
        }

        // Fetch all clients with currency information
        $sql = "SELECT 
                    c.*,
                    cur.code as currency_code,
                    cur.name as currency_name,
                    cur.symbol as currency_symbol
                FROM clients c
                LEFT JOIN currencies cur ON c.currency_id = cur.id
                ORDER BY c.created_at DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $clients = $stmt->fetchAll();
        
        // Debug: Log first client to check currency fields
        if (count($clients) > 0) {
            error_log("First client keys: " . implode(", ", array_keys($clients[0])));
        }

        // Format the data for frontend consumption
        $formattedClients = [];
        foreach ($clients as $client) {
            $formatted = [
                'id' => $client['id'] ?? '',
                'user_id' => $client['user_id'] ?? '',
                'name' => $client['name'] ?? '',
                'phone' => $client['phone'] ?? '',
                'email' => $client['email'] ?? '',
                'created_at' => $client['created_at'] ?? null,
                'updated_at' => $client['updated_at'] ?? null
            ];
            
            // Add optional fields (include even if NULL so frontend can display properly)
            if (array_key_exists('contact_person', $client)) $formatted['contact_person'] = $client['contact_person'];
            if (array_key_exists('address', $client)) $formatted['address'] = $client['address'];
            if (array_key_exists('company_name', $client)) {
                $formatted['company_name'] = $client['company_name'];
                $formatted['company'] = $client['company_name']; // Alias for frontend compatibility
            }
            if (array_key_exists('gst_treatment', $client)) $formatted['gst_treatment'] = $client['gst_treatment'];
            if (array_key_exists('source_of_supply', $client)) {
                $formatted['source_of_supply'] = $client['source_of_supply'];
                $formatted['place_of_supply'] = $client['source_of_supply']; // Alias for frontend compatibility
            }
            if (array_key_exists('gst', $client)) $formatted['gst'] = $client['gst'];
            if (array_key_exists('pan', $client)) $formatted['pan'] = $client['pan'];
            if (array_key_exists('currency_id', $client)) $formatted['currency_id'] = $client['currency_id'];
            
            // Add currency information from JOIN or fetch separately
            $formatted['currency_code'] = $client['currency_code'] ?? null;
            $formatted['currency_name'] = $client['currency_name'] ?? null;
            $formatted['currency_symbol'] = $client['currency_symbol'] ?? null;
            
            // If currency data is missing from JOIN, fetch it separately
            if (!$formatted['currency_code'] && isset($client['currency_id']) && $client['currency_id']) {
                try {
                    $currStmt = $pdo->prepare("SELECT code, name, symbol FROM currencies WHERE id = ?");
                    $currStmt->execute([$client['currency_id']]);
                    $currencyData = $currStmt->fetch();
                    if ($currencyData) {
                        $formatted['currency_code'] = $currencyData['code'];
                        $formatted['currency_name'] = $currencyData['name'];
                        $formatted['currency_symbol'] = $currencyData['symbol'];
                    }
                } catch (Exception $e) {
                    // Silently fail if currency lookup fails
                    error_log("Currency lookup failed for ID " . $client['currency_id'] . ": " . $e->getMessage());
                }
            }
            
            if (array_key_exists('mode_of_payment', $client)) $formatted['mode_of_payment'] = $client['mode_of_payment'];
            if (array_key_exists('amount', $client)) $formatted['amount'] = $client['amount'];
            if (array_key_exists('quantity', $client)) $formatted['quantity'] = $client['quantity'];
            if (array_key_exists('status', $client)) $formatted['status'] = $client['status'];
            
            $formattedClients[] = $formatted;
        }

        // Return successful response
        echo json_encode([
            'success' => true,
            'data' => $formattedClients,
            'total_count' => count($formattedClients),
            'timestamp' => date('Y-m-d H:i:s'),
            'message' => 'Clients retrieved successfully'
        ]);

    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Handle POST request - create new client
        
        error_log("POST request received for client creation");
        
        // Check if this is a multipart/form-data request (file upload)
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        $isFormData = stripos($contentType, 'multipart/form-data') !== false;
        
        if ($isFormData) {
            // Handle FormData (file upload case)
            error_log("Processing FormData request with file upload");
            $input = $_POST;
            error_log("POST data: " . print_r($input, true));
            error_log("FILES data: " . print_r($_FILES, true));
        } else {
            // Handle JSON request (no file upload)
            $rawInput = file_get_contents('php://input');
            error_log("Raw input: " . $rawInput);
            
            $input = json_decode($rawInput, true);
            
            if (!$input) {
                error_log("Failed to decode JSON input");
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'error' => 'Invalid JSON input',
                    'raw_input' => $rawInput,
                    'json_error' => json_last_error_msg()
                ]);
                exit;
            }
        }

        error_log("Decoded input: " . print_r($input, true));

        // Validate required fields
        $name = trim($input['name'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $email = trim($input['email'] ?? '');

        error_log("Validated fields - Name: $name, Phone: $phone, Email: $email");

        if (empty($name)) {
            error_log("Name validation failed");
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Name is required']);
            exit;
        }

        if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            error_log("Email validation failed: $email");
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid email format']);
            exit;
        }

        // Check for duplicate email if provided
        if (!empty($email)) {
            try {
                $stmt = $pdo->prepare("SELECT id FROM clients WHERE email = :email");
                $stmt->execute([':email' => $email]);
                if ($stmt->rowCount() > 0) {
                    error_log("Duplicate email found: $email");
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'Email already exists']);
                    exit;
                }
            } catch (PDOException $e) {
                error_log("Email check failed: " . $e->getMessage());
                throw $e;
            }
        }

        // Get an existing user_id from the users table (foreign key constraint requirement)
        $stmt = $pdo->query("SELECT id FROM users LIMIT 1");
        $existingUser = $stmt->fetch();
        
        if (!$existingUser) {
            // If no users exist, we need to create one or use a default
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'No users found in database. Cannot create client without valid user_id.',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            exit;
        }
        
        $userId = $existingUser['id'];
        error_log("Using existing User ID: $userId");

        // Handle file upload if present
        $documentPath = null;
        if (isset($_FILES['document']) && $_FILES['document']['error'] === UPLOAD_ERR_OK) {
            // Validate file type - only allow safe document formats
            $allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'];
            $allowedMimeTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'image/jpeg',
                'image/png'
            ];
            
            $originalFilename = $_FILES['document']['name'];
            $fileExtension = strtolower(pathinfo($originalFilename, PATHINFO_EXTENSION));
            
            // Reject files with multiple extensions (e.g., file.php.jpg)
            $filenameParts = explode('.', $originalFilename);
            if (count($filenameParts) > 2) {
                error_log("File upload rejected: multiple extensions detected in $originalFilename");
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Files with multiple extensions are not allowed'
                ]);
                exit;
            }
            
            // Use finfo for more robust MIME detection
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $fileMimeType = finfo_file($finfo, $_FILES['document']['tmp_name']);
            finfo_close($finfo);
            
            if (!in_array($fileExtension, $allowedExtensions)) {
                error_log("File upload rejected: invalid extension $fileExtension");
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid file type. Allowed types: ' . implode(', ', $allowedExtensions)
                ]);
                exit;
            }
            
            if (!in_array($fileMimeType, $allowedMimeTypes)) {
                error_log("File upload rejected: invalid MIME type $fileMimeType");
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid file content type'
                ]);
                exit;
            }
            
            $uploadDir = __DIR__ . '/../public/uploads/clients/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            
            $fileName = 'client_doc_' . uniqid() . '_' . time() . '.' . $fileExtension;
            $uploadPath = $uploadDir . $fileName;
            
            if (move_uploaded_file($_FILES['document']['tmp_name'], $uploadPath)) {
                $documentPath = '/uploads/clients/' . $fileName;
                error_log("File uploaded successfully: $documentPath");
            } else {
                error_log("Failed to move uploaded file");
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to save uploaded file'
                ]);
                exit;
            }
        }

        // Get available columns from clients table
        $stmt = $pdo->query("SHOW COLUMNS FROM clients");
        $availableColumns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Build dynamic insert based on available columns and provided data
        $insertFields = ['user_id', 'name', 'phone', 'email'];
        $insertValues = [
            ':user_id' => $userId,
            ':name' => $name,
            ':phone' => $phone,
            ':email' => $email
        ];
        
        // Add document_path if file was uploaded
        if ($documentPath && in_array('document_path', $availableColumns)) {
            $insertFields[] = 'document_path';
            $insertValues[':document_path'] = $documentPath;
        }
        
        // Add optional fields if they exist in both the table and the input
        $optionalFields = [
            'address', 'company_name', 'gst_treatment', 'source_of_supply', 
            'gst', 'currency_id', 'status', 'contact_person'
        ];
        
        foreach ($optionalFields as $field) {
            if (in_array($field, $availableColumns) && isset($input[$field])) {
                $insertFields[] = $field;
                // Preserve non-empty values, convert only null/undefined to null
                $value = $input[$field];
                if ($value === null) {
                    $insertValues[":$field"] = null;
                } else {
                    // Trim string values, preserve empty strings as empty strings
                    $insertValues[":$field"] = is_string($value) ? trim($value) : $value;
                }
            }
        }
        
        // Build SQL
        $fieldsStr = implode(', ', $insertFields);
        $placeholders = ':' . implode(', :', $insertFields);
        $sql = "INSERT INTO clients ($fieldsStr, created_at, updated_at) 
                VALUES ($placeholders, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())";
        
        error_log("Dynamic INSERT SQL: $sql");
        error_log("Insert values: " . print_r($insertValues, true));
        
        try {
            $stmt = $pdo->prepare($sql);
            $result = $stmt->execute($insertValues);

            error_log("Insert result: " . ($result ? 'success' : 'failed'));
            error_log("Affected rows: " . $stmt->rowCount());

            if (!$result) {
                throw new Exception("Insert operation failed");
            }

            // Get the last inserted ID (database generated UUID)
            $clientId = $pdo->lastInsertId();
            
            // If lastInsertId doesn't work with UUIDs, find the latest client by user_id
            if (!$clientId) {
                $stmt = $pdo->prepare("SELECT id FROM clients WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 1");
                $stmt->execute([':user_id' => $userId]);
                $result = $stmt->fetch();
                $clientId = $result['id'] ?? null;
            }

            if (!$clientId) {
                throw new Exception("Could not retrieve generated client ID");
            }

            // Return the created client
            $stmt = $pdo->prepare("SELECT * FROM clients WHERE id = :id");
            $stmt->execute([':id' => $clientId]);
            $newClient = $stmt->fetch();

            error_log("Created client: " . print_r($newClient, true));

            echo json_encode([
                'success' => true,
                'data' => $newClient,
                'message' => 'Client created successfully',
                'timestamp' => date('Y-m-d H:i:s')
            ]);

        } catch (PDOException $e) {
            error_log("Database insert error: " . $e->getMessage());
            error_log("SQL: $sql");
            error_log("Parameters: " . print_r([
                ':user_id' => $userId,
                ':name' => $name,
                ':phone' => $phone,
                ':email' => $email
            ], true));
            throw $e;
        }

    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Handle PUT request - update client
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Get client ID from URL path or request body
        $clientId = null;
        if (preg_match('#/clients/([^/]+)$#', $_SERVER['REQUEST_URI'], $matches)) {
            $clientId = $matches[1];
        } elseif (isset($input['id'])) {
            $clientId = $input['id'];
        }
        
        if (!$clientId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Client ID is required']);
            exit;
        }
        $name = trim($input['name'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $email = trim($input['email'] ?? '');

        if (empty($name)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Name is required']);
            exit;
        }

        if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid email format']);
            exit;
        }

        // Get available columns from clients table
        $stmt = $pdo->query("SHOW COLUMNS FROM clients");
        $availableColumns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Build dynamic update based on available columns and provided data
        $updateFields = [];
        $updateValues = [':id' => $clientId];
        
        // Always update basic fields if provided
        if (!empty($name)) {
            $updateFields[] = 'name = :name';
            $updateValues[':name'] = $name;
        }
        if (isset($input['phone'])) {
            $updateFields[] = 'phone = :phone';
            $updateValues[':phone'] = $phone;
        }
        if (isset($input['email'])) {
            $updateFields[] = 'email = :email';
            $updateValues[':email'] = $email;
        }
        
        // Add optional fields if they exist in both the table and the input
        $optionalFields = [
            'address', 'company_name', 'gst_treatment', 'source_of_supply', 
            'gst', 'currency_id', 'status', 'contact_person'
        ];
        
        foreach ($optionalFields as $field) {
            if (in_array($field, $availableColumns) && isset($input[$field])) {
                $updateFields[] = "$field = :$field";
                // Preserve non-empty values, convert only null/undefined to null
                $value = $input[$field];
                if ($value === null) {
                    $updateValues[":$field"] = null;
                } else {
                    // Trim string values, preserve empty strings as empty strings
                    $updateValues[":$field"] = is_string($value) ? trim($value) : $value;
                }
            }
        }
        
        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No fields to update']);
            exit;
        }
        
        // Build SQL
        $updateFieldsStr = implode(', ', $updateFields);
        $sql = "UPDATE clients SET $updateFieldsStr, updated_at = CURRENT_TIMESTAMP() WHERE id = :id";
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute($updateValues);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Client not found']);
            exit;
        }

        // Return the updated client
        $stmt = $pdo->prepare("SELECT * FROM clients WHERE id = :id");
        $stmt->execute([':id' => $clientId]);
        $updatedClient = $stmt->fetch();

        echo json_encode([
            'success' => true,
            'data' => $updatedClient,
            'message' => 'Client updated successfully'
        ]);

    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        // Handle DELETE request - delete client
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Client ID is required']);
            exit;
        }

        $clientId = $input['id'];

        // Delete client
        $sql = "DELETE FROM clients WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([':id' => $clientId]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Client not found']);
            exit;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Client deleted successfully'
        ]);

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }

} catch (PDOException $e) {
    error_log("Clients API Database Error: " . $e->getMessage());
    error_log("Error Code: " . $e->getCode());
    error_log("Error Info: " . print_r($e->errorInfo ?? [], true));
    error_log("Request method: " . ($_SERVER['REQUEST_METHOD'] ?? 'unknown'));
    error_log("Host: $host, Database: $dbname, Username: $username");
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed',
        'message' => $e->getMessage(),
        'error_code' => $e->getCode(),
        'error_info' => $e->errorInfo ?? null,
        'debug_info' => [
            'host' => $host,
            'database' => $dbname,
            'username' => $username,
            'php_version' => phpversion(),
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
            'timestamp' => date('Y-m-d H:i:s'),
            'request_uri' => $_SERVER['REQUEST_URI'] ?? '',
            'content_type' => $_SERVER['CONTENT_TYPE'] ?? ''
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ]);
} catch (Exception $e) {
    error_log("Clients API Error: " . $e->getMessage());
    error_log("Request method: " . ($_SERVER['REQUEST_METHOD'] ?? 'unknown'));
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'message' => $e->getMessage(),
        'debug_info' => [
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
            'php_version' => phpversion(),
            'timestamp' => date('Y-m-d H:i:s'),
            'request_uri' => $_SERVER['REQUEST_URI'] ?? '',
            'content_type' => $_SERVER['CONTENT_TYPE'] ?? ''
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>