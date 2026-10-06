import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { login } from '../services/authService.js';
import { getMe } from '../services/userService.js';
import { setToken } from '../services/api.js';

// page de connexion
function LoginPage({ user, setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // déjà connecté
  if (user) return <Navigate to="/tasks" />;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !password) {
      setError('Remplis tous les champs.');
      return;
    }
    try {
      const token = await login(username.trim(), password);
      setToken(token);
      setUser(await getMe());
      navigate('/tasks');
    } catch (err) {
      setError(err.message === 'Invalid credentials' ? 'Identifiants incorrects.' : err.message);
    }
  }

  return (
    <div className="form-page">
      <Card title="Connexion" subtitle="Content de te revoir sur TaskFlow.">
        <ErrorMessage message={error} />

        <form className="form" onSubmit={handleSubmit}>
          <Input id="username" label="Nom d’utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input id="password" label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit">Se connecter</Button>
        </form>

        <p className="card-footer">
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </p>
      </Card>
    </div>
  );
}

export default LoginPage;
