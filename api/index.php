<?php
/**
 * Main API Entry Point
 */

// Load error handler FIRST to ensure all errors return JSON
require_once __DIR__ . '/error_handler.php';

// Include constants
require_once __DIR__ . '/config/constants.php';

require_once __DIR__ . '/middleware/CORS.php';
require_once __DIR__ . '/utils/Response.php';

// Determine environment for error messages
$isDevelopment = getenv('APP_ENV') === 'development';

// Set CORS headers
CORS::handle();

// Get request method and URI
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/');

// Remove base path if present - handle both direct access and nested paths
if (strpos($uri, '/License/api/index.php') === 0) {
    $uri = substr($uri, strlen('/License/api/index.php'));
} elseif (strpos($uri, '/License/api') === 0) {
    $uri = substr($uri, strlen('/License/api'));
} elseif (strpos($uri, '/lms/api/index.php') === 0) {
    $uri = substr($uri, strlen('/lms/api/index.php'));
} elseif (strpos($uri, '/lms/api') === 0) {
    $uri = substr($uri, strlen('/lms/api'));
} elseif (strpos($uri, '/api/index.php') === 0) {
    $uri = substr($uri, strlen('/api/index.php'));
} elseif (strpos($uri, '/api') === 0) {
    $uri = substr($uri, strlen('/api'));
}

// Parse URI segments
$segments = array_filter(explode('/', $uri));
$segments = array_values($segments);

// Health check endpoint - when no segments or accessing index.php directly
if ((empty($segments) || (count($segments) == 1 && $segments[0] == 'index.php')) && $method === 'GET') {
    Response::success(['status' => 'OK', 'timestamp' => date('c')], 'API is running');
}

