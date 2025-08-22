// frontend/src/components/Header.js

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Header = ({ currentUser, setCurrentUser }) => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleLogout = async () => {
    try {
      // Отправляем запрос на выход
      await fetch('http://localhost:5000/api/logout', {
        method: 'GET',
        credentials: 'include' // важно для передачи сессии/куки
      });

      // Очищаем состояние пользователя
      setCurrentUser(null);

      // Перенаправляем на главную страницу
      navigate('/assets');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  return (
    <Box sx={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #ddd',
      padding: '10px 20px',
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 1100,
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    }}>
      {/* Отображение роли */}
      <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
        {currentUser ? 'Администратор' : 'Пользователь'}
      </Typography>

      {/* Кнопка входа или выхода */}
      {!currentUser ? (
        <Button
          variant="contained"
          color="primary"
          onClick={handleLoginClick}
        >
          Войти
        </Button>
      ) : (
        <Button
          variant="outlined"
          color="error"
          onClick={handleLogout}
        >
          Выйти
        </Button>
      )}
    </Box>
  );
};

export default Header;