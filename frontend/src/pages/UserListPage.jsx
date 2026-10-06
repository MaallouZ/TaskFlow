import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api.js';

// date -> "6 oct. 2026"
function formatDate(value) {
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// initiales pour l'avatar
function initials(username) {
  const parts = username.split(/[\s._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : username.slice(0, 2);
  return letters.toUpperCase();
}

export default function UserListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .getUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(user) {
    if (!window.confirm(`Supprimer l’utilisateur « ${user.username} » ?`)) return;
    try {
      await api.deleteUser(user._id);
      setUsers((current) => current.filter((u) => u._id !== user._id));
    } catch (err) {
      setError(err.message);
    }
  }

  // recherche sur le nom et l'email
  const query = search.trim().toLowerCase();
  const visibleUsers = users
    .filter(
      (u) => !query || u.username.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
    )
    .sort((a, b) => a.username.localeCompare(b.username));

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Utilisateurs</h1>
          {!loading && !error && (
            <p className="page-sub">
              {users.length === 0
                ? 'Aucun utilisateur pour le moment.'
                : `${users.length} utilisateur${users.length > 1 ? 's' : ''}`}
            </p>
          )}
        </div>
        <Link to="/users/new" className="btn btn-primary">Nouvel utilisateur</Link>
      </div>

      {error && <p className="alert" role="alert">{error}</p>}

      {loading ? (
        <p className="loading" aria-live="polite">Chargement des utilisateurs…</p>
      ) : (
        !error && (
          <section className="table-section" aria-labelledby="all-users">
            <h2 id="all-users">Tous les utilisateurs</h2>

            <div className="filters">
              <label className="search">
                <span className="visually-hidden">Rechercher un utilisateur</span>
                <input
                  type="search"
                  placeholder="Rechercher un nom ou un email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>

            <p className="results" aria-live="polite">
              {visibleUsers.length} résultat{visibleUsers.length > 1 ? 's' : ''}
            </p>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Utilisateur</th>
                    <th scope="col">Email</th>
                    <th scope="col">Inscrit le</th>
                    <th scope="col"><span className="visually-hidden">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="table-empty">
                        {users.length === 0 ? (
                          <>Aucun utilisateur enregistré. <Link to="/users/new">Créer un utilisateur</Link></>
                        ) : (
                          'Aucun utilisateur ne correspond à cette recherche.'
                        )}
                      </td>
                    </tr>
                  ) : (
                    visibleUsers.map((user) => (
                      <tr key={user._id}>
                        <td>
                          <span className="user-cell">
                            <span className="avatar" aria-hidden="true">{initials(user.username)}</span>
                            <span className="cell-title">{user.username}</span>
                          </span>
                        </td>
                        <td className="muted">{user.email}</td>
                        <td className="muted">{user.createdAt ? formatDate(user.createdAt) : '—'}</td>
                        <td className="cell-actions">
                          <Link to={`/users/${user._id}/edit`} className="btn btn-ghost btn-sm">Modifier</Link>
                          <button
                            type="button"
                            className="btn btn-danger-ghost btn-sm"
                            onClick={() => handleDelete(user)}
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )
      )}
    </section>
  );
}
