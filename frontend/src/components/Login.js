// frontend/src/components/Login.js

import React, { useState } from 'react';
import axios from 'axios';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography
} from '@mui/material';
import { API_BASE_URL } from '../config'; // Импорт базового URL
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post
        (`${API_BASE_URL}/api/login`,
        { username, password },
        { withCredentials: true }
      );

      if (response.status === 200 && response.data.role === 'admin') {
        onLogin({ username: response.data.username, role: response.data.role });
        navigate('/assets'); // Редирект на /assets
      } else {
        setError('Только администратор может войти');
      }
    } catch (err) {
      console.error(err);
      setError('Ошибка при входе: неверный логин или пароль');
    }
  };

  return (
    <Container maxWidth="xs" style={{ marginTop: '50px' }}>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h5">Вход</Typography>

        {error && <Typography color="error">{error}</Typography>}

        <TextField
          label="Логин"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          fullWidth
        />

        <TextField
          label="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
        />

        <Button variant="contained" color="primary" type="submit" fullWidth>
          Войти
        </Button>
      </Box>
    </Container>
  );
};

export default Login;