import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function UserReviews() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/users/${userId}/reviews`)
      .then(res => res.json())
      .then(data => {
        setReviews(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Ошибка при загрузке отзывов:", err);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <p style={{ padding: '20px' }}>Загрузка отзывов...</p>;

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ background: '#6b7280', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', marginBottom: '20px' }}
      >
        ← Назад в профиль
      </button>

      <h2>💬 Отзывы об арендодателе</h2>
      <p style={{ color: '#666' }}>Здесь собраны все отзывы от пользователей, которые брали вещи этого человека в аренду.</p>

      {reviews.length === 0 ? (
        <div style={{ padding: '30px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', textAlign: 'center', color: '#6b7280' }}>
          Об этом пользователе еще не оставили ни одного отзыва.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          {reviews.map((rev) => (
            <div key={rev.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <strong>Отправитель: {rev.author_name}</strong>
                  <div style={{ color: '#eab308', fontSize: '16px', marginTop: '3px' }}>
                    {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)} 
                    <span style={{ color: '#333', fontSize: '14px', marginLeft: '5px' }}>({rev.rating}/5)</span>
                  </div>
                </div>
                <span style={{ color: '#9ca3af', fontSize: '13px' }}>{rev.created_at}</span>
              </div>

              <div style={{ background: '#f3f4f6', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', color: '#4b5563', marginBottom: '10px', display: 'inline-block' }}>
                📦 Товар: <strong>{rev.item_title}</strong>
              </div>

              <p style={{ margin: '5px 0 0 0', color: '#374151', lineHeight: '1.5', fontStyle: 'italic' }}>
                "{rev.comment}"
              </p>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}