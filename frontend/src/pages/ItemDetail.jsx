import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchItem = fetch(`http://localhost:8000/items`).then(res => res.json());

    const fetchUser = token 
      ? fetch('http://localhost:8000/users/me', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.ok ? res.json() : null)
      : Promise.resolve(null);

    Promise.all([fetchItem, fetchUser])
      .then(([itemsData, userData]) => {
        const foundItem = itemsData.find(i => i.id === parseInt(id));
        setItem(foundItem);
        setCurrentUser(userData);

        if (foundItem) {
          setEditTitle(foundItem.title);
          setEditPrice(foundItem.price_per_day);
          setEditImageUrl(foundItem.image_url || '');
          setEditDescription(foundItem.description || '');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id, token]);

  const handleDelete = async () => {
    if (!window.confirm("Вы уверены, что хотите удалить этот товар?")) return;
    try {
      const res = await fetch(`http://localhost:8000/items/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Товар успешно удален!");
        navigate('/');
      } else {
        alert("Ошибка при удалении");
      }
    } catch (err) {
      alert("Ошибка сервера");
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:8000/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editTitle,
          price_per_day: parseFloat(editPrice),
          image_url: editImageUrl,
          description: editDescription,
          category_id: item.category_id
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setItem(updated.item || { ...item, title: editTitle, price_per_day: editPrice, image_url: editImageUrl, description: editDescription });
        setIsEditing(false);
        alert("Изменения сохранены!");
      } else {
        alert("Не удалось обновить товар");
      }
    } catch (err) {
      alert("Ошибка сети");
    }
  };

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
        setReviewMessage('✅ Отзыв успешно отправлен!');
        setComment('');
      }
    } catch (err) {
      setReviewMessage('❌ Не удалось отправить отзыв.');
    }
  };

  if (loading) return <p style={{ padding: '20px', color: '#1e293b' }}>Загрузка...</p>;
  if (!item) return <p style={{ padding: '20px', color: '#ef4444' }}>Товар не найден.</p>;

  const isOwner = currentUser && item.owner_id === currentUser.id;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      
      <button onClick={() => navigate(-1)} style={{ background: '#6b7280', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', marginBottom: '20px' }}>
        ← Назад
      </button>

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
          src={isEditing ? (editImageUrl || 'https://via.placeholder.com/450x350') : (item.image_url || 'https://via.placeholder.com/450x350?text=Нет+фото')} 
          style={{ width: '450px', height: '350px', borderRadius: '15px', objectFit: 'cover' }} 
          alt="" 
        />
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', minHeight: '350px' }}>
          
          {isEditing ? (
            <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h2 style={{ margin: 0, color: '#0f172a' }}>⚙️ Редактирование товара</h2>
              <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} required style={inputStyle} placeholder="Название товара" />
              <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} required style={inputStyle} placeholder="Цена в день (₽)" />
              <input type="text" value={editImageUrl} onChange={e => setEditImageUrl(e.target.value)} style={inputStyle} placeholder="Ссылка на URL картинки" />
              <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} style={{ ...inputStyle, height: '100px', resize: 'none' }} placeholder="Описание товара..." />
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ background: '#22c55e', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Сохранить</button>
                <button type="button" onClick={() => setIsEditing(false)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>Отмена</button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', flex: 1 }}>
              <div>
                <h1 style={{ margin: 0, color: '#0f172a', fontSize: '32px', fontWeight: 'bold' }}>{item.title}</h1>
                
                <p style={{ margin: '10px 0', color: '#475569', fontSize: '16px' }}>
                  Владелец: 
                  <Link to={`/user/${item.owner_id}`} style={{ marginLeft: '8px', color: '#0ea5e9', fontWeight: 'bold', textDecoration: 'none' }}>
                    Посмотреть профиль
                  </Link>
                  {isOwner && <span style={{ marginLeft: '10px', color: '#22c55e', fontSize: '13px', fontWeight: 'bold' }}>(Это вы)</span>}
                </p>

                <p style={{ margin: '15px 0', color: '#475569', fontSize: '15px', lineHeight: '1.5' }}>
                  {item.description || 'Описание товара не указано владельцем.'}
                </p>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#22c55e', marginBottom: '15px' }}>
                  {item.price_per_day} ₽ <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>/ день</span>
                </div>

                {isOwner && (
                  <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                    <button 
                      onClick={() => setIsEditing(true)} 
                      style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                    >
                      ✏️ Редактировать объявление
                    </button>
                    <button 
                      onClick={handleDelete} 
                      style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      🗑️ Удалить вещь
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {!isOwner && (
        <div style={{ background: '#ffffff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', maxWidth: '550px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#0f172a' }}>✍️ Оставить отзыв о сделке / владельце</h3>
          {token ? (
            <form onSubmit={handleSendReview} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <label style={{ color: '#334155', fontSize: '14px' }}>
                Оценка (от 1 до 5):
                <select value={rating} onChange={e => setRating(e.target.value)} style={{ marginLeft: '10px', padding: '6px', borderRadius: '6px', background: 'white', color: '#0f172a' }}>
                  <option value="5">5 ★★★★★</option>
                  <option value="4">4 ★★★★</option>
                  <option value="3">3 ★★★</option>
                  <option value="2">2 ★★</option>
                  <option value="1">1 ★</option>
                </select>
              </label>
              <textarea placeholder="Напишите честный отзыв..." value={comment} onChange={e => setComment(e.target.value)} required style={{ padding: '12px', height: '80px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#0f172a', background: 'white', resize: 'none' }} />
              <button type="submit" style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '10px', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold' }}>Отправить отзыв</button>
            </form>
          ) : (
            <p style={{ color: '#64748b', fontStyle: 'italic' }}>💡 Войдите, чтобы иметь возможность оставлять отзывы.</p>
          )}
          {reviewMessage && <p style={{ marginTop: '15px', fontWeight: 'bold', color: '#10b981' }}>{reviewMessage}</p>}
        </div>
      )}

    </div>
  );
}

const inputStyle = {
  padding: '10px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  fontSize: '14px',
  background: '#fff',
  color: '#0f172a',
  width: '100%',
  boxSizing: 'border-box'
};