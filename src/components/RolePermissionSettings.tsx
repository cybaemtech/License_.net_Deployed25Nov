import { useState, useEffect } from 'react';
import { Shield, Save, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { getApiBaseUrl } from '../utils/api';

interface UserRole {
  id?: string;
  user_id: string;
  role_type: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

interface User {
  id: string;
  email: string;
  role: string;
}

function RolePermissionSettings() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('client');
  const [permissions, setPermissions] = useState({
    can_create: false,
    can_read: true,
    can_update: false,
    can_delete: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);

  const roleTypes = [
    { value: 'admin', label: 'Admin', description: 'Full system access' },
    { value: 'client', label: 'Client', description: 'Client-specific permissions' },
    { value: 'vendor', label: 'Vendor', description: 'Vendor-specific permissions' },
    { value: 'accounts', label: 'Accounts', description: 'Financial and accounting access' },
    { value: 'user', label: 'User', description: 'Basic user access' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserRoles(selectedUserId);
    }
  }, [selectedUserId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // For now, we'll get the admin user
      // In production, this should fetch all users
      const mockUser = {
        id: '8730df72-494f-4c76-8eb5-5f4ee47d819b',
        email: 'admin@example.com',
        role: 'admin'
      };
      setUsers([mockUser]);
      setSelectedUserId(mockUser.id);
    } catch (err) {
      console.error('Error fetching users:', err);
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRoles = async (userId: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/user-roles/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setUserRoles(result.data);
        
        // Find permissions for selected role
        const rolePermissions = result.data.find((r: UserRole) => r.role_type === selectedRole);
        if (rolePermissions) {
          setPermissions({
            can_create: rolePermissions.can_create,
            can_read: rolePermissions.can_read,
            can_update: rolePermissions.can_update,
            can_delete: rolePermissions.can_delete
          });
        } else {
          // Reset to defaults if no permissions found
          setPermissions({
            can_create: false,
            can_read: true,
            can_update: false,
            can_delete: false
          });
        }
      }
    } catch (err) {
      console.error('Error fetching user roles:', err);
    }
  };

  const handleSave = async () => {
    if (!selectedUserId) {
      setMessage({ type: 'error', text: 'Please select a user' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const roleData = {
        user_id: selectedUserId,
        role_type: selectedRole,
        ...permissions
      };

      const response = await fetch(`${getApiBaseUrl()}/user-roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Role permissions saved successfully!' });
        fetchUserRoles(selectedUserId); // Refresh the roles
      } else {
        throw new Error(result.error || 'Failed to save permissions');
      }
    } catch (err) {
      console.error('Error saving permissions:', err);
      setMessage({ type: 'error', text: 'Failed to save permissions' });
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    // Find permissions for the newly selected role
    const rolePermissions = userRoles.find((r: UserRole) => r.role_type === role);
    if (rolePermissions) {
      setPermissions({
        can_create: rolePermissions.can_create,
        can_read: rolePermissions.can_read,
        can_update: rolePermissions.can_update,
        can_delete: rolePermissions.can_delete
      });
    } else {
      // Reset to defaults if no permissions found
      setPermissions({
        can_create: false,
        can_read: true,
        can_update: false,
        can_delete: false
      });
    }
  };

  const togglePermission = (permission: keyof typeof permissions) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500 dark:text-gray-400">Loading roles and permissions...</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-6">
      <div className="flex items-center mb-6">
        <Shield className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Role & Permission Management
        </h2>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Manage user roles and permissions for Client and Vendor access. Assign specific permissions to control what each role can do in the system.
      </p>

      {message && (
        <div className={`flex items-center p-4 rounded-lg mb-6 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
            : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 mr-2" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-2" />
          )}
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label htmlFor="user" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Users className="h-4 w-4 inline mr-1" />
            Select User
          </label>
          <select
            id="user"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
          >
            <option value="">Select a user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.email} ({user.role})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Select Role Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {roleTypes.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => handleRoleChange(role.value)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedRole === role.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">{role.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{role.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Permissions for {roleTypes.find(r => r.value === selectedRole)?.label}
          </label>
          <div className="bg-gray-50 dark:bg-dark-900 rounded-lg p-4 space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Create</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Can create new records</div>
              </div>
              <input
                type="checkbox"
                checked={permissions.can_create}
                onChange={() => togglePermission('can_create')}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Read</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Can view records</div>
              </div>
              <input
                type="checkbox"
                checked={permissions.can_read}
                onChange={() => togglePermission('can_read')}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Update</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Can edit records</div>
              </div>
              <input
                type="checkbox"
                checked={permissions.can_update}
                onChange={() => togglePermission('can_update')}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Delete</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Can delete records</div>
              </div>
              <input
                type="checkbox"
                checked={permissions.can_delete}
                onChange={() => togglePermission('can_delete')}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-dark-700">
          <button
            onClick={handleSave}
            disabled={saving || !selectedUserId}
            className="flex items-center space-x-2 bg-blue-600 dark:bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Permissions'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default RolePermissionSettings;
