import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api.js';
import StatusBadge, { STATUS_LABELS } from '../components/StatusBadge.jsx';

const STATUSES = ['todo', 'doing', 'done'];

// date -> "20 oct. 2026"
function formatDate(value) {
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// date du jour en YYYY-MM-DD (heure locale)
function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// en retard = date passée et pas terminée
function isLate(task) {
  if (!task.deadline || task.status === 'done') return false;
  return task.deadline.slice(0, 10) < todayString();
}

// à rendre aujourd'hui
function isDueToday(task) {
  if (!task.deadline || task.status === 'done') return false;
  return task.deadline.slice(0, 10) === todayString();
}

export default function TaskListPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // filtres
  const [statusFilter, setStatusFilter] = useState('all'); // all, todo, doing, done
  const [search, setSearch] = useState('');
  const [lateOnly, setLateOnly] = useState(false);

  // on charge les tâches au début
  useEffect(() => {
    api
      .getTasks()
      .then(setTasks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(task) {
    if (!window.confirm(`Supprimer « ${task.title} » ?`)) return;
    try {
      await api.deleteTask(task._id);
      setTasks((current) => current.filter((t) => t._id !== task._id));
    } catch (err) {
      setError(err.message);
    }
  }

  // nb de tâches par statut
  const counts = Object.fromEntries(
    STATUSES.map((s) => [s, tasks.filter((t) => t.status === s).length])
  );

  // on filtre puis on trie par échéance
  const query = search.trim().toLowerCase();
  const visibleTasks = tasks
    .filter((t) => statusFilter === 'all' || t.status === statusFilter)
    .filter((t) => !query || t.title.toLowerCase().includes(query))
    .filter((t) => !lateOnly || isLate(t))
    .sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    });

  const hasFilters = statusFilter !== 'all' || query || lateOnly;

  function resetFilters() {
    setStatusFilter('all');
    setSearch('');
    setLateOnly(false);
  }

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Tâches</h1>
          {!loading && !error && (
            <p className="page-sub">
              {tasks.length === 0
                ? 'Aucune tâche pour le moment.'
                : `${tasks.length} tâche${tasks.length > 1 ? 's' : ''} au total`}
            </p>
          )}
        </div>
        <Link to="/tasks/new" className="btn btn-primary">Nouvelle tâche</Link>
      </div>

      {error && <p className="alert" role="alert">{error}</p>}

      {loading ? (
        <p className="loading" aria-live="polite">Chargement des tâches…</p>
      ) : (
        !error && (
          <>
            {/* compteurs */}
            <dl className="stats">
              {STATUSES.map((status) => (
                <div key={status} className={`stat stat-${status}`}>
                  <dt>{STATUS_LABELS[status]}</dt>
                  <dd>{counts[status]}</dd>
                </div>
              ))}
              <div className="stat stat-late">
                <dt>En retard</dt>
                <dd>{tasks.filter(isLate).length}</dd>
              </div>
            </dl>

            <section className="table-section" aria-labelledby="all-tasks">
              <h2 id="all-tasks">Toutes les tâches</h2>

              {/* filtres */}
              <div className="filters">
                <div className="segmented" role="group" aria-label="Filtrer par statut">
                  {['all', ...STATUSES].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`segment segment-${value}`}
                      aria-pressed={statusFilter === value}
                      onClick={() => setStatusFilter(value)}
                    >
                      {value === 'all' ? 'Toutes' : STATUS_LABELS[value]}
                    </button>
                  ))}
                </div>

                <label className="search">
                  <span className="visually-hidden">Rechercher par titre</span>
                  <input
                    type="search"
                    placeholder="Rechercher un titre…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>

                <label className="check">
                  <input
                    type="checkbox"
                    checked={lateOnly}
                    onChange={(e) => setLateOnly(e.target.checked)}
                  />
                  En retard uniquement
                </label>
              </div>

              <p className="results" aria-live="polite">
                {visibleTasks.length} résultat{visibleTasks.length > 1 ? 's' : ''}
                {hasFilters && (
                  <button type="button" className="link-btn" onClick={resetFilters}>
                    Effacer les filtres
                  </button>
                )}
              </p>

              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Titre</th>
                      <th scope="col">Statut</th>
                      <th scope="col">Description</th>
                      <th scope="col">Échéance</th>
                      <th scope="col"><span className="visually-hidden">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTasks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="table-empty">
                          {tasks.length === 0 ? (
                            <>Aucune tâche enregistrée. <Link to="/tasks/new">Créer une tâche</Link></>
                          ) : (
                            'Aucune tâche ne correspond à ces filtres.'
                          )}
                        </td>
                      </tr>
                    ) : (
                      visibleTasks.map((task) => (
                        <tr key={task._id} className={isLate(task) ? 'row-late' : undefined}>
                          <td className="cell-title">{task.title}</td>
                          <td><StatusBadge status={task.status} /></td>
                          <td className="cell-desc">{task.description || <span className="muted">—</span>}</td>
                          <td className={isLate(task) ? 'is-late' : ''}>
                            {task.deadline ? (
                              <time dateTime={task.deadline.slice(0, 10)}>{formatDate(task.deadline)}</time>
                            ) : (
                              <span className="muted">—</span>
                            )}
                            {isLate(task) && <span className="tag tag-late">En retard</span>}
                            {isDueToday(task) && <span className="tag tag-today">Aujourd’hui</span>}
                          </td>
                          <td className="cell-actions">
                            <Link to={`/tasks/${task._id}/edit`} className="btn btn-ghost btn-sm">Modifier</Link>
                            <button
                              type="button"
                              className="btn btn-danger-ghost btn-sm"
                              onClick={() => handleDelete(task)}
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )
      )}
    </section>
  );
}
