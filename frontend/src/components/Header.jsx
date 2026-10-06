import { NavLink } from 'react-router-dom';

// header : logo + menu
// NavLink met la classe active sur la page en cours
export default function Header() {
  return (
    <header className="header">
      <NavLink to="/tasks" className="logo" aria-label="TaskFlow, accueil">
        {/* logo = 3 barres (les 3 statuts) */}
        <span className="logo-mark" aria-hidden="true">
          <span className="bar bar-todo" />
          <span className="bar bar-doing" />
          <span className="bar bar-done" />
        </span>
        TaskFlow
      </NavLink>

      <nav aria-label="Navigation principale">
        <ul className="nav">
          <li><NavLink to="/tasks">Tâches</NavLink></li>
          <li><NavLink to="/users">Utilisateurs</NavLink></li>
        </ul>
      </nav>
    </header>
  );
}
