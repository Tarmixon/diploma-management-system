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
    <div className="flex justify-center items-center mt-24">
      <div className="bg-white p-10 rounded shadow-sm border border-gray-200 w-[400px]">
        <h2 className="text-2xl font-bold mb-8 text-center text-gray-900">Новий пароль</h2>
        
        {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm text-center">{message}</div>}
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm text-center">{error}</div>}
        
        {!message && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Новий пароль:</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#198754] text-white font-bold py-3 px-4 rounded hover:bg-green-700 transition-colors uppercase text-sm mt-2 disabled:opacity-50"
            >
              {isLoading ? 'Збереження...' : 'Зберегти пароль'}
            </button>
          </form>
        )}
        
        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-gray-600 hover:text-blue-600 hover:underline">
            Повернутися до входу
          </Link>
        </div>
      </div>
    </div>
  );
}
