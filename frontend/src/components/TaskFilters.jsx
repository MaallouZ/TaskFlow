import { PRIORITY_LABELS } from './PriorityBadge.jsx';

// filtres : statut (avec "en retard") + priorité + recherche
function TaskFilters({ status, setStatus, priority, setPriority, search, setSearch }) {
  const buttons = [
    { value: 'all', label: 'Toutes' },
    { value: 'todo', label: 'À faire' },
    { value: 'doing', label: 'En cours' },
    { value: 'done', label: 'Terminé' },
    { value: 'late', label: 'En retard' },
  ];

  return (
    <div className="filters">
      <div className="segmented">
        {buttons.map((b) => (
          <button
            key={b.value}
            type="button"
            className={status === b.value ? 'segment active' : 'segment'}
            onClick={() => setStatus(b.value)}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* filtre par priorité */}
      <select className="select" value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priorité">
        <option value="all">Toutes priorités</option>
        {Object.keys(PRIORITY_LABELS).map((p) => (
          <option key={p} value={p}>Priorité {PRIORITY_LABELS[p].toLowerCase()}</option>
        ))}
      </select>

      <input
        className="search"
        type="search"
        placeholder="Rechercher une tâche…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );
}

export default TaskFilters;
