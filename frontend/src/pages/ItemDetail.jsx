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

  if (!item) return <p style={{ padding: '20px' }}>Загрузка...</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>{item.title}</h2>
      <div style={{ display: 'flex', gap: '30px', marginTop: '20px', borderBottom: '1px solid #eee', paddingBottom: '30px' }}>
        <div style={{ width: '300px', height: '200px', background: '#eee', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>📷 Фото товара</div>
        <div>
          <h3>Описание:</h3>
          <p>{item.description || 'Описание отсутствует.'}</p>
          <h4 style={{ color: '#007bff' }}>Цена: {item.price_per_day} ₽ / день</h4>
          {item.is_available ? (
            <Link to={`/cart/${item.id}`}><button style={{ background: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}>🤝 Арендовать вещь</button></Link>
          ) : (
            <button disabled style={{ background: '#ccc', padding: '10px 20px' }}>❌ Занято</button>
          )}
        </div>
      </div>

      {/* --- БЛОК ОСТАВИТЬ ОТЗЫВ ВЛАДЕЛЬЦУ --- */}
      {token ? (
        <div style={{ marginTop: '30px', maxWidth: '500px', background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
          <h3>✍️ Оставить отзыв о сделке / владельце</h3>
          <form onSubmit={handleSendReview} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label>Оценка (от 1 до 5):
              <select value={rating} onChange={e => setRating(e.target.value)} style={{ marginLeft: '10px', padding: '5px' }}>
                <option value="5">5 ★★★★★</option>
                <option value="4">4 ★★★★</option>
                <option value="3">3 ★★★</option>
                <option value="2">2 ★★</option>
                <option value="1">1 ★</option>
              </select>
            </label>
            <textarea placeholder="Напишите честный отзыв об опыте аренды этого предмета..." value={comment} onChange={e => setComment(e.target.value)} required style={{ padding: '8px', height: '8px', height: '60px' }} />
            <button type="submit" style={{ background: '#007bff', color: 'white', border: 'none', padding: '8px', cursor: 'pointer' }}>Отправить отзыв</button>
          </form>
          {reviewMessage && <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{reviewMessage}</p>}
        </div>
      ) : (
        <p style={{ marginTop: '20px', color: '#666' }}>💡 Войдите, чтобы иметь возможность оставлять отзывы.</p>
      )}
    </div>
  );
}