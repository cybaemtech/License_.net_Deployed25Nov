import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../contexts/PermissionContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredModule?: string;
  requiredAction?: string;
}

function ProtectedRoute({ 
  children, 
  requiredModule,
  requiredAction
}: ProtectedRouteProps) {
  const { permissions, hasModuleAccess, hasActionAccess } = usePermissions();

  if (!requiredModule) {
    return <>{children}</>;
  }

  if (!permissions) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = requiredAction 
    ? hasActionAccess(requiredModule, requiredAction)
    : hasModuleAccess(requiredModule);

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-dark-900">
        <div className="text-center p-8 bg-white dark:bg-dark-800 rounded-lg shadow-lg max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
