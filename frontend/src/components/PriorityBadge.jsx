// noms affichés pour chaque priorité
export const PRIORITY_LABELS = {
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
};

// petite étiquette de priorité
function PriorityBadge({ priority }) {
  if (!priority) return null;
  return <span className={`priority priority-${priority}`}>{PRIORITY_LABELS[priority]}</span>;
}

export default PriorityBadge;
