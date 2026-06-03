import React, { useState } from 'react';

export default function Auth() {
  const [screenMode, setScreenMode] = useState('login');
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [generatedCode, setGeneratedCode] = useState(null);
  const [userEnteredCode, setUserEnteredCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (screenMode === 'login') {
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
        setMessage('Ошибка: Не удалось связаться с сервером бэкенда.');
      }

    } else if (screenMode === 'register') {
      try {
        const response = await fetch('http://localhost:8000/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          setMessage('Регистрация успешна! Теперь вы можете войти.');
          setScreenMode('login');
          setEmail('');
          setPassword('');
        } else {
          setMessage(`Ошибка: ${data.detail || 'Что-то пошло не так'}`);
        }
      } catch (error) {
        setMessage('Ошибка: Не удалось связаться с сервером бэкенда.');
      }
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setMessage('');

    const code = Math.floor(1000 + Math.random() * 9000);
    setGeneratedCode(code);

    alert(`📨 Письмо отправлено!\n\nИмитация доставки на адрес: ${email}\nВаш проверочный код: ${code}`);

    setScreenMode('forgot_code');
    setMessage('Введите 4-значный код из уведомления.');
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    setMessage('');

    if (Number(userEnteredCode) === generatedCode) {
      setScreenMode('forgot_new_password');
      setMessage('Код подтвержден. Установите новый пароль.');
    } else {
      setMessage('Ошибка: Неверный проверочный код. Попробуйте еще раз.');
    }
  };

  const handleNewPasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (newPassword !== confirmPassword) {
      setMessage('Ошибка: Пароли не совпадают!');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/users/me/password', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          email: email, 
          new_password: newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`🔒 Пароль успешно обновлен!\n\nОтвет сервера: ${data.message}`);

        setNewPassword('');
        setConfirmPassword('');
        setUserEnteredCode('');
        setGeneratedCode(null);
        setEmail('');

        setScreenMode('login');
        setMessage('Пароль успешно изменен. Используйте его для входа в систему.');
      } else {
        setMessage(`Ошибка: ${data.detail || 'Не удалось изменить пароль'}`);
      }
    } catch (error) {
      setMessage('Ошибка: Не удалось связаться с сервером при смене пароля.');
    }
  };

  return (
    <div style={{ 
      maxWidth: '400px', 
      margin: '50px auto', 
      padding: '25px', 
      background: '#ffffff', 
      borderRadius: '12px', 
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
      border: '1px solid #e2e8f0',
      fontFamily: 'sans-serif' 
    }}>

      {screenMode === 'forgot_email' && (
        <>
          <h2 style={{ margin: '0 0 20px 0', color: '#0f172a' }}>Восстановление</h2>
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <p style={textHelpStyle}>Введите ваш Email, привязанный к аккаунту. Мы сгенерируем код сброса.</p>
            <input 
              type="email" placeholder="Ваш Email" value={email} 
              onChange={(e) => setEmail(e.target.value)} required style={inputStyle} 
            />
            <button type="submit" style={submitBtnStyle}>Получить код восстановления</button>
          </form>
          <button onClick={() => { setScreenMode('login'); setMessage(''); }} style={linkBtnStyle}>← Назад</button>
        </>
      )}

      {screenMode === 'forgot_code' && (
        <>
          <h2 style={{ margin: '0 0 20px 0', color: '#0f172a' }}>Подтверждение</h2>
          <form onSubmit={handleCodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <p style={textHelpStyle}>Введите 4-значный код, полученный во всплывающем окне:</p>
            <input 
              type="number" placeholder="0000" value={userEnteredCode} 
              onChange={(e) => setUserEnteredCode(e.target.value)} required 
              style={{...inputStyle, textAlign: 'center', fontSize: '20px', letterSpacing: '5px'}} 
            />
            <button type="submit" style={submitBtnStyle}>Проверить код</button>
          </form>
          <button onClick={() => setScreenMode('forgot_email')} style={linkBtnStyle}>← Изменить Email</button>
        </>
      )}

      {screenMode === 'forgot_new_password' && (
        <>
          <h2 style={{ margin: '0 0 20px 0', color: '#0f172a' }}>Новый пароль</h2>
          <form onSubmit={handleNewPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <p style={textHelpStyle}>Установите новый пароль для учетной записи <strong>{email}</strong>.</p>
            <input 
              type="password" placeholder="Новый пароль" value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} required style={inputStyle} 
            />
            <input 
              type="password" placeholder="Повторите новый пароль" value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} required style={inputStyle} 
            />
            <button type="submit" style={submitBtnStyle}>Сохранить изменения</button>
          </form>
        </>
      )}

      {(screenMode === 'login' || screenMode === 'register') && (
        <>
          <h2 style={{ margin: '0 0 20px 0', color: '#0f172a' }}>
            {screenMode === 'login' ? 'Вход в систему' : 'Регистрация нового аккаунта'}
          </h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="text" placeholder="Имя пользователя (Логин)" value={username} 
              onChange={(e) => setUsername(e.target.value)} required style={inputStyle}
            />

            {screenMode === 'register' && (
              <input 
                type="email" placeholder="Электронная почта" value={email} 
                onChange={(e) => setEmail(e.target.value)} required style={inputStyle}
              />
            )}

            <input 
              type="password" placeholder="Пароль" value={password} 
              onChange={(e) => setPassword(e.target.value)} required style={inputStyle}
            />

            {screenMode === 'login' && (
              <div style={{ textAlign: 'right', marginTop: '-5px' }}>
                <span 
                  onClick={() => { setMessage(''); setScreenMode('forgot_email'); }} 
                  style={{ fontSize: '13px', color: '#0ea5e9', cursor: 'pointer', fontWeight: '500' }}
                >
                  Я забыл пароль
                </span>
              </div>
            )}

            <button type="submit" style={submitBtnStyle}>
              {screenMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>

          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#475569' }}>
            {screenMode === 'login' ? 'Ещё нет аккаунта?' : 'Уже есть аккаунт?'} {' '}
            <span 
              style={{ color: '#0ea5e9', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }} 
              onClick={() => { 
                setScreenMode(screenMode === 'login' ? 'register' : 'login'); 
                setMessage(''); 
              }}
            >
              {screenMode === 'login' ? 'Зарегистрироваться' : 'Войти'}
            </span>
          </p>
        </>
      )}

      {message && (
        <p style={{ 
          marginTop: '15px', 
          fontWeight: '500',
          fontSize: '14px',
          textAlign: 'center',
          color: message.includes('Ошибка') ? '#ef4444' : '#10b981' 
        }}>
          {message}
        </p>
      )}

    </div>
  );
}

const inputStyle = {
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '14px',
  outline: 'none',
  background: '#ffffff',
  color: '#1e293b',
  width: '100%',
  boxSizing: 'border-box'
};

const submitBtnStyle = {
  background: '#0f172a',
  color: 'white',
  padding: '12px',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '14px',
  marginTop: '5px'
};

const linkBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#64748b',
  cursor: 'pointer',
  fontSize: '13px',
  marginTop: '15px',
  width: '100%',
  textAlign: 'center',
  textDecoration: 'underline'
};

const textHelpStyle = {
  margin: 0, 
  fontSize: '14px', 
  color: '#475569', 
  lineHeight: '1.4'
};