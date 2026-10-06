import { useState } from 'react';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import DeleteAccountModal from '../components/DeleteAccountModal.jsx';
import { login } from '../services/authService.js';
import { deleteUser, updateUser } from '../services/userService.js';
import { formatLongDate } from '../utils/dates.js';
import { isValidEmail } from '../utils/validation.js';

// page mon compte
function AccountPage({ user, setUser, onLogout }) {
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState({ username: user.username, email: user.email });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // enregistrer les modifications
  async function handleSave(e) {
    e.preventDefault();
    const newErrors = {};
    if (!form.username.trim()) newErrors.username = 'Le nom d’utilisateur est obligatoire.';
    if (!isValidEmail(form.email)) newErrors.email = 'Email invalide.';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const updated = await updateUser(user._id, { username: form.username.trim(), email: form.email.trim() });
      setUser(updated);
      setEditing(false);
      setSuccess('Modifications enregistrées.');
    } catch (err) {
      setError(err.message);
    }
  }

  // suppression : on vérifie le mot de passe avec un login
  async function handleDelete(password) {
    try {
      await login(user.username, password);
    } catch {
      throw new Error('Mot de passe incorrect.');
    }
    await deleteUser(user._id);
    onLogout();
  }

  return (
    <div className="form-page">
      <Card title="Mon compte" subtitle="Tes informations personnelles.">
        <ErrorMessage message={error} />
        {success && <p className="notice">{success}</p>}

        {editing ? (
          <form className="form" onSubmit={handleSave}>
            <Input id="username" label="Nom d’utilisateur" value={form.username} onChange={handleChange} error={errors.username} />
            <Input id="email" label="Email" type="email" value={form.email} onChange={handleChange} error={errors.email} />
            <div className="form-actions">
              <Button variant="ghost" onClick={() => setEditing(false)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        ) : (
          <>
            <div className="info-list">
              <p><span>Nom d’utilisateur</span>{user.username}</p>
              <p><span>Email</span>{user.email}</p>
              {user.createdAt && <p><span>Membre depuis</span>{formatLongDate(user.createdAt)}</p>}
            </div>
            <div className="form-actions">
              <Button variant="ghost" onClick={() => setEditing(true)}>Modifier</Button>
            </div>
          </>
        )}
      </Card>

      <div className="danger-box">
        <div>
          <strong>Supprimer mon compte</strong>
          <p className="muted">Ton compte sera supprimé définitivement.</p>
        </div>
        <Button variant="danger" onClick={() => setShowDelete(true)}>Supprimer mon compte</Button>
      </div>

      {showDelete && <DeleteAccountModal onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />}
    </div>
  );
}

export default AccountPage;
