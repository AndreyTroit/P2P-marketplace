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

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
    
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

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingMessage('');
    
    try {
      const res = await fetch('http://localhost:8000/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          item_id: parseInt(id),
          start_date: startDate,
          end_date: endDate
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setBookingMessage(`🎉 Успешно забронировано! Итого к оплате: ${data.booking.total_price} ₽`);
        setItem({ ...item, is_available: false });
      } else {
        setBookingMessage(`❌ Ошибка: ${data.detail || 'Не удалось забронировать'}`);
      }
    } catch (err) {
      setBookingMessage('❌ Ошибка соединения с сервером.');
    }
  };

  const calculatePreviewPrice = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays * item.price_per_day : 0;
  };

  const handleStartChat = async () => {
    if (!token) {
      alert("💡 Пожалуйста, авторизуйтесь, чтобы написать продавцу.");
      return;
    }

    try {
      // Отправляем стартовое системное сообщение бэкенду
      const res = await fetch('http://localhost:8000/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiver_id: item.owner_id,
          text: `Здравствуйте! Меня заинтересовал ваш товар: "${item.title}". Подскажите, он доступен?`
        })
      });

      if (res.ok) {
        // Как только сообщение записалось в БД, чат официально создан. Перенаправляем в мессенджер!
        navigate('/chat');
      } else {
        const data = await res.json();
        alert(`Ошибка: ${data.detail || 'Не удалось начать диалог'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка при соединении с сервером.");
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

                {/* Кнопка "Написать продавцу" отображается только для гостей */}
                {!isOwner && (
                  <button 
                    onClick={handleStartChat}
                    style={{background: '#0ea5e9', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
                      fontSize: '14px', marginTop: '5px', marginBottom: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(14, 165, 233, 0.2)' }}
                  >💬 Написать продавцу</button>
                )}

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
        <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ 
            flex: 1, 
            minWidth: '300px', 
            background: '#ffffff', 
            padding: '25px', 
            borderRadius: '12px', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#0f172a' }}>✍️ Оставить отзыв о владельце</h3>
            {token ? (
              <form onSubmit={handleSendReview} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label style={{ color: '#334155', fontSize: '14px' }}>
                  Оценка (от 1 до 5):
                  <select value={rating} onChange={e => setRating(e.target.value)} style={{ marginLeft: '10px', padding: '6px', borderRadius: '6px', background: 'white', color: '#0f172a', border: '1px solid #cbd5e1' }}>
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
              <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0 }}>💡 Войдите, чтобы иметь возможность оставлять отзывы.</p>
            )}
            {reviewMessage && <p style={{ marginTop: '15px', fontWeight: 'bold', color: '#10b981' }}>{reviewMessage}</p>}
          </div>

          <div style={{ 
            flex: 1, 
            minWidth: '300px', 
            background: '#ffffff', 
            padding: '25px', 
            borderRadius: '12px', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#0f172a' }}>📅 Бронирование вещи</h3>
            {token ? (
              item.is_available !== false ? (
                <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <label style={{ flex: 1, color: '#475569', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      Начало аренды:
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required style={inputStyle} />
                    </label>
                    <label style={{ flex: 1, color: '#475569', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      Конец аренды:
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required style={inputStyle} />
                    </label>
                  </div>

                  {calculatePreviewPrice() > 0 && (
                    <p style={{ margin: '5px 0', color: '#0f172a', fontSize: '15px', fontWeight: '500' }}>
                      Итоговая стоимость: <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '18px' }}>{calculatePreviewPrice()} ₽</span>
                    </p>
                  )}

                  <button type="submit" style={{ background: '#22c55e', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                    Подтвердить бронирование
                  </button>
                </form>
              ) : (
                <p style={{ color: '#ef4444', fontWeight: '500', margin: 0 }}>🔒 К сожалению, этот предмет сейчас занят или уже забронирован.</p>
              )
            ) : (
              <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0 }}>💡 Войдите в аккаунт, чтобы забронировать эту вещь.</p>
            )}
            {bookingMessage && (
              <p style={{ 
                marginTop: '15px', 
                fontWeight: 'bold', 
                fontSize: '14px', 
                color: bookingMessage.includes('❌') ? '#ef4444' : '#10b981' 
              }}>
                {bookingMessage}
              </p>
            )}
          </div>

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

const bookingInputStyle = {
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  color: '#0f172a',
  fontSize: '14px',
  width: '100%',
  boxSizing: 'border-box'
};