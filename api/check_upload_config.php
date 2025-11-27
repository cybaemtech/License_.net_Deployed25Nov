<?php
/**
 * cPanel Upload Configuration Diagnostic Tool
 * Check this file to diagnose upload issues on cPanel
 */

header('Content-Type: application/json');

// Enable error display temporarily for diagnosis
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$results = [
    'php_version' => phpversion(),
    'upload_settings' => [
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        'max_file_uploads' => ini_get('max_file_uploads'),
        'file_uploads' => ini_get('file_uploads') ? 'Enabled' : 'Disabled',
        'max_execution_time' => ini_get('max_execution_time'),
        'memory_limit' => ini_get('memory_limit')
    ],
    'directories' => [],
    'permissions_test' => [],
    'finfo_available' => extension_loaded('fileinfo'),
    'current_user' => get_current_user(),
    'temp_dir' => sys_get_temp_dir()
];

// Check upload directories
$uploadDirs = [
    'clients' => __DIR__ . '/../public/uploads/clients/',
    'vendors' => __DIR__ . '/../public/uploads/vendors/',
    'company' => __DIR__ . '/../public/uploads/company/'
];

foreach ($uploadDirs as $name => $path) {
    $exists = is_dir($path);
    $readable = $exists && is_readable($path);
    $writable = $exists && is_writable($path);
    
    $results['directories'][$name] = [
        'path' => $path,
        'exists' => $exists,
        'readable' => $readable,
        'writable' => $writable,
        'permissions' => $exists ? substr(sprintf('%o', fileperms($path)), -4) : 'N/A'
    ];
    
    // Try to create directory if it doesn't exist
    if (!$exists) {
        try {
            $created = mkdir($path, 0755, true);
            $results['permissions_test'][$name] = [
                'create_attempt' => $created,
                'message' => $created ? 'Successfully created directory' : 'Failed to create directory'
            ];
            
            if ($created) {
                $results['directories'][$name]['exists'] = true;
                $results['directories'][$name]['permissions'] = substr(sprintf('%o', fileperms($path)), -4);
            }
        } catch (Exception $e) {
            $results['permissions_test'][$name] = [
                'create_attempt' => false,
                'error' => $e->getMessage()
            ];
        }
    } else {
        // Try to write a test file
        $testFile = $path . 'test_write_' . time() . '.txt';
        try {
            $written = file_put_contents($testFile, 'test');
            if ($written !== false) {
                $results['permissions_test'][$name] = [
                    'write_test' => true,
                    'message' => 'Successfully wrote test file'
                ];
                unlink($testFile);
            } else {
                $results['permissions_test'][$name] = [
                    'write_test' => false,
                    'message' => 'Failed to write test file'
                ];
            }
        } catch (Exception $e) {
            $results['permissions_test'][$name] = [
                'write_test' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}

echo json_encode($results, JSON_PRETTY_PRINT);
?>
