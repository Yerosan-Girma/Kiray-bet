import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#070C17]">
        <div className="w-10 h-10 border-4 border-[#E8B84B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user has no permission, redirect to appropriate dashboard or home
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'owner') return <Navigate to="/owner" replace />;
    if (user.role === 'broker') return <Navigate to="/broker" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
