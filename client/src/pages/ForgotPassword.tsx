import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post('/users/forgot-password', { email });
      setMessage(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Сталася помилка при відправці');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2 style={{ textAlign: 'center', marginBottom: '24px', marginTop: 0 }}>Відновлення пароля</h2>
      
      {message && <div style={{ color: 'green', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>{message}</div>}
      {error && <div style={{ color: 'var(--danger-color, red)', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Ваш Email:</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
          {isLoading ? 'Відправка...' : 'Надіслати інструкції'}
        </button>
      </form>
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link to="/login" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'underline' }}>
          Повернутися до входу
        </Link>
      </div>
    </div>
  );
}
