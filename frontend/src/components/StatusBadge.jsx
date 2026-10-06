// noms affichés pour chaque statut
export const STATUS_LABELS = {
  todo: 'À faire',
  doing: 'En cours',
  done: 'Terminé',
};

// badge du statut (couleur dans le css)
export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status] ?? status}</span>;
}
