<?php
/**
 * cPanel Directory Setup Script
 * Run this once after deployment to create required directories
 * Access: https://your-domain.com/License/setup_cpanel_directories.php
 */

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>cPanel Directory Setup - LicenseHub</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
        .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #28a745; }
        .error { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #dc3545; }
        .info { background: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #17a2b8; }
        .warning { background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #ffc107; }
        .step { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .step h3 { margin-top: 0; color: #4CAF50; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📁 LicenseHub - cPanel Directory Setup</h1>
        
        <?php
        $results = [];
        $allSuccess = true;
        
        // Define required directories
        $baseDir = __DIR__ . '/public/uploads/';
        $directories = [
            'clients' => $baseDir . 'clients/',
            'vendors' => $baseDir . 'vendors/',
            'company' => $baseDir . 'company/'
        ];
        
        echo '<div class="step">';
        echo '<h3>Step 1: Creating Upload Directories</h3>';
        
        // Create base uploads directory first
        if (!is_dir($baseDir)) {
            if (mkdir($baseDir, 0755, true)) {
                echo '<div class="success">✓ Created base uploads directory: <code>' . $baseDir . '</code></div>';
            } else {
                echo '<div class="error">✗ Failed to create base uploads directory: <code>' . $baseDir . '</code></div>';
                echo '<div class="warning">Please create this directory manually via cPanel File Manager and set permissions to 755</div>';
                $allSuccess = false;
            }
        } else {
            echo '<div class="info">ℹ Base uploads directory already exists: <code>' . $baseDir . '</code></div>';
        }
        
        // Create subdirectories
        foreach ($directories as $name => $path) {
            if (!is_dir($path)) {
                if (mkdir($path, 0755, true)) {
                    $results[$name] = [
                        'created' => true,
                        'path' => $path,
                        'permissions' => substr(sprintf('%o', fileperms($path)), -4)
                    ];
                    echo '<div class="success">✓ Created <strong>' . $name . '</strong> directory: <code>' . $path . '</code></div>';
                } else {
                    $results[$name] = ['created' => false, 'path' => $path];
                    echo '<div class="error">✗ Failed to create <strong>' . $name . '</strong> directory: <code>' . $path . '</code></div>';
                    $allSuccess = false;
                }
            } else {
                $results[$name] = [
                    'created' => true,
                    'exists' => true,
                    'path' => $path,
                    'permissions' => substr(sprintf('%o', fileperms($path)), -4)
                ];
                echo '<div class="info">ℹ <strong>' . ucfirst($name) . '</strong> directory already exists</div>';
            }
        }
        
        echo '</div>';
        
        // Test write permissions
        echo '<div class="step">';
        echo '<h3>Step 2: Testing Write Permissions</h3>';
        
        foreach ($directories as $name => $path) {
            if (is_dir($path)) {
                $testFile = $path . 'test_write_' . time() . '.txt';
                if (file_put_contents($testFile, 'Permission test') !== false) {
                    unlink($testFile);
                    echo '<div class="success">✓ <strong>' . ucfirst($name) . '</strong> directory is writable</div>';
                } else {
                    echo '<div class="error">✗ <strong>' . ucfirst($name) . '</strong> directory is NOT writable</div>';
                    echo '<div class="warning">Fix: In cPanel File Manager, right-click the directory → Change Permissions → Set to 755</div>';
                    $allSuccess = false;
                }
            }
        }
        
        echo '</div>';
        
        // Check PHP configuration
        echo '<div class="step">';
        echo '<h3>Step 3: Checking PHP Upload Configuration</h3>';
        
        $uploadMaxSize = ini_get('upload_max_filesize');
        $postMaxSize = ini_get('post_max_size');
        $fileUploads = ini_get('file_uploads');
        $maxFileUploads = ini_get('max_file_uploads');
        
        echo '<table style="width: 100%; border-collapse: collapse;">';
        echo '<tr style="background: #f8f9fa;"><th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Setting</th><th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Current Value</th><th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Recommended</th><th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Status</th></tr>';
        
        $phpSettings = [
            ['file_uploads', $fileUploads ? 'On' : 'Off', 'On', $fileUploads],
            ['upload_max_filesize', $uploadMaxSize, '≥10M', true],
            ['post_max_size', $postMaxSize, '≥12M', true],
            ['max_file_uploads', $maxFileUploads, '≥20', $maxFileUploads >= 20]
        ];
        
        foreach ($phpSettings as $setting) {
            $statusIcon = $setting[3] ? '✓' : '✗';
            $statusColor = $setting[3] ? '#28a745' : '#dc3545';
            echo '<tr>';
            echo '<td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><code>' . $setting[0] . '</code></td>';
            echo '<td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>' . $setting[1] . '</strong></td>';
            echo '<td style="padding: 10px; border-bottom: 1px solid #dee2e6;">' . $setting[2] . '</td>';
            echo '<td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: ' . $statusColor . ';"><strong>' . $statusIcon . '</strong></td>';
            echo '</tr>';
        }
        echo '</table>';
        
        if (!$fileUploads || $maxFileUploads < 20) {
            echo '<div class="warning" style="margin-top: 15px;">⚠ Some PHP settings need adjustment. Go to cPanel → Select PHP Version → Options to update these values.</div>';
            $allSuccess = false;
        }
        
        echo '</div>';
        
        // Final status
        echo '<div class="step">';
        if ($allSuccess) {
            echo '<div class="success" style="font-size: 18px; text-align: center;">';
            echo '<strong>🎉 All Checks Passed!</strong><br>';
            echo 'Your server is ready for file uploads. You can now add clients and vendors with documents.';
            echo '</div>';
            echo '<div class="info" style="margin-top: 15px;">For security, please delete this file after setup: <code>setup_cpanel_directories.php</code></div>';
        } else {
            echo '<div class="error" style="font-size: 18px; text-align: center;">';
            echo '<strong>⚠ Some Issues Found</strong><br>';
            echo 'Please review the errors above and fix them before proceeding.';
            echo '</div>';
            echo '<div class="warning" style="margin-top: 15px;">Need help? Check the <code>CPANEL_UPLOAD_FIX.md</code> file for detailed troubleshooting steps.</div>';
        }
        echo '</div>';
        
        // Additional info
        echo '<div class="footer">';
        echo '<strong>Quick Fixes:</strong><br>';
        echo '1. <strong>Directory Permissions:</strong> cPanel File Manager → Right-click folder → Change Permissions → 755<br>';
        echo '2. <strong>PHP Settings:</strong> cPanel → Select PHP Version → Options → Update values<br>';
        echo '3. <strong>Error Logs:</strong> cPanel → Metrics → Errors → Check recent errors<br>';
        echo '4. <strong>Diagnostic Tool:</strong> <a href="api/check_upload_config.php">api/check_upload_config.php</a>';
        echo '</div>';
        ?>
    </div>
</body>
</html>
