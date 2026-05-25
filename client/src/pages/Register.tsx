// client/src/pages/Register.tsx
import React, { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // За замовчуванням - студент
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Звертаємося до нашого бекенду для створення користувача
      await api.post('/users', { name, email, password, role });
      
      // Після успішної реєстрації перенаправляємо на сторінку входу
      alert('Реєстрація успішна! Тепер ви можете увійти.');
      navigate('/login');
    } catch (err: any) {
      // Обробка помилки (наприклад, якщо email вже існує)
      setError(err.response?.data?.message || 'Помилка під час реєстрації');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
      <h2 style={{ textAlign: 'center' }}>Реєстрація</h2>
      
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>ПІБ:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Іванов Іван Іванович"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="student@lpnu.ua"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Пароль:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Роль у системі:</label>
          <select 
            className="form-control"
            value={role} 
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="student">Студент</option>
            <option value="teacher">Викладач</option>
            <option value="admin">Адміністратор</option>
          </select>
          {role === 'teacher' && (
            <div style={{ fontSize: '12px', color: 'var(--primary-color)', marginTop: '8px' }}>
              * Вкажіть ПІБ точно так само, як у базі керівників (напр. "Дорошенко А. В."), щоб система автоматично знайшла ваших студентів.
            </div>
          )}
        </div>

        {error && <div style={{ color: 'red', fontSize: '14px' }}>{error}</div>}

        <button type="submit" disabled={loading} style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          {loading ? 'Створення акаунта...' : 'Зареєструватися'}
        </button>
      </form>

      <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px' }}>
        Вже маєте акаунт? <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Увійти</Link>
      </div>
    </div>
  );
}