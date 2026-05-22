import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('user' | 'admin')[];
  fallbackRedirect: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles, 
  fallbackRedirect 
}) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EEF0F5] flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center">
          {/* Animated custom visual spinner */}
          <div className="w-12 h-12 rounded-full border-4 border-[#1A2E6C] border-t-transparent animate-spin mb-4"></div>
          <span className="text-sm font-medium text-[#1A2E6C]/80 font-mono tracking-wider">VERIFYING SESSION...</span>
        </div>
      </div>
    );
  }

  if (!session || !session.profile) {
    // Save location to redirect after login if desired, or just go to specified fallback
    return <Navigate to={fallbackRedirect} state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(session.profile.role)) {
    // Role not authorized - redirect to standard dashboard or login
    const targetRedirect = session.profile.role === 'admin' ? '/admin/dashboard' : '/app/dashboard';
    return <Navigate to={targetRedirect} replace />;
  }

  return <>{children}</>;
};
