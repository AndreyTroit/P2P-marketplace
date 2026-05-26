import React, { useState, useEffect } from 'react';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Состояния для редактирования
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const token = localStorage.getItem('token');

  // Загрузка данных профиля и вещей
  const loadProfileData = async () => {
    if (!token) return;
    try {
      // 1. Получаем профиль
      const profRes = await fetch('http://localhost:8000/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profData = await profRes.json();
      setProfile(profData);
      setBio(profData.bio || '');
      setCity(profData.city || '');
      setAvatarUrl(profData.avatar_url || '');

      // 2. Получаем вещи
      const itemsRes = await fetch('http://localhost:8000/my/items', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const itemsData = await itemsRes.json();
      setMyItems(itemsData);
      
      setLoading(false);
    } catch (err) {
      console.error("Ошибка загрузки данных профиля:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [token]);

  // Сохранение изменений профиля
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bio, city, avatar_url: avatarUrl })
      });
      
      if (response.ok) {
        const updatedProf = await response.json();
        setProfile(updatedProf);
        setIsEditing(false);
      }
    } catch (err) {
      alert("Не удалось сохранить профиль");
    }
  };

  if (!token) {
    return <div style={{ padding: '40px', textAlign: 'center' }}><h2>🔒 Доступ ограничен</h2><p>Пожалуйста, авторизуйтесь.</p></div>;
  }

  if (loading || !profile) return <p style={{ padding: '20px' }}>Загрузка профиля...</p>;

  // Полностью замени начинку блока return в Profile.jsx на эту структуру:

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/'; // Редирект на главную страницу после выхода
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* --- БЛОК ПРОФИЛЯ --- */}
      <div style={{ display: 'flex', gap: '30px', background: '#fff', padding: '25px', borderRadius: '12px', marginBottom: '40px', alignItems: 'center', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        
        {/* Кнопка ВЫЙТИ в углу профиля */}
        <button 
          onClick={handleLogout} 
          style={{ position: 'absolute', top: '15px', right: '15px', background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}
        >
          🚪 Выйти из аккаунта
        </button>

        {/* Аватарка */}
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="Avatar" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #007bff' }} />
        ) : (
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#007bff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 'bold' }}>
            {profile.username[0].toUpperCase()}
          </div>
        )}

        {/* Информация / Форма редактирования */}
        <div style={{ flex: 1, paddingRight: '120px' }}> {/* Паддинг справа, чтобы текст не налезал на кнопку выхода */}
          {!isEditing ? (
            <>
              <h2 style={{ margin: '0 0 5px 0' }}>{profile.username} <span style={{fontSize: '14px', color: '#6c757d'}}>({profile.email})</span></h2>
              <p style={{ margin: '0 0 10px 0', color: '#6c757d', fontSize: '14px' }}>📍 {profile.city || 'Город не указан'}</p>
              <p style={{ margin: '0 0 15px 0', fontStyle: 'italic', color: '#495057' }}>"{profile.bio}"</p>
              <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
                <span>⭐ Реальный рейтинг: <strong>{profile.rating} / 5</strong></span>
                <span>📦 Ваших товаров: <strong>{myItems.length}</strong></span>
              </div>
              <button onClick={() => setIsEditing(true)} style={{ marginTop: '15px', padding: '6px 15px', cursor: 'pointer', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}>✏️ Редактировать профиль</button>
            </>
          ) : (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <h3>Редактирование профиля</h3>
              <input type="text" placeholder="Город" value={city} onChange={e => setCity(e.target.value)} style={{padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}} />
              <textarea placeholder="О себе" value={bio} onChange={e => setBio(e.target.value)} style={{padding: '8px', height: '60px', borderRadius: '4px', border: '1px solid #ccc'}} />
              <input type="text" placeholder="Ссылка на URL аватарки" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} style={{padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ background: '#22c55e', color: 'white', border: 'none', padding: '6px 15px', cursor: 'pointer', borderRadius: '4px' }}>Сохранить</button>
                <button type="button" onClick={() => setIsEditing(false)} style={{ background: '#6b7280', color: 'white', border: 'none', padding: '6px 15px', cursor: 'pointer', borderRadius: '4px' }}>Отмена</button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* --- БЛОК ТОВАРОВ ПОЛЬЗОВАТЕЛЯ --- */}
      <h3>📋 Мои товары в аренде</h3>
      {myItems.length === 0 ? (
        <p style={{color: '#6c757d'}}>Вы еще не выставили ни одного товара.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {myItems.map((item) => (
            <div key={item.id} style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '15px', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>{item.title}</h4>
              <p style={{ color: '#6c757d', fontSize: '13px' }}>{item.description}</p>
              <p style={{ fontWeight: 'bold', color: '#22c55e', margin: '10px 0 0 0' }}>{item.price_per_day} ₽/д</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}