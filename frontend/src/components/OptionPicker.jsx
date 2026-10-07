// choix parmi quelques options (boutons radio)
// sert pour la priorité et la fréquence
function OptionPicker({ label, name, options, value, onChange }) {
  return (
    <div className="field">
      <p className="field-label">{label}</p>
      <div className="picker">
        {options.map((option) => (
          <label key={option.value} className={`picker-option picker-${option.value}`}>
            <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={onChange} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default OptionPicker;
