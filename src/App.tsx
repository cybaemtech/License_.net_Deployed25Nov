import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { PermissionProvider } from './contexts/PermissionContext';
import AuthWrapper from './components/AuthWrapper';
import Navbar from './components/Navbar';
import PageLayout from './components/PageLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Vendors from './pages/Vendors';
import VendorDetail from './pages/VendorDetail';
import Licenses from './pages/Licenses';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NotificationCenter from './pages/NotificationCenter';

function AppContent() {
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize dark mode from localStorage or system preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      return JSON.parse(savedDarkMode);
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const location = useLocation();
  const showNavbar = location.pathname !== '/login';

  // Apply dark mode to document and save to localStorage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode
        ? 'bg-dark-900 text-gray-100'
        : 'bg-gray-50 text-gray-900'
      }`}>
      {showNavbar && <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />}
      <AuthWrapper>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute requiredModule="dashboard"><PageLayout><Dashboard /></PageLayout></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute requiredModule="dashboard"><PageLayout><Dashboard /></PageLayout></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute requiredModule="clients"><PageLayout><Clients /></PageLayout></ProtectedRoute>} />
          <Route path="/clients/:id" element={<ProtectedRoute requiredModule="clients"><PageLayout><ClientDetail /></PageLayout></ProtectedRoute>} />
          <Route path="/vendors" element={<ProtectedRoute requiredModule="vendors"><PageLayout><Vendors /></PageLayout></ProtectedRoute>} />
          <Route path="/vendors/:id" element={<ProtectedRoute requiredModule="vendors"><PageLayout><VendorDetail /></PageLayout></ProtectedRoute>} />
          <Route path="/licenses" element={<ProtectedRoute requiredModule="licenses"><PageLayout><Licenses /></PageLayout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute requiredModule="reports"><PageLayout><Reports /></PageLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute requiredModule="settings"><PageLayout><Settings /></PageLayout></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute requiredModule="notifications"><PageLayout><NotificationCenter /></PageLayout></ProtectedRoute>} />
        </Routes>
      </AuthWrapper>
    </div>
  );
}

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <PermissionProvider>
        <AppContent />
      </PermissionProvider>
    </Router>
  );
}

export default App;