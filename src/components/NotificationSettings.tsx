import { useState, useEffect } from 'react';
import { Bell, Save, AlertCircle, CheckCircle, Mail, History, Clock } from 'lucide-react';
import { getApiBaseUrl } from '../utils/api';
import { fetchApi } from '../utils/apiHelper';
import { broadcastSettingsUpdate, subscribeToSettingsUpdates } from '../utils/notificationSync';

interface NotificationSettings {
  id?: string;
  email_notifications_enabled: boolean;
  notification_days: number[];
  notification_time: string;
  timezone: string;
}

interface EmailHistory {
  id: string;
  license_id: string;
  notification_type: string;
  email_status: string;
  email_subject: string;
  email_sent_at: string;
  tool_name: string;
  vendor: string;
  expiration_date: string;
  client_name: string;
  client_email: string;
}

function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications_enabled: true,
    notification_days: [45, 30, 15, 7, 5, 1, 0],
    notification_time: '15:30',
    timezone: 'UTC'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
    
    const unsubscribe = subscribeToSettingsUpdates((updatedSettings) => {
      setSettings(updatedSettings);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (showHistory) {
      fetchEmailHistory();
    }
  }, [showHistory]);

  const fetchSettings = async () => {
    try {
      const result = await fetchApi('/notification-settings', {
        method: 'GET',
      });
      
      if (result.success) {
        setSettings(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch settings');
      }
    } catch (err) {
      console.error('Error fetching notification settings:', err);
      setMessage({ type: 'error', text: 'Failed to load notification settings' });
      
      // Fallback to default settings if API fails
      setSettings({
        email_notifications_enabled: true,
        notification_days: [45, 30, 15, 7, 5, 1, 0],
        notification_time: '15:30',
        timezone: 'UTC'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailHistory = async () => {
    setHistoryLoading(true);
    try {
      const result = await fetchApi('/notifications/history?limit=50', {
        method: 'GET',
      });
      
      if (result.success) {
        setEmailHistory(result.data.history || []);
      } else {
        throw new Error(result.error || 'Failed to fetch email history');
      }
    } catch (err) {
      console.error('Error fetching email history:', err);
      setMessage({ type: 'error', text: 'Failed to load email history' });
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const settingsData = {
        email_notifications_enabled: settings.email_notifications_enabled,
        notification_days: settings.notification_days,
        notification_time: settings.notification_time,
        timezone: settings.timezone
      };

      const result = await fetchApi('/notification-settings', {
        method: 'POST',
        body: JSON.stringify(settingsData),
      });
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Notification settings updated successfully. Email scheduler restarted with new time.' });
        // Update local settings with saved data
        if (result.data) {
          setSettings(result.data);
          broadcastSettingsUpdate(result.data);
        }
      } else {
        throw new Error(result.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving notification settings:', err);
      setMessage({ type: 'error', text: 'Failed to save notification settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleDayToggle = (day: number) => {
    const newDays = settings.notification_days.includes(day)
      ? settings.notification_days.filter(d => d !== day)
      : [...settings.notification_days, day].sort((a, b) => b - a);
    
    setSettings({ ...settings, notification_days: newDays });
  };

  const dayOptions = [
    { value: 45, label: '45 days before' },
    { value: 30, label: '30 days before' },
    { value: 15, label: '15 days before' },
    { value: 7, label: '7 days before' },
    { value: 5, label: '5 days before' },
    { value: 1, label: '1 day before' },
    { value: 0, label: 'On expiry date' }
  ];

  const handleCheckExpiringLicenses = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/notifications/check-expiring-licenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: result.message || `Checked licenses and sent ${result.emailsSent || 0} email(s)` 
        });
        // Refresh history if showing
        if (showHistory) {
          fetchEmailHistory();
        }
      } else {
        throw new Error(result.message || 'Failed to check licenses');
      }
    } catch (err) {
      console.error('Error checking expiring licenses:', err);
      setMessage({ type: 'error', text: 'Failed to check expiring licenses' });
    } finally {
      setTesting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationLabel = (type: string) => {
    const map: Record<string, string> = {
      '0_days': 'Expiring Today',
      '1_day': '1 Day Before',
      '5_days': '5 Days Before',
      '7_days': '7 Days Before',
      '15_days': '15 Days Before',
      '30_days': '30 Days Before',
      '45_days': '45 Days Before'
    };
    return map[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center mb-6">
        <Bell className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Notification Settings
        </h2>
      </div>

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
        {/* Email Notifications Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Email Notifications
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Receive email reminders for license expirations
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.email_notifications_enabled}
              onChange={(e) => setSettings({ 
                ...settings, 
                email_notifications_enabled: e.target.checked 
              })}
              className="sr-only peer"
              aria-label="Enable email notifications"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Notification Days */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            Notification Schedule
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Choose when to receive expiry reminders
          </p>
          <div className="space-y-3">
            {dayOptions.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notification_days.includes(option.value)}
                  onChange={() => handleDayToggle(option.value)}
                  disabled={!settings.email_notifications_enabled}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  aria-label={`Notify ${option.label}`}
                />
                <span className={`ml-3 text-sm ${
                  settings.email_notifications_enabled 
                    ? 'text-gray-900 dark:text-white' 
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Notification Time */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            Notification Time
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            What time should we send daily notifications?
          </p>
          <input
            type="time"
            value={settings.notification_time}
            onChange={(e) => setSettings({ ...settings, notification_time: e.target.value })}
            disabled={!settings.email_notifications_enabled}
            className="block w-32 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 disabled:opacity-50"
            aria-label="Notification time"
          />
        </div>

        {/* Timezone */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            Timezone
          </h3>
          <select
            value={settings.timezone}
            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
            disabled={!settings.email_notifications_enabled}
            className="block w-64 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 disabled:opacity-50"
            aria-label="Timezone selection"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Asia/Tokyo">Tokyo</option>
            <option value="Asia/Kolkata">India Standard Time</option>
            <option value="Australia/Sydney">Sydney</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-200 dark:border-dark-600 flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !settings.email_notifications_enabled}
            className="flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-dark-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          <button
            onClick={handleCheckExpiringLicenses}
            disabled={testing || !settings.email_notifications_enabled}
            className="flex items-center px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:ring-offset-2 dark:focus:ring-offset-dark-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Mail className="h-4 w-4 mr-2" />
            {testing ? 'Checking...' : 'Check & Send Emails Now'}
          </button>
        </div>
      </div>

      {/* Email History Section */}
      <div className="mt-8 pt-8 border-t border-gray-200 dark:border-dark-600">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center text-lg font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <History className="h-5 w-5 mr-2" />
          Send Email History
          <span className="ml-2 text-gray-400">{showHistory ? '▼' : '▶'}</span>
        </button>

        {showHistory && (
          <div className="mt-6">
            {historyLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : emailHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No email history yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {emailHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {item.tool_name || 'Unknown Tool'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.client_name ? `Client: ${item.client_name}` : 'No client'}
                          {item.client_email && ` (${item.client_email})`}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.email_status === 'sent' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {item.email_status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDate(item.email_sent_at)}
                      </div>
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded">
                        {getNotificationLabel(item.notification_type)}
                      </span>
                    </div>
                    {item.email_subject && (
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        {item.email_subject}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationSettings;
