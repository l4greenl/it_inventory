// frontend/src/components/EditNeed.js

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
  CircularProgress,
  Alert,
  // Добавьте другие необходимые импорты, например, FormControl, FormHelperText, если используете валидацию
} from '@mui/material';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';

// ... (другие импорты, если есть, например, для иконок)

const EditNeed = ({ currentUser }) => {
  const navigate = useNavigate();
  const { id } = useParams(); // Получаем ID из URL
  const theme = useTheme();

  // --- Состояния ---
  const [need, setNeed] = useState({
    date: '', // Дата создания (обычно не редактируется)
    department_id: '',
    asset_type_id: '',
    quantity: '',
    reason_date: '', // Дата основания
    status: '',
    note: '',
    // inventory_number, serial_number и другие поля из Asset не используются в Need
  });

  const [departments, setDepartments] = useState([]);
  const [types, setTypes] = useState([]); // asset_types
  // const [statuses, setStatuses] = useState([]); // Если список статусов загружается отдельно

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false); // Для отслеживания состояния сохранения
  const [fetchError, setFetchError] = useState(''); // Ошибка загрузки данных

  // --- Состояния для модального окна удаления ---
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteError, setDeleteError] = useState(''); // Ошибка при удалении

  // --- Загрузка данных ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setFetchError('');
      setDeleteError('');
      try {
        // Загружаем справочники
        const [deptsRes, typesRes /*, statusesRes */] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/departments`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/types`, { withCredentials: true }), // Или отдельный эндпоинт для типов потребностей
          // axios.get(`${API_BASE_URL}/api/statuses`, { withCredentials: true }), // Если статусы отдельно
        ]);

        // Загружаем конкретную потребность
        const needRes = await axios.get(`${API_BASE_URL}/api/needs/${id}`, { withCredentials: true });

        const sortedDepts = deptsRes.data.sort((a, b) =>
          a.name.localeCompare(b.name, 'ru')
        );
        const sortedTypes = typesRes.data.sort((a, b) =>
          a.name.localeCompare(b.name, 'ru')
        );
        // const availableStatuses = statusesRes.data; // Если загружаете статусы

        setDepartments(sortedDepts);
        setTypes(sortedTypes);
        // setStatuses(availableStatuses); // Если используете

        // Устанавливаем данные в форму
        setNeed({
          date: needRes.data.date || '',
          department_id: needRes.data.department_id || '',
          asset_type_id: needRes.data.asset_type_id || '',
          quantity: needRes.data.quantity || '',
          reason_date: needRes.data.reason_date || '', // Формат YYYY-MM-DD
          status: needRes.data.status || '',
          note: needRes.data.note || '',
        });

      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        if (error.response) {
          if (error.response.status === 404) {
            setFetchError('Потребность не найдена.');
          } else {
            setFetchError(`Ошибка загрузки данных: ${error.response.status}`);
          }
        } else {
          setFetchError('Ошибка сети. Проверьте подключение.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]); // Зависимость от id

  // --- Обработчики ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNeed((prev) => ({ ...prev, [name]: value }));

    // Очистка ошибок при изменении поля
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // --- Валидация формы ---
  const validateForm = () => {
    const newErrors = {};
    // Примеры обязательных полей (адаптируйте под свои правила)
    if (!need.department_id) newErrors.department_id = 'Обязательное поле';
    if (!need.asset_type_id) newErrors.asset_type_id = 'Обязательное поле';
    if (!need.quantity || parseInt(need.quantity, 10) <= 0) newErrors.quantity = 'Введите положительное число';
    if (!need.reason_date) newErrors.reason_date = 'Обязательное поле';
    if (!need.status?.trim()) newErrors.status = 'Обязательное поле';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Сохранение изменений ---
  const handleSave = async (e) => {
    e.preventDefault(); // Предотвращает перезагрузку страницы, если форма обернута в <form>

    if (!validateForm()) {
      return;
    }

    setSaveLoading(true);
    setDeleteError(''); // Очищаем ошибку удаления перед сохранением

    // Подготавливаем данные для отправки
    const dataToSend = {
      department_id: parseInt(need.department_id, 10),
      asset_type_id: parseInt(need.asset_type_id, 10),
      quantity: parseInt(need.quantity, 10),
      reason_date: need.reason_date, // Дата в формате YYYY-MM-DD
      status: need.status.trim(),
      note: need.note.trim() || null, // Примечание может быть null
    };

    try {
      const response = await axios.put(`${API_BASE_URL}/api/needs/${id}`, dataToSend, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        alert('Потребность успешно обновлена!');
        // После успешного сохранения можно перенаправить на список
        navigate('/needs');
        // Или обновить локальное состояние, если остаетесь на странице
        // setNeed(response.data); // Если response.data содержит обновленный объект
      }
    } catch (error) {
      console.error('Ошибка при обновлении потребности:', error);
      if (error.response) {
        if (error.response.status === 400) {
          // Ошибки валидации данных
          if (error.response.data.details) {
            // Предполагаем, что details - это объект { field: "message" }
            setErrors(error.response.data.details);
          } else {
            alert(`Ошибка в данных: ${error.response.data.error || 'Проверьте правильность заполнения формы.'}`);
          }
        } else if (error.response.status === 401) {
          alert('Ошибка авторизации. Пожалуйста, войдите в систему.');
        } else if (error.response.status === 403) {
          alert('Доступ запрещен.');
        } else if (error.response.status === 404) {
          alert('Потребность не найдена.');
          navigate('/needs'); // Перенаправляем, если не найдена
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
    } finally {
      setSaveLoading(false);
    }
  };

  // --- Удаление потребности ---
  const handleOpenDeleteDialog = () => {
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeleteError(''); // Очищаем ошибку при закрытии
  };

  const handleDelete = async () => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/needs/${id}`, {
        withCredentials: true,
      });

      if (response.status === 200) {
        alert('Потребность успешно удалена!');
        // Перенаправляем на список после удаления
        navigate('/needs');
      }
    } catch (error) {
      console.error('Ошибка при удалении потребности:', error);
      if (error.response) {
        if (error.response.status === 401) {
          alert('Ошибка авторизации.');
          handleCloseDeleteDialog(); // Закрываем диалог
        } else if (error.response.status === 403) {
          alert('Доступ запрещен.');
          handleCloseDeleteDialog();
        } else if (error.response.status === 404) {
            alert('Потребность не найдена.');
            handleCloseDeleteDialog();
            navigate('/needs'); // Перенаправляем, если не найдена
        } else if (error.response.status === 500) {
          setDeleteError('Внутренняя ошибка сервера при удалении.'); // Показываем в диалоге
        } else {
          setDeleteError(`Ошибка сервера: ${error.response.status}`); // Показываем в диалоге
        }
      } else if (error.request) {
        setDeleteError('Ошибка сети. Проверьте подключение.'); // Показываем в диалоге
      } else {
        setDeleteError(`Ошибка: ${error.message}`); // Показываем в диалоге
      }
    }
    // Не закрываем диалог автоматически при ошибке, чтобы пользователь увидел сообщение
  };


  // --- Навигация назад ---
  const handleGoBack = () => {
    // Можно добавить проверку на несохраненные изменения, если нужно
    navigate('/needs');
  };

  // --- Отображение ---
  if (loading) return (
    <Container maxWidth="md" sx={{ mt: 3, textAlign: 'center' }}>
      <CircularProgress />
      <Typography>Загрузка потребности...</Typography>
    </Container>
  );

  if (fetchError) return (
    <Container maxWidth="md" sx={{ mt: 3 }}>
      <Alert severity="error">{fetchError}</Alert>
      <Box sx={{ mt: 2 }}>
        <Button variant="outlined" onClick={handleGoBack}>
          Назад к списку
        </Button>
      </Box>
    </Container>
  );


  return (
    <Container maxWidth="md">
      <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="h5" gutterBottom>Редактирование потребности</Typography>
        
      {/* Форма редактирования */}

        <Grid container spacing={2}>
          {/* Отдел (подразделение) - Обязательное */}
          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              margin="normal"
              sx={{ mb: -1 }}
              error={!!errors.department_id}
              required
            >
              <InputLabel id="department-label">Отдел (подразделение)</InputLabel>
              <Select
                labelId="department-label"
                name="department_id"
                value={need.department_id}
                onChange={handleChange}
                label="Отдел (подразделение)"
                disabled={!currentUser || currentUser.role !== 'admin'}
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
              sx={{ mb: -1 }}
              error={!!errors.asset_type_id}
              required
            >
              <InputLabel id="asset-type-label">Наименование потребности</InputLabel>
              <Select
                labelId="asset-type-label"
                name="asset_type_id"
                value={need.asset_type_id}
                onChange={handleChange}
                label="Наименование потребности"
                disabled={!currentUser || currentUser.role !== 'admin'}
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
              label="Количество"
              name="quantity"
              type="number"
              value={need.quantity}
              onChange={handleChange}
              fullWidth
              margin="normal"
              sx={{ mb: -1 }}
              error={!!errors.quantity}
              helperText={errors.quantity}
              required
              inputProps={{ min: "1", step: "1" }}
              disabled={!currentUser || currentUser.role !== 'admin'}
            />
          </Grid>

          {/* Основание (Дата) - Обязательное */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Дата основания"
              name="reason_date"
              type="date"
              value={need.reason_date}
              onChange={handleChange}
              fullWidth
              margin="normal"
              sx={{ mb: -1 }}
              error={!!errors.reason_date}
              helperText={errors.reason_date}
              required
              InputLabelProps={{
                shrink: true,
              }}
              disabled={!currentUser || currentUser.role !== 'admin'}
            />
          </Grid>

          {/* Статус - Обязательное */}
          <Grid item xs={12}>
            <TextField
              label="Статус"
              name="status"
              value={need.status}
              onChange={handleChange}
              fullWidth
              margin="normal"
              sx={{ mb: -1 }}
              error={!!errors.status}
              helperText={errors.status}
              required
              disabled={!currentUser || currentUser.role !== 'admin'}
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
              sx={{ mb: -1 }}
              multiline
              rows={3}
              disabled={!currentUser || currentUser.role !== 'admin'}
            />
          </Grid>
        </Grid>
      </Box>
        {/* <<<--- ИЗМЕНЕНО: Кнопки действий внизу, аналогично AssetDetails --- */}
        <Box mt={4.5} display="flex" justifyContent="space-between" alignItems="center">
          {/* Кнопка "Назад" */}
          <Button onClick={handleGoBack} variant="outlined">
            Назад
          </Button>

          {/* Кнопки "Удалить" и "Сохранить" для администратора */}
          <Box>
            {currentUser && currentUser.role === 'admin' && (
              <>
                {/* Кнопка "Удалить" */}
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleOpenDeleteDialog} // Открывает модальное окно
                  disabled={!currentUser || currentUser.role !== 'admin' || saveLoading} // Блокировка во время сохранения
                  sx={{ mr: '16px' }}
                >
                  Удалить
                </Button>

                {/* Кнопка "Сохранить" */}
                <Button
                  type="submit" // Тип submit для формы
                  variant="contained"
                  color="success"
                  // onClick={handleSave} // Не нужен, так как обработчик на form onSubmit
                  disabled={!currentUser || currentUser.role !== 'admin' || saveLoading}
                >
                  {saveLoading ? <CircularProgress size={24} /> : 'Сохранить'}
                </Button>
              </>
            )}
          </Box>
        </Box>
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}

      {/* <<<--- ИЗМЕНЕНО: Модальное окно подтверждения удаления --- */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Подтвердите удаление"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Вы уверены, что хотите удалить эту потребность?
            Это действие нельзя отменить.
          </DialogContentText>
          {/* Отображение ошибки удаления внутри диалога */}
          {deleteError && (
            <Alert severity="error" style={{ marginTop: '10px' }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          {/* Кнопка "Отмена" в диалоге */}
          <Button onClick={handleCloseDeleteDialog} color="primary" disabled={saveLoading}>
            Отмена
          </Button>
          {/* Кнопка "Удалить" в диалоге */}
          <Button
            onClick={handleDelete}
            color="error"
            autoFocus
            disabled={saveLoading}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
      {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
    </Container>
  );
};

export default EditNeed;