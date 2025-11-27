<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/controllers/UserManagementController.php';

$controller = new UserManagementController();
$method = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];

$path = parse_url($requestUri, PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));
$userId = isset($pathParts[2]) ? $pathParts[2] : null;

switch ($method) {
    case 'GET':
        $controller->getAllUsers();
        break;
    
    case 'POST':
        $controller->createUser();
        break;
    
    case 'PUT':
        if ($userId) {
            $controller->updateUser($userId);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'User ID is required']);
        }
        break;
    
    case 'DELETE':
        if ($userId) {
            $controller->deleteUser($userId);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'User ID is required']);
        }
        break;
    
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
