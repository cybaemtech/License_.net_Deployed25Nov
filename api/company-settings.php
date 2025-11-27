<?php
require_once __DIR__ . '/error_handler.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/controllers/CompanySettingsController.php';

$controller = new CompanySettingsController();
$method = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];

$path = parse_url($requestUri, PHP_URL_PATH);

if (strpos($path, '/upload-logo') !== false) {
    if ($method === 'POST') {
        $controller->uploadLogo();
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
} else {
    switch ($method) {
        case 'GET':
            $controller->getSettings();
            break;
        
        case 'POST':
        case 'PUT':
            $controller->updateSettings();
            break;
        
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
}
