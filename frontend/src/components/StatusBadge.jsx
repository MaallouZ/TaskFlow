// noms affichés pour chaque statut
export const STATUS_LABELS = {
  todo: 'À faire',
  doing: 'En cours',
  done: 'Terminé',
};

// pastille du statut
function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span>;
}

export default StatusBadge;
