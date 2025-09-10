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
  Tooltip,
  // <<< ДОБАВИЛ CircularProgress для индикатора загрузки
  CircularProgress, 
  // <<< ДОБАВИЛ Alert для отображения ошибок
  Alert, 
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
    status: '', // Инициализируем пустой строкой
    note: '',
  });

  // <<< ДОБАВИЛ: Состояние для отслеживания touched-полей (которые пользователь начал заполнять)
  const [touched, setTouched] = useState({});
  // <<< ДОБАВИЛ: Состояние для ошибок валидации
  const [errors, setErrors] = useState({});
  // <<< ДОБАВИЛ: Состояние загрузки
  const [loading, setLoading] = useState(false);
  // <<< ДОБАВИЛ: Состояние для ошибок сервера
  const [serverError, setServerError] = useState('');

  const [departments, setDepartments] = useState([]);
  const [types, setTypes] = useState([]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const availableStatuses = ['Принято', 'В процессе', 'Исполнено'];

  // Загрузка справочников
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptsRes, typesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/departments`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/types`, { withCredentials: true }),
        ]);
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

  // <<< ИЗМЕНЕНО: Функция для проверки валидности конкретного поля
  const validateField = (name, value) => {
    switch (name) {
      case 'department_id':
        return value ? '' : 'Обязательное поле';
      case 'asset_type_id':
        return value ? '' : 'Обязательное поле';
      case 'quantity':
        const numValue = parseInt(value, 10);
        return (!isNaN(numValue) && numValue > 0) ? '' : 'Введите положительное число';
      case 'reason_date':
        return value ? '' : 'Обязательное поле';
      case 'status':
        return value && value.trim() ? '' : 'Обязательное поле';
      default:
        return '';
    }
  };

  // <<< ИЗМЕНЕНО: Функция для проверки всей формы
  const validateForm = () => {
    const newErrors = {};
    Object.keys(need).forEach(key => {
      newErrors[key] = validateField(key, need[key]);
    });
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNeed((prev) => ({ ...prev, [name]: value }));

    // <<< ДОБАВИЛ: Отмечаем поле как "touched" при изменении
    setTouched((prev) => ({ ...prev, [name]: true }));

    // <<< ДОБАВИЛ: Валидируем поле при изменении, если оно уже было "touched"
    if (touched[name] || errors[name]) {
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  // <<< ИЗМЕНЕНО: handleSubmit теперь асинхронная и предотвращает стандартное поведение формы
  const handleSubmit = async (e) => {
    e.preventDefault(); // <<< ВАЖНО: Предотвращаем перезагрузку страницы

    // <<< ДОБАВИЛ: Помечаем все поля как "touched" при попытке отправки
    const allTouched = Object.keys(need).reduce((acc, key) => {
        acc[key] = true;
        return acc;
    }, {});
    setTouched(allTouched);

    // <<< ДОБАВИЛ: Проводим валидацию
    const formErrors = validateForm();
    setErrors(formErrors);

    // <<< ДОБАВИЛ: Проверяем, есть ли ошибки
    const hasErrors = Object.values(formErrors).some(error => error !== '');
    if (hasErrors) {
        return; // Прерываем отправку, если есть ошибки
    }

    setLoading(true);
    setServerError(''); // Очищаем предыдущую ошибку сервера

    // Подготовка данных для отправки
    const dataToSend = {
      department_id: parseInt(need.department_id, 10),
      asset_type_id: parseInt(need.asset_type_id, 10),
      quantity: parseInt(need.quantity, 10),
      reason_date: need.reason_date,
      status: need.status.trim(),
      note: need.note.trim() || null,
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
        navigate('/needs');
      }
    } catch (error) {
      console.error('Ошибка при добавлении потребности:', error);
      let errorMessage = 'Неизвестная ошибка';
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = `Ошибка в данных: ${error.response.data.error || 'Проверьте правильность заполнения формы.'}`;
          // Если сервер прислал детали ошибок по полям, обновим их
          if (error.response.data.details) {
              const serverFieldErrors = error.response.data.details;
              setErrors(prevErrors => ({ ...prevErrors, ...serverFieldErrors }));
          }
        } else if (error.response.status === 401) {
          errorMessage = 'Ошибка авторизации. Пожалуйста, войдите в систему.';
        } else if (error.response.status === 403) {
          errorMessage = 'Доступ запрещен. У вас нет прав для выполнения этой операции.';
        } else if (error.response.status === 500) {
          errorMessage = 'Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.';
        } else {
          errorMessage = `Ошибка сервера: ${error.response.status} - ${error.response.statusText}`;
        }
      } else if (error.request) {
        errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      } else {
        errorMessage = `Ошибка: ${error.message}`;
      }
      setServerError(errorMessage); // Отображаем ошибку сервера
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const hasChanges = Object.values(need).some(
      (value) => value !== '' && value !== null && value !== undefined
    );
    
    if (hasChanges) {
      setCancelDialogOpen(true);
    } else {
      navigate('/needs');
    }
  };

  const handleConfirmCancel = () => {
    setCancelDialogOpen(false);
    navigate('/needs');
  };

  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
  };

  // <<< ДОБАВИЛ: Функция для определения, должно ли поле быть выделено как ошибочное
  const isError = (fieldName) => {
    return touched[fieldName] && !!errors[fieldName];
  };

  return (
    <Container maxWidth="md">
      <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
        <Typography variant="h5" gutterBottom>Добавить потребность</Typography>
      </Box>
        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>
        )}
      <Box
        component="form"
        onSubmit={handleSubmit}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              margin="normal"
              error={isError('department_id')}
            >
              <InputLabel id="department-label">Отдел (подразделение) *</InputLabel>
              <Select
                labelId="department-label"
                name="department_id"
                value={need.department_id}
                onChange={handleChange}
                label="Отдел (подразделение) *"
                sx={isError('department_id') ? {'& .MuiOutlinedInput-notchedOutline': { borderColor: 'error.main' } } : {mb: -2}}
                MenuProps={{
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  },
                  PaperProps: {
                    style: {
                      maxHeight: 260,
                    },
                  },
                }}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              margin="normal"
              error={isError('asset_type_id')}
            >
              <InputLabel id="asset-type-label">Наименование потребности *</InputLabel>
              <Select
                labelId="asset-type-label"
                name="asset_type_id"
                value={need.asset_type_id}
                onChange={handleChange}
                label="Наименование потребности *"
                sx={isError('asset_type_id') ? {'& .MuiOutlinedInput-notchedOutline': { borderColor: 'error.main' } } : {mb: -2}}
                MenuProps={{
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  },
                  PaperProps: {
                    style: {
                      maxHeight: 260,
                    },
                  },
                }}
              >
                {types.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Количество *"
              name="quantity"
              type="number"
              value={need.quantity}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={isError('quantity')}
              inputProps={{ min: "1", step: "1" }}
              sx={isError('quantity') ? {'& .MuiOutlinedInput-notchedOutline': { borderColor: 'error.main' } } : {mb: -1}}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Дата основания *"
              name="reason_date"
              type="date"
              value={need.reason_date}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={isError('reason_date')}
              InputLabelProps={{
                shrink: true,
              }}
              sx={isError('reason_date') ? {'& .MuiOutlinedInput-notchedOutline': { borderColor: 'error.main' } } : {mb: 1}}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              variant="outlined"
              error={isError('status')} // Используем существующую логику isError
            >
              <InputLabel id="need-status-label">Статус *</InputLabel>
              <Select
                label="Статус *"
                labelId="need-status-label"
                name="status"
                value={need.status}
                onChange={handleChange}
                fullWidth
                margin="normal"
                error={isError('status')}
                sx={isError('status') ? { '& .MuiOutlinedInput-notchedOutline': { borderColor: 'error.main' } } : {mb: -1}}
              >
                {availableStatuses.map((statusText) => (
                  <MenuItem key={statusText} value={statusText}>
                    {statusText}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

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

        <Box display="flex" justifyContent="space-between" mt={1.5} mb={2}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleCancel}
          >
            Отмена
          </Button>
          <Button
            variant="contained"
            color="success"
            type="submit" // <<< ВАЖНО: type="submit" для отправки формы
            sx={{ minWidth: 120 }}
            disabled={loading} // <<< ДОБАВИЛ: Блокировка во время загрузки
          >
            {loading ? <CircularProgress size={24} /> : 'Добавить'} {/* <<< ДОБАВИЛ: Индикатор загрузки */}
          </Button>
        </Box>
      </Box>

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