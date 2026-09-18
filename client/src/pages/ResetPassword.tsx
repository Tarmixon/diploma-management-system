import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Відсутній токен відновлення');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post('/users/reset-password', { token, newPassword });
      setMessage(response.data.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Сталася помилка при зміні пароля');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2 style={{ textAlign: 'center', marginBottom: '24px', marginTop: 0 }}>Новий пароль</h2>
      
      {message && <div style={{ color: 'green', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>{message}</div>}
      {error && <div style={{ color: 'var(--danger-color, red)', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
      
      {!message && (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Введіть новий пароль:</label>
            <input
              type="password"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          
          <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ width: '100%', padding: '12px', backgroundColor: '#198754', borderColor: '#198754' }}>
            {isLoading ? 'Збереження...' : 'Зберегти пароль'}
          </button>
        </form>
      )}
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link to="/login" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'underline' }}>
          Повернутися до входу
        </Link>
      </div>
    </div>
  );
}
