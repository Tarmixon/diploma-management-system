// client/src/pages/ActionHistory.tsx
import { useEffect, useState } from 'react';
import api from '../api';

interface HistoryItem {
  id: number;
  user_name: string;
  project_title: string;
  action: string;
  timestamp: string;
}

export default function ActionHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = async () => {
    try {
      const response = await api.get('/history');
      setHistory(response.data);
    } catch (err: any) {
      console.error(err);
      setError('Data loading error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  if (loading) return <div className="empty-state" style={{ textAlign: 'center' }}>Завантаження журналу...</div>;
  if (error) return <div style={{ color: 'var(--danger-color)', padding: '20px' }}>{error}</div>;

  return (
    <div className="form-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 className="dashboard-title">Журнал історії дій</h3>
        <button onClick={() => { setLoading(true); loadHistory(); }} className="btn" style={{ border: '1px solid var(--border-color)', color: 'var(--text-main)', backgroundColor: 'transparent' }}>
          Оновити дані
        </button>
      </div>
      
      {history.length === 0 ? (
        <p className="empty-state">Журнал дій наразі порожній.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th style={{ width: '200px' }}>Користувач</th>
                <th>Тема проєкту</th>
                <th>Дія</th>
                <th style={{ width: '180px' }}>Дата та час</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => {
                let statusClass = '';
                if (item.action.includes('затверджено')) statusClass = 'status-затверджено';
                else if (item.action.includes('відхилено')) statusClass = 'status-відхилено';
                else if (item.action.includes('Видалення')) statusClass = 'status-видалено'; // Додано обробку видалення
                else statusClass = 'status-checking';

                return (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{item.id}</td>
                    <td><strong>{item.user_name}</strong></td>
                    <td style={{ fontSize: '14px' }}>{item.project_title}</td>
                    <td>
                      <span className={`status-badge ${statusClass}`} style={{ fontSize: '12px' }}>
                        {item.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {new Date(item.timestamp).toLocaleString('uk-UA')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}