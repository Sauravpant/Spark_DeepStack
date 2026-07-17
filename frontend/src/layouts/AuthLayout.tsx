import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Outlet />
    </div>
  );
}
