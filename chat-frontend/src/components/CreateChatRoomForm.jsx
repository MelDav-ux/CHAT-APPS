import React, { useState } from 'react';
import axios from 'axios';
import { useToast } from './ToastContext';

function CreateChatRoomForm({ onCreated }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return showToast('Le nom du salon est requis', { type: 'error' });

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/rooms', { name }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      showToast('Salon créé', { type: 'success' });
      setName('');
      onCreated && onCreated();
    } catch (err) {
      console.error('Create room error:', err);
      showToast(err.response?.data?.message || err.message || 'Erreur création salon', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du salon" className="form-input" />
      <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Création...' : 'Créer'}</button>
    </form>
  );
}

export default CreateChatRoomForm;
