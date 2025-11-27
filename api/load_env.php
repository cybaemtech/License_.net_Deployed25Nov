<?php
/**
 * Simple .env file loader for PHP
 * Loads environment variables from .env file
 */

function loadEnv($filePath = __DIR__ . '/../.env') {
    // Try multiple possible .env locations
    $possiblePaths = [
        $filePath,
        __DIR__ . '/../.env',
        dirname(__DIR__) . '/.env',
        dirname(dirname(__DIR__)) . '/.env',
        $_SERVER['DOCUMENT_ROOT'] . '/.env',
    ];
    
    $envLoaded = false;
    foreach ($possiblePaths as $path) {
        if (file_exists($path)) {
            $filePath = $path;
            $envLoaded = true;
            break;
        }
    }
    
    if (!$envLoaded) {
        error_log('[ENV] .env file not found in any standard location');
        return false;
    }
    
    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments and empty lines
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }
        
        // Parse KEY=VALUE format
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            
            // Remove quotes if present
            $value = trim($value, '"\'');
            
            // Set as environment variable (override if exists)
            putenv("$key=$value");
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }
    }
    
    return true;
}

// Load environment variables
loadEnv();

// Load environment defaults (sets EMAIL_MODE, APP_URL if not already set)
$envDefaultsPath = __DIR__ . '/config/env_defaults.php';
if (file_exists($envDefaultsPath)) {
    require_once $envDefaultsPath;
}
?>
