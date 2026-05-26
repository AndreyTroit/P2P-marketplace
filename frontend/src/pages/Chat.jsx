import React, { useState } from 'react';

export default function Chat() {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Система', text: 'Добро пожаловать в чат сделки!' },
  ]);
  const [text, setText] = useState('');

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setMessages([...messages, { id: Date.now(), sender: 'Вы', text }]);
    setText('');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>💬 Сообщения по сделкам</h2>
      <div style={{ border: '1px solid #ccc', height: '300px', overflowY: 'scroll', padding: '10px', background: '#fdfdfd', marginBottom: '10px', borderRadius: '4px' }}>
        {messages.map(m => (
          <div key={m.id} style={{ marginBottom: '10px', textAlign: m.sender === 'Вы' ? 'right' : 'left' }}>
            <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#555' }}>{m.sender}:</span>
            <div style={{ display: 'inline-block', background: m.sender === 'Вы' ? '#d1ecf1' : '#e2e3e5', padding: '8px 12px', borderRadius: '12px', margin: '0 5px' }}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} style={{ display: 'flex', gap: '10px' }}>
        <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Введите сообщение..." style={{ flex: 1, padding: '10px' }} />
        <button type="submit" style={{ background: '#007bff', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer' }}>Отправить</button>
      </form>
    </div>
  );
}