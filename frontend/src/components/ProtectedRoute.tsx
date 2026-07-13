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

  // Not logged in → go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Broker accessing /broker dashboard: must be approved
  if (allowedRoles?.includes('broker') && user.role === 'broker' && !user.isApproved) {
    return <Navigate to="/broker/pending" replace />;
  }

  // Wrong role for this route → redirect to their own dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'owner') return <Navigate to="/owner" replace />;
    if (user.role === 'broker') {
      return user.isApproved
        ? <Navigate to="/broker" replace />
        : <Navigate to="/broker/pending" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
