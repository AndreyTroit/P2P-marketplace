import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import ItemDetail from './pages/ItemDetail';
import Cart from './pages/Cart';
import Chat from './pages/Chat';

export default function App() {
  const [user, setUser] = useState(null);
  const token = localStorage.getItem('token');

  // Загружаем данные пользователя для шапки (аватарку и имя)
  useEffect(() => {
    if (!token) return;
    
    fetch('http://localhost:8000/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Устаревший токен');
      })
      .then(data => setUser(data))
      .catch(() => {
        // Если токен протух или невалиден — чистим его
        localStorage.removeItem('token');
      });
  }, [token]);

  return (
    <Router>
      <div style={{ fontFamily: 'sans-serif', background: '#f4f6f9', minHeight: '100vh', margin: 0 }}>
        
        {/* --- ОБНОВЛЕННАЯ ШАПКА --- */}
        <nav style={{ 
          padding: '10px 20px', 
          background: '#1e293b', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '18px' }}>📦 Шеринг Вещей</Link>
            <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Каталог</Link>
            {token && <Link to="/chat" style={{ color: '#94a3b8', textDecoration: 'none' }}>Сообщения</Link>}
          </div>
          
          <div>
            {token ? (
              /* Кликабельный аватар вместо текста "Личный кабинет" */
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: '10px' }}>
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt="Avatar" 
                    style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #38bdf8' }} 
                  />
                ) : (
                  <div style={{ 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '50%', 
                    background: '#0284c7', 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}>
                    {user ? user.username[0].toUpperCase() : 'U'}
                  </div>
                )}
              </Link>
            ) : (
              <Link to="/auth" style={{ color: '#94a3b8', textDecoration: 'none' }}>Войти / Регистрация</Link>
            )}
          </div>
        </nav>

        {/* Контент */}
        <main style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 15px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/item/:id" element={<ItemDetail />} />
            <Route path="/cart/:id" element={<Cart />} />
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}