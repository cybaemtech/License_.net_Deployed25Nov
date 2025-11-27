import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Users, Building2 } from 'lucide-react';
import UserManagement from '../components/settings/UserManagement';
import CompanyInformation from '../components/settings/CompanyInformation';
import { getSession } from '../utils/session';

type TabType = 'users' | 'company';

function Settings() {
  const session = getSession();
  const isAdmin = session?.role === 'admin';
  
  const [activeTab, setActiveTab] = useState<TabType>(isAdmin ? 'users' : 'company');

  const tabs = [
    ...(isAdmin ? [{ id: 'users' as TabType, label: 'User Management', icon: Users }] : []),
    { id: 'company' as TabType, label: 'Company Information', icon: Building2 },
  ];

  useEffect(() => {
    if (!isAdmin && activeTab === 'users') {
      setActiveTab('company');
    }
  }, [isAdmin, activeTab]);

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <SettingsIcon className="h-8 w-8 text-blue-600 mr-3" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'company' && <CompanyInformation />}
        </div>
      </div>
    </div>
  );
}

export default Settings;
