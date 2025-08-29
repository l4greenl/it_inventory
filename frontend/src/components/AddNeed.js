// frontend/src/components/AddNeed.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme,
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const AddNeed = ({ currentUser }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const [need, setNeed] = useState({
    department_id: '',
    asset_type_id: '',
    quantity: '',
    reason_date: '',
    status: '',
    note: '',
  });

  const [departments, setDepartments] = useState([]);
  const [types, setTypes] = useState([]);
  const [errors, setErrors] = useState({});
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Загрузка справочников
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptsRes, typesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/departments`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/types`, { withCredentials: true }),
        ]);
        // Сортируем по алфавиту
        const sortedDepts = deptsRes.data.sort((a, b) =>
          a.name.localeCompare(b.name, 'ru')
        );
        const sortedTypes = typesRes.data.sort((a, b) =>
          a.name.localeCompare(b.name, 'ru')
        );
        setDepartments(sortedDepts);
        setTypes(sortedTypes);
      } catch (error) {
        console.error('Ошибка загрузки справочников:', error);
        alert('Не удалось загрузить справочники. Пожалуйста, обновите страницу.');
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNeed((prev) => ({ ...prev, [name]: value }));

    // Очищаем ошибку при изменении поля
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Проверка обязательных полей
  const validateForm = () => {
    const newErrors = {};
    if (!need.department_id) newErrors.department_id = 'Обязательное поле';
    if (!need.asset_type_id) newErrors.asset_type_id = 'Обязательное поле';
    if (!need.quantity || parseInt(need.quantity, 10) <= 0) newErrors.quantity = 'Введите положительное число';
    if (!need.reason_date) newErrors.reason_date = 'Обязательное поле';
    if (!need.status.trim()) newErrors.status = 'Обязательное поле';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Подготовка данных для отправки
    const dataToSend = {
      department_id: parseInt(need.department_id, 10),
      asset_type_id: parseInt(need.asset_type_id, 10),
      quantity: parseInt(need.quantity, 10),
      reason_date: need.reason_date, // Дата основания
      status: need.status.trim(),
      note: need.note.trim() || null, // Примечание может быть null
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/api/needs`, dataToSend, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 201) {
        alert('Потребность успешно добавлена!');
        navigate('/needs'); // Переход к списку после успешного добавления
      }
    } catch (error) {
      console.error('Ошибка при добавлении потребности:', error);
      if (error.response) {
        if (error.response.status === 400) {
          alert(`Ошибка в данных: ${error.response.data.error || 'Проверьте правильность заполнения формы.'}`);
        } else if (error.response.status === 401) {
          alert('Ошибка авторизации. Пожалуйста, войдите в систему.');
          // Можно вызвать logout функцию здесь, если она доступна
        } else if (error.response.status === 403) {
          alert('Доступ запрещен. У вас нет прав для выполнения этой операции.');
        } else if (error.response.status === 500) {
          alert('Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.');
        } else {
          alert(`Ошибка сервера: ${error.response.status} - ${error.response.statusText}`);
        }
      } else if (error.request) {
        alert('Ошибка сети. Проверьте подключение к интернету.');
      } else {
        alert(`Ошибка: ${error.message}`);
      }
    }
  };

  const handleCancel = () => {
    // Проверяем, есть ли несохраненные изменения
    const hasChanges = Object.values(need).some(
      (value) => value !== '' && value !== null && value !== undefined
    );
    
    if (hasChanges) {
      setCancelDialogOpen(true); // Открываем диалог подтверждения
    } else {
      navigate('/needs'); // Нет изменений, просто уходим
    }
  };

  const handleConfirmCancel = () => {
    setCancelDialogOpen(false);
    navigate('/needs');
  };

  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
          Добавить потребность
        </Typography>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          backgroundColor: theme.palette.background.paper,
          padding: 3,
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Grid container spacing={2}>
          {/* Отдел (подразделение) - Обязательное */}
          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              margin="normal"
              error={!!errors.department_id}
              required
            >
              <InputLabel id="department-label">Отдел (подразделение) *</InputLabel>
              <Select
                labelId="department-label"
                name="department_id"
                value={need.department_id}
                onChange={handleChange}
                label="Отдел (подразделение) *"
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.department_id && (
                <Typography variant="caption" color="error">
                  {errors.department_id}
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Наименование потребности (Тип устройства) - Обязательное */}
          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              margin="normal"
              error={!!errors.asset_type_id}
              required
            >
              <InputLabel id="asset-type-label">Наименование потребности *</InputLabel>
              <Select
                labelId="asset-type-label"
                name="asset_type_id"
                value={need.asset_type_id}
                onChange={handleChange}
                label="Наименование потребности *"
              >
                {types.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.asset_type_id && (
                <Typography variant="caption" color="error">
                  {errors.asset_type_id}
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Количество - Обязательное */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Количество *"
              name="quantity"
              type="number"
              value={need.quantity}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={!!errors.quantity}
              helperText={errors.quantity}
              required
              inputProps={{ min: "1", step: "1" }}
            />
          </Grid>

          {/* Основание (Дата) - Обязательное */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Дата основания *"
              name="reason_date"
              type="date"
              value={need.reason_date}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={!!errors.reason_date}
              helperText={errors.reason_date}
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          {/* Статус - Обязательное */}
          <Grid item xs={12}>
            <TextField
              label="Статус *"
              name="status"
              value={need.status}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={!!errors.status}
              helperText={errors.status}
              required
            />
          </Grid>

          {/* Примечание */}
          <Grid item xs={12}>
            <TextField
              label="Примечание"
              name="note"
              value={need.note}
              onChange={handleChange}
              fullWidth
              margin="normal"
              multiline
              rows={3}
            />
          </Grid>
        </Grid>

        {/* Кнопки действий */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleCancel}
            sx={{ minWidth: 120 }}
          >
            Отмена
          </Button>
          <Button
            variant="contained"
            color="success" // Зелёная кнопка
            type="submit"
            sx={{ minWidth: 120 }}
          >
            Добавить
          </Button>
        </Box>
      </Box>

      {/* Диалог подтверждения отмены */}
      <Dialog
        open={cancelDialogOpen}
        onClose={handleCloseCancelDialog}
        aria-labelledby="cancel-dialog-title"
        aria-describedby="cancel-dialog-description"
      >
        <DialogTitle id="cancel-dialog-title">
          Подтвердите отмену
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="cancel-dialog-description">
            Вы уверены, что хотите отменить добавление? Все введённые данные будут потеряны.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog} color="primary">
            Продолжить заполнение
          </Button>
          <Button onClick={handleConfirmCancel} color="error" autoFocus>
            Отменить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AddNeed;