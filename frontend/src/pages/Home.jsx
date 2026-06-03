import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token');

  const fetchItems = async () => {
    try {
      const response = await fetch('http://localhost:8000/items');
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8000/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        if (data.length > 0) {
          setCategoryId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!categoryId) {
      setMessage('Ошибка: Сначала администратор должен добавить категории в БД!');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title,
          description: description,
          price_per_day: parseFloat(pricePerDay),
          category_id: parseInt(categoryId),
          image_url: imageUrl
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Товар успешно добавлен в каталог!');
        setTitle('');
        setDescription('');
        setPricePerDay('');
        setImageUrl('');
        fetchItems();
      } else {
        setMessage(`Ошибка: ${data.detail || 'Не удалось добавить товар'}`);
      }
    } catch (error) {
      setMessage('Ошибка соединения с сервером.');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <h2>Каталог вещей для шеринга</h2>

      {token ? (
        <div style={{ background: '#ffffff', padding: '25px', borderRadius: '12px', marginBottom: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h3 style={{ marginTop: 0, color: '#1e293b' }}>➕ Сдать вещь в аренду</h3>
          <form onSubmit={handleAddItem} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <input type="text" placeholder="Название вещи" value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />
            <input type="number" placeholder="Цена (руб/день)" value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} required style={inputStyle} />
            <input type="text" placeholder="Ссылка на фото (URL)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={inputStyle} />
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={inputStyle}>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <textarea placeholder="Описание состояния..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, gridColumn: 'span 2', height: '80px' }} />
            <button type="submit" style={{ gridColumn: 'span 2', background: '#0f172a', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              Опубликовать объявление
            </button>
          </form>
          {message && <p style={{ marginTop: '15px', fontWeight: 'bold', color: message.includes('Ошибка') ? '#ef4444' : '#10b981' }}>{message}</p>}
        </div>
      ) : (
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          💡 Чтобы сдать свою вещь в аренду, пожалуйста, <a href="/auth">авторизуйтесь</a>.
        </p>
      )}

      <h3>Доступные предложения</h3>
      {items.length === 0 ? (
        <p>Каталог пока пуст.</p>
      ) : (
        /* Контейнер списка: элементы выводятся строго построчно (один под другим) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '15px' }}>
          {items.map((item) => (
            <Link to={`/item/${item.id}`} key={item.id} style={{ textDecoration: 'none', color: 'inherit' }}>
              
              {/* Горизонтальная прямоугольная карточка в стиле макета ItemDetail */}
              <div style={{ 
                background: '#ffffff', 
                borderRadius: '12px', 
                padding: '20px', 
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0',
                display: 'flex', 
                gap: '25px',
                alignItems: 'center'
              }}>
                
                {/* Вывод изображения товара с фиксированными границами */}
                <img 
                  src={item.image_url || 'https://via.placeholder.com/200x150?text=Нет+фото'} 
                  style={{ width: '200px', height: '150px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} 
                  alt={item.title} 
                />
                
                {/* Текстовый информационный блок карточки */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'space-between', height: '130px' }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#0f172a', fontSize: '20px', fontWeight: 'bold' }}>{item.title}</h4>
                    <p style={{ margin: '8px 0 0 0', color: '#475569', fontSize: '14px', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {item.description || 'Описание товара не указано владельцем.'}
                    </p>
                  </div>
                  
                  {/* Нижняя строка: Стоимость и статус доступности */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e' }}>
                      {item.price_per_day} ₽ <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>/ день</span>
                    </div>
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      padding: '5px 10px', 
                      borderRadius: '6px', 
                      background: item.is_available !== false ? '#e2f0d9' : '#fee2e2', 
                      color: item.is_available !== false ? '#385723' : '#b91c1c' 
                    }}>
                      {item.is_available !== false ? 'Доступно' : 'Занято'}
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

const inputStyle = {
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '14px',
  outline: 'none',
  background: '#ffffff',
  color: '#1e293b'
};