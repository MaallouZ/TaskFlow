import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import PriorityBadge from './PriorityBadge.jsx';
import { formatLongDate, formatShortDate, isDueToday, isLate } from '../utils/dates.js';

// liste des tâches (une carte par tâche)
function TaskList({ tasks, onDelete }) {
  if (tasks.length === 0) {
    return <p className="empty">Aucune tâche à afficher.</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li key={task._id} className={`task task-${task.status}`}>
          <div className="task-main">
            <p className="task-title">{task.title}</p>
            {task.description && <p className="task-desc">{task.description}</p>}
            {task.status === 'done' && task.completedAt && (
              <p className="task-done-on">Terminée le {formatLongDate(task.completedAt)}</p>
            )}
          </div>

          <div className="task-meta">
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />

            {/* date d'échéance */}
            {task.deadline && (
              <span className={isLate(task) ? 'date date-late' : 'date'}>
                {formatShortDate(task.deadline)}
                {isLate(task) && ' · En retard'}
                {isDueToday(task) && ' · Aujourd’hui'}
              </span>
            )}
          </div>

          <div className="task-actions">
            <Link to={`/tasks/${task._id}/edit`} className="link">Modifier</Link>
            <button type="button" className="link link-danger" onClick={() => onDelete(task)}>
              Supprimer
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default TaskList;
