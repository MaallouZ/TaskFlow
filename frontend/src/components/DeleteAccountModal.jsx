import { useState } from 'react';
import Input from './Input.jsx';
import Button from './Button.jsx';

// fenêtre pour confirmer la suppression avec le mot de passe
function DeleteAccountModal({ onConfirm, onCancel }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password) {
      setError('Entre ton mot de passe.');
      return;
    }
    try {
      await onConfirm(password);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={handleSubmit}>
        <h2>Supprimer ton compte ?</h2>
        <p className="muted">Cette action est définitive. Entre ton mot de passe pour confirmer.</p>

        <Input
          id="delete-password"
          label="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error}
        />

        <div className="form-actions">
          <Button variant="ghost" onClick={onCancel}>Annuler</Button>
          <Button type="submit" variant="danger">Supprimer</Button>
        </div>
      </form>
    </div>
  );
}

export default DeleteAccountModal;
