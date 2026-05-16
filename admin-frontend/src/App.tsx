import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { client } from './graphql/client';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AdminLayout from './components/layout/AdminLayout';
import LoadingSpinner from './components/common/LoadingSpinner';
import { ToastProvider } from './components/common/ToastProvider';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientListPage from './pages/patients/PatientListPage';
import PatientDetailPage from './pages/patients/PatientDetailPage';
import AppointmentListPage from './pages/appointments/AppointmentListPage';
import AppointmentDetailPage from './pages/appointments/AppointmentDetailPage';
import DoctorQueuePage from './pages/doctor/DoctorQueuePage';
import ExaminePage from './pages/doctor/ExaminePage';
import StaffListPage from './pages/staff/StaffListPage';
import ServicesPage from './pages/services/ServicesPage';
import MonthlyReportPage from './pages/reports/MonthlyReportPage';
import UnavailableBlocksPage from './pages/schedule/UnavailableBlocksPage';
import AuditLogPage from './pages/AuditLogPage';
import SettingsPage from './pages/SettingsPage';
import SurveySettingsPage from './pages/SurveySettingsPage';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, loading, hasRole } = useAuth();
  if (loading) return <LoadingSpinner text="Ачааллаж байна..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.some(r => hasRole(r))) return <Navigate to="/" replace />;
  return <AdminLayout>{children}</AdminLayout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

      {/* Patients */}
      <Route path="/patients" element={<ProtectedRoute roles={['receptionist','doctor','nurse','superadmin']}><PatientListPage /></ProtectedRoute>} />
      <Route path="/patients/:id" element={<ProtectedRoute roles={['receptionist','doctor','nurse','superadmin']}><PatientDetailPage /></ProtectedRoute>} />

      {/* Appointments */}
      <Route path="/appointments" element={<ProtectedRoute roles={['receptionist','doctor','nurse','superadmin']}><AppointmentListPage /></ProtectedRoute>} />
      <Route path="/appointments/:id" element={<ProtectedRoute roles={['receptionist','doctor','nurse','superadmin']}><AppointmentDetailPage /></ProtectedRoute>} />
      <Route path="/schedule/unavailable" element={<ProtectedRoute roles={['doctor','nurse','superadmin']}><UnavailableBlocksPage /></ProtectedRoute>} />

      {/* Doctor */}
      <Route path="/doctor/queue" element={<ProtectedRoute roles={['doctor']}><DoctorQueuePage /></ProtectedRoute>} />
      <Route path="/doctor/examine/:visitId" element={<ProtectedRoute roles={['doctor']}><ExaminePage /></ProtectedRoute>} />

      {/* Staff */}
      <Route path="/staff" element={<ProtectedRoute roles={['superadmin']}><StaffListPage /></ProtectedRoute>} />
      <Route path="/services" element={<ProtectedRoute roles={['superadmin']}><ServicesPage /></ProtectedRoute>} />

      <Route path="/reports" element={<ProtectedRoute roles={['receptionist','doctor','nurse','superadmin']}><MonthlyReportPage /></ProtectedRoute>} />
      <Route path="/survey-settings" element={<ProtectedRoute roles={['superadmin']}><SurveySettingsPage /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute roles={['superadmin']}><AuditLogPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute roles={['receptionist','doctor','nurse','superadmin']}><SettingsPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ApolloProvider client={client}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ApolloProvider>
  );
}
