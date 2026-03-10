import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import TaskList from './pages/admin/TaskList';
import ClientList from './pages/admin/ClientList';
import ClientDetail from './pages/admin/ClientDetail';
import BillingPage from './pages/admin/BillingPage';
import UserManagement from './pages/admin/UserManagement';
import TaskTypes from './pages/admin/TaskTypes';
import LawyerTaskForm from './pages/lawyer/TaskForm';
import MyTasks from './pages/lawyer/MyTasks';
import Portal from './pages/client/Portal';

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'lawyer') return <Navigate to="/lawyer" replace />;
  return <Navigate to="/portal" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="tasks" element={<TaskList />} />
            <Route path="clients" element={<ClientList />} />
            <Route path="clients/:id" element={<ClientDetail />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="task-types" element={<TaskTypes />} />
          </Route>

          {/* Lawyer */}
          <Route path="/lawyer" element={<ProtectedRoute roles={['lawyer']}><Layout /></ProtectedRoute>}>
            <Route index element={<LawyerTaskForm />} />
            <Route path="tasks" element={<MyTasks />} />
          </Route>

          {/* Client */}
          <Route path="/portal" element={<ProtectedRoute roles={['client']}><Layout /></ProtectedRoute>}>
            <Route index element={<Portal />} />
          </Route>

          <Route path="*" element={<RoleRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
