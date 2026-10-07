import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import TaskListPage from './pages/TaskListPage.jsx';
import TaskFormPage from './pages/TaskFormPage.jsx';
import HabitListPage from './pages/HabitListPage.jsx';
import HabitFormPage from './pages/HabitFormPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import { clearToken, getToken } from './services/api.js';
import { getMe } from './services/userService.js';

function App() {
  const [user, setUser] = useState(null); // utilisateur connecté
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // au démarrage : si on a un token, on récupère l'utilisateur
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    getMe()
      .then((data) => setUser(data))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  // déconnexion
  function handleLogout() {
    clearToken();
    setUser(null);
    navigate('/login');
  }

  if (loading) {
    return <p className="loading">Chargement…</p>;
  }

  return (
    <div className="layout">
      <Header user={user} onLogout={handleLogout} />

      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/tasks" />} />

          {/* pages publiques */}
          <Route path="/login" element={<LoginPage user={user} setUser={setUser} />} />
          <Route path="/register" element={<RegisterPage user={user} setUser={setUser} />} />

          {/* pages connectées */}
          <Route path="/tasks" element={<ProtectedRoute user={user}><TaskListPage user={user} /></ProtectedRoute>} />
          <Route path="/tasks/new" element={<ProtectedRoute user={user}><TaskFormPage /></ProtectedRoute>} />
          <Route path="/tasks/:id/edit" element={<ProtectedRoute user={user}><TaskFormPage /></ProtectedRoute>} />
          <Route path="/habits" element={<ProtectedRoute user={user}><HabitListPage user={user} /></ProtectedRoute>} />
          <Route path="/habits/new" element={<ProtectedRoute user={user}><HabitFormPage /></ProtectedRoute>} />
          <Route path="/habits/:id/edit" element={<ProtectedRoute user={user}><HabitFormPage /></ProtectedRoute>} />
          <Route
            path="/account"
            element={<ProtectedRoute user={user}><AccountPage user={user} setUser={setUser} onLogout={handleLogout} /></ProtectedRoute>}
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
