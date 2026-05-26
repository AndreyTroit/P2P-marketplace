import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  
  // Для формы отзыва
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`http://localhost:8000/items`)
      .then(res => res.json())
      .then(data => {
        const foundItem = data.find(i => i.id === parseInt(id));
        setItem(foundItem);
      });
  }, [id]);

  const handleSendReview = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ item_id: parseInt(id), rating: parseInt(rating), comment })
      });
      if (response.ok) {
        setReviewMessage('✅ Отзыв успешно отправлен! Рейтинг владельца обновлен.');
        setComment('');
      }
    } catch (err) {
      setReviewMessage('❌ Не удалось отправить отзыв.');
    }
  };

  if (!item) return <p style={{ padding: '20px', color: '#1e293b' }}>Загрузка...</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>

      <div style={{ 
        background: '#ffffff', 
        borderRadius: '12px', 
        padding: '25px', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        display: 'flex', 
        gap: '40px',
        alignItems: 'flex-start',
        marginBottom: '30px'
      }}>

        <img 
          src={item.image_url || 'https://via.placeholder.com/400x300?text=Нет+фото'} 
          alt={item.title}
          style={{ width: '450px', height: '350px', borderRadius: '15px', objectFit: 'cover' }} 
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h1 style={{ margin: 0, color: '#0f172a', fontSize: '32px', fontWeight: 'bold' }}>
            {item.title}
          </h1>
          
          <p style={{ margin: 0, color: '#475569', fontSize: '16px' }}>
            Владелец: 
            <Link to={`/user/${item.owner_id}`} style={{ marginLeft: '8px', color: '#0ea5e9', fontWeight: 'bold', textDecoration: 'none' }}>
              Посмотреть профиль
            </Link>
          </p>

          <p style={{ margin: 0, color: '#475569', fontSize: '15px', lineHeight: '1.5' }}>
            {item.description || 'Описание товара не указано владельцем.'}
          </p>
          
          <div style={{ marginTop: 'auto', fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
            {item.price_per_day} ₽ <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>/ день</span>
          </div>
        </div>

      </div>

      {token ? (
        <div style={{ 
          background: '#ffffff', 
          padding: '25px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
          maxWidth: '550px' 
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#0f172a' }}>✍️ Оставить отзыв о сделке / владельце</h3>
          
          <form onSubmit={handleSendReview} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <label style={{ color: '#334155', fontSize: '14px', fontWeight: '500' }}>
              Оценка (от 1 до 5):
              <select 
                value={rating} 
                onChange={e => setRating(e.target.value)} 
                style={{ marginLeft: '10px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#0f172a' }}
              >
                <option value="5">5 ★★★★★</option>
                <option value="4">4 ★★★★</option>
                <option value="3">3 ★★★</option>
                <option value="2">2 ★★</option>
                <option value="1">1 ★</option>
              </select>
            </label>
            
            <textarea 
              placeholder="Напишите честный отзыв об опыте аренды этого предмета..." 
              value={comment} 
              onChange={e => setComment(e.target.value)} 
              required 
              style={{ 
                padding: '12px', 
                height: '80px', 
                borderRadius: '8px', 
                border: '1px solid #cbd5e1', 
                color: '#0f172a', 
                background: 'white',
                fontSize: '14px',
                resize: 'none'
              }} 
            />
            
            <button 
              type="submit" 
              style={{ 
                background: '#0ea5e9', 
                color: 'white', 
                border: 'none', 
                padding: '10px 20px', 
                cursor: 'pointer', 
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              Отправить отзыв
            </button>
          </form>
          
          {reviewMessage && (
            <p style={{ 
              marginTop: '15px', 
              fontWeight: 'bold', 
              color: reviewMessage.includes('❌') ? '#ef4444' : '#10b981',
              fontSize: '14px'
            }}>
              {reviewMessage}
            </p>
          )}
        </div>
      ) : (
        <p style={{ marginTop: '20px', color: '#64748b', fontStyle: 'italic' }}>
          💡 Войдите, чтобы иметь возможность оставлять отзывы.
        </p>
      )}
    </div>
  );
}