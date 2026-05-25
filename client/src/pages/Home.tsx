// client/src/pages/Home.tsx
import { useEffect, useState } from 'react';
import api from '../api';

interface Project {
  project_id: number;
  title: string;
  description: string;
  keywords: string;
  student_id: number;
  supervisor_id: number | null;
  status: 'перевірка' | 'затверджено' | 'відхилено';
  relevance: string | null;
  student_name?: string;
  supervisor_name?: string;
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [supervisors, setSupervisors] = useState<{supervisor_id: number, name: string}[]>([]);
  
  // --- НОВІ СТАНИ ДЛЯ РЕДАГУВАННЯ ---
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', keywords: '' });
  // ---------------------------------

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  const loadProjects = async () => {
    try {
      const response = await api.get('/projects');
      if (currentUser && currentUser.role === 'student') {
        setProjects(response.data.filter((p: Project) => p.student_id === currentUser.user_id));
      } else if (currentUser && currentUser.role === 'teacher') {
        setProjects(response.data.filter((p: Project) => p.supervisor_name === currentUser.name));
      } else {
        setProjects(response.data);
        if (currentUser?.role === 'admin') {
          const supResponse = await api.get('/projects/supervisors/all');
          setSupervisors(supResponse.data);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('Не вдалося завантажити список проєктів.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [currentUser?.role]);

  const handleStatusChange = async (projectId: number, newStatus: 'затверджено' | 'відхилено') => {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
      await api.patch(`/projects/${projectId}/status`, { status: newStatus, admin_id: currentUser.user_id });
      loadProjects();
    } catch (err: any) { alert(err.response?.data?.message || 'Помилка при зміні статусу.'); }
  };

  const handleSupervisorChange = async (projectId: number, newSupervisorId: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
      await api.patch(`/projects/${projectId}/supervisor`, { supervisor_id: newSupervisorId, admin_id: currentUser.user_id });
      loadProjects();
    } catch (err: any) { alert(err.response?.data?.message || 'Помилка при зміні керівника.'); }
  };

  const handleDelete = async (projectId: number) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    if (!window.confirm('Ви впевнені, що хочете видалити цю тему?')) return;
    try {
      await api.delete(`/projects/${projectId}?admin_id=${currentUser.user_id}`);
      loadProjects();
    } catch (err: any) { alert(err.response?.data?.message || 'Помилка при видаленні теми.'); }
  };

  // --- НОВІ ФУНКЦІЇ ДЛЯ РЕДАГУВАННЯ ---
  const startEditing = (project: Project) => {
    setEditingProjectId(project.project_id);
    setEditForm({ title: project.title, description: project.description, keywords: project.keywords });
  };

  const saveEdit = async (projectId: number) => {
    try {
      await api.put(`/projects/${projectId}`, { ...editForm, student_id: currentUser.user_id });
      alert('Тему успішно оновлено та відправлено на перевірку!');
      setEditingProjectId(null);
      loadProjects();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Помилка при оновленні теми.');
    }
  };
  // ------------------------------------

  if (!currentUser) {
    return (
      <div className="form-container" style={{ textAlign: 'center' }}>
        <h3 className="dashboard-title">Вітаємо у платформі <span className="logo-dip">Dip</span><span className="logo-pom">Pom</span></h3>
        <p style={{ color: 'var(--text-muted)' }}>Будь ласка, авторизуйтесь у системі.</p>
      </div>
    );
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Завантаження даних...</div>;
  if (error) return <div style={{ color: 'var(--danger-color)', padding: '20px' }}>{error}</div>;

  return (
    <div className="form-container">
      <h2 className="dashboard-title">
        <span className="logo-dip">Dip</span><span className="logo-pom">Pom</span>:{' '}
        {currentUser.role === 'admin' ? 'Панель адміністратора' : currentUser.role === 'teacher' ? 'Панель викладача' : 'Панель студента'}
      </h2>
      <p className="dashboard-desc">
        {currentUser.role === 'admin' ? 'Список поданих заявок для верифікації.' : currentUser.role === 'teacher' ? 'Дипломні проєкти закріплених за вами студентів.' : 'Відстеження статусу та аналітика вашої дипломної теми.'}
      </p>

      {projects.length === 0 ? (
        <p className="empty-state">Проєктів не знайдено.</p>
      ) : (
        <div className="projects-list">
          {projects.map((project) => (
            <div key={project.project_id} className="project-card">
              
              <div className="project-card-header">
                {/* ЯКЩО РЕЖИМ РЕДАГУВАННЯ - ПОКАЗУЄМО ІНПУТ ДЛЯ НАЗВИ */}
                {editingProjectId === project.project_id ? (
                  <input 
                    className="form-control" 
                    value={editForm.title} 
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})} 
                    style={{ fontWeight: 700, fontSize: '16px', color: 'var(--primary-color)' }}
                  />
                ) : (
                  <h4 className="project-title">{project.title}</h4>
                )}

                <span className={`status-badge status-${project.status}`}>
                  {project.status === 'перевірка' ? 'на перевірці' : project.status}
                </span>
              </div>

              {/* ЯКЩО РЕЖИМ РЕДАГУВАННЯ - ПОКАЗУЄМО ІНПУТИ ОПИСУ ТА СЛІВ */}
              {editingProjectId === project.project_id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                  <textarea 
                    className="form-control" 
                    rows={3} 
                    value={editForm.description} 
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})} 
                  />
                  <input 
                    className="form-control" 
                    value={editForm.keywords} 
                    onChange={(e) => setEditForm({...editForm, keywords: e.target.value})} 
                    placeholder="Ключові слова (через кому)"
                  />
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button className="btn btn-primary" onClick={() => saveEdit(project.project_id)}>Зберегти зміни</button>
                    <button className="btn" style={{ border: '1px solid var(--border-color)', color: 'var(--text-main)', backgroundColor: 'transparent' }} onClick={() => setEditingProjectId(null)}>Скасувати</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="project-desc">{project.description}</p>
                  <div className="project-meta-tags"><strong>Ключові слова:</strong> {project.keywords}</div>
                </>
              )}

              {/* МЕТА-ПАНЕЛЬ (ХОВАТИ ПРИ РЕДАГУВАННІ, ЩОБ НЕ ЗАВАЖАЛО) */}
              {editingProjectId !== project.project_id && (
                <div className="project-analytics-panel">
                  <div><strong>Актуальність:</strong> {project.relevance || 'Не оцінено'}</div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>Керівник:</strong>
                    {currentUser.role === 'admin' ? (
                      <select 
                        className="form-control"
                        style={{ padding: '4px 8px', width: 'auto', fontSize: '13px', backgroundColor: 'var(--bg-color)' }}
                        value={project.supervisor_id || ''}
                        onChange={(e) => handleSupervisorChange(project.project_id, e.target.value)}
                      >
                        <option value="">-- Не призначено --</option>
                        {supervisors.map(sup => <option key={sup.supervisor_id} value={sup.supervisor_id}>{sup.name}</option>)}
                      </select>
                    ) : (
                      project.supervisor_name ? <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{project.supervisor_name}</span> : <span style={{ color: 'var(--danger-color)' }}>Не призначено</span>
                    )}
                  </div>

                  {(currentUser.role === 'admin' || currentUser.role === 'teacher') && (
                    <div><strong>Подав студент:</strong> {project.student_name}</div>
                  )}
                </div>
              )}

              {/* ПАНЕЛЬ КНОПОК */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                
                {/* КНОПКИ АДМІНА */}
                {currentUser.role === 'admin' && (
                  <>
                    {project.status === 'перевірка' && (
                      <>
                        <button onClick={() => handleStatusChange(project.project_id, 'затверджено')} className="btn btn-primary">Затвердити</button>
                        <button onClick={() => handleStatusChange(project.project_id, 'відхилено')} className="btn btn-danger">Відхилити</button>
                      </>
                    )}
                    <button onClick={() => handleDelete(project.project_id)} className="btn" style={{ backgroundColor: 'transparent', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', marginLeft: project.status === 'перевірка' ? 'auto' : '0' }}>Видалити з БД</button>
                  </>
                )}

                {/* НОВА КНОПКА РЕДАГУВАННЯ ДЛЯ СТУДЕНТА (Якщо статус не затверджено) */}
                {currentUser.role === 'student' && project.status !== 'затверджено' && editingProjectId !== project.project_id && (
                  <button onClick={() => startEditing(project)} className="btn" style={{ border: '1px solid var(--primary-color)', color: 'var(--primary-color)', backgroundColor: 'transparent' }}>
                    Редагувати тему
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}