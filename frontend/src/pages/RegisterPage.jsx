import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { login, register } from '../services/authService.js';
import { getMe } from '../services/userService.js';
import { setToken } from '../services/api.js';
import { isValidEmail } from '../utils/validation.js';

// page d'inscription
function RegisterPage({ user, setUser }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (user) return <Navigate to="/tasks" />;

  // un seul handler pour tous les champs
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // vérification des champs
  function validate() {
    const newErrors = {};
    if (!form.username.trim()) newErrors.username = 'Le nom d’utilisateur est obligatoire.';
    if (!isValidEmail(form.email)) newErrors.email = 'Email invalide.';
    if (form.password.length < 8) newErrors.password = '8 caractères minimum.';
    if (form.confirm !== form.password) newErrors.confirm = 'Les mots de passe ne sont pas identiques.';
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      // inscription puis connexion
      await register({ username: form.username.trim(), email: form.email.trim().toLowerCase(), password: form.password, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      const token = await login(form.username.trim(), form.password);
      setToken(token);
      setUser(await getMe());
      navigate('/tasks');
    } catch (err) {
      setError(err.message === 'Username or email already exists' ? 'Ce nom ou cet email est déjà utilisé.' : err.message);
    }
  }

  return (
    <div className="form-page">
      <Card title="Créer un compte" subtitle="Quelques secondes et c’est parti.">
        <ErrorMessage message={error} />

        <form className="form" onSubmit={handleSubmit}>
          <Input id="username" label="Nom d’utilisateur" value={form.username} onChange={handleChange} error={errors.username} />
          <Input id="email" label="Email" type="email" value={form.email} onChange={handleChange} error={errors.email} />
          <Input id="password" label="Mot de passe" type="password" value={form.password} onChange={handleChange} error={errors.password} hint="8 caractères minimum" />
          <Input id="confirm" label="Confirmer le mot de passe" type="password" value={form.confirm} onChange={handleChange} error={errors.confirm} />
          <Button type="submit">Créer mon compte</Button>
        </form>

        <p className="card-footer">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </Card>
    </div>
  );
}

export default RegisterPage;
