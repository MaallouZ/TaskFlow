import { NavLink } from 'react-router-dom';

// barre du haut
function Header({ user, onLogout }) {
  return (
    <header className="header">
      <NavLink to="/tasks" className="logo">
        <span className="logo-mark">
          <span className="bar bar-todo" />
          <span className="bar bar-doing" />
          <span className="bar bar-done" />
        </span>
        TaskFlow
      </NavLink>

      <nav>
        {user ? (
          <ul className="nav">
            <li><NavLink to="/tasks">Tâches</NavLink></li>
            <li className="nav-user">
              <NavLink to="/account" className="nav-name">{user.username}</NavLink>
              <button type="button" className="btn-logout" onClick={onLogout}>Déconnexion</button>
            </li>
          </ul>
        ) : (
          <ul className="nav">
            <li><NavLink to="/login">Connexion</NavLink></li>
            <li><NavLink to="/register">Inscription</NavLink></li>
          </ul>
        )}
      </nav>
    </header>
  );
}

export default Header;
