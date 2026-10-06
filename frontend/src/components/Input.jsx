// champ de formulaire : label + champ + message
function Input({ id, label, type = 'text', value, onChange, error, hint, placeholder, optional, multiline }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label} {optional && <span className="optional">(facultatif)</span>}
      </label>

      {multiline ? (
        <textarea id={id} name={id} className="input" rows={5} value={value} onChange={onChange} placeholder={placeholder} />
      ) : (
        <input id={id} name={id} className="input" type={type} value={value} onChange={onChange} placeholder={placeholder} />
      )}

      {/* erreur en rouge, sinon petite aide */}
      {error && <p className="field-error">{error}</p>}
      {!error && hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

export default Input;
