// bouton réutilisable (variant = primary, ghost, danger)
function Button({ children, type = 'button', variant = 'primary', onClick, disabled }) {
  return (
    <button type={type} className={`btn btn-${variant}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export default Button;
