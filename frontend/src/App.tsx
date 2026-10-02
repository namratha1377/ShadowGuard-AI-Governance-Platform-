import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { DashboardLayout } from './layout/DashboardLayout';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import ActivityPage from './pages/ActivityPage';
import RiskPage from './pages/RiskPage';
import DataSecurityPage from './pages/DataSecurityPage';
import PoliciesPage from './pages/PoliciesPage';
import HarnessConsolePage from './pages/HarnessConsolePage';
import ChatbotPage from './pages/ChatbotPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PromptPage from './pages/PromptPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Authentication & Onboarding */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Consumer Employee Prompt Experience (Standalone, no admin sidebar) */}
            <Route path="/prompt" element={<PromptPage />} />

            {/* Authenticated Admin Dashboard & Operations */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="activity" element={<ActivityPage />} />
              <Route path="risk" element={<RiskPage />} />
              <Route path="data-security" element={<DataSecurityPage />} />
              <Route path="policies" element={<PoliciesPage />} />
              <Route path="harness" element={<HarnessConsolePage />} />
              <Route path="chatbot" element={<ChatbotPage />} />
              <Route path="audit" element={<AuditLogsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Top-level route aliases for workspace convenience */}
            <Route element={<DashboardLayout />}>
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/risk" element={<RiskPage />} />
              <Route path="/data-security" element={<DataSecurityPage />} />
              <Route path="/policies" element={<PoliciesPage />} />
              <Route path="/harness" element={<HarnessConsolePage />} />
              <Route path="/chatbot" element={<ChatbotPage />} />
              <Route path="/audit" element={<AuditLogsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </ThemeProvider>
  );
};

export default App;

