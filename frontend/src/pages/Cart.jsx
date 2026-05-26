import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function Cart() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [days, setDays] = useState(1);

  const handleOrder = () => {
    alert('Заявка на аренду успешно отправлена владельцу!');
    navigate('/');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px' }}>
      <h2>📅 Оформление аренды</h2>
      <p>Вы собираетесь арендовать товар с ID: <strong>{id}</strong></p>
      
      <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label>Количество дней аренды:</label>
        <input 
          type="number" 
          min="1" 
          value={days} 
          onChange={(e) => setDays(parseInt(e.target.value) || 1)} 
          style={{ padding: '8px', width: '100px' }}
        />
      </div>

      <button onClick={handleOrder} style={{ background: '#007bff', color: 'white', border: 'none', padding: '12px', width: '100%', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>
        Подтвердить бронирование
      </button>
    </div>
  );
}