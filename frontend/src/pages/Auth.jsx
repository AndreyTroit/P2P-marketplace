import React, { useState } from 'react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (isLogin) {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      try {
        const response = await fetch('http://localhost:8000/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem('token', data.access_token);
          setMessage('Вы успешно вошли! Токен сохранен.');
          window.location.href = '/';
        } else {
          setMessage(`Ошибка: ${data.detail || 'Неверные данные'}`);
        }
      } catch (error) {
        setMessage('Не удалось связаться с сервером бэкенда.');
      }

    } else {
      try {
        const response = await fetch('http://localhost:8000/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          setMessage('Регистрация успешна! Теперь вы можете войти.');
          setIsLogin(true);
        } else {
          setMessage(`Ошибка: ${data.detail || 'Что-то пошло не так'}`);
        }
      } catch (error) {
        setMessage('Не удалось связаться с сервером бэкенда.');
      }
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>{isLogin ? 'Вход в систему' : 'Регистрация нового аккаунта'}</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        <input 
          type="text" 
          placeholder="Имя пользователя (Логин)" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          required 
        />

        {!isLogin && (
          <input 
            type="email" 
            placeholder="Электронная почта" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        )}

        <input 
          type="password" 
          placeholder="Пароль" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />

        <button type="submit" style={{ background: '#007bff', color: 'white', border: 'none', padding: '10px', cursor: 'pointer' }}>
          {isLogin ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>

      {message && <p style={{ marginTop: '15px', color: message.startsWith('Ошибка') ? 'red' : 'green' }}>{message}</p>}

      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
        {isLogin ? 'Ещё нет аккаунта?' : 'Уже есть аккаунт?'} {' '}
        <span 
          style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }} 
          onClick={() => { setIsLogin(!isLogin); setMessage(''); }}
        >
          {isLogin ? 'Зарегистрироваться' : 'Войти'}
        </span>
      </p>
    </div>
  );
}