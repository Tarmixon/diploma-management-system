// client/src/pages/Analytics.tsx
import { useEffect, useState } from 'react';
import api from '../api';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, 
  ResponsiveContainer 
} from 'recharts';

interface Project {
  project_id: number;
  status: string;
  supervisor_name?: string;
}

export default function Analytics() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects');
        setProjects(response.data);
      } catch (err) {
        console.error('Помилка завантаження даних', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Формування аналітики...</div>;

  // --- 1. ПІДГОТОВКА ДАНИХ ДЛЯ КРУГОВОЇ ДІАГРАМИ (Статуси) ---
  const statusCounts = projects.reduce((acc: any, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(statusCounts).map(key => ({
    name: key === 'перевірка' ? 'На перевірці' : key === 'затверджено' ? 'Затверджено' : 'Відхилено',
    value: statusCounts[key],
    originalKey: key
  }));

  const COLORS: Record<string, string> = {
    'перевірка': '#eab308',   // Жовтий
    'затверджено': '#22c55e', // Зелений
    'відхилено': '#ef4444'    // Червоний
  };

  // --- 2. ПІДГОТОВКА ДАНИХ ДЛЯ СТОВПЧИКОВОЇ ДІАГРАМИ (Викладачі) ---
  const supervisorCounts = projects.reduce((acc: any, project) => {
    const name = project.supervisor_name || 'Не призначено';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.keys(supervisorCounts).map(name => ({
    name: name,
    Кількість: supervisorCounts[name]
  })).sort((a, b) => b.Кількість - a.Кількість); // Сортуємо від найбільшого до найменшого

  // Кастомний Tooltip для адаптації під темну тему
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '4px', color: 'var(--text-main)' }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{label || payload[0].name}</p>
          <p style={{ margin: 0 }}>Кількість тем: <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{payload[0].value}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="form-container">
      <h2 className="dashboard-title">Аналітика та статистика</h2>
      <p className="dashboard-desc">Візуалізація даних платформи у режимі реального часу.</p>

      {projects.length === 0 ? (
        <p className="empty-state">Немає даних для аналізу.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', marginTop: '30px' }}>
          
          {/* БЛОК 1: КРУГОВА ДІАГРАМА */}
          <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-color)' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '16px', color: 'var(--text-main)' }}>
              Розподіл тем за статусом перевірки
            </h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={(entry: any) => `${entry.name} ${((entry.percent || 0) * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.originalKey] || '#8884d8'} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* БЛОК 2: СТОВПЧИКОВА ДІАГРАМА */}
          <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-color)' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '16px', color: 'var(--text-main)' }}>
              Завантаженість наукових керівників
            </h3>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--text-muted)" 
                    tick={{ fontSize: 12 }} 
                    angle={-45} 
                    textAnchor="end" 
                  />
                  <YAxis stroke="var(--text-muted)" allowDecimals={false} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="Кількість" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}