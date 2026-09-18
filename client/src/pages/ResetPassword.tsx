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
      // Через 3 секунди перекидаємо на сторінку логіну
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Сталася помилка при зміні пароля');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Новий пароль</h2>
        {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">{message}</div>}
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
        
        {!message && (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Введіть новий пароль</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Збереження...' : 'Зберегти пароль'}
            </button>
          </form>
        )}
        <div className="mt-4 text-center">
          <Link to="/login" className="text-blue-500 hover:text-blue-700 text-sm">
            Повернутися до входу
          </Link>
        </div>
      </div>
    </div>
  );
}
