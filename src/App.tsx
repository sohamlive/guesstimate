import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicHeroPage } from './pages/PublicHeroPage';
import { UserLoginPage } from './pages/UserLoginPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { UserDashboard } from './pages/UserDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            {/* Public Views */}
            <Route path="/" element={<PublicHeroPage />} />
            <Route path="/login" element={<UserLoginPage />} />
            <Route path="/admin" element={<AdminLoginPage />} />

            {/* User Protected Views */}
            <Route
              path="/app/dashboard"
              element={
                <ProtectedRoute allowedRoles={['user', 'admin']} fallbackRedirect="/">
                  <UserDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Views */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']} fallbackRedirect="/">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>

        {/* Dynamic Global toast reports */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#111827',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '13px',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            },
            success: {
              iconTheme: {
                primary: '#16A34A',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#DC2626',
                secondary: '#ffffff',
              },
            }
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}
