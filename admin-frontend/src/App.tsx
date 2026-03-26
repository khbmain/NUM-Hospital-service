import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { client } from './graphql/client';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AdminLayout from './components/layout/AdminLayout';
import LoadingSpinner from './components/common/LoadingSpinner';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientListPage from './pages/patients/PatientListPage';
import AppointmentListPage from './pages/appointments/AppointmentListPage';
import DoctorQueuePage from './pages/doctor/DoctorQueuePage';
import ExaminePage from './pages/doctor/ExaminePage';
import StaffListPage from './pages/staff/StaffListPage';

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
      <Route path="/patients" element={<ProtectedRoute roles={['data_operator','doctor','nurse','superadmin']}><PatientListPage /></ProtectedRoute>} />

      {/* Appointments */}
      <Route path="/appointments" element={<ProtectedRoute roles={['data_operator','doctor','superadmin']}><AppointmentListPage /></ProtectedRoute>} />

      {/* Doctor */}
      <Route path="/doctor/queue" element={<ProtectedRoute roles={['doctor']}><DoctorQueuePage /></ProtectedRoute>} />
      <Route path="/doctor/examine/:visitId" element={<ProtectedRoute roles={['doctor']}><ExaminePage /></ProtectedRoute>} />

      {/* Staff */}
      <Route path="/staff" element={<ProtectedRoute roles={['superadmin']}><StaffListPage /></ProtectedRoute>} />

      {/* Placeholder pages - to be built */}
      <Route path="/departments" element={<ProtectedRoute roles={['superadmin']}><Placeholder title="Тасгийн удирдлага" /></ProtectedRoute>} />
      <Route path="/nurse/queue" element={<ProtectedRoute roles={['nurse']}><Placeholder title="Сувилагчийн дараалал" /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute roles={['nurse','superadmin']}><Placeholder title="Эм, материал" /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute roles={['data_operator','doctor','superadmin']}><Placeholder title="Тайлан" /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute roles={['superadmin']}><Placeholder title="Аудит лог" /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute roles={['superadmin']}><Placeholder title="Тохиргоо" /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-xl font-display text-surface-900 mb-2">{title}</h1>
      <p className="text-sm text-surface-500">Phase 2 хөгжүүлэлтэд бүтээгдэнэ</p>
    </div>
  );
}

export default function App() {
  return (
    <ApolloProvider client={client}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ApolloProvider>
  );
}
