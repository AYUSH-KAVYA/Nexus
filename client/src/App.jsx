import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import AppLayout from './layouts/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import CreateProject from './pages/CreateProject';
import ProjectDashboard from './pages/ProjectDashboard';
import TaskCreate from './pages/TaskCreate';
import TriggerChange from './pages/TriggerChange';
import ImpactCascade from './pages/ImpactCascade';
import PendingApprovals from './pages/PendingApprovals';
import ProjectMemory from './pages/ProjectMemory';
import Alerts from './pages/Alerts';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="projects/new" element={<CreateProject />} />
        <Route path="projects/:id" element={<ProjectDashboard />} />
        <Route path="projects/:id/tasks/new" element={<TaskCreate />} />
        <Route path="projects/:id/changes/new" element={<TriggerChange />} />
        <Route path="projects/:id/changes/:changeId" element={<ImpactCascade />} />
        <Route path="projects/:id/changes/:changeId/impact" element={<ImpactCascade />} />
        <Route path="projects/:id/approvals" element={<PendingApprovals />} />
        <Route path="projects/:id/history" element={<ProjectMemory />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
