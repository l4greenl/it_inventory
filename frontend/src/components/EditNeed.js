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
  Tooltip, 
} from '@mui/material';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const EditNeed = ({ currentUser }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const theme = useTheme();

  const [need, setNeed] = useState({
    date: '',
    department_id: '',
    asset_type_id: '',
    quantity: '',
    reason_date: '',
    status: '',
    note: '',
  });

  const [departments, setDepartments] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // <<< ДОБАВИЛ: Состояния для валидации
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const availableStatuses = ['Принято', 'В процессе', 'Исполнено'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setFetchError('');
      setDeleteError('');
      try {
        const [deptsRes, typesRes, needRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/departments`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/types`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/needs/${id}`, { withCredentials: true }),
        ]);

        const sortedDepts = deptsRes.data.sort((a, b) =>
          a.name.localeCompare(b.name, 'ru')
        );
        const sortedTypes = typesRes.data.sort((a, b) =>
          a.name.localeCompare(b.name, 'ru')
        );

        setDepartments(sortedDepts);
        setTypes(sortedTypes);
        setNeed({
          date: needRes.data.date || '',
          department_id: needRes.data.department_id || '',
          asset_type_id: needRes.data.asset_type_id || '',
          quantity: needRes.data.quantity || '',
          reason_date: needRes.data.reason_date || '',
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
  }, [id]);

  // <<< ДОБАВИЛ: Функция для проверки валидности конкретного поля
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

  // <<< ДОБАВИЛ: Функция для проверки всей формы
  const validateForm = () => {
    const newErrors = {};
    Object.keys(need).forEach(key => {
      // Проверяем только обязательные поля или поля, которые уже имеют ошибки
      if (['department_id', 'asset_type_id', 'quantity', 'reason_date', 'status'].includes(key) || errors[key]) {
        newErrors[key] = validateField(key, need[key]);
      }
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

  const handleSave = async (e) => {
    e.preventDefault();

    // <<< ДОБАВИЛ: Помечаем все обязательные поля как "touched" при попытке отправки
    const allTouched = { ...touched };
    ['department_id', 'asset_type_id', 'quantity', 'reason_date', 'status'].forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // <<< ДОБАВИЛ: Проводим валидацию
    const formErrors = validateForm();
    setErrors(formErrors);

    // <<< ДОБАВИЛ: Проверяем, есть ли ошибки
    const hasErrors = Object.values(formErrors).some(error => error !== '');
    if (hasErrors) {
        // Не отправляем форму, если есть ошибки
        return; 
    }

    setSaveLoading(true);
    setDeleteError('');

    const dataToSend = {
      department_id: parseInt(need.department_id, 10),
      asset_type_id: parseInt(need.asset_type_id, 10),
      quantity: parseInt(need.quantity, 10),
      reason_date: need.reason_date,
      status: need.status.trim(),
      note: need.note.trim() || null,
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
        navigate('/needs');
      }
    } catch (error) {
      console.error('Ошибка при обновлении потребности:', error);
      if (error.response) {
        if (error.response.status === 400) {
          alert(`Ошибка в данных: ${error.response.data.error || 'Проверьте правильность заполнения формы.'}`);
        } else if (error.response.status === 401) {
          alert('Ошибка авторизации. Пожалуйста, войдите в систему.');
        } else if (error.response.status === 403) {
          alert('Доступ запрещен.');
        } else if (error.response.status === 404) {
          alert('Потребность не найдена.');
          navigate('/needs');
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

  const handleOpenDeleteDialog = () => {
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeleteError('');
  };

  const handleDelete = async () => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/needs/${id}`, {
        withCredentials: true,
      });

      if (response.status === 200) {
        alert('Потребность успешно удалена!');
        navigate('/needs');
      }
    } catch (error) {
      console.error('Ошибка при удалении потребности:', error);
      if (error.response) {
        if (error.response.status === 401) {
          alert('Ошибка авторизации.');
          handleCloseDeleteDialog();
        } else if (error.response.status === 403) {
          alert('Доступ запрещен.');
          handleCloseDeleteDialog();
        } else if (error.response.status === 404) {
            alert('Потребность не найдена.');
            handleCloseDeleteDialog();
            navigate('/needs');
        } else if (error.response.status === 500) {
          setDeleteError('Внутренняя ошибка сервера при удалении.');
        } else {
          setDeleteError(`Ошибка сервера: ${error.response.status}`);
        }
      } else if (error.request) {
        setDeleteError('Ошибка сети. Проверьте подключение.');
      } else {
        setDeleteError(`Ошибка: ${error.message}`);
      }
    }
  };

  // <<< ДОБАВИЛ: Функция для определения, должно ли поле быть выделено как ошибочное
  const isError = (fieldName) => {
    // Поле считается ошибочным, если оно было "touched" и валидация показала ошибку
    return touched[fieldName] && !!errors[fieldName];
  };

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
        <Button variant="outlined" onClick={() => navigate('/needs')}>
          Назад к списку
        </Button>
      </Box>
    </Container>
  );

  return (
    <Container maxWidth="md">
      <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
        <Typography variant="h5" gutterBottom>Редактировать потребность</Typography>
      </Box>

      <Box
        component="form"
        onSubmit={handleSave}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              margin="normal"
              // <<< ИЗМЕНЕНО: error определяется функцией isError
              error={isError('department_id')}
            >
              <InputLabel id="department-label">Отдел (подразделение) *</InputLabel>
              <Select
                labelId="department-label"
                name="department_id"
                value={need.department_id}
                onChange={handleChange}
                label="Отдел (подразделение) *"
                disabled={!currentUser || currentUser.role !== 'admin'}
                // <<< ДОБАВИЛ: Визуальное выделение ошибки через sx
                sx={isError('department_id') ? { '& .MuiOutlinedInput-notchedOutline': { borderColor: 'error.main' } } : {mb: -2}}
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
                disabled={!currentUser || currentUser.role !== 'admin'}
                sx={isError('asset_type_id') ? { '& .MuiOutlinedInput-notchedOutline': { borderColor: 'error.main' } } : {mb: -2}}
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
              sx={isError('quantity') ? { '& .MuiOutlinedInput-notchedOutline': { borderColor: 'error.main' } } : {mb: -1}}
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
              disabled={!currentUser || currentUser.role !== 'admin'}
              sx={isError('reason_date') ? { '& .MuiOutlinedInput-notchedOutline': { borderColor: 'error.main' } } : {mb: 1}}
              InputProps={{
                inputProps: {
                  min: "1000-01-01",
                  max: "9999-12-31"
                }
              }}
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
                name="status"
                value={need.status}
                onChange={handleChange}
                fullWidth
                margin="normal"
                error={isError('status')}
                disabled={!currentUser || currentUser.role !== 'admin'}
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
              disabled={!currentUser || currentUser.role !== 'admin'}
            />
          </Grid>
        </Grid>

        <Box mt={1.5} mb={2} display="flex" justifyContent="space-between" alignItems="center">
          <Button onClick={() => navigate('/needs')} variant="outlined">
            Назад
          </Button>

          <Box>
            {currentUser && currentUser.role === 'admin' && (
              <>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleOpenDeleteDialog}
                  disabled={!currentUser || currentUser.role !== 'admin' || saveLoading}
                  sx={{ mr: '16px' }}
                >
                  Удалить
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  disabled={!currentUser || currentUser.role !== 'admin' || saveLoading}
                >
                  {saveLoading ? <CircularProgress size={24} /> : 'Сохранить'}
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Box>

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
          {deleteError && (
            <Alert severity="error" style={{ marginTop: '10px' }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary" disabled={saveLoading}>
            Отмена
          </Button>
          <Button onClick={handleDelete} color="error" autoFocus disabled={saveLoading}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EditNeed;