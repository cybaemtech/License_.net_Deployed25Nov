<?php
// Global error handler for API - ensures all errors are returned as JSON

// Load environment variables FIRST
require_once __DIR__ . '/load_env.php';

// Set headers for JSON response
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Determine environment AFTER loading .env
$isDevelopment = getenv('APP_ENV') === 'development';

// Never display errors as HTML
ini_set('display_errors', '0');
error_reporting(E_ALL);

// Custom error handler - only handle FATAL errors, log non-fatal ones
set_error_handler(function($errno, $errstr, $errfile, $errline) use ($isDevelopment) {
    // Only handle fatal errors (E_ERROR, E_USER_ERROR, E_RECOVERABLE_ERROR)
    // Let warnings and notices be logged but not terminate the request
    if (!in_array($errno, [E_ERROR, E_USER_ERROR, E_RECOVERABLE_ERROR])) {
        // Log non-fatal errors but don't stop execution
        error_log("PHP Error ($errno): $errstr in " . basename($errfile) . " on line $errline");
        return false; // Let PHP handle it normally
    }
    
    // Fatal error - return JSON and exit
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal Server Error',
        'message' => $isDevelopment ? $errstr : 'An error occurred while processing your request',
        'details' => $isDevelopment ? [
            'file' => basename($errfile),
            'line' => $errline,
            'code' => $errno
        ] : null
    ]);
    exit;
});

// Custom exception handler - sanitize production messages
set_exception_handler(function($exception) use ($isDevelopment) {
    // Log the full exception
    error_log("Uncaught exception: " . $exception->getMessage() . " in " . $exception->getFile() . ":" . $exception->getLine());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal Server Error',
        'message' => $isDevelopment ? $exception->getMessage() : 'An error occurred while processing your request',
        'details' => $isDevelopment ? [
            'file' => basename($exception->getFile()),
            'line' => $exception->getLine(),
            'code' => $exception->getCode()
        ] : null
    ]);
    exit;
});

// Catch fatal errors only
register_shutdown_function(function() use ($isDevelopment) {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        // Log the error
        error_log("Fatal error: " . $error['message'] . " in " . $error['file'] . ":" . $error['line']);
        
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Fatal Error',
            'message' => $isDevelopment ? $error['message'] : 'A critical error occurred',
            'details' => $isDevelopment ? [
                'file' => basename($error['file']),
                'line' => $error['line']
            ] : null
        ]);
        exit;
    }
});
?>
