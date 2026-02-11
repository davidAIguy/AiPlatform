import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AgentsPage } from './pages/AgentsPage';
import { ClientsPage } from './pages/ClientsPage';
import { CallLogsPage } from './pages/CallLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PortalPage } from './pages/PortalPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/clients" element={<ClientsPage />} />
      <Route path="/agents" element={<AgentsPage />} />
      <Route path="/call-logs" element={<CallLogsPage />} />
      <Route path="/portal" element={<PortalPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
