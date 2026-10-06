import { STATUS_LABELS } from './StatusBadge.jsx';

// choix du statut (3 boutons radio)
function StatusPicker({ value, onChange }) {
  return (
    <div className="field">
      <p className="field-label">Statut</p>
      <div className="status-picker">
        {Object.keys(STATUS_LABELS).map((status) => (
          <label key={status} className={`status-option status-${status}`}>
            <input type="radio" name="status" value={status} checked={value === status} onChange={onChange} />
            <span>{STATUS_LABELS[status]}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default StatusPicker;