// Route requests
try {
    if (count($segments) === 0) {
        Response::notFound('Endpoint not found');
    }
    
    $resource = $segments[0];
    $id = isset($segments[1]) ? $segments[1] : null;
    $action = isset($segments[2]) ? $segments[2] : null;
    
    switch ($resource) {
        case 'auth':
            require_once __DIR__ . '/controllers/AuthController.php';
            $controller = new AuthController();
            
            switch ($id) {
                case 'login':
                    $controller->login();
                    break;
                case 'register':
                    $controller->register();
                    break;
                case 'me':
                    $controller->me();
                    break;
                case 'status':
                    $controller->status();
                    break;
                case 'change-password':
                    $controller->changePassword();
                    break;
                default:
                    Response::notFound('Auth endpoint not found');
            }
            break;
            
        case 'licenses':
            require_once __DIR__ . '/controllers/LicenseController.php';
            $controller = new LicenseController();
            
            if ($method === 'GET' && $id === 'next-invoice') {
                $controller->getNextInvoiceNumber();
            } elseif ($method === 'GET' && $id === 'import-template') {
                $controller->downloadTemplate();
            } elseif ($method === 'POST' && $id === 'import') {
                $controller->importCSV();
            } elseif ($method === 'GET' && !$id) {
                $controller->index();
            } elseif ($method === 'GET' && $id) {
                $controller->show($id);
            } elseif ($method === 'POST') {
                $controller->store();
            } elseif ($method === 'PUT' && $id) {
                $controller->update($id);
            } elseif ($method === 'DELETE' && $id) {
                $controller->destroy($id);
            } else {
                Response::notFound('License endpoint not found');
            }
            break;
            
        case 'clients':
            require_once __DIR__ . '/controllers/ClientController.php';
            $controller = new ClientController();
            
            if ($method === 'GET' && $id === 'import-template') {
                $controller->downloadTemplate();
            } elseif ($method === 'POST' && $id === 'import') {
                $controller->importCSV();
            } elseif ($method === 'GET' && !$id) {
                $controller->index();
            } elseif ($method === 'GET' && $id) {
                $controller->show($id);
            } elseif ($method === 'POST') {
                $controller->store();
            } elseif ($method === 'PUT' && $id) {
                $controller->update($id);
            } elseif ($method === 'DELETE' && $id) {
                $controller->destroy($id);
            } else {
                Response::notFound('Client endpoint not found');
            }
            break;
            
        case 'vendors':
            require_once __DIR__ . '/controllers/VendorsController.php';
            $controller = new VendorsController();
            
            if ($method === 'GET' && $id === 'import-template') {
                $controller->downloadTemplate();
            } elseif ($method === 'POST' && $id === 'import') {
                $controller->importCSV();
            } elseif ($method === 'GET' && !$id) {
                $controller->index();
            } elseif ($method === 'GET' && $id) {
                $controller->show($id);
            } elseif ($method === 'POST') {
                $controller->store();
            } elseif ($method === 'PUT' && $id) {
                $controller->update($id);
            } elseif ($method === 'DELETE' && $id) {
                $controller->destroy($id);
            } else {
                Response::notFound('Vendor endpoint not found');
            }
            break;
            
        case 'currencies':
            require __DIR__ . '/currencies.php';
            exit;
            
        case 'notification-settings':
            require __DIR__ . '/notification_settings.php';
            exit;
            
        case 'notifications':
            if ($id === 'history') {
                require __DIR__ . '/notifications/history.php';
                exit;
            } elseif ($id === 'check-expiring-licenses') {
                require __DIR__ . '/notifications/check-expiring-licenses.php';
                exit;
            } elseif ($id === 'test-email') {
                require __DIR__ . '/notifications/test-email.php';
                exit;
            }
            Response::notFound('Notification endpoint not found');
            break;
            
        case 'sales':
            require_once __DIR__ . '/controllers/SalesController.php';
            $controller = new SalesController();
            
            if ($method === 'GET' && $id === 'next-invoice') {
                $controller->getNextInvoiceNumber();
            } elseif ($method === 'GET' && $id === 'import-template') {
                $controller->downloadTemplate();
            } elseif ($method === 'POST' && $id === 'import') {
                $controller->importCSV();
            } elseif ($method === 'GET' && !$id) {
                $controller->index();
            } elseif ($method === 'GET' && $id) {
                $controller->show($id);
            } elseif ($method === 'POST') {
                $controller->store();
            } elseif ($method === 'PUT' && $id) {
                $controller->update($id);
            } elseif ($method === 'DELETE' && $id) {
                $controller->destroy($id);
            } else {
                Response::notFound('Sales endpoint not found');
            }
            break;
            
        case 'login':
            require __DIR__ . '/login.php';
            exit;
            
        case 'validate-session':
            require __DIR__ . '/validate-session.php';
            exit;
            
        case 'test-smtp':
        case 'test_email':
            require __DIR__ . '/test-smtp.php';
            exit;
            
        case 'notificationmail':
            require __DIR__ . '/notificationmail.php';
            exit;
            
        case 'users':
            require_once __DIR__ . '/controllers/UserManagementController.php';
            $controller = new UserManagementController();
            
            if ($method === 'GET' && !$id) {
                $controller->getAllUsers();
            } elseif ($method === 'POST') {
                $controller->createUser();
            } elseif ($method === 'PUT' && $id) {
                $controller->updateUser($id);
            } elseif ($method === 'DELETE' && $id) {
                $controller->deleteUser($id);
            } else {
                Response::notFound('User endpoint not found');
            }
            break;
            
        case 'company-settings':
            require_once __DIR__ . '/controllers/CompanySettingsController.php';
            $controller = new CompanySettingsController();
            
            if ($id === 'upload-logo' && $method === 'POST') {
                $controller->uploadLogo();
            } elseif ($method === 'GET') {
                $controller->getSettings();
            } elseif ($method === 'POST' || $method === 'PUT') {
                $controller->updateSettings();
            } else {
                Response::notFound('Company settings endpoint not found');
            }
            break;
            
        default:
            // Try to find a matching standalone PHP file before returning 404
            $phpFile = __DIR__ . '/' . str_replace('-', '_', $resource) . '.php';
            if (file_exists($phpFile)) {
                require $phpFile;
                exit;
            }
            
            Response::notFound('Resource not found');
    }
} catch (Exception $e) {
    // Log the actual error for debugging
    error_log("API Error: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
    
    // Return generic error message in production, detailed in development  
    if ($isDevelopment) {
        Response::error('Internal server error: ' . $e->getMessage());
    } else {
        Response::error('Internal server error');
    }
}
?>