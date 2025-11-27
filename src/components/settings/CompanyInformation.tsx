import { useState, useEffect } from 'react';
import { Building2, Upload, Save, Lock, Edit2, X } from 'lucide-react';
import { apiRequest } from '../../utils/apiHelper';
import { getSession } from '../../utils/session';

interface CompanySettings {
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  company_logo_path: string;
  company_website: string;
  company_gst: string;
}

function CompanyInformation() {
  const session = getSession();
  const isAdmin = session?.role === 'admin';
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState<CompanySettings>({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: '',
    company_logo_path: '',
    company_website: '',
    company_gst: '',
  });
  const [originalSettings, setOriginalSettings] = useState<CompanySettings>({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: '',
    company_logo_path: '',
    company_website: '',
    company_gst: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/company-settings');
      if (response.success) {
        setSettings(response.data);
        setOriginalSettings(response.data);
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/company-settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      });

      if (response.success) {
        alert('Company settings saved successfully!');
        setOriginalSettings(settings);
        setIsEditing(false);
        fetchSettings();
        
        // Notify navbar to update logo
        window.dispatchEvent(new Event('companySettingsUpdated'));
      }
    } catch (error: any) {
      alert(error.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setSettings(originalSettings);
    setIsEditing(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('File size should be less than 50MB');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('logo', file);

      const basePath = import.meta.env.BASE_URL || '/';
      const response = await fetch(`${basePath}api/company-settings/upload-logo`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setSettings({ ...settings, company_logo_path: result.data.logo_path });
        alert('Logo uploaded successfully!');
        
        // Notify navbar to update logo immediately
        window.dispatchEvent(new Event('companySettingsUpdated'));
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  if (loading && !settings.company_name) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading company information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Company Information</h2>
        {isAdmin && !isEditing && (
          <button
            onClick={handleEdit}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit2 className="h-5 w-5 mr-2" />
            Edit
          </button>
        )}
        {isAdmin && isEditing && (
          <div className="flex space-x-2">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5 mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-5 w-5 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
        {!isAdmin && (
          <div className="flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg">
            <Lock className="h-5 w-5 mr-2" />
            View Only
          </div>
        )}
      </div>
      
      {!isAdmin && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Notice:</strong> You are viewing company information in read-only mode. Only administrators can edit these settings.
          </p>
        </div>
      )}

      <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg space-y-6">
        {/* Logo Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Company Logo
          </label>
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              {settings.company_logo_path ? (
                <img
                  src={`${import.meta.env.BASE_URL || '/'}${settings.company_logo_path.replace(/^\/License\/|^\//, '')}`}
                  alt="Company Logo"
                  className="h-24 w-24 object-contain bg-white dark:bg-gray-800 rounded-lg p-2 border-2 border-gray-300 dark:border-gray-600"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="h-24 w-24 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center border-2 border-gray-300 dark:border-gray-600"><svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path></svg></div>';
                    }
                  }}
                />
              ) : (
                <div className="h-24 w-24 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                  <Building2 className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            {isAdmin && isEditing && (
              <div>
                <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Upload className="h-5 w-5 mr-2 text-gray-700 dark:text-gray-300" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {uploading ? 'Uploading...' : 'Upload Logo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Supported: JPG, PNG, GIF, SVG (Max 50MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Company Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              value={settings.company_name}
              onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
              placeholder="Enter company name"
              disabled={!isAdmin || !isEditing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Email
            </label>
            <input
              type="email"
              value={settings.company_email}
              onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
              placeholder="company@example.com"
              disabled={!isAdmin || !isEditing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Phone
            </label>
            <input
              type="tel"
              value={settings.company_phone}
              onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
              placeholder="+1 (555) 123-4567"
              disabled={!isAdmin || !isEditing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Website
            </label>
            <input
              type="url"
              value={settings.company_website}
              onChange={(e) => setSettings({ ...settings, company_website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
              placeholder="https://www.example.com"
              disabled={!isAdmin || !isEditing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              GST Number
            </label>
            <input
              type="text"
              value={settings.company_gst}
              onChange={(e) => setSettings({ ...settings, company_gst: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
              placeholder="Enter GST number"
              disabled={!isAdmin || !isEditing}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Address
            </label>
            <textarea
              value={settings.company_address}
              onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
              placeholder="Enter company address"
              disabled={!isAdmin || !isEditing}
            />
          </div>
        </div>

        {isAdmin && isEditing && (
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Company Information'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> The company logo will be displayed in the navbar once saved. Make sure to upload a clear logo for the best appearance.
        </p>
      </div>
    </div>
  );
}

export default CompanyInformation;
