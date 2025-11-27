<?php
/**
 * Application Constants
 */

// Environment Configuration - defaults to development for Replit, production otherwise
// Check if running on Replit or in development environment
$isReplit = !empty(getenv('REPL_ID')) || !empty(getenv('REPL_SLUG'));
$defaultEnv = $isReplit ? 'development' : 'production';
define('APP_ENV', getenv('APP_ENV') ?: $defaultEnv);

// API Configuration
define('API_VERSION', 'v1');
define('BASE_URL', '/api/' . API_VERSION);

// Authentication - JWT not currently implemented
// Note: Session-based authentication is currently used instead of JWT
// WARNING: If JWT support is added in the future, JWT_SECRET MUST be set as an environment variable
// Setting JWT_SECRET to null when not provided ensures any JWT code will fail explicitly
$jwtSecret = getenv('JWT_SECRET');
define('JWT_SECRET', $jwtSecret ?: null);
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRY', 3600 * 24); // 24 hours

// Helper function to validate JWT configuration before use
// Call this before any JWT operations to ensure proper setup
function validateJwtConfig() {
    if (empty(JWT_SECRET)) {
        throw new Exception('JWT_SECRET environment variable must be set before using JWT authentication');
    }
}

// Response Status Codes
define('HTTP_OK', 200);
define('HTTP_CREATED', 201);
define('HTTP_BAD_REQUEST', 400);
define('HTTP_UNAUTHORIZED', 401);
define('HTTP_FORBIDDEN', 403);
define('HTTP_NOT_FOUND', 404);
define('HTTP_METHOD_NOT_ALLOWED', 405);
define('HTTP_INTERNAL_ERROR', 500);

// User Roles
define('ROLE_ADMIN', 'admin');
define('ROLE_ACCOUNTS', 'accounts');
define('ROLE_USER', 'user');

// Notification Types
define('NOTIFICATION_30_DAYS', '30_days');
define('NOTIFICATION_15_DAYS', '15_days');
define('NOTIFICATION_5_DAYS', '5_days');
define('NOTIFICATION_1_DAY', '1_day');
define('NOTIFICATION_EXPIRED', 'expired');

// License Status
define('LICENSE_ACTIVE', 'active');
define('LICENSE_EXPIRED', 'expired');
define('LICENSE_REVOKED', 'revoked');

// Email Status
define('EMAIL_SENT', 'sent');
define('EMAIL_FAILED', 'failed');
define('EMAIL_PENDING', 'pending');

// Default Settings
define('DEFAULT_TIMEZONE', 'UTC');
define('DEFAULT_CURRENCY', 'INR');
define('DEFAULT_NOTIFICATION_TIME', '09:00:00');