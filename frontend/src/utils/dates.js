// date -> "20 oct. 2026"
export function formatShortDate(value) {
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// date -> "6 octobre 2026"
export function formatLongDate(value) {
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// date du jour en YYYY-MM-DD (heure locale)
export function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// en retard = date passée et pas terminée
export function isLate(task) {
  if (!task.deadline || task.status === 'done') return false;
  return task.deadline.slice(0, 10) < todayString();
}

// à rendre aujourd'hui
export function isDueToday(task) {
  if (!task.deadline || task.status === 'done') return false;
  return task.deadline.slice(0, 10) === todayString();
}
