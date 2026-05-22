'use client';

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDashboardStats } from '../hooks/useDashboardStats';
import Login from '../components/Login';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const {
    isAuthenticated,
    userEmail,
    isLoading: isAuthLoading,
    error: authError,
    login,
    logout,
    refreshSession
  } = useAuth();

  const {
    stats,
    isLoading: isStatsLoading,
    error: statsError,
    refreshStats
  } = useDashboardStats();

  // If session is checking on initial load, show a simple loading spinner
  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-800">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-gray-500">Checking credentials...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, show Dashboard
  if (isAuthenticated) {
    return (
      <Dashboard
        stats={stats}
        isLoading={isStatsLoading}
        error={statsError}
        userEmail={userEmail}
        onLogout={logout}
        onRefresh={refreshStats}
      />
    );
  }

  // Otherwise, show Login panel
  return (
    <Login
      onLogin={login}
      isLoading={isAuthLoading}
      error={authError}
    />
  );
}
