import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { initEmailJS } from './services/emailjs';
import { GOOGLE_CLIENT_ID } from './config/keys';

// Lazy load pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const CitizenPortal = lazy(() => import('./pages/citizen/CitizenPortal'));
const OfficerDashboard = lazy(() => import('./pages/officer/OfficerDashboard'));
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'));

// Initialize EmailJS
initEmailJS();

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2346] to-[#1a3c6e]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/70 font-medium text-lg">Loading CityFix…</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, userData, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && userData && !allowedRoles.includes(userData.role)) {
    if (userData.role === 'admin') return <Navigate to="/admin" replace />;
    if (userData.role === 'officer') return <Navigate to="/officer" replace />;
    return <Navigate to="/citizen" replace />;
  }
  return children;
}

function RoleRedirect() {
  const { user, userData, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (userData?.role === 'admin') return <Navigate to="/admin" replace />;
  if (userData?.role === 'officer') return <Navigate to="/officer" replace />;
  return <Navigate to="/citizen" replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={user ? <RoleRedirect /> : <LoginPage />} />
        <Route path="/dashboard" element={<RoleRedirect />} />

        <Route path="/citizen/*" element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <CitizenPortal />
          </ProtectedRoute>
        } />

        <Route path="/officer/*" element={
          <ProtectedRoute allowedRoles={['officer']}>
            <OfficerDashboard />
          </ProtectedRoute>
        } />

        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPanel />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a3c6e',
              color: '#fff',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 10px 30px rgba(26,60,110,0.3)',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}