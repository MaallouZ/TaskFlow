import { Link } from 'react-router-dom';

// page 404
export default function NotFoundPage() {
  return (
    <section className="page">
      <h1>Page introuvable</h1>
      <p>Cette adresse n’existe pas.</p>
      <Link to="/tasks">Retour aux tâches</Link>
    </section>
  );
}
