import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

export default function UserPublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = fetch(`http://localhost:8000/users/${userId}`).then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    });

    const fetchItems = fetch(`http://localhost:8000/items`).then(res => res.json());

    Promise.all([fetchProfile, fetchItems])
      .then(([profileData, allItems]) => {
        setProfile(profileData);
        const userItems = allItems.filter(item => item.owner_id === parseInt(userId));
        setItems(userItems);
        setLoading(false);
      })
      .catch(err => {
        console.error("Ошибка при сборке данных профиля:", err);
        setLoading(false);
      });

     const fetchReviews = fetch(`http://localhost:8000/users/${userId}/reviews`).then(res => res.json());
     fetchReviews.then(data => setReviews(data)).catch(err => console.error("Ошибка при загрузке отзывов:", err));
  }, [userId]);

  if (loading) return <p style={{ padding: '20px', color: '#1e293b' }}>Загрузка профиля...</p>;
  
  if (!profile) return (
    <div style={{ padding: '20px', color: '#1e293b' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px', cursor: 'pointer' }}>← Назад</button>
      <p style={{ color: '#ef4444', fontWeight: 'bold' }}>❌ Пользователь не найден.</p>
    </div>
  );

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>

      <button 
        onClick={() => navigate(-1)} 
        style={{ background: '#6b7280', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', marginBottom: '20px', fontSize: '14px' }}
      >
        ← Назад к товару
      </button>

      <div style={{ 
        display: 'flex', 
        gap: '30px', 
        background: '#fff', 
        padding: '25px', 
        borderRadius: '12px', 
        marginBottom: '40px', 
        alignItems: 'center', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0'
      }}>

        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="Avatar" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #0ea5e9' }} />
        ) : (
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#0ea5e9', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 'bold' }}>
            {profile.username[0].toUpperCase()}
          </div>
        )}

        <div style={{ flex: 1 }}>
          <h2 style={{ margin: '0 0 5px 0', color: '#0f172a' }}>
            {profile.username} <span style={{ fontSize: '14px', color: '#64748b' }}>({profile.email})</span>
          </h2>
          
          <p style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '14px' }}>📍 {profile.city || 'Город не указан'}</p>
          
          <p style={{ margin: '0 0 15px 0', fontStyle: 'italic', color: '#334155', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
            "{profile.bio || 'Пользователь не оставил описания.'}"
          </p>
          
          <div style={{ display: 'flex', gap: '25px', fontSize: '14px', color: '#1e293b' }}>
            <span>⭐ Рейтинг: <strong>{profile.rating} / 5</strong></span>
            <span>
              💬 <Link to={`/profile/reviews/${profile.id}`} style={{ color: '#0ea5e9', textDecoration: 'underline', fontWeight: 'bold' }}>
                Отзывы: <strong>{reviews.length}</strong>
              </Link>
            </span>
            <span>📦Товаров на сайте: <strong>{items.length}</strong></span>
          </div>
        </div>
      </div>


      <h3 style={{ color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>📦 Все вещи этого владельца</h3>
      
      {items.length === 0 ? (
        <p style={{ color: '#64748b', fontStyle: 'italic', marginTop: '15px' }}>Этот пользователь пока не выставил товары на шеринг.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {items.map((item) => (
            <Link key={item.id} to={`/item/${item.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                padding: '15px', 
                background: '#fff', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>

                  <img 
                    src={item.image_url || 'https://via.placeholder.com/150'} 
                    style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px' }} 
                    alt={item.title}
                  />
                  <h4 style={{ margin: '0 0 5px 0', color: '#0f172a' }}>{item.title}</h4>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: 0, height: '36px', overflow: 'hidden' }}>{item.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                    <span style={{ fontWeight: 'bold', color: '#22c55e', margin: '10px 0 0 0', fontSize: '16px' }}>{item.price_per_day} ₽/день</span>
                    <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '4px', background: item.is_available ? '#e2f0d9' : '#fce4d6', color: item.is_available ? '#385723' : '#c65911' }}>
                      {item.is_available ? 'Доступно' : 'Занято'}
                    </span>
                  </div>   
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}