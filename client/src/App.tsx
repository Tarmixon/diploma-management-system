// client/src/App.tsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import SubmitTopic from './pages/SubmitTopic';
import Login from './pages/Login';
import Register from './pages/Register';
import ActionHistory from './pages/ActionHistory';
import Home from './pages/Home';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import './index.css'; 

function App() {
  const [user, setUser] = useState<any>(null);
  
  // 1. Ініціалізуємо стан теми з localStorage, або за замовчуванням 'light'
  const [theme, setTheme] = useState<string>(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 2. Слідкуємо за зміною теми і застосовуємо атрибут до тегу HTML
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Функція перемикання теми
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      <div className="app-container">
        
        {/* Навігаційне меню */}
        <nav className="navbar">
          <div className="nav-left-group">
            <Link to="/" className="brand-logo">
              <span className="logo-dip">Dip</span><span className="logo-pom">Pom</span>
            </Link>
            
            <div className="nav-links">
              <Link to="/" className="nav-item">Головна</Link>
              
              {user?.role === 'student' && (
                <Link to="/submit" className="nav-item">Подати тему</Link>
              )}

              {user?.role === 'admin' && (
              <>
                <Link to="/history" className="nav-item">Історія дій</Link>
                <Link to="/reports" className="nav-item">Звіти</Link>
                <Link to="/analytics" className="nav-item">Аналітика</Link>
              </>
            )}
              
            </div>
          </div>

          <div className="user-controls">
            <button onClick={toggleTheme} className="theme-toggle-btn">
              {theme === 'light' ? 'DARK' : 'LIGHT'}
            </button>

            {user ? (
              <>
                <span className="user-name" style={{ fontSize: '14px' }}>
                  <strong>{user.name}</strong> 
                  <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({user.role})</span>
                </span>
                <button onClick={handleLogout} className="btn btn-danger">Вийти</button>
              </>
            ) : (
              <Link to="/login" className="nav-item" style={{ color: 'var(--primary-color)' }}>Увійти в систему</Link>
            )}
          </div>
        </nav>

        {/* Маршрутизація */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login setUser={setUser} />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          
          <Route 
            path="/submit" 
            element={user?.role === 'student' ? <SubmitTopic /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/history" 
            element={user?.role === 'admin' ? <ActionHistory /> : <Navigate to="/" />} 
          />

          <Route 
            path="/reports" 
            element={user?.role === 'admin' ? <Reports /> : <Navigate to="/" />} 
          />

          <Route 
            path="/analytics" 
            element={user?.role === 'admin' ? <Analytics /> : <Navigate to="/" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;