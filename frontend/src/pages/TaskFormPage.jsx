import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import StatusPicker from '../components/StatusPicker.jsx';
import OptionPicker from '../components/OptionPicker.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { createTask, getTask, updateTask } from '../services/taskService.js';

const PRIORITIES = [
  { value: 'low', label: 'Basse' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
];

// même page pour créer et modifier une tâche
function TaskFormPage() {
  const { id } = useParams(); // id dans l'url si on modifie
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: '', description: '', status: 'todo', priority: 'medium', deadline: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');

  // en modification : on remplit le formulaire
  useEffect(() => {
    if (!id) return;
    getTask(id)
      .then((task) =>
        setForm({
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority || 'medium',
          deadline: task.deadline ? task.deadline.slice(0, 10) : '',
        })
      )
      .catch((err) => setError(err.message));
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // vérification des champs
  function validate() {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Le titre est obligatoire.';
    if (form.title.length > 120) newErrors.title = '120 caractères maximum.';
    if (!form.deadline) newErrors.deadline = 'L’échéance est obligatoire.';
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      if (id) await updateTask(id, form);
      else await createTask(form);
      navigate('/tasks');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="form-page">
      <Link to="/tasks" className="back-link">← Retour aux tâches</Link>

      <Card title={id ? 'Modifier la tâche' : 'Nouvelle tâche'}>
        <ErrorMessage message={error} />

        <form className="form" onSubmit={handleSubmit}>
          <Input id="title" label="Titre" value={form.title} onChange={handleChange} error={errors.title} placeholder="Ex. Préparer la soutenance" />
          <StatusPicker value={form.status} onChange={handleChange} />
          <OptionPicker label="Priorité" name="priority" options={PRIORITIES} value={form.priority} onChange={handleChange} />
          <Input id="description" label="Description" optional multiline value={form.description} onChange={handleChange} placeholder="Détails, liens, étapes…" />
          <Input id="deadline" label="Échéance" type="date" value={form.deadline} onChange={handleChange} error={errors.deadline} />

          <div className="form-actions">
            <Button variant="ghost" onClick={() => navigate('/tasks')}>Annuler</Button>
            <Button type="submit">{id ? 'Enregistrer' : 'Créer la tâche'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default TaskFormPage;
