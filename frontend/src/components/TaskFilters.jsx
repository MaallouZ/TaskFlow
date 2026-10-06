// filtres : statut (avec "en retard") + recherche
function TaskFilters({ status, setStatus, search, setSearch }) {
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
