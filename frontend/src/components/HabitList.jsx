import { useState } from 'react';
import { Link } from 'react-router-dom';
import { countThisWeek } from '../utils/habits.js';

// liste des habitudes façon to-do : on clique le rond pour cocher aujourd'hui
function HabitList({ title, subtitle, habits, today, onToggle, onDelete }) {
  const [openMenu, setOpenMenu] = useState(null); // id de l'habitude dont le menu ⋯ est ouvert

  // rien dans cette section : on ne l'affiche pas
  if (habits.length === 0) return null;

  return (
    <div className="habit-section">
      <div className="habit-section-head">
        <h2 className="section-title">{title}</h2>
        <span className="habit-section-sub">{subtitle}</span>
      </div>

      <ul className="habit-list">
        {habits.map((habit) => {
          const doneToday = habit.completedDates.includes(today);
          const weekly = habit.frequency === 'weekly';
          const target = weekly ? habit.targetPerPeriod || 1 : 7; // quotidien = 7 fois par semaine
          const doneWeek = countThisWeek(habit, today);

          return (
            <li key={habit._id} className={doneToday ? 'habit habit-done' : 'habit'}>
              {/* le rond à cocher */}
              <button
                type="button"
                className={doneToday ? 'habit-check checked' : 'habit-check'}
                onClick={() => onToggle(habit, today)}
                aria-label={doneToday ? 'Décocher' : 'Cocher'}
              >
                {doneToday && '✓'}
              </button>

              <div className="habit-main">
                <p className="habit-name">{habit.name}</p>
                <p className="habit-info">
                  {!weekly && (doneToday ? 'Fait aujourd’hui · ' : 'À faire aujourd’hui · ')}
                  {doneWeek} / {target} cette semaine
                </p>
              </div>

              {/* un point par fois à faire dans la semaine */}
              <div className="goal-dots" aria-hidden="true">
                {Array.from({ length: target }, (_, i) => (
                  <span key={i} className={i < doneWeek ? 'goal-dot filled' : 'goal-dot'} />
                ))}
              </div>

              {/* menu ⋯ avec modifier / supprimer */}
              <div className="habit-more">
                <button
                  type="button"
                  className="more-btn"
                  onClick={() => setOpenMenu(openMenu === habit._id ? null : habit._id)}
                  aria-label="Plus d’options"
                >
                  ⋯
                </button>
                {openMenu === habit._id && (
                  <div className="more-menu">
                    <Link to={`/habits/${habit._id}/edit`}>Modifier</Link>
                    <button type="button" className="link-danger" onClick={() => onDelete(habit)}>Supprimer</button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default HabitList;
