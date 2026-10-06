// message d'erreur en haut d'un formulaire
function ErrorMessage({ message }) {
  if (!message) return null;
  return <p className="alert">{message}</p>;
}

export default ErrorMessage;
