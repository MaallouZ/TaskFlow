import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import TaskListPage from './pages/TaskListPage.jsx';
import TaskFormPage from './pages/TaskFormPage.jsx';
import UserListPage from './pages/UserListPage.jsx';
import UserFormPage from './pages/UserFormPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// routes de l'app
export default function App() {
  return (
    <Layout>
      <Routes>
        {/* / -> /tasks */}
        <Route path="/" element={<Navigate to="/tasks" replace />} />

        {/* tâches */}
        <Route path="/tasks" element={<TaskListPage />} />
        <Route path="/tasks/new" element={<TaskFormPage />} />
        <Route path="/tasks/:id/edit" element={<TaskFormPage />} />

        {/* users */}
        <Route path="/users" element={<UserListPage />} />
        <Route path="/users/new" element={<UserFormPage />} />
        <Route path="/users/:id/edit" element={<UserFormPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
