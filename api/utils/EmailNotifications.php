<?php
/**
 * Email Notification Helper Functions
 * License Management System - PHP Backend
 * Simple PHP mail() implementation
 */

/**
 * Get trusted base URL for email links
 * Uses APP_URL from .env (recommended) or falls back to HTTP_HOST
 * 
 * @return string Base URL without trailing slash
 */
function getTrustedBaseUrl() {
    // RECOMMENDED: Use APP_URL from .env (works in CLI and HTTP)
    $appUrl = getenv('APP_URL');
    if (!empty($appUrl)) {
        return rtrim($appUrl, '/'); // Remove trailing slash if present
    }
    
    // FALLBACK: For HTTP requests only, use SERVER_NAME/HTTP_HOST
    if (php_sapi_name() !== 'cli') {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['SERVER_NAME'] ?? $_SERVER['HTTP_HOST'] ?? 'localhost';
        
        // Sanitize hostname to prevent header injection
        $host = filter_var($host, FILTER_SANITIZE_URL);
        $host = preg_replace('/[^a-z0-9\-\.:]/i', '', $host); // Allow only safe characters
        
        return $protocol . '://' . $host;
    }
    
    // DEFAULT: Return a safe default (should not reach here if .env is configured)
    error_log("WARNING: Unable to determine base URL. Please set APP_URL in .env file.");
    return 'https://localhost';
}

/**
 * Send email notification using PHP mail()
 *
 * @param string $to Recipient email address
 * @param string $subject Email subject
 * @param string $message HTML email content
 * @param string $cc Optional CC email address
 * @return bool True if email was sent successfully, false otherwise
 */
function sendEmailNotification($to, $subject, $message, $cc = null) {
    $fromEmail = "noreply@cybaemtech.net";
    $fromName = "LicenseHub Enterprise";
    $replyTo = "accounts@cybaemtech.net";
    
    // Enhanced headers for better inbox delivery and spam avoidance
    $headers = "From: {$fromName} <{$fromEmail}>\r\n";
    $headers .= "Reply-To: {$replyTo}\r\n";
    $headers .= "Return-Path: {$fromEmail}\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: quoted-printable\r\n";
    $headers .= "X-Mailer: LicenseHub-System\r\n";
    $headers .= "X-Priority: 3\r\n";
    $headers .= "Importance: Normal\r\n";
    $headers .= "Message-ID: <" . time() . "." . uniqid() . "@cybaemtech.net>\r\n";
    $headers .= "Date: " . date('r') . "\r\n";
    $headers .= "List-Unsubscribe: <mailto:unsubscribe@cybaemtech.net>\r\n";
    
    if ($cc) {
        $headers .= "Cc: " . $cc . "\r\n";
    }
    
    $additionalParams = "-f{$fromEmail}";
    
    // Encode message in quoted-printable for better compatibility
    $encodedMessage = quoted_printable_encode($message);
    
    // Check if sendmail is available (production environment)
    $hasSendmail = isMailServerAvailable();
    
    if ($hasSendmail) {
        // Production: Use PHP mail() function
        $mailSent = @mail($to, $subject, $encodedMessage, $headers, $additionalParams);
       
        if (!$mailSent) {
            error_log("Failed to send email notification to: $to");
            return false;
        }
       
        error_log("Email notification sent successfully to: $to");
        return true;
    } else {
        // Development/Replit: Save email to file for testing
        return saveEmailToFile($to, $subject, $message, $cc, $headers);
    }
}

/**
 * Check if mail server is available
 */
