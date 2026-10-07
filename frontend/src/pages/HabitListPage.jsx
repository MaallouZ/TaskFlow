import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HabitList from '../components/HabitList.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { checkHabit, deleteHabit, getHabits, uncheckHabit } from '../services/habitService.js';
import { timeLeftToday, todayIn } from '../utils/habits.js';

// page liste des habitudes
function HabitListPage({ user }) {
  const [habits, setHabits] = useState([]);
  const [error, setError] = useState('');

  const [, setTick] = useState(0); // sert juste à rafraîchir le compte à rebours

  // aujourd'hui dans le fuseau de l'utilisateur
  const today = todayIn(user.timezone);

  // on rafraîchit la page toutes les 30 secondes (compte à rebours)
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer); // on arrête le timer quand on quitte la page
  }, []);

  // récupération des habitudes
  useEffect(() => {
    getHabits()
      .then((data) => setHabits(data))
      .catch((err) => setError(err.message));
  }, []);

  // cocher / décocher un jour
  async function handleToggle(habit, date) {
    setError('');
    try {
      const updated = habit.completedDates.includes(date)
        ? await uncheckHabit(habit._id, date)
        : await checkHabit(habit._id, date);
      setHabits(habits.map((h) => (h._id === updated._id ? updated : h)));
    } catch (err) {
      setError(err.message);
    }
  }

  // suppression d'une habitude
  async function handleDelete(habit) {
    if (!window.confirm(`Supprimer « ${habit.name} » ?`)) return;
    try {
      await deleteHabit(habit._id);
      setHabits(habits.filter((h) => h._id !== habit._id));
    } catch (err) {
      setError(err.message);
    }
  }

  const doneToday = habits.filter((h) => h.completedDates.includes(today)).length;

  // jours restants dans la semaine (dimanche compris)
  const daysLeft = 7 - ((new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7);

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Habitudes</h1>
          <p className="page-sub">{doneToday} / {habits.length} faite(s) aujourd’hui</p>
        </div>
        <Link to="/habits/new" className="btn btn-primary">+ Nouvelle habitude</Link>
      </div>

      <ErrorMessage message={error} />

      {habits.length === 0 && <p className="empty">Aucune habitude pour le moment.</p>}

      {/* une section par fréquence */}
      <HabitList
        title="Chaque jour"
        subtitle={`Plus que ${timeLeftToday(user.timezone)} avant demain`}
        habits={habits.filter((h) => h.frequency === 'daily')}
        today={today}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
      <HabitList
        title="Cette semaine"
        subtitle={`Plus que ${daysLeft} jour(s) avant lundi`}
        habits={habits.filter((h) => h.frequency === 'weekly')}
        today={today}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
    </section>
  );
}

export default HabitListPage;
