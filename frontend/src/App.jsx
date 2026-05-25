import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Auth from './pages/Auth';

export default function App() {
  return (
    <Router>
      <div>
        <nav style={{ padding: '10px', background: '#f0f0f0', display: 'flex', gap: '15px' }}>
          <Link to="/">Главная</Link>
          <Link to="/auth">Войти / Регистрация</Link>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}