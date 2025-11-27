import { useState, useEffect, useMemo } from 'react';
import { UserPlus, Edit2, Trash2, Eye, EyeOff, Mail, Shield, Search } from 'lucide-react';
import { apiRequest } from '../../utils/apiHelper';
import { getDefaultPermissions } from '../../utils/permissionHelper';

interface ModulePermission {
  access: boolean;
  actions?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
    add_purchase_license?: boolean;
    add_sell_license?: boolean;
    edit?: boolean;
    send?: boolean;
    add?: boolean;
    import_csv?: boolean;
  };
}

interface User {
  id: string;
  email: string;
  role: string;
  permissions: {
    dashboard?: ModulePermission | boolean;
    license_dashboard?: ModulePermission | boolean;
    licenses?: ModulePermission | boolean;
    purchase_licenses?: ModulePermission | boolean;
    selling_licenses?: ModulePermission | boolean;
    sales?: ModulePermission | boolean;
    clients?: ModulePermission | boolean;
    vendors?: ModulePermission | boolean;
    reports?: ModulePermission | boolean;
    teams?: ModulePermission | boolean;
    settings?: ModulePermission | boolean;
    notifications?: ModulePermission | boolean;
  };
  created_at: string;
}

interface NewUser {
  email: string;
  password: string;
  role: string;
  permissions: {
    dashboard?: ModulePermission | boolean;
    license_dashboard?: ModulePermission | boolean;
    licenses?: ModulePermission | boolean;
    purchase_licenses?: ModulePermission | boolean;
    selling_licenses?: ModulePermission | boolean;
    sales?: ModulePermission | boolean;
    clients?: ModulePermission | boolean;
    vendors?: ModulePermission | boolean;
    reports?: ModulePermission | boolean;
    teams?: ModulePermission | boolean;
    settings?: ModulePermission | boolean;
    notifications?: ModulePermission | boolean;
  };
}

function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    password: '',
    role: 'user',
    permissions: getDefaultPermissions('user'),
  });

  const [editFormData, setEditFormData] = useState<Partial<NewUser>>({});

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return users.filter(user => 
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  }, [users, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/users');
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clean legacy fields from permissions before saving
  const cleanPermissions = (perms: typeof newUser.permissions) => {
    const cleaned = { ...perms };
    // Remove legacy fields that are no longer used in new UI
    delete cleaned.license_dashboard;
    delete cleaned.sales;
    delete cleaned.teams;
    return cleaned;
  };

  const handleCreateUser = async () => {
    if (!newUser.email) {
      alert('Email is required');
      return;
    }
    
    // If editing, password is optional; if creating, password is required
    if (!editingUser && !newUser.password) {
      alert('Password is required for new users');
      return;
    }

    try {
      setLoading(true);
      
      const cleanedPermissions = cleanPermissions(newUser.permissions);
      
      // Log permissions being saved for debugging
      console.log('📝 Saving User Permissions:', {
        email: newUser.email,
        role: newUser.role,
        permissions: cleanedPermissions
      });
      
      if (editingUser) {
        // Update existing user
        const updateData: any = {
          email: newUser.email,
          role: newUser.role,
          permissions: cleanedPermissions,
        };
        
        // Only include password if it was changed
        if (newUser.password) {
          updateData.password = newUser.password;
        }
        
        console.log('🔄 Updating user:', updateData);
        
        const response = await apiRequest(`/users/${editingUser}`, {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });

        if (response.success) {
          console.log('✅ User updated successfully:', response);
          alert('User updated successfully! Permissions have been saved.');
          // Dispatch event to refresh permissions for all users
          window.dispatchEvent(new Event('permissionsUpdated'));
          cancelEdit();
          fetchUsers();
        }
      } else {
        // Create new user
        const createData = {
          ...newUser,
          permissions: cleanedPermissions,
        };
        
        console.log('➕ Creating new user:', createData);
        
        const response = await apiRequest('/users', {
          method: 'POST',
          body: JSON.stringify(createData),
        });

        if (response.success) {
          console.log('✅ User created successfully:', response);
          alert('User created successfully! Permissions have been saved.');
          // Dispatch event to refresh permissions
          window.dispatchEvent(new Event('permissionsUpdated'));
          setIsCreating(false);
          setNewUser({
            email: '',
            password: '',
            role: 'user',
            permissions: getDefaultPermissions('user'),
          });
          fetchUsers();
        }
      }
    } catch (error: any) {
      console.error('❌ Error saving user:', error);
      alert(error.message || `Failed to ${editingUser ? 'update' : 'create'} user`);
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest(`/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.success) {
        alert('User deleted successfully!');
        fetchUsers();
      }
    } catch (error: any) {
      alert(error.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const normalizeUserPermissions = (userPerms: any, role: string) => {
    // Get fresh defaults for the role to ensure all required fields (like create) are present
    const defaults = getDefaultPermissions(role);
    
    // Deep merge: start with defaults, then overlay user's existing permissions
    const normalized: any = {};
    
    Object.keys(defaults).forEach(module => {
      const defaultModule = defaults[module as keyof typeof defaults];
      const userModule = userPerms?.[module];
      
      if (!userModule && userModule !== false) {
        // User doesn't have this module (undefined/null), use default
        normalized[module] = defaultModule;
      } else if (typeof userModule === 'boolean') {
        // CRITICAL: Convert boolean to proper structure without privilege escalation
        if (userModule === false) {
          // Convert false to proper disabled structure
          if (typeof defaultModule === 'object' && 'actions' in defaultModule) {
            const disabledActions: any = {};
            Object.keys((defaultModule as any).actions || {}).forEach(action => {
              disabledActions[action] = false;
            });
            normalized[module] = {
              access: false,
              actions: disabledActions
            };
          } else {
            normalized[module] = { access: false };
          }
        } else {
          // true: Convert to {access:true, actions:{...all true}} preserving legacy full access
          // BUT only enable actions that exist in schema (don't escalate beyond schema)
          if (typeof defaultModule === 'object' && 'actions' in defaultModule) {
            const fullActions: any = {};
            Object.keys((defaultModule as any).actions || {}).forEach(action => {
              fullActions[action] = true;  // All actions enabled (legacy full access)
            });
            normalized[module] = {
              access: true,
              actions: fullActions
            };
          } else {
            normalized[module] = { access: true };
          }
        }
      } else if (typeof userModule === 'object' && typeof defaultModule === 'object') {
        // Both are objects, merge them
        normalized[module] = {
          access: userModule.access ?? (defaultModule as any).access,
          actions: {
            ...(defaultModule as any).actions,
            ...userModule.actions
          }
        };
      } else {
        // Fallback to user value
        normalized[module] = userModule;
      }
    });
    
    return normalized;
  };

  const startEdit = (user: User) => {
    // Open the create form in edit mode with normalized permissions
    setEditingUser(user.id);
    setNewUser({
      email: user.email,
      password: '', // Don't prefill password
      role: user.role,
      permissions: normalizeUserPermissions(user.permissions, user.role),
    });
    setIsCreating(true); // Reuse the create form
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditFormData({});
    setIsCreating(false);
    setNewUser({
      email: '',
      password: '',
      role: 'user',
      permissions: getDefaultPermissions('user'),
    });
  };

  const permissionsList = [
    { 
      key: 'dashboard', 
      label: 'Dashboard', 
      description: 'Purchase Analytics & Sales Analytics',
      type: 'readonly',
      icon: '📊'
    },
    { 
      key: 'purchase_licenses', 
      label: 'Purchase Licenses', 
      description: 'Purchase Licenses Management',
      type: 'full',
      icon: '🛒'
    },
    { 
      key: 'selling_licenses', 
      label: 'Selling Licenses', 
      description: 'Selling Licenses Management',
      type: 'full',
      icon: '💰'
    },
    { 
      key: 'clients', 
      label: 'Clients', 
      description: 'Client Management',
      type: 'full',
      icon: '👥'
    },
    { 
      key: 'vendors', 
      label: 'Vendors', 
      description: 'Vendor Management',
      type: 'full',
      icon: '🏢'
    },
    { 
      key: 'reports', 
      label: 'Reports', 
      description: 'Analytics Reports',
      type: 'readonly',
      icon: '📈'
    },
    { 
      key: 'notifications', 
      label: 'Notifications', 
      description: 'Email Notifications',
      type: 'special',
      icon: '🔔'
    },
    { 
      key: 'settings', 
      label: 'Settings', 
      description: 'User & Company Settings',
      type: 'access_only',
      icon: '⚙️'
    },
  ];


  const toggleModuleAccess = (moduleKey: string, isNewUser: boolean = true) => {
    const permissions = isNewUser ? newUser.permissions : editFormData.permissions;
    const currentRole = isNewUser ? newUser.role : (editFormData.role || newUser.role);
    if (!permissions) return;

    const currentPerm = permissions[moduleKey as keyof typeof permissions];
    const permModule = permissionsList.find(p => p.key === moduleKey);

    let newPerm: ModulePermission | boolean;
    
    if (typeof currentPerm === 'boolean') {
      // Convert old boolean to new structure with proper actions
      const roleDefaults = getDefaultPermissions(currentRole);
      const defaultModule = roleDefaults[moduleKey as keyof typeof roleDefaults];
      
      if (!currentPerm) {
        // Was false, now enabling - use role defaults
        if (typeof defaultModule === 'object') {
          newPerm = { ...defaultModule, access: true };
        } else if (permModule?.type === 'readonly') {
          newPerm = { access: true, actions: { read: true } };
        } else if (permModule?.type === 'access_only') {
          newPerm = { access: true };
        } else {
          newPerm = { access: true, actions: {} };
        }
      } else {
        // Was true, now disabling
        if (typeof defaultModule === 'object' && 'actions' in defaultModule) {
          const disabledActions: any = {};
          Object.keys((defaultModule as any).actions || {}).forEach(action => {
            disabledActions[action] = false;
          });
          newPerm = { access: false, actions: disabledActions };
        } else {
          newPerm = { access: false };
        }
      }
    } else if (currentPerm && typeof currentPerm === 'object') {
      const wasDisabled = !currentPerm.access;
      const newAccess = !currentPerm.access;
      
      if (wasDisabled && newAccess) {
        // Re-enabling: preserve existing actions structure but set access to true
        newPerm = { ...currentPerm, access: true };
        
        // If actions were all false, reset to role defaults
        const hasAnyTrueAction = currentPerm.actions && Object.values(currentPerm.actions).some(v => v === true);
        if (!hasAnyTrueAction) {
          const roleDefaults = getDefaultPermissions(currentRole);
          const defaultModule = roleDefaults[moduleKey as keyof typeof roleDefaults];
          if (typeof defaultModule === 'object' && 'actions' in defaultModule) {
            newPerm = { access: true, actions: { ...(defaultModule as any).actions } };
          }
        }
      } else {
        // Disabling: keep actions but set access to false
        newPerm = { ...currentPerm, access: newAccess };
      }
    } else {
      // New permission - set based on role defaults
      const roleDefaults = getDefaultPermissions(currentRole);
      const defaultModule = roleDefaults[moduleKey as keyof typeof roleDefaults];
      
      if (typeof defaultModule === 'object') {
        newPerm = { ...defaultModule, access: true };
      } else if (permModule?.type === 'readonly') {
        newPerm = { access: true, actions: { read: true } };
      } else if (permModule?.type === 'access_only') {
        newPerm = { access: true };
      } else {
        newPerm = { access: true, actions: {} };
      }
    }

    if (isNewUser) {
      setNewUser({ ...newUser, permissions: { ...permissions, [moduleKey]: newPerm } });
    } else {
      setEditFormData({ ...editFormData, permissions: { ...permissions, [moduleKey]: newPerm } });
    }
  };

  const toggleAction = (moduleKey: string, actionKey: string, isNewUser: boolean = true) => {
    const permissions = isNewUser ? newUser.permissions : editFormData.permissions;
    if (!permissions) return;

    const currentPerm = permissions[moduleKey as keyof typeof permissions];
    
    if (typeof currentPerm === 'object' && currentPerm.actions) {
      const newActions = { 
        ...currentPerm.actions, 
        [actionKey]: !currentPerm.actions[actionKey as keyof typeof currentPerm.actions] 
      };
      const newPerm = { ...currentPerm, actions: newActions };

      if (isNewUser) {
        setNewUser({ ...newUser, permissions: { ...permissions, [moduleKey]: newPerm } });
      } else {
        setEditFormData({ ...editFormData, permissions: { ...permissions, [moduleKey]: newPerm } });
      }
    }
  };

  const getModuleAccess = (perm: ModulePermission | boolean | undefined): boolean => {
    if (typeof perm === 'boolean') return perm;
    return perm?.access || false;
  };

  const getActionValue = (perm: ModulePermission | boolean | undefined, action: string): boolean => {
    if (typeof perm === 'boolean') return perm;
    if (perm && typeof perm === 'object' && perm.actions) {
      return perm.actions[action as keyof typeof perm.actions] || false;
    }
    return false;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50';
      case 'accounts':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/50';
    }
  };

  return (
    <div className="space-y-4 mt-5">
      {/* Simple Header like Clients/Vendors */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-y-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center bg-blue-600 dark:bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
        >
          <UserPlus className="h-4 w-4 mr-2.5" />
          {isCreating ? 'Cancel' : 'Create New User'}
        </button>
      </div>

      {/* Search Bar - Simple Style */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-dark-700">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by email or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <span className="text-xl">×</span>
            </button>
          )}
        </div>
      </div>

      {isCreating && (
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {editingUser ? 'Update User' : 'Create New User'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password {editingUser ? '(Optional)' : '*'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white pr-10"
                  placeholder={editingUser ? "Leave blank to keep current password" : "Enter password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {editingUser && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enter a new password only if you want to change it
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role *
              </label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="user">User</option>
                <option value="accounts">Accounts</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Module Permissions (Simplified)
            </label>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {permissionsList.map((perm) => {
                const currentPerm = newUser.permissions[perm.key as keyof typeof newUser.permissions];
                const hasAccess = getModuleAccess(currentPerm);
                
                return (
                  <div key={perm.key} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    {/* Module Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasAccess}
                            onChange={() => toggleModuleAccess(perm.key, true)}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{perm.icon}</span>
                              <span className="text-base font-semibold text-gray-900 dark:text-white">{perm.label}</span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 ml-7">{perm.description}</div>
                          </div>
                        </label>
                      </div>
                      {hasAccess && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Enabled
                        </span>
                      )}
                    </div>
                    
                    {/* Actions - Only show if module is enabled */}
                    {hasAccess && (
                      <div className="ml-7 pt-2 border-t border-gray-200 dark:border-gray-600">
                        {/* Dashboard & Reports - Read Only */}
                        {(perm.type === 'readonly') && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              👁️ Read Only (View Analytics)
                            </span>
                          </div>
                        )}
                        
                        {/* Purchase Licenses - Separate Module */}
                        {perm.key === 'purchase_licenses' && (
                          <div className="grid grid-cols-2 gap-2">
                            <label className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                              <input
                                type="checkbox"
                                checked={getActionValue(currentPerm, 'read')}
                                onChange={() => toggleAction(perm.key, 'read', true)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">👁️ View</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                              <input
                                type="checkbox"
                                checked={getActionValue(currentPerm, 'delete')}
                                onChange={() => toggleAction(perm.key, 'delete', true)}
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">🗑️ Delete</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                              <input
                                type="checkbox"
                                checked={getActionValue(currentPerm, 'update')}
                                onChange={() => toggleAction(perm.key, 'update', true)}
                                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">✏️ Update</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                              <input
                                type="checkbox"
                                checked={getActionValue(currentPerm, 'add')}
                                onChange={() => toggleAction(perm.key, 'add', true)}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">🛒 Add Purchase</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                              <input
                                type="checkbox"
                                checked={getActionValue(currentPerm, 'import_csv')}
                                onChange={() => toggleAction(perm.key, 'import_csv', true)}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">📥 Import CSV</span>
                            </label>
                          </div>
                        )}
                        
                        {/* Selling Licenses - Separate Module */}
                        {perm.key === 'selling_licenses' && (
                          <div className="grid grid-cols-2 gap-2">
                            <label className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                              <input
                                type="checkbox"
                                checked={getActionValue(currentPerm, 'read')}
                                onChange={() => toggleAction(perm.key, 'read', true)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">👁️ View</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                              <input
                                type="checkbox"
                                checked={getActionValue(currentPerm, 'delete')}
                                onChange={() => toggleAction(perm.key, 'delete', true)}
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">🗑️ Delete</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                              <input
                                type="checkbox"
                                checked={getActionValue(currentPerm, 'update')}
                                onChange={() => toggleAction(perm.key, 'update', true)}
                                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">✏️ Update</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                              <input
                                type="checkbox"
                                checked={getActionValue(currentPerm, 'add')}
                                onChange={() => toggleAction(perm.key, 'add', true)}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">💰 Add Selling</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                              <input
                                type="checkbox"
                                checked={getActionValue(currentPerm, 'import_csv')}
                                onChange={() => toggleAction(perm.key, 'import_csv', true)}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">📥 Import CSV</span>
                            </label>
                          </div>
                        )}
                        
                        {/* Clients & Vendors - Full CRUD */}
                        {(perm.key === 'clients' || perm.key === 'vendors') && (
                          <div className="grid grid-cols-2 gap-2">
                            <label className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                              <input
                                type="checkbox"
                                checked={getActionValue(currentPerm, 'create')}
                                onChange={() => toggleAction(perm.key, 'create', true)}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">➕ Create</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                              <input
                                type="checkbox"
                                checked={getActionValue(currentPerm, 'read')}
                                onChange={() => toggleAction(perm.key, 'read', true)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">👁️ View</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                              <input
                                type="checkbox"
                                checked={getActionValue(currentPerm, 'update')}
                                onChange={() => toggleAction(perm.key, 'update', true)}
                                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">✏️ Update</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                              <input
                                type="checkbox"
                                checked={getActionValue(currentPerm, 'delete')}
                                onChange={() => toggleAction(perm.key, 'delete', true)}
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">🗑️ Delete</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                              <input
                                type="checkbox"
                                checked={getActionValue(currentPerm, 'import_csv')}
                                onChange={() => toggleAction(perm.key, 'import_csv', true)}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">📥 Import CSV</span>
                            </label>
                          </div>
                        )}
                        
                        {/* Notifications - Special permissions */}
                        {perm.key === 'notifications' && (
                          <div className="grid grid-cols-1 gap-2">
                            <label className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                              <input
                                type="checkbox"
                                checked={getActionValue(currentPerm, 'read')}
                                onChange={() => toggleAction(perm.key, 'read', true)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">👁️ View Notifications</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                              <input
                                type="checkbox"
                                checked={getActionValue(currentPerm, 'edit')}
                                onChange={() => toggleAction(perm.key, 'edit', true)}
                                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">✏️ Edit Settings</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                              <input
                                type="checkbox"
                                checked={getActionValue(currentPerm, 'send')}
                                onChange={() => toggleAction(perm.key, 'send', true)}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">📧 Send Notifications</span>
                            </label>
                          </div>
                        )}
                        
                        {/* Settings - Access only */}
                        {perm.type === 'access_only' && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              ⚙️ Full Access to Settings
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleCreateUser}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? (editingUser ? 'Updating...' : 'Creating...') : (editingUser ? 'Update User' : 'Create User')}
            </button>
          </div>
        </div>
      )}

      {loading && !isCreating && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      )}

      {!loading && users.length === 0 && !isCreating && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
            <Shield className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">No users found. Create your first user!</p>
        </div>
      )}

      {!loading && users.length > 0 && filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <Search className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No users found matching "{searchTerm}"</p>
          <button
            onClick={() => setSearchTerm('')}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            Clear search
          </button>
        </div>
      )}

      {!loading && filteredUsers.length > 0 && (
        <div>
          {searchTerm && (
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Found <span className="font-semibold text-blue-600 dark:text-blue-400">{filteredUsers.length}</span> user{filteredUsers.length !== 1 ? 's' : ''} matching "{searchTerm}"
            </div>
          )}
          <div className="grid grid-cols-1 gap-6">
            {filteredUsers.map((user) => {
            const enabledPermissions = user.permissions 
              ? Object.entries(user.permissions).filter(([_, value]) => {
                  const isEnabled = typeof value === 'boolean' ? value : (value && typeof value === 'object' && value.access === true);
                  return isEnabled;
                })
              : [];

            return (
              <div
                key={user.id}
                className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 hover:shadow-md transition-all duration-200"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                              {user.email}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getRoleBadgeColor(user.role)}`}>
                              {user.role.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Permissions */}
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Permissions ({enabledPermissions.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {enabledPermissions.length > 0 ? (
                            enabledPermissions.map(([key]) => {
                              const permInfo = permissionsList.find((p) => p.key === key);
                              return (
                                <span
                                  key={key}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-700 shadow-sm"
                                >
                                  <span>{permInfo?.icon || '✓'}</span>
                                  <span>{permInfo?.label || key}</span>
                                </span>
                              );
                            })
                          ) : (
                            <span className="px-3 py-1.5 text-xs bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 rounded-lg italic">
                              No permissions assigned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => startEdit(user)}
                        className="group/btn flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all duration-200 hover:scale-110 hover:shadow-lg"
                        title="Edit User"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="group/btn flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200 hover:scale-110 hover:shadow-lg"
                        title="Delete User"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
