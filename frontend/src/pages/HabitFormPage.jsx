import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import OptionPicker from '../components/OptionPicker.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { createHabit, getHabit, updateHabit } from '../services/habitService.js';

const FREQUENCIES = [
  { value: 'daily', label: 'Chaque jour' },
  { value: 'weekly', label: 'Chaque semaine' },
];

// même page pour créer et modifier une habitude
function HabitFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', description: '', frequency: 'daily', targetPerPeriod: '1' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');

  // en modification : on remplit le formulaire
  useEffect(() => {
    if (!id) return;
    getHabit(id)
      .then((habit) =>
        setForm({
          name: habit.name,
          description: habit.description || '',
          frequency: habit.frequency,
          targetPerPeriod: String(habit.targetPerPeriod || 1),
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
    const target = Number(form.targetPerPeriod);
    if (!form.name.trim()) newErrors.name = 'Le nom est obligatoire.';
    if (form.name.length > 100) newErrors.name = '100 caractères maximum.';
    if (form.description.length > 500) newErrors.description = '500 caractères maximum.';
    if (form.frequency === 'weekly' && (!Number.isInteger(target) || target < 1 || target > 7)) {
      newErrors.targetPerPeriod = 'Entre 1 et 7 fois par semaine.';
    }
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // objectif : 1 par jour, sinon le nombre choisi par semaine
    const habit = {
      name: form.name.trim(),
      description: form.description,
      frequency: form.frequency,
      targetPerPeriod: form.frequency === 'weekly' ? Number(form.targetPerPeriod) : 1,
    };

    try {
      if (id) await updateHabit(id, habit);
      else await createHabit(habit);
      navigate('/habits');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="form-page">
      <Link to="/habits" className="back-link">← Retour aux habitudes</Link>

      <Card title={id ? 'Modifier l’habitude' : 'Nouvelle habitude'}>
        <ErrorMessage message={error} />

        <form className="form" onSubmit={handleSubmit}>
          <Input id="name" label="Nom" value={form.name} onChange={handleChange} error={errors.name} placeholder="Ex. Lire 20 minutes" />
          <Input id="description" label="Description" optional multiline value={form.description} onChange={handleChange} error={errors.description} />
          <OptionPicker label="Fréquence" name="frequency" options={FREQUENCIES} value={form.frequency} onChange={handleChange} />

          {/* objectif seulement pour une habitude par semaine */}
          {form.frequency === 'weekly' && (
            <Input
              id="targetPerPeriod"
              label="Combien de fois par semaine ?"
              type="number"
              value={form.targetPerPeriod}
              onChange={handleChange}
              error={errors.targetPerPeriod}
            />
          )}

          <div className="form-actions">
            <Button variant="ghost" onClick={() => navigate('/habits')}>Annuler</Button>
            <Button type="submit">{id ? 'Enregistrer' : 'Créer l’habitude'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default HabitFormPage;
