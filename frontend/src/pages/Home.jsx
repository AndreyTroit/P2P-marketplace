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
          category_id: parseInt(categoryId)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Товар успешно добавлен в каталог!');
        setTitle('');
        setDescription('');
        setPricePerDay('');
        fetchItems();
      } else {
        setMessage(`Ошибка: ${data.detail || 'Не удалось добавить товар'}`);
      }
    } catch (error) {
      setMessage('Ошибка соединения с сервером.');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '15px' }}>
          {items.map((item) => (
            <Link to={`/item/${item.id}`} key={item.id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h4>{item.title}</h4>
                <p style={{ color: '#666', fontSize: '14px' }}>{item.description || 'Нет описания'}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                  <span style={{ fontWeight: 'bold', color: '#007bff' }}>{item.price_per_day} ₽ / день</span>
                  <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '4px', background: item.is_available ? '#e2f0d9' : '#fce4d6', color: item.is_available ? '#385723' : '#c65911' }}>
                    {item.is_available ? 'Доступно' : 'Занято'}
                  </span>
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