// frontend/src/components/AddAsset.js
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
  FormHelperText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const AddAsset = ({ currentUser }) => {
  const [asset, setAsset] = useState({
    serial_number: '',
    inventory_number: '',
    type_id: '',
    brand: '',
    model: '',
    status_id: '',
    actual_user: '',
    responsible_person: '',
    department_id: '',
    room: '',
    purchase_date: '',
    comments: ''
  });

  const [types, setTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [typeProperties, setTypeProperties] = useState([]);
  const [dynamicFields, setDynamicFields] = useState({});

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const [openCancelDialog, setOpenCancelDialog] = useState(false);

  // Функция для сортировки массивов по имени
  const sortByLabel = (a, b) => {
    return (a.name || '').localeCompare(b.name || '', 'ru', { sensitivity: 'base' });
  };

  // Загрузка справочников
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, statusesRes, employeesRes, departmentsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/types`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/statuses`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/employees`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/departments`, { withCredentials: true }),
        ]);

        setTypes(typesRes.data.sort(sortByLabel));
        setStatuses(statusesRes.data.sort(sortByLabel));
        setEmployees(employeesRes.data.sort(sortByLabel));
        setDepartments(departmentsRes.data.sort(sortByLabel));
      } catch (error) {
        console.error('Ошибка при загрузке справочников:', error);
        alert('Не удалось загрузить данные справочников.');
      }
    };

    fetchData();
  }, []);

  // Загрузка свойств типа при изменении type_id
  useEffect(() => {
    const loadTypeProperties = async () => {
      if (asset.type_id) {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/types/${asset.type_id}/properties`, { withCredentials: true });
          setTypeProperties(res.data);

          const initialDynamicFields = {};
          res.data.forEach(prop => {
            const fieldName = mapPropertyNameToAssetField(prop.name);
            if (fieldName) {
              initialDynamicFields[fieldName] = '';
            }
          });
          setDynamicFields(initialDynamicFields);
        } catch (error) {
          console.error('Ошибка при загрузке свойств типа:', error);
          setTypeProperties([]);
          setDynamicFields({});
        }
      } else {
        setTypeProperties([]);
        setDynamicFields({});
      }
    };

    loadTypeProperties();
  }, [asset.type_id]);

  const mapPropertyNameToAssetField = (propertyName) => {
    const mapping = {
      'Диагональ': 'diagonal',
      'Диагональ (дюймы)': 'diagonal',
      'Операционная система': 'OS',
      'ОС': 'OS',
      'Процессор': 'CPU',
      'Оперативная память (ГБ)': 'RAM',
      'Оперативная память': 'RAM',
      'Диск (HDD/SSD)': 'Drive',
      'Диск': 'Drive',
      'IP-адрес': 'IP_address', // В JS удобнее работать с IP_address
      'Внутренний номер': 'number',
    };
    return mapping[propertyName] || propertyName.toLowerCase().replace(/\s+/g, '_');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAsset((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // <<<--- ИЗМЕНЕНО: Восстановлена логика автоматического заполнения отдела
  const handleResponsiblePersonChange = (e) => {
    const employeeId = e.target.value;
    handleChange(e); // Обновляем поле responsible_person

    if (employeeId) {
      // Найти выбранного сотрудника в уже загруженном списке
      const selectedEmployee = employees.find(emp => emp.id === parseInt(employeeId, 10));
      if (selectedEmployee && selectedEmployee.department_id) {
        // Автоматически устанавливаем department_id из данных сотрудника
        setAsset(prevAsset => ({
          ...prevAsset,
          department_id: selectedEmployee.department_id.toString() // Убедиться, что это строка
        }));

        // Очищаем ошибку для department_id, если она была
        if (errors.department_id) {
          setErrors(prevErrors => ({ ...prevErrors, department_id: '' }));
        }
      } else {
        // Если у сотрудника нет отдела или сотрудник не найден, очищаем поле отдела
        setAsset(prevAsset => ({
          ...prevAsset,
          department_id: ''
        }));
      }
    } else {
      // Если сотрудник не выбран, очищаем отдел
      setAsset(prevAsset => ({
        ...prevAsset,
        department_id: ''
      }));
    }
  };

  const handleDynamicFieldChange = (fieldName) => (e) => {
    const { value } = e.target;
    setDynamicFields((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!asset.inventory_number) newErrors.inventory_number = 'Обязательное поле';
    if (!asset.type_id) newErrors.type_id = 'Обязательное поле';
    if (!asset.status_id) newErrors.status_id = 'Обязательное поле';
    if (!asset.responsible_person) newErrors.responsible_person = 'Обязательное поле';
    if (!asset.department_id) newErrors.department_id = 'Обязательное поле';
    if (!asset.purchase_date) newErrors.purchase_date = 'Обязательное поле';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const dataToSend = {
        ...asset,
        ...dynamicFields
      };

      await axios.post(`${API_BASE_URL}/api/assets`, dataToSend, { withCredentials: true });
      alert('Актив успешно добавлен');
      navigate('/assets');
    } catch (error) {
      console.error('Ошибка при добавлении актива:', error);
      let errorMessage = 'Неизвестная ошибка';
      if (error.response) {
        if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `Ошибка ${error.response.status}: ${error.response.statusText}`;
        }
      } else if (error.request) {
        errorMessage = 'Нет ответа от сервера';
      } else {
        errorMessage = error.message;
      }
      alert(`Ошибка при добавлении актива: ${errorMessage}`);
    }
  };

  const handleOpenCancelDialog = () => {
    const isFormTouched =
      asset.serial_number ||
      asset.inventory_number ||
      asset.type_id ||
      asset.brand ||
      asset.model ||
      Object.keys(dynamicFields).some(key => dynamicFields[key]) ||
      asset.status_id ||
      asset.actual_user ||
      asset.responsible_person ||
      asset.department_id ||
      asset.room ||
      asset.purchase_date ||
      asset.comments;

    if (isFormTouched) {
      setOpenCancelDialog(true);
    } else {
      navigate('/assets');
    }
  };

  const handleConfirmCancel = () => {
    setOpenCancelDialog(false);
    navigate('/assets');
  };

  const handleCloseCancelDialog = () => {
    setOpenCancelDialog(false);
  };

  return (
    <Container maxWidth="md" style={{ marginTop: '10px' }}>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="h5"></Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Серийный номер"
              name="serial_number"
              value={asset.serial_number}
              onChange={handleChange}
              fullWidth
              margin="normal"
              sx={{ mb: -1 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Инвентарный номер *"
              name="inventory_number"
              value={asset.inventory_number}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={!!errors.inventory_number}
              helperText={errors.inventory_number}
              sx={{ mb: -1 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal" error={!!errors.type_id} sx={{ mb: 0 }}>
              <InputLabel id="type-label">Тип устройства *</InputLabel>
              <Select
                labelId="type-label"
                label="Тип устройства *"
                name="type_id"
                value={asset.type_id}
                onChange={handleChange}
                sx={{ mb: -1 }}
              >
                {types.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.type_id && <FormHelperText>{errors.type_id}</FormHelperText>}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Производитель"
              name="brand"
              value={asset.brand}
              onChange={handleChange}
              fullWidth
              margin="normal"
              sx={{ mb: -1 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Модель"
              name="model"
              value={asset.model}
              onChange={handleChange}
              fullWidth
              margin="normal"
              sx={{ mb: -1 }}
            />
          </Grid>

          {typeProperties.map((property) => {
            const fieldName = mapPropertyNameToAssetField(property.name);
            const value = dynamicFields[fieldName] || '';
            
            // Определяем тип поля ввода на основе имени свойства (можно усложнить)
            let fieldType = 'text';
            if (property.name.toLowerCase().includes('дата')) {
              fieldType = 'date';
            }

            return (
              <Grid item xs={12} sm={6} key={property.id}>
                <TextField
                  label={property.name}
                  name={fieldName}
                  value={value}
                  onChange={handleDynamicFieldChange(fieldName)}
                  fullWidth
                  margin="normal"
                  sx={{ mb: -1 }}
                  type={fieldType} // Используем определенный тип
                  // Если это поле даты, добавляем специальные props
                  {...(fieldType === 'date' ? { InputLabelProps: { shrink: true } } : {})}
                />
              </Grid>
            );
          })}

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal" error={!!errors.status_id} sx={{ mb: -1 }}>
              <InputLabel id="status-label">Статус *</InputLabel>
              <Select
                labelId="status-label"
                label="Статус *"
                name="status_id"
                value={asset.status_id}
                onChange={handleChange}
                sx={{ mb: -1 }}
              >
                {statuses.map((status) => (
                  <MenuItem key={status.id} value={status.id}>
                    {status.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.status_id && <FormHelperText>{errors.status_id}</FormHelperText>}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal" sx={{ mb: -1 }}>
              <InputLabel id="actual-user-label">Фактический пользователь</InputLabel>
              <Select
                labelId="actual-user-label"
                label="Фактический пользователь"
                name="actual_user"
                value={asset.actual_user || ''}
                onChange={handleChange}
                sx={{ mb: 0 }}

              >
                {employees.map((emp) => (
                  <MenuItem key={`actual-${emp.id}`} value={emp.id}>
                    {emp.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal" error={!!errors.responsible_person} sx={{ mb: -1 }}>
              <InputLabel id="responsible-person-label">Ответственный *</InputLabel>
              <Select
                labelId="responsible-person-label"
                label="Ответственный *"
                name="responsible_person"
                value={asset.responsible_person}
                onChange={handleResponsiblePersonChange}
                sx={{ mb: 0 }}
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.responsible_person && <FormHelperText>{errors.responsible_person}</FormHelperText>}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal" error={!!errors.department_id} sx={{ mb: -1 }}>
              <InputLabel id="department-label">Отдел (подразделение) *</InputLabel>
              <Select
                labelId="department-label"
                label="Отдел (подразделение) *"
                name="department_id"
                value={asset.department_id}
                onChange={handleChange}
                disabled
                style={{
                  backgroundColor: '#f5f5f5',
                  color: 'rgba(0, 0, 0, 0.87)', // Цвет текста сделан более контрастным
                  cursor: 'not-allowed'
                }}
                sx={{
                  mb: 0,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                  '& .MuiSelect-select': { color: 'rgba(0, 0, 0, 0.87)' }
                }}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.department_id && <FormHelperText>{errors.department_id}</FormHelperText>}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Помещение"
              name="room"
              value={asset.room}
              onChange={handleChange}
              fullWidth
              margin="normal"
              sx={{ mb: -1 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Дата покупки *"
              name="purchase_date"
              type="date"
              value={asset.purchase_date}
              onChange={handleChange}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                inputProps: {
                  min: "1000-01-01",
                  max: "9999-12-31"
                }
              }}
              error={!!errors.purchase_date}
              helperText={errors.purchase_date}
              sx={{ mb: -1 }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Комментарий"
              name="comments"
              value={asset.comments}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              margin="normal"
              sx={{ mb: -1 }}
            />
          </Grid>
        </Grid>

        <Box display="flex" justifyContent="space-between" mt={1.5} mb={2}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleOpenCancelDialog}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="success"
          >
            Добавить
          </Button>
        </Box>
      </Box>

      <Dialog
        open={openCancelDialog}
        onClose={handleCloseCancelDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Подтвердите отмену"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
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

export default AddAsset;