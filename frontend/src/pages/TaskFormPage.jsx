import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as api from '../api.js';
import { STATUS_LABELS } from '../components/StatusBadge.jsx';

// mêmes limites que le modèle
const TITLE_MAX = 120;
const DESCRIPTION_MAX = 1000;

const EMPTY_FORM = { title: '', description: '', status: 'todo', deadline: '' };

// même page pour créer (/tasks/new) et modifier (/tasks/:id/edit)
export default function TaskFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({}); // erreurs des champs
  const [error, setError] = useState(''); // erreur de l'API
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // en modif on charge la tâche pour remplir le form
  useEffect(() => {
    if (!isEdit) return;
    api
      .getTask(id)
      .then((task) =>
        setForm({
          title: task.title,
          description: task.description ?? '',
          status: task.status,
          // l'input date veut YYYY-MM-DD
          deadline: task.deadline ? task.deadline.slice(0, 10) : '',
        })
      )
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  // un seul handler pour tous les champs (grâce à name)
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  // validation front (le back valide aussi)
  function validate() {
    const errors = {};
    const title = form.title.trim();
    if (!title) errors.title = 'Le titre est obligatoire.';
    else if (title.length > TITLE_MAX) errors.title = `${TITLE_MAX} caractères maximum.`;
    if (!form.deadline) errors.deadline = 'L’échéance est obligatoire.';
    if (form.description.length > DESCRIPTION_MAX) {
      errors.description = `${DESCRIPTION_MAX} caractères maximum.`;
    }
    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault(); // pas de rechargement

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      deadline: form.deadline,
    };

    setSaving(true);
    setError('');
    try {
      if (isEdit) await api.updateTask(id, payload);
      else await api.createTask(payload);
      navigate('/tasks');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="page loading" aria-live="polite">Chargement de la tâche…</p>;
  }

  return (
    <section className="page page-narrow">
      <Link to="/tasks" className="back-link">← Retour aux tâches</Link>

      <div className="page-head">
        <h1>{isEdit ? 'Modifier la tâche' : 'Nouvelle tâche'}</h1>
      </div>

      {error && <p className="alert" role="alert">{error}</p>}

      {/* noValidate = on gère nos messages d'erreur */}
      <form className="form-card" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="title">Titre</label>
          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            maxLength={TITLE_MAX}
            placeholder="Ex. Préparer la soutenance"
            aria-invalid={Boolean(fieldErrors.title)}
            aria-describedby={fieldErrors.title ? 'title-error' : 'title-hint'}
            autoFocus
          />
          {fieldErrors.title ? (
            <p id="title-error" className="field-error">{fieldErrors.title}</p>
          ) : (
            <p id="title-hint" className="field-hint">{form.title.length}/{TITLE_MAX}</p>
          )}
        </div>

        {/* statut (boutons radio) */}
        <fieldset className="field">
          <legend>Statut</legend>
          <div className="status-picker">
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <label key={value} className={`status-option status-${value}`}>
                <input
                  type="radio"
                  name="status"
                  value={value}
                  checked={form.status === value}
                  onChange={handleChange}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor="description">
            Description <span className="optional">(facultatif)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            value={form.description}
            onChange={handleChange}
            maxLength={DESCRIPTION_MAX}
            placeholder="Détails, liens, étapes…"
            aria-invalid={Boolean(fieldErrors.description)}
            aria-describedby="description-hint"
          />
          <p id="description-hint" className={fieldErrors.description ? 'field-error' : 'field-hint'}>
            {fieldErrors.description ?? `${form.description.length}/${DESCRIPTION_MAX}`}
          </p>
        </div>

        <div className="field">
          <label htmlFor="deadline">Échéance</label>
          <input
            id="deadline"
            name="deadline"
            type="date"
            value={form.deadline}
            onChange={handleChange}
            required
            aria-invalid={Boolean(fieldErrors.deadline)}
            aria-describedby={fieldErrors.deadline ? 'deadline-error' : undefined}
          />
          {fieldErrors.deadline && (
            <p id="deadline-error" className="field-error">{fieldErrors.deadline}</p>
          )}
        </div>

        <div className="form-actions">
          <Link to="/tasks" className="btn btn-ghost">Annuler</Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer les modifications' : 'Créer la tâche'}
          </button>
        </div>
      </form>
    </section>
  );
}
