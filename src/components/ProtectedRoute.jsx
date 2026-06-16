import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-height-screen flex items-center justify-center bg-slate-900 text-slate-100 flex-col gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold tracking-wider uppercase text-slate-400">Loading Portal...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to their default dashboard based on their role
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'teacher') return <Navigate to="/teacher" replace />;
    if (userRole === 'parent') return <Navigate to="/parent" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};
