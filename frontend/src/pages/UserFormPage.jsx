import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as api from '../api.js';

// mêmes limites que le modèle User
const USERNAME_MAX = 30;
const EMAIL_MAX = 100;
const PASSWORD_MIN = 8;

// format email simple
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// même page pour créer et modifier un user
export default function UserFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // en modif on remplit nom + email
  // (l'API ne renvoie pas le mdp)
  useEffect(() => {
    if (!isEdit) return;
    api
      .getUser(id)
      .then((user) => setForm({ username: user.username, email: user.email, password: '' }))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function validate() {
    const errors = {};
    const username = form.username.trim();
    const email = form.email.trim();

    if (!username) errors.username = 'Le nom d’utilisateur est obligatoire.';
    else if (username.length > USERNAME_MAX) errors.username = `${USERNAME_MAX} caractères maximum.`;

    if (!email) errors.email = 'L’email est obligatoire.';
    else if (email.length > EMAIL_MAX) errors.email = `${EMAIL_MAX} caractères maximum.`;
    else if (!EMAIL_PATTERN.test(email)) errors.email = 'Format d’email invalide (ex. nom@domaine.fr).';

    // mdp obligatoire seulement à la création
    if (!isEdit && !form.password) errors.password = 'Le mot de passe est obligatoire.';
    else if (form.password && form.password.length < PASSWORD_MIN) {
      errors.password = `${PASSWORD_MIN} caractères minimum.`;
    }
    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = {
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
    };
    // mdp envoyé seulement s'il est rempli
    if (form.password) payload.password = form.password;

    setSaving(true);
    setError('');
    try {
      if (isEdit) await api.updateUser(id, payload);
      else await api.createUser(payload);
      navigate('/users');
    } catch (err) {
      // ex : 409 si email déjà pris
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="page loading" aria-live="polite">Chargement de l’utilisateur…</p>;
  }

  return (
    <section className="page page-narrow">
      <Link to="/users" className="back-link">← Retour aux utilisateurs</Link>

      <div className="page-head">
        <h1>{isEdit ? 'Modifier l’utilisateur' : 'Nouvel utilisateur'}</h1>
      </div>

      {error && <p className="alert" role="alert">{error}</p>}

      <form className="form-card" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="username">Nom d’utilisateur</label>
          <input
            id="username"
            name="username"
            type="text"
            value={form.username}
            onChange={handleChange}
            maxLength={USERNAME_MAX}
            autoComplete="username"
            placeholder="Ex. thomas.paul"
            aria-invalid={Boolean(fieldErrors.username)}
            aria-describedby={fieldErrors.username ? 'username-error' : 'username-hint'}
            autoFocus
          />
          {fieldErrors.username ? (
            <p id="username-error" className="field-error">{fieldErrors.username}</p>
          ) : (
            <p id="username-hint" className="field-hint">{form.username.length}/{USERNAME_MAX}</p>
          )}
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            maxLength={EMAIL_MAX}
            autoComplete="email"
            placeholder="nom@domaine.fr"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          />
          {fieldErrors.email && <p id="email-error" className="field-error">{fieldErrors.email}</p>}
        </div>

        <div className="field">
          <label htmlFor="password">
            Mot de passe {isEdit && <span className="optional">(laisser vide pour ne pas le changer)</span>}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'password-error' : 'password-hint'}
          />
          {fieldErrors.password ? (
            <p id="password-error" className="field-error">{fieldErrors.password}</p>
          ) : (
            <p id="password-hint" className="field-hint">{PASSWORD_MIN} caractères minimum</p>
          )}
        </div>

        <div className="form-actions">
          <Link to="/users" className="btn btn-ghost">Annuler</Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer les modifications' : 'Créer l’utilisateur'}
          </button>
        </div>
      </form>
    </section>
  );
}
