<?php
/**
 * Environment Defaults Configuration
 * Sets required environment variables if not already set
 */

// Set EMAIL_MODE to production if not set
// This enables PHP mail() function for sending emails
if (!getenv('EMAIL_MODE')) {
    putenv('EMAIL_MODE=production');
    $_ENV['EMAIL_MODE'] = 'production';
    $_SERVER['EMAIL_MODE'] = 'production';
}

// Set APP_URL if not set
if (!getenv('APP_URL')) {
    $appUrl = 'https://cybaemtech.net';
    putenv("APP_URL=$appUrl");
    $_ENV['APP_URL'] = $appUrl;
    $_SERVER['APP_URL'] = $appUrl;
}

// Set APP_ENV if not set
if (!getenv('APP_ENV')) {
    putenv('APP_ENV=development');
    $_ENV['APP_ENV'] = 'development';
    $_SERVER['APP_ENV'] = 'development';
}

error_log("Environment defaults loaded: EMAIL_MODE=" . getenv('EMAIL_MODE') . ", APP_URL=" . getenv('APP_URL'));
?>
