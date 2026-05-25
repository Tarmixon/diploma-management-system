// client/src/pages/Reports.tsx
import { useEffect, useState } from 'react';
import api from '../api';

interface Project {
  project_id: number;
  title: string;
  status: string;
  student_name?: string;
  supervisor_name?: string;
}

export default function Reports() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('затверджено'); // За замовчуванням показуємо затверджені
  
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await api.get('/projects');
        setProjects(response.data);
      } catch (err) {
        console.error('Помилка завантаження даних для звіту', err);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  const handlePrint = () => {
    window.print(); // Викликає стандартне вікно друку браузера
  };

  const filteredProjects = projects.filter(p => filter === 'all' || p.status === filter);

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Формування звіту...</div>;

  return (
    <div className="form-container">
      {/* Цей блок буде приховано під час друку завдяки класу no-print */}
      <div className="no-print" style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="dashboard-title">Генерація звітів</h2>
          <p className="dashboard-desc" style={{ marginBottom: 0 }}>Оберіть тип даних для формування відомості.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <select 
            className="form-control" 
            style={{ width: 'auto' }}
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="затверджено">Тільки затверджені теми</option>
            <option value="перевірка">Теми на перевірці</option>
            <option value="all">Усі теми в базі</option>
          </select>
          
          <button onClick={handlePrint} className="btn btn-primary">
            🖨️ Роздрукувати звіт
          </button>
        </div>
      </div>

      {/* --- ОФІЦІЙНА ЧАСТИНА ЗВІТУ (ЙДЕ НА ДРУК) --- */}
      <div id="print-area">
        <h3 style={{ textAlign: 'center', textTransform: 'uppercase', marginBottom: '8px' }}>
          ЗВЕДЕНА ВІДОМІСТЬ
        </h3>
        <p style={{ textAlign: 'center', fontSize: '14px', marginBottom: '24px' }}>
          Дипломні проєкти студентів (Статус: <strong>{filter === 'all' ? 'Усі' : filter}</strong>) <br/>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Дата формування: {new Date().toLocaleDateString('uk-UA')}
          </span>
        </p>

        {filteredProjects.length === 0 ? (
          <p className="empty-state" style={{ textAlign: 'center' }}>Немає даних для вибраного фільтра.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '50px', textAlign: 'center' }}>№</th>
                <th style={{ width: '25%' }}>Студент</th>
                <th style={{ width: '45%' }}>Назва затвердженої теми</th>
                <th style={{ width: '25%' }}>Науковий керівник</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project, index) => (
                <tr key={project.project_id}>
                  <td style={{ textAlign: 'center' }}>{index + 1}</td>
                  <td><strong>{project.student_name}</strong></td>
                  <td>{project.title}</td>
                  <td>{project.supervisor_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {/* Місце для підписів на роздрукованому документі */}
        <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
          <div>Підпис адміністратора: __________________</div>
          <div>Печатка: __________________</div>
        </div>
      </div>
    </div>
  );
}