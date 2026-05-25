// client/src/pages/SubmitTopic.tsx
import React, { useState } from 'react';
import api from '../api';

interface ProjectResult {
  project_id: number;
  title: string;
  description: string;
  keywords: string;
  status: string;
  relevance: string;
  supervisor_id: number | null;
  supervisor_name?: string;
}

export default function SubmitTopic() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<ProjectResult | null>(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    setResult(null);

    try {
      const response = await api.post('/projects', {
        title,
        description,
        keywords,
        student_id: currentUser.user_id 
      });

      setMessage(response.data.message);
      setResult(response.data.project);
      
      setTitle('');
      setDescription('');
      setKeywords('');
    } catch (err: any) {
      if (err.response && err.response.status === 409) {
        setError(`${err.response.data.message} Збіг: "${err.response.data.existingTopic}"`);
      } else {
        setError(err.response?.data?.message || 'Submission error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h3 className="dashboard-title" style={{ marginBottom: '24px' }}>Подання теми дипломного проєкту</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Назва теми:</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Введіть повну назву теми"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Опис проєкту:</label>
          <textarea
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Опишіть мету та завдання дипломної роботи"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Ключові слова (через кому):</label>
          <input
            type="text"
            className="form-control"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Наприклад: Node.js, React, бази даних"
          />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? 'Обробка...' : 'Відправити на розгляд'}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--status-rejected-bg)', color: 'var(--status-rejected-text)', borderRadius: '8px' }}>
          <strong>Помилка:</strong> {error}
        </div>
      )}

      {message && result && (
        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--status-approved-bg)', color: 'var(--status-approved-text)', borderRadius: '8px' }}>
          <strong>Успіх!</strong> {message}
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'var(--card-bg)', borderRadius: '6px', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
            <p style={{ margin: '0 0 8px 0' }}><strong>ID теми:</strong> {result.project_id}</p>
            <p style={{ margin: '0 0 8px 0' }}><strong>Статус верифікації:</strong> <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{result.status}</span></p>
            <p style={{ margin: '0 0 8px 0' }}><strong>Оцінка актуальності (API):</strong> {result.relevance}</p>
            <p style={{ margin: 0 }}><strong>Керівник:</strong> {result.supervisor_name ? result.supervisor_name : 'Не знайдено'}</p>
          </div>
        </div>
      )}
    </div>
  );
}