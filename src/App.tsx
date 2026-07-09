import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import InviteAccess from './pages/InviteAccess';
import InvitePage from './pages/InvitePage';
import EntryPass from './pages/EntryPass';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import EnableTwoFactor from './pages/EnableTwoFactor';
import BudgetPlanner from './pages/BudgetPlanner';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ErrorBoundary from './components/layout/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="planner" element={<BudgetPlanner />} />
            <Route path="invite-access" element={<InviteAccess />} />
            <Route path="invite/:slug" element={<InvitePage />} />
            <Route path="admin/login" element={<AdminLogin />} />
            <Route path="admin/enable-2fa" element={
              <ProtectedRoute>
                <EnableTwoFactor />
              </ProtectedRoute>
            } />
            <Route path="admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Route>
          <Route path="/pass/:slug" element={<EntryPass />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}
