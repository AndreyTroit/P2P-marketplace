import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]); // Состояние для списка категорий
  
  // Состояния формы
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [categoryId, setCategoryId] = useState(''); // Сюда запишется ID выбранной категории
  
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token');

  // 1. Загрузка товаров
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

  // 2. Загрузка категорий с бэкенда
  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8000/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        if (data.length > 0) {
          setCategoryId(data[0].id); // По умолчанию выбираем первую категорию из списка
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchCategories(); // Подгружаем категории при открытии сайта
  }, []);

  // Отправка формы создания товара
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
          category_id: parseInt(categoryId) // Передаем ID из выпадающего списка!
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

      {/* --- ФОРМА ДОБАВЛЕНИЯ --- */}
      {token ? (
        <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '30px', maxWidth: '400px' }}>
          <h3>➕ Сдать вещь в аренду</h3>
          <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Название вещи" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
            />
            <textarea 
              placeholder="Описание состояния" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
            />
            <input 
              type="number" 
              placeholder="Цена аренды за день (руб)" 
              value={pricePerDay} 
              onChange={(e) => setPricePerDay(e.target.value)} 
              required 
            />

            {/* ВЫПАДАЮЩИЙ СПИСОК КАТЕГОРИЙ */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '14px', color: '#555' }}>
              Выберите категорию:
              <select 
                value={categoryId} 
                onChange={(e) => setCategoryId(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px', cursor: 'pointer', borderRadius: '4px' }}>
              Опубликовать
            </button>
          </form>
          {message && <p style={{ color: message.startsWith('Ошибка') ? 'red' : 'green', marginTop: '10px' }}>{message}</p>}
        </div>
      ) : (
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          💡 Чтобы сдать свою вещь в аренду, пожалуйста, <a href="/auth">авторизуйтесь</a>.
        </p>
      )}

      {/* --- СПИСОК ТОВАРОВ --- */}
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