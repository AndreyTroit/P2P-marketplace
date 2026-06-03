import React, { useState, useEffect, useRef } from 'react';

export default function Messages() {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null); 
  const [messages, setMessages] = useState([]); 
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  const token = localStorage.getItem('token');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    fetch('http://localhost:8000/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : null)
    .then(userData => {
      if (userData) {
        setCurrentUserId(Number(userData.id)); 
      }
    })
    .catch(err => console.error("Ошибка получения профиля:", err));

    fetch('http://localhost:8000/chats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setChats(data);
      setLoadingChats(false);
    })
    .catch(err => {
      console.error(err);
      setLoadingChats(false);
    });
  }, [token]);

  useEffect(() => {
    if (!activeChat || !token) return;

    const fetchHistory = () => {
      fetch(`http://localhost:8000/messages/${activeChat.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setMessages(data);
      })
      .catch(err => console.error("Ошибка обновления чата:", err));
    };

    fetchHistory(); // Первый быстрый вызов при клике на чат

    // Запускаем интервал, чтобы сообщения качались в фоне и обновлялись без перезагрузки страницы
    const interval = setInterval(fetchHistory, 3000); 

    return () => clearInterval(interval); // Чистим интервал при смене чата
  }, [activeChat, token]);

  // Плавный скролл вниз к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Отправка нового сообщения
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const textToSend = newMessage;
    setNewMessage(''); // Сразу очищаем инпут, чтобы интерфейс не тупил

    try {
      const res = await fetch('http://localhost:8000/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiver_id: Number(activeChat.id),
          text: textToSend 
        })
      });

      if (res.ok) {
        const createdMsg = await res.json();
        // Убеждаемся, что в объект точно зашиты правильные ID
        setMessages(prev => [...prev, {
          ...createdMsg,
          sender_id: Number(createdMsg.sender_id || currentUserId),
          receiver_id: Number(createdMsg.receiver_id || activeChat.id)
        }]);
      } else {
        alert("Не удалось отправить сообщение");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!token) return <p style={{ padding: '20px', color: '#64748b' }}>💡 Пожалуйста, авторизуйтесь для просмотра сообщений.</p>;

  return (
    <div style={{ 
      display: 'flex', 
      maxWidth: '1100px', 
      margin: '20px auto', 
      height: 'calc(100vh - 120px)', 
      background: '#ffffff', 
      borderRadius: '12px', 
      boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      border: '1px solid #e2e8f0',
      fontFamily: 'sans-serif'
    }}>
      
      {/* ЛЕВАЯ КОЛОНКА: ЧАТЫ */}
      <div style={{ width: '320px', borderRight: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '20px' }}>💬 Сообщения</h2>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {loadingChats ? (
            <p style={{ color: '#64748b', fontSize: '14px', padding: '10px' }}>Загрузка чатов...</p>
          ) : chats.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '14px', padding: '10px', fontStyle: 'italic' }}>У вас пока нет активных диалогов.</p>
          ) : (
            chats.map(user => (
              <div 
                key={user.id}
                onClick={() => setActiveChat(user)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px',
                  cursor: 'pointer', marginBottom: '5px', transition: 'background 0.2s',
                  background: activeChat?.id === user.id ? '#e0f2fe' : 'transparent', color: '#0f172a'
                }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', background: '#0ea5e9',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                }}>
                  {user.username ? user.username[0].toUpperCase() : 'U'}
                </div>
                <div style={{ fontWeight: activeChat?.id === user.id ? 'bold' : 'normal' }}>
                  {user.username}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ПРАВАЯ КОЛОНКА: ПЕРЕПИСКА */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
        {activeChat ? (
          <>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>{activeChat.username}</span>
            </div>

            {/* Окно сообщений */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f1f5f9', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.map(msg => {
                // ВАЖНО: Приводим оба ID к Number, чтобы избежать бага "строка === число"
                const isMyMessage = Number(msg.sender_id) === Number(currentUserId);
                
                return (
                  <div 
                    key={msg.id} 
                    style={{
                      maxWidth: '70%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      fontSize: '15px',
                      lineHeight: '1.4',
                      alignSelf: isMyMessage ? 'flex-end' : 'flex-start',
                      background: isMyMessage ? '#0ea5e9' : '#ffffff',
                      color: isMyMessage ? '#ffffff' : '#0f172a',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      border: isMyMessage ? 'none' : '1px solid #e2e8f0'
                    }}
                  >
                    {msg.text}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Форма ввода */}
            <form onSubmit={handleSendMessage} style={{ padding: '15px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', background: '#fff' }}>
              <input 
                type="text" 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Напишите сообщение..."
                style={{
                  flex: 1, padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1',
                  background: '#fff', color: '#0f172a', fontSize: '14px', outline: 'none'
                }}
              />
              <button type="submit" style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '0 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Отправить
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <span style={{ fontSize: '50px' }}>💬</span>
            <p style={{ marginTop: '10px', fontSize: '16px' }}>Выберите диалог слева, чтобы начать обсуждение покупки.</p>
          </div>
        )}
      </div>

    </div>
  );
}