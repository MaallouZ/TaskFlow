import { Navigate } from 'react-router-dom';

// si pas connecté -> page de connexion
function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
}

export default ProtectedRoute;
