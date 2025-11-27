import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const publicRoutes = ['/login'];

function AuthWrapper({ children }: AuthWrapperProps) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuthentication = () => {
      // Skip auth check for public routes
      if (publicRoutes.includes(location.pathname)) {
        return;
      }

      // Check if user is authenticated using localStorage
      const session = localStorage.getItem('auth_session');
      let isAuthenticated = false;
      
      if (session) {
        try {
          const userData = JSON.parse(session);
          // Check for token presence in addition to email and id for stronger authentication
          isAuthenticated = userData && userData.email && userData.id && userData.token;
        } catch {
          // Invalid session data, remove it
          localStorage.removeItem('auth_session');
        }
      }
      
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        navigate('/login', {
          state: { from: location.pathname }
        });
      }
    };

    checkAuthentication();
  }, [location.pathname]);

  return <>{children}</>;
}

export default AuthWrapper;