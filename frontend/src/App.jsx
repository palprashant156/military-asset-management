import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Purchases from './pages/Purchases';
import Transfers from './pages/Transfers';
import Assignments from './pages/Assignments';
import AuditLogs from './pages/AuditLogs';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />

            <Route
              path="/purchases"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'LOGISTICS_OFFICER']}>
                  <Purchases />
                </ProtectedRoute>
              }
            />

            <Route
              path="/transfers"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'LOGISTICS_OFFICER']}>
                  <Transfers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/assignments"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'BASE_COMMANDER']}>
                  <Assignments />
                </ProtectedRoute>
              }
            />

            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a2332',
            color: '#e2e8f0',
            border: '1px solid rgba(51, 65, 85, 0.5)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </AuthProvider>
  );
}
