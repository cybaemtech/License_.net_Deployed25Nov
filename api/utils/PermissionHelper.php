<?php
/**
 * Permission Helper Class
 * Handles granular permission checking for modules and actions
 */

class PermissionHelper {
    
    /**
     * Check if user has permission for a specific module and action
     * 
     * @param array $permissions User's permission JSON decoded as array
     * @param string $module Module name (e.g., 'licenses', 'clients', 'vendors')
     * @param string $action Action name (e.g., 'create', 'read', 'update', 'delete')
     * @return bool
     */
    public static function hasPermission($permissions, $module, $action = null) {
        // If permissions is null or empty, deny access
        if (empty($permissions) || !is_array($permissions)) {
            return false;
        }

        // Check if module exists in permissions
        if (!isset($permissions[$module])) {
            return false;
        }

        $modulePerms = $permissions[$module];

        // Handle old boolean format (backward compatibility)
        if (is_bool($modulePerms)) {
            return $modulePerms;
        }

        // Check module access
        if (!isset($modulePerms['access']) || !$modulePerms['access']) {
            return false;
        }

        // If no specific action requested, just check module access
        if ($action === null) {
            return true;
        }

        // Check specific action permission
        if (isset($modulePerms['actions']) && isset($modulePerms['actions'][$action])) {
            return (bool)$modulePerms['actions'][$action];
        }

        // Default: if actions not defined, grant access (for modules without actions)
        return true;
    }

    /**
     * Get default permissions for a role
     * 
     * @param string $role Role name (admin, accounts, user)
     * @return array
     */
    public static function getDefaultPermissions($role) {
        switch ($role) {
            case 'admin':
                return [
                    'dashboard' => ['access' => true],
                    'licenses' => [
                        'access' => true,
                        'actions' => [
                            'create' => true,
                            'read' => true,
                            'update' => true,
                            'delete' => true
                        ]
                    ],
                    'purchase_licenses' => [
                        'access' => true,
                        'actions' => [
                            'add' => true,
                            'read' => true,
                            'update' => true,
                            'delete' => true,
                            'import_csv' => true
                        ]
                    ],
                    'selling_licenses' => [
                        'access' => true,
                        'actions' => [
                            'add' => true,
                            'read' => true,
                            'update' => true,
                            'delete' => true,
                            'import_csv' => true
                        ]
                    ],
                    'sales' => [
                        'access' => true,
                        'actions' => [
                            'create' => true,
                            'read' => true,
                            'update' => true,
                            'delete' => true
                        ]
                    ],
                    'clients' => [
                        'access' => true,
                        'actions' => [
                            'create' => true,
                            'read' => true,
                            'update' => true,
                            'delete' => true
                        ]
                    ],
                    'vendors' => [
                        'access' => true,
                        'actions' => [
                            'create' => true,
                            'read' => true,
                            'update' => true,
                            'delete' => true
                        ]
                    ],
                    'reports' => ['access' => true],
                    'teams' => ['access' => true],
                    'settings' => ['access' => true],
                    'notifications' => ['access' => true]
                ];

            case 'accounts':
                return [
                    'dashboard' => ['access' => true],
                    'licenses' => [
                        'access' => true,
                        'actions' => [
                            'create' => true,
                            'read' => true,
                            'update' => true,
                            'delete' => false
                        ]
                    ],
                    'purchase_licenses' => [
                        'access' => true,
                        'actions' => [
                            'add' => true,
                            'read' => true,
                            'update' => true,
                            'delete' => false,
                            'import_csv' => true
                        ]
                    ],
                    'selling_licenses' => [
                        'access' => true,
                        'actions' => [
                            'add' => true,
                            'read' => true,
                            'update' => true,
                            'delete' => false,
                            'import_csv' => true
                        ]
                    ],
                    'sales' => [
                        'access' => true,
                        'actions' => [
                            'create' => true,
                            'read' => true,
                            'update' => true,
                            'delete' => false
                        ]
                    ],
                    'clients' => [
                        'access' => true,
                        'actions' => [
                            'create' => true,
                            'read' => true,
                            'update' => true,
                            'delete' => false
                        ]
                    ],
                    'vendors' => [
                        'access' => true,
                        'actions' => [
                            'create' => true,
                            'read' => true,
                            'update' => true,
                            'delete' => false
                        ]
                    ],
                    'reports' => ['access' => true],
                    'teams' => ['access' => true],
                    'settings' => ['access' => false],
                    'notifications' => ['access' => true]
                ];

            case 'user':
            default:
                return [
                    'dashboard' => ['access' => true],
                    'licenses' => [
                        'access' => true,
                        'actions' => [
                            'create' => false,
                            'read' => true,
                            'update' => false,
                            'delete' => false
                        ]
                    ],
                    'purchase_licenses' => [
                        'access' => true,
                        'actions' => [
                            'add' => false,
                            'read' => true,
                            'update' => false,
                            'delete' => false,
                            'import_csv' => false
                        ]
                    ],
                    'selling_licenses' => [
                        'access' => true,
                        'actions' => [
                            'add' => false,
                            'read' => true,
                            'update' => false,
                            'delete' => false,
                            'import_csv' => false
                        ]
                    ],
                    'sales' => [
                        'access' => true,
                        'actions' => [
                            'create' => false,
                            'read' => true,
                            'update' => false,
                            'delete' => false
                        ]
                    ],
                    'clients' => [
                        'access' => true,
                        'actions' => [
                            'create' => false,
                            'read' => true,
                            'update' => false,
                            'delete' => false
                        ]
                    ],
                    'vendors' => [
                        'access' => true,
                        'actions' => [
                            'create' => false,
                            'read' => true,
                            'update' => false,
                            'delete' => false
                        ]
                    ],
                    'reports' => ['access' => true],
                    'teams' => ['access' => false],
                    'settings' => ['access' => false],
                    'notifications' => ['access' => true]
                ];
        }
    }

    /**
     * Validate permission structure
     * 
     * @param mixed $permissions
     * @return bool
     */
    public static function validatePermissions($permissions) {
        if (!is_array($permissions)) {
            return false;
        }

        $validModules = ['dashboard', 'licenses', 'purchase_licenses', 'selling_licenses', 'sales', 'clients', 'vendors', 'reports', 'teams', 'settings', 'notifications'];
        $validActions = ['create', 'read', 'update', 'delete', 'add', 'import_csv'];

        foreach ($permissions as $module => $value) {
            if (!in_array($module, $validModules)) {
                return false;
            }

            if (is_array($value) && isset($value['actions'])) {
                foreach ($value['actions'] as $action => $allowed) {
                    if (!in_array($action, $validActions)) {
                        return false;
                    }
                }
            }
        }

        return true;
    }
}