function isMailServerAvailable() {
    // METHOD 1: Check for explicit environment variable (RECOMMENDED for production)
    // Set EMAIL_MODE=production in .env for cPanel production environment
    $emailMode = getenv('EMAIL_MODE');
    if ($emailMode === 'production') {
        return true; // Force production mail() usage (for cron jobs and HTTP)
    } elseif ($emailMode === 'development') {
        return false; // Force development file logging
    }
    
    // METHOD 2: Auto-detect based on sendmail binary presence
    // Check if we have a REAL sendmail binary (cPanel/production servers)
    // This works for both HTTP requests and CLI/cron jobs
    if (file_exists('/usr/sbin/sendmail') || file_exists('/usr/bin/sendmail')) {
        // Further check: Is this the dummy Nix sendmail that doesn't work?
        $sendmailPath = ini_get('sendmail_path');
        
        // Handle cases where sendmail_path is empty, false, or null (common in cPanel)
        if (empty($sendmailPath)) {
            // Empty sendmail_path but binary exists = production server
            return true;
        }
        
        // Check if it's NOT the Nix dummy sendmail
        if (is_string($sendmailPath) && strpos($sendmailPath, '/nix/store/') === false) {
            // Real sendmail found (not Nix dummy) 
            // This is a production server - use mail() function
            return true;
        }
    }
    
    // METHOD 3: Check if we're in development environment (localhost/Replit)
    // For HTTP requests, check hostname
    if (php_sapi_name() !== 'cli') {
        $host = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? '';
        $isDev = (
            empty($host) ||
            strpos($host, 'localhost') !== false ||
            strpos($host, '127.0.0.1') !== false ||
            strpos($host, 'replit') !== false ||
            strpos($host, '.repl.') !== false
        );
        
        // If development domain detected, use file logging
        if ($isDev) {
            return false;
        }
    }
    
    // DEFAULT: Use file logging for safety
    // If we reach here, we couldn't definitively determine the environment
    // Production servers should set EMAIL_MODE=production explicitly
    return false;
}

/**
 * Save email to file for development/testing
 */
function saveEmailToFile($to, $subject, $message, $cc, $headers) {
    $logDir = __DIR__ . '/../../logs/emails';
    
    // Create logs/emails directory if it doesn't exist
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    
    // Generate filename with timestamp
    $timestamp = date('Y-m-d_H-i-s');
    $filename = $logDir . '/email_' . $timestamp . '_' . uniqid() . '.html';
    
    // Create email preview HTML
    $emailPreview = "<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>Email Preview - {$subject}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .email-info { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .email-info h2 { margin-top: 0; color: #2563eb; }
        .email-info table { width: 100%; border-collapse: collapse; }
        .email-info td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        .email-info td:first-child { font-weight: bold; width: 120px; color: #64748b; }
        .email-content { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .dev-notice { background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .dev-notice h3 { margin-top: 0; color: #92400e; }
    </style>
</head>
<body>
    <div class='dev-notice'>
        <h3>📧 Development Mode - Email Preview</h3>
        <p><strong>Note:</strong> This email was NOT actually sent because mail server is not configured in development environment.</p>
        <p><strong>Production:</strong> On cPanel server with sendmail configured, this email will be sent automatically using PHP mail() function.</p>
        <p><strong>Saved:</strong> " . date('F j, Y \a\t g:i A') . "</p>
    </div>
    
    <div class='email-info'>
        <h2>Email Details</h2>
        <table>
            <tr><td>To:</td><td>{$to}</td></tr>
            <tr><td>Subject:</td><td>{$subject}</td></tr>
            " . ($cc ? "<tr><td>CC:</td><td>{$cc}</td></tr>" : "") . "
            <tr><td>From:</td><td>LicenseHub Enterprise &lt;noreply@cybaemtech.net&gt;</td></tr>
            <tr><td>Reply-To:</td><td>accounts@cybaemtech.net</td></tr>
            <tr><td>Timestamp:</td><td>" . date('Y-m-d H:i:s') . "</td></tr>
        </table>
    </div>
    
    <div class='email-content'>
        <h2>Email Content</h2>
        {$message}
    </div>
</body>
</html>";
    
    // Save to file
    $saved = @file_put_contents($filename, $emailPreview);
    
    if ($saved) {
        error_log("Development: Email saved to file: $filename (To: $to)");
        
        // Also log to a summary file
        $summaryFile = $logDir . '/email_log.txt';
        $logEntry = sprintf(
            "[%s] To: %s | Subject: %s | File: %s\n",
            date('Y-m-d H:i:s'),
            $to,
            $subject,
            basename($filename)
        );
        @file_put_contents($summaryFile, $logEntry, FILE_APPEND);
        
        return true;
    } else {
        error_log("Failed to save email to file for: $to");
        return false;
    }
}

/**
 * Generate HTML email template with consistent styling
 *
 * @param string $title Email title
 * @param string $content Email content/body
 * @param string $footer Optional footer text
 * @return string HTML email template
 */
function generateEmailTemplate($title, $content, $footer = "") {
    $template = "
    <html>
      <body style='background:linear-gradient(135deg,#e0e7ff 0%,#f8fafc 100%);margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;'>
        <div style='max-width:600px;margin:48px auto;background:#fff;border-radius:16px;box-shadow:0 8px 32px #c7d2fe;padding:48px 32px;text-align:center;'>
          <div style='background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);width:80px;height:80px;margin:0 auto 24px;border-radius:16px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(59,130,246,0.4);'>
            <span style='font-size:48px;'>📋</span>
          </div>
          <h1 style='color:#2563eb;margin-bottom:18px;font-size:2rem;'>$title</h1>
          <div style='color:#334155;font-size:18px;margin-bottom:32px;line-height:1.6;text-align:left;'>
            $content
          </div>
          <div style='margin-top:36px;padding-top:24px;border-top:1px solid #e2e8f0;'>
            <p style='color:#64748b;font-size:15px;margin-bottom:0;'>
              $footer<br><br>
              Thanks,<br>
              <span style='color:#2563eb;font-weight:bold;'>LicenseHub Enterprise Team</span>
            </p>
          </div>
          <hr style='margin:40px 0 24px 0;border:none;border-top:1px solid #cbd5e1;'/>
          <p style='color:#94a3b8;font-size:13px;'>
            &copy; 2025 LicenseHub Enterprise. All rights reserved.
          </p>
        </div>
      </body>
    </html>
    ";
   
    return $template;
}

/**
 * Get urgency color based on days until expiry
 *
 * @param int $daysUntilExpiry Days until license expires
 * @return string Color code for urgency level
 */
function getUrgencyColor($daysUntilExpiry) {
    if ($daysUntilExpiry === 0) {
        return '#dc2626'; // Red - Expires today
    } elseif ($daysUntilExpiry <= 5) {
        return '#ea580c'; // Dark Orange - Critical
    } elseif ($daysUntilExpiry <= 15) {
        return '#f59e0b'; // Orange - Warning
    } elseif ($daysUntilExpiry <= 30) {
        return '#eab308'; // Yellow - Notice
    } else {
        return '#3b82f6'; // Blue - Information
    }
}

/**
 * Get urgency level text
 *
 * @param int $daysUntilExpiry Days until license expires
 * @return string Urgency level text
 */
function getUrgencyLevel($daysUntilExpiry) {
    if ($daysUntilExpiry === 0) {
        return '🚨 EXPIRES TODAY';
    } elseif ($daysUntilExpiry === 1) {
        return '⚠️ EXPIRES TOMORROW';
    } elseif ($daysUntilExpiry <= 5) {
        return '⚠️ CRITICAL';
    } elseif ($daysUntilExpiry <= 15) {
        return '⚡ WARNING';
    } elseif ($daysUntilExpiry <= 30) {
        return '📢 NOTICE';
    } else {
        return 'ℹ️ REMINDER';
    }
}

/**
 * Send license expiration notification to client
 *
 * @param array $licenseData License information
 * @param array $clientData Client information
 * @param int $daysUntilExpiry Days until expiration
 * @return bool True if email was sent successfully
 */
function sendLicenseExpirationNotification($licenseData, $clientData, $daysUntilExpiry) {
    $urgencyColor = getUrgencyColor($daysUntilExpiry);
    $urgencyLevel = getUrgencyLevel($daysUntilExpiry);
    
    $title = "License Expiration Alert - " . htmlspecialchars($licenseData['tool_name']);
    
    // Format expiration date
    $expirationDate = date('F j, Y', strtotime($licenseData['expiration_date']));
    $purchaseDate = date('F j, Y', strtotime($licenseData['purchase_date']));
    
    // Calculate license age in days
    $licenseAge = floor((time() - strtotime($licenseData['purchase_date'])) / 86400);
    
    $content = "
    <div style='background: linear-gradient(135deg, {$urgencyColor}15 0%, {$urgencyColor}05 100%); padding: 24px; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid {$urgencyColor};'>
        <h2 style='color: {$urgencyColor}; margin: 0 0 12px 0; font-size: 1.5rem; display: flex; align-items: center;'>
            <span style='margin-right: 8px; font-size: 1.8rem;'>⏰</span>
            {$urgencyLevel}
        </h2>
        <p style='color: #64748b; margin: 0; font-size: 16px;'>
            Your software license is expiring in <strong style='color: {$urgencyColor}; font-size: 20px;'>{$daysUntilExpiry} day" . ($daysUntilExpiry !== 1 ? 's' : '') . "</strong>
        </p>
    </div>
    
    <div style='text-align: center; margin-bottom: 24px;'>
        <p style='color: #334155; font-size: 18px; margin-bottom: 16px;'>
            Hello <strong style='color: #2563eb;'>" . htmlspecialchars($clientData['name']) . "</strong>! 👋
        </p>
        <p style='color: #64748b; font-size: 16px; line-height: 1.6;'>
            This is a friendly reminder that your software license is approaching its expiration date. 
            Please review the details below and take necessary action to renew your license.
        </p>
    </div>
    
    <div style='background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 24px; border: 2px solid #e2e8f0;'>
        <h3 style='color: #334155; margin: 0 0 16px 0; font-size: 1.2rem; text-align: center;'>📋 License Details</h3>
        <div style='background: white; padding: 16px; border-radius: 6px; border: 1px solid #cbd5e1;'>
            <table style='width: 100%; border-collapse: collapse;'>
                <tr>
                    <td style='padding: 12px 0; font-weight: 600; color: #475569; width: 140px; border-bottom: 1px solid #f1f5f9;'>Software:</td>
                    <td style='padding: 12px 0; color: #1e293b; font-weight: 600; border-bottom: 1px solid #f1f5f9;'>" . htmlspecialchars($licenseData['tool_name']) . "</td>
                </tr>
                <tr>
                    <td style='padding: 12px 0; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;'>Version:</td>
                    <td style='padding: 12px 0; color: #1e293b; border-bottom: 1px solid #f1f5f9;'>" . htmlspecialchars($licenseData['version'] ?? 'N/A') . "</td>
                </tr>
                <tr>
                    <td style='padding: 12px 0; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;'>Vendor:</td>
                    <td style='padding: 12px 0; color: #1e293b; border-bottom: 1px solid #f1f5f9;'>" . htmlspecialchars($licenseData['vendor'] ?? 'N/A') . "</td>
                </tr>
                <tr>
                    <td style='padding: 12px 0; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;'>Quantity:</td>
                    <td style='padding: 12px 0; color: #1e293b; border-bottom: 1px solid #f1f5f9;'>" . htmlspecialchars($licenseData['quantity']) . " user" . ($licenseData['quantity'] > 1 ? 's' : '') . "</td>
                </tr>
                <tr>
                    <td style='padding: 12px 0; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;'>Purchase Date:</td>
                    <td style='padding: 12px 0; color: #1e293b; border-bottom: 1px solid #f1f5f9;'>{$purchaseDate}</td>
                </tr>
                <tr>
                    <td style='padding: 12px 0; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;'>Expiration Date:</td>
                    <td style='padding: 12px 0; color: {$urgencyColor}; font-weight: 700; font-size: 16px; border-bottom: 1px solid #f1f5f9;'>{$expirationDate}</td>
                </tr>
                <tr>
                    <td style='padding: 12px 0; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;'>Days Remaining:</td>
                    <td style='padding: 12px 0; color: {$urgencyColor}; font-weight: 700; font-size: 18px; border-bottom: 1px solid #f1f5f9;'>{$daysUntilExpiry} day" . ($daysUntilExpiry !== 1 ? 's' : '') . "</td>
                </tr>
                <tr>
                    <td style='padding: 12px 0; font-weight: 600; color: #475569;'>License Age:</td>
                    <td style='padding: 12px 0; color: #1e293b;'>{$licenseAge} days</td>
                </tr>
            </table>
        </div>
    </div>
    
    <div style='background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 24px;'>
        <h3 style='color: #334155; margin: 0 0 16px 0; font-size: 1.2rem;'>👤 Client Information:</h3>
        <table style='width: 100%; border-collapse: collapse;'>
            <tr>
                <td style='padding: 8px 0; font-weight: 600; color: #475569; width: 140px;'>Company:</td>
                <td style='padding: 8px 0; color: #1e293b;'>" . htmlspecialchars($clientData['name']) . "</td>
            </tr>
            <tr>
                <td style='padding: 8px 0; font-weight: 600; color: #475569;'>Email:</td>
                <td style='padding: 8px 0; color: #1e293b;'>" . htmlspecialchars($clientData['email']) . "</td>
            </tr>
            <tr>
                <td style='padding: 8px 0; font-weight: 600; color: #475569;'>Contact:</td>
                <td style='padding: 8px 0; color: #1e293b;'>" . htmlspecialchars($clientData['contact'] ?? 'N/A') . "</td>
            </tr>
            <tr>
                <td style='padding: 8px 0; font-weight: 600; color: #475569;'>GST:</td>
                <td style='padding: 8px 0; color: #1e293b;'>" . htmlspecialchars($clientData['gst'] ?? 'N/A') . "</td>
            </tr>
        </table>
    </div>
    
    <div style='background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;'>
        <h3 style='color: white; margin: 0 0 16px 0; font-size: 1.2rem;'>🔄 Renew Your License</h3>
        <p style='color: rgba(255,255,255,0.9); margin: 0 0 20px 0; font-size: 14px;'>
            Click the button below to view your license details and proceed with renewal:
        </p>
        <a href='" . getTrustedBaseUrl() . "/licenses?license_id=" . $licenseData['id'] . "'
           style='color: white; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; background: rgba(255,255,255,0.2); padding: 14px 28px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.3);'>
            📋 View License Details
        </a>
    </div>
    
    <div style='background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 24px;'>
        <h4 style='color: #92400e; margin: 0 0 8px 0; font-size: 1rem;'>⚠️ Important Reminder:</h4>
        <ul style='color: #78350f; margin: 0; padding-left: 20px; font-size: 14px;'>
            <li>Renew your license before expiration to avoid service interruption</li>
            <li>Contact us if you need assistance with the renewal process</li>
            <li>Keep your software licenses up to date for security and compliance</li>
            <li>Review your license requirements and adjust quantities if needed</li>
        </ul>
    </div>
    ";
   
    $footer = "This is an automated reminder about your software license expiration. For assistance with license renewal or any questions, please contact our support team at accounts@cybaemtech.net.";
   
    $message = generateEmailTemplate($title, $content, $footer);
    $subject = "⏰ License Expiration Alert: " . $licenseData['tool_name'] . " - Expires in {$daysUntilExpiry} day" . ($daysUntilExpiry !== 1 ? 's' : '');
   
    return sendEmailNotification($clientData['email'], $subject, $message);
}

/**
 * Send test email
 *
 * @param string $toEmail Recipient email
 * @param string $subject Email subject
 * @param string $customMessage Custom message content
 * @return array Result with success status and message
 */
function sendTestEmail($toEmail, $subject = 'Test Email from LicenseHub', $customMessage = null) {
    $title = "Test Email - LicenseHub Enterprise";
    
    $message = $customMessage ?? "This is a test email to verify that the PHP email system is working correctly.";
    
    $content = "
    <div style='background: linear-gradient(135deg, #22c55e15 0%, #22c55e05 100%); padding: 24px; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid #22c55e;'>
        <h2 style='color: #22c55e; margin: 0 0 12px 0; font-size: 1.5rem;'>
            <span style='margin-right: 8px;'>✅</span>
            Email System Test
        </h2>
        <p style='color: #64748b; margin: 0; font-size: 16px;'>
            {$message}
        </p>
    </div>
    
    <div style='background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 24px;'>
        <h3 style='color: #334155; margin: 0 0 16px 0; font-size: 1.2rem;'>Test Details:</h3>
        <table style='width: 100%; border-collapse: collapse;'>
            <tr>
                <td style='padding: 8px 0; font-weight: 600; color: #475569; width: 140px;'>Sent to:</td>
                <td style='padding: 8px 0; color: #1e293b;'>{$toEmail}</td>
            </tr>
            <tr>
                <td style='padding: 8px 0; font-weight: 600; color: #475569;'>Date/Time:</td>
                <td style='padding: 8px 0; color: #1e293b;'>" . date('F j, Y \a\t g:i A') . "</td>
            </tr>
            <tr>
                <td style='padding: 8px 0; font-weight: 600; color: #475569;'>Server:</td>
                <td style='padding: 8px 0; color: #1e293b;'>" . getTrustedBaseUrl() . "</td>
            </tr>
        </table>
    </div>
    ";
    
    $footer = "If you received this email, the email system is configured correctly and working properly.";
    
    $emailMessage = generateEmailTemplate($title, $content, $footer);
    
    $result = sendEmailNotification($toEmail, $subject, $emailMessage);
    
    return [
        'success' => $result,
        'message' => $result ? 'Test email sent successfully' : 'Failed to send test email',
        'sent_to' => $toEmail,
        'timestamp' => date('Y-m-d H:i:s')
    ];
}
?>
