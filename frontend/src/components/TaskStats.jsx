import { isLate } from '../utils/dates.js';

// les 4 compteurs en haut
function TaskStats({ tasks }) {
  const todo = tasks.filter((t) => t.status === 'todo').length;
  const doing = tasks.filter((t) => t.status === 'doing').length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const late = tasks.filter((t) => isLate(t)).length;

  return (
    <div className="stats">
      <div className="stat stat-todo"><strong>{todo}</strong><p>À faire</p></div>
      <div className="stat stat-doing"><strong>{doing}</strong><p>En cours</p></div>
      <div className="stat stat-done"><strong>{done}</strong><p>Terminé</p></div>
      <div className="stat stat-late"><strong>{late}</strong><p>En retard</p></div>
    </div>
  );
}

export default TaskStats;
