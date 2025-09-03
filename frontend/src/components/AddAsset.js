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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme,
  Tooltip,
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
  
  const navigate = useNavigate();
  const theme = useTheme();

  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({})

  const [typeProperties, setTypeProperties] = useState([]);
  const [dynamicFields, setDynamicFields] = useState({});

  const [errors, setErrors] = useState({});
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
    setAsset(prev => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
    
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const FIELD_TOOLTIPS = {
    'CPU': 'Например: i5-3570',
    'OS': 'Например: Windows 7 Pro',
    'Drive': 'Например: HDD 250 Гб + SSD 1 Тб',
    'RAM': 'Например: 4 Гб',
    'diagonal': 'Например: 15,6"',
    'IP_address': 'Например: 192.168.1.100',
    'number': 'Например: 2129',
  };  
 // ВНИМАНИЕ! Может эта функция лучше
//  const handleResponsiblePersonChange = (e) => {
//     const { value } = e.target;
//     setAsset(prev => ({ ...prev, responsible_person: value }));
//     setHasUnsavedChanges(true);
    
//     // <<< ДОБАВИЛ: Отмечаем поле как "touched"
//     setTouched(prev => ({ ...prev, responsible_person: true }));
    
//     if (errors.responsible_person) {
//       setErrors(prev => ({ ...prev, responsible_person: '' }));
//     }

//     // Автозаполнение отдела
//     if (value) {
//       const employee = employees.find(emp => emp.id === parseInt(value));
//       if (employee && employee.department_id) {
//         setAsset(prev => ({ ...prev, department_id: employee.department_id }));
//         if (errors.department_id) {
//           setErrors(prev => ({ ...prev, department_id: '' }));
//         }
//       }
//     }
//   };

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

  const validateField = (name, value) => {
    // Определяем обязательные поля
    const requiredFields = ['inventory_number', 'type_id', 'status_id', 'responsible_person', 'purchase_date'];
    if (requiredFields.includes(name)) {
      if (name === 'responsible_person' || name === 'status_id' || name === 'type_id' || name === 'department_id') {
        return (value !== null && value !== undefined && value !== '') ? '' : 'Обязательное поле';
      } else if (name === 'purchase_date') {
        return (value !== null && value !== undefined && value !== '') ? '' : 'Обязательное поле';
      } else {
        return (value && typeof value === 'string' && value.trim() !== '') ? '' : 'Обязательное поле';
      }
    }
    return '';
  };

  // <<< ДОБАВИЛ: Функция для определения, должно ли поле быть выделено как ошибочное
  const isFieldError = (fieldName) => {
    return touched[fieldName] && !!fieldErrors[fieldName];
  };

  // <<< ДОБАВИЛ: Функция для валидации всей формы
  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['inventory_number', 'type_id', 'status_id', 'responsible_person', 'purchase_date'];
    
    requiredFields.forEach(field => {
      let value;
      if (field === 'responsible_person' || field === 'department_id' || field === 'type_id') {
        value = asset[field];
      } else if (field === 'purchase_date') {
        value = asset[field];
      } else {
        value = asset[field];
      }
      newErrors[field] = validateField(field, value);
    });

    return newErrors;
  };

  const handleDynamicFieldChange = (fieldName, value) => {
    setDynamicFields(prev => ({ ...prev, [fieldName]: value }));
    setHasUnsavedChanges(true);
    
    // <<< ДОБАВИЛ: Отмечаем поле как "touched" при изменении
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // <<< ДОБАВИЛ: Помечаем все обязательные поля как "touched"
    const requiredFields = ['inventory_number', 'type_id', 'status_id', 'responsible_person', 'purchase_date'];
    const allTouched = { ...touched };
    requiredFields.forEach(field => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    // <<< ДОБАВИЛ: Проводим валидацию
    const formErrors = validateForm();
    setFieldErrors(formErrors);

    // <<< ДОБАВИЛ: Проверяем, есть ли ошибки
    const hasErrors = Object.values(formErrors).some(error => error !== '');
    if (hasErrors) {
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
      if (error.response && error.response.data && error.response.data.error) {
        alert(`Ошибка: ${error.response.data.error}`);
      } else {
        alert('Не удалось добавить актив');
      }
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

  // Рендер динамического поля с подсказкой
  const renderDynamicField = (property) => {
    const fieldName = mapPropertyNameToAssetField(property.name);
    const value = dynamicFields[fieldName] || '';
    const tooltipTitle = FIELD_TOOLTIPS[fieldName];

    // Создаем элемент поля ввода
    const inputElement = (
      <TextField
        label={property.name}
        name={fieldName}
        value={value}
        onChange={(e) => handleDynamicFieldChange(fieldName, e.target.value)}
        fullWidth
        margin="normal"
        // <<< ИЗМЕНЕНО: Визуальное выделение ошибки через sx
        sx={{
          mb: -1,
          '& .MuiOutlinedInput-notchedOutline': { 
            borderColor: isFieldError(fieldName) ? 'error.main' : 'rgba(0, 0, 0, 0.23)' 
          }
        }}
      />
    );

    // Если есть подсказка, оборачиваем поле в Tooltip
    if (tooltipTitle) {
      return (
        <Grid item xs={12} sm={6} key={property.id}>
          <Tooltip 
            title={tooltipTitle}
             arrow
             placement='bottom'
             PopperProps={{
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: [0, 55],
                    },
                  },
                ],
                disablePortal: false
             }}>
              <span>{inputElement}</span>
            </Tooltip>
        </Grid>
      );
    }

    return (
      <Grid item xs={12} sm={6} key={property.id}>
        {inputElement}
      </Grid>
    );
  };

  return (
    <Container maxWidth="md">
      <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
        <Typography variant="h5" gutterBottom> Создание оборудование </Typography>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Tooltip title='Например: EX583772630042024' arrow>
              <TextField
                label="Серийный номер"
                name="serial_number"
                value={asset.serial_number || ''}
                onChange={handleChange}
                fullWidth
                margin="normal"
                sx={{ mb: -1 }}
                disabled={!currentUser || currentUser.role !== 'admin'}
              />
            </Tooltip>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Tooltip title='Например: 1171066177' arrow>
              <TextField
                label="Инвентарный номер *"
                name="inventory_number"
                value={asset.inventory_number}
                onChange={handleChange}
                fullWidth
                margin="normal"
                disabled={!currentUser || currentUser.role !== 'admin'}
                sx={{
                  mb: -1,
                  '& .MuiOutlinedInput-notchedOutline': { 
                    borderColor: isFieldError('inventory_number') ? 'error.main' : 'rgba(0, 0, 0, 0.23)' 
                  }
                }}
              />
            </Tooltip>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl 
              fullWidth 
              margin="normal" 
              sx={{ 
                mb: -1,
                '& .MuiOutlinedInput-notchedOutline': { 
                  borderColor: isFieldError('type_id') ? 'error.main' : 'rgba(0, 0, 0, 0.23)' 
                }
              }}
            >
              <InputLabel id="type-label">Тип устройства *</InputLabel>
              <Select
                labelId="type-label"
                label="Тип устройства *"
                name="type_id"
                value={asset.type_id}
                onChange={handleChange}
                disabled={!currentUser || currentUser.role !== 'admin'}
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
            <Tooltip title='Например: PrimeBox' arrow>
              <TextField
                label="Производитель"
                name="brand"
                value={asset.brand || ''}
                onChange={handleChange}
                fullWidth
                margin="normal"
                sx={{ mb: -1 }}
                disabled={!currentUser || currentUser.role !== 'admin'}
              />
            </Tooltip>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Tooltip title='Например: EAGLE M24HVIB' arrow>
              <TextField
                label="Модель"
                name="model"
                value={asset.model || ''}
                onChange={handleChange}
                fullWidth
                margin="normal"
                sx={{ mb: -1 }}
                disabled={!currentUser || currentUser.role !== 'admin'}
              />
            </Tooltip>
          </Grid>

          {typeProperties.map(renderDynamicField)}

          <Grid item xs={12} sm={6}>
            <FormControl 
              fullWidth 
              margin="normal" 
              sx={{ 
                mb: -2,
                '& .MuiOutlinedInput-notchedOutline': { 
                  borderColor: isFieldError('status_id') ? 'error.main' : 'rgba(0, 0, 0, 0.23)' 
                }
              }}
            >
              <InputLabel id="status-label">Статус *</InputLabel>
              <Select
                labelId="status-label"
                label="Статус *"
                name="status_id"
                value={asset.status_id}
                onChange={handleChange}
                disabled={!currentUser || currentUser.role !== 'admin'}
              >
                {statuses.map((status) => (
                  <MenuItem key={status.id} value={status.id}>
                    {status.name}
                  </MenuItem>
                ))}
              </Select>
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
                disabled={!currentUser || currentUser.role !== 'admin'}
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
            <FormControl 
              fullWidth 
              margin="normal" 
              sx={{ 
                mb: -1,
                '& .MuiOutlinedInput-notchedOutline': { 
                  borderColor: isFieldError('responsible_person') ? 'error.main' : 'rgba(0, 0, 0, 0.23)' 
                }
              }}
            >
              <InputLabel id="responsible-person-label">Ответственный *</InputLabel>
              <Select
                labelId="responsible-person-label"
                label="Ответственный *"
                name="responsible_person"
                value={asset.responsible_person}
                onChange={handleResponsiblePersonChange}
                disabled={!currentUser || currentUser.role !== 'admin'}
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl 
              fullWidth 
              margin="normal" 
              sx={{ mb: -1 }}
            >
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
                  color: 'rgba(0, 0, 0, 0.87)',
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
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Tooltip title='Например: 204 С (С - старое, Н - новое)' arrow>
              <TextField
                label="Помещение"
                name="room"
                value={asset.room || ''}
                onChange={handleChange}
                fullWidth
                margin="normal"
                sx={{ mb: -1 }}
                disabled={!currentUser || currentUser.role !== 'admin'}
              />
            </Tooltip>
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
              disabled={!currentUser || currentUser.role !== 'admin'}
              sx={{
                mb: -1,
                '& .MuiOutlinedInput-notchedOutline': { 
                  borderColor: isFieldError('purchase_date') ? 'error.main' : 'rgba(0, 0, 0, 0.23)' 
                }
              }}
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

        <Box mt={3.5} display="flex" justifyContent="space-between" alignItems="center">
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