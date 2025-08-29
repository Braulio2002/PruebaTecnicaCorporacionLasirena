import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface UseAuthGuardOptions {
  requiredRole?: 'admin' | 'employee';
  redirectTo?: string;
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { requiredRole, redirectTo = '/login' } = options;

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate(redirectTo, { replace: true });
        return;
      }

      if (requiredRole && user?.role !== requiredRole) {
        navigate('/unauthorized', { replace: true });
        return;
      }
    }
  }, [isAuthenticated, user, isLoading, requiredRole, redirectTo, navigate]);

  return {
    isAuthenticated,
    user,
    isLoading,
    hasRequiredRole: !requiredRole || user?.role === requiredRole,
  };
}