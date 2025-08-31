// frontend/src/components/AssetDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  CircularProgress,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Tooltip,
} from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../config'; // Импорт базового URL

const AssetDetails = ({ currentUser }) => { // Принимаем currentUser как пропс
  const { id } = useParams();
  const navigate = useNavigate();
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
    comments: '',
    diagonal: '',
    CPU: '',
    RAM: '',
    Drive: '',
    OS: '',
    IP_address: '',
    number: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState(''); // Состояние для URL QR-кода

  // Состояния для редактирования
  const [isEditing, setIsEditing] = useState(false);
  const [editedAsset, setEditedAsset] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [errors, setErrors] = useState({});

  // Состояния для выпадающих списков
  const [types, setTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  // Исправлено: dynamicFields должен быть массивом
  const [dynamicFields, setDynamicFields] = useState([]);
  const [typeProperties, setTypeProperties] = useState([]);
  // <<< ДОБАВИЛ: Состояния для валидации
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  // Загрузка данных актива и справочников
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [assetRes, typesRes, statusesRes, departmentsRes, employeesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/assets/${id}`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/types`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/statuses`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/departments`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/employees`, { withCredentials: true }),
        ]);

        setAsset(assetRes.data);
        setEditedAsset(assetRes.data);
        setTypes(typesRes.data);
        setStatuses(statusesRes.data);
        setDepartments(departmentsRes.data);
        setEmployees(employeesRes.data);

        // Формируем URL для QR-кода
        setQrCodeUrl(`${API_BASE_URL}/api/assets/${id}/qr`);

      } catch (err) {
        console.error('Ошибка при загрузке актива:', err);
        setError('Не удалось загрузить данные актива.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Исправлено: добавлен asset в зависимости и исправлена установка dynamicFields
  useEffect(() => {
    const fetchTypeProperties = async () => {
      if (!asset.type_id) { // Используем asset.type_id
        setTypeProperties([]);
        setDynamicFields([]);
        return;
      }

      try {
        const res = await axios.get(`${API_BASE_URL}/api/types/${asset.type_id}/properties`, { withCredentials: true }); // Используем asset.type_id
        setTypeProperties(res.data);

        // Инициализируем dynamicFields значениями из asset
        const initialDynamicFields = res.data.map(property => {
          const fieldName = mapPropertyNameToAssetField(property.name);
          // При первой загрузке asset уже должен содержать данные
          return {
            id: property.id,
            name: property.name,
            fieldName: fieldName,
            value: asset[fieldName] || '' // Используем значение из asset
          };
        });
        setDynamicFields(initialDynamicFields); // Устанавливаем массив

      } catch (err) {
        console.error('Ошибка при загрузке свойств типа:', err);
        setTypeProperties([]);
        setDynamicFields([]);
      }
    };

    fetchTypeProperties();
  }, [asset.type_id]); // Зависимость от asset.type_id

  // Функция маппинга названий свойств на поля актива
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
      'IP-адрес': 'IP_address',
      'IP_адрес': 'IP_address',
      'Внутренний номер': 'number',
    };
    return mapping[propertyName] || propertyName.toLowerCase().replace(/\s+/g, '_');
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/assets/${id}`, { withCredentials: true });
      alert('Актив успешно удален');
      navigate('/assets');
    } catch (err) {
      console.error('Ошибка при удалении актива:', err);
      setDeleteError('Не удалось удалить актив.');
    }
  };

  const handleOpenDeleteDialog = () => {
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeleteError('');
  };

  const handlePrintQRCode = async () => {
    if (!asset.inventory_number) {
      alert('Инвентарный номер не указан');
      return;
    }

    try {
      // Получаем QR-код с сервера
      const res = await axios.post(`${API_BASE_URL}/api/qrcodes`, {
        ids: [asset.id],
      }, { withCredentials: true });

      const codes = res.data;

      // Генерируем HTML-контент для печати
      let htmlContent = `
        <html>
          <head>
            <style>
              @page {
                size: A4;
                margin: 0;
              }
              body {
                width: 21cm;
                padding: 0;
                background-color: #fff;
                font-family: Arial, sans-serif;
              }
              .page {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                padding: 20px;
                box-sizing: border-box;
                page-break-after: always;
                break-after: page;
              }
              .qr-wrapper {
                width: 3cm; /* Ширина контейнера */
                height: 3cm; /* Высота контейнера */
                position: relative;
                text-align: center;
                font-size: 10px;
                box-sizing: border-box;
                page-break-inside: avoid;
                break-inside: avoid;
              }
              .qr-container {
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
              }
              .text-top, .text-bottom {
                position: absolute;
                left: 50%; /* Центрирование по горизонтали */
                transform: translateX(-50%); /* Корректировка центрирования */
                white-space: nowrap; /* Запрет переноса строки */
                overflow: hidden; /* Скрывает лишний текст */
                text-overflow: ellipsis; /* Добавляет многоточие при обрезке */
                width: 90%; /* Ограничиваем ширину текста */
                font-size: 8px; /* Маленький размер шрифта */
              }
              .text-top {
                top: 0;
              }
              .text-bottom {
                bottom: 0;
              }
            </style>
          </head>
          <body>
      `;

      codes.forEach((code) => {
        htmlContent += `
          <div class="qr-wrapper">
            <div class="qr-container">
              <img src="data:image/png;base64,${code.qr_base64}" />
            </div>
            <span class="text-top">${code.full_name}</span>
            <span class="text-bottom">${code.inventory_number}</span>
          </div>
        `;
      });

      htmlContent += '</body></html>';

      // Создаем новое окно для печати
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } catch (err) {
      console.error('Ошибка при генерации QR-кода:', err);
      alert('Не удалось получить QR-код с сервера');
    }
  };

  const handleDynamicFieldChange = (fieldName, value) => {
    // Обновляем основное состояние asset
    setAsset(prevAsset => ({ ...prevAsset, [fieldName]: value }));

    // Обновляем состояние dynamicFields для отображения
    setDynamicFields(prevFields =>
      prevFields.map(field =>
        field.fieldName === fieldName ? { ...field, value } : field
      )
    );
  };

  // Обработчик изменения типа устройства
  const handleTypeChange = async (e) => {
    const newTypeId = parseInt(e.target.value, 10) || '';
    // Обновляем asset.type_id через общий обработчик
    handleChange(e);

    if (newTypeId) {
      try {
        // Загружаем свойства нового типа
        const propsRes = await axios.get(`${API_BASE_URL}/api/types/${newTypeId}/properties`, { withCredentials: true });
        setTypeProperties(propsRes.data);

        // Инициализируем dynamicFields значениями из asset
        const initialDynamicFields = propsRes.data.map(property => {
          const fieldName = mapPropertyNameToAssetField(property.name);
          // Берем значение из текущего asset
          return {
            id: property.id,
            name: property.name,
            fieldName: fieldName,
            value: asset[fieldName] || '' // Используем значение из asset или пустую строку
          };
        });
        setDynamicFields(initialDynamicFields); // Устанавливаем массив

      } catch (err) {
        console.error('Ошибка при загрузке свойств нового типа:', err);
        setTypeProperties([]);
        setDynamicFields([]);
        alert('Не удалось загрузить свойства для выбранного типа.');
      }
    } else {
      // Если тип не выбран, очищаем свойства и поля
      setTypeProperties([]);
      setDynamicFields([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAsset(prevAsset => {
      const updatedAsset = { ...prevAsset, [name]: value };

      // <<<--- НОВОЕ: Автозаполнение отдела при смене ответственного --- >>>
      if (name === 'responsible_person') {
        const selectedEmployee = employees.find(emp => emp.id === parseInt(value, 10));
        if (selectedEmployee && selectedEmployee.department_id) {
          updatedAsset.department_id = selectedEmployee.department_id;
          // Очищаем ошибку, если она была
          if (errors.department_id) {
            setErrors(prevErrors => ({ ...prevErrors, department_id: '' }));
          }
        }
      }
      setTouched(prevTouched => ({ ...prevTouched, [name]: true }));

      // <<< ДОБАВИЛ: Валидируем поле при изменении, если оно уже было "touched" или имело ошибку
      if (touched[name] || fieldErrors[name]) {
        const error = validateField(name, value);
        setFieldErrors(prevErrors => ({ ...prevErrors, [name]: error }));
      }
      // Очищаем ошибку для этого поля, если она была
      if (errors[name]) {
        setErrors(prevErrors => ({ ...prevErrors, [name]: '' }));
      }

      return updatedAsset;
    });
  };

  const isFieldError = (fieldName) => {
    return touched[fieldName] && !!fieldErrors[fieldName]; // Или errors[fieldName]
  };

  // Обработчик сохранения изменений
  const handleSave = async () => {
    const requiredFields = ['inventory_number', 'type_id', 'status_id', 'responsible_person', 'department_id', 'purchase_date'];
    const allTouched = { ...touched };
    requiredFields.forEach(field => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    const formErrors = validateForm();
    setFieldErrors(formErrors);

    const hasErrors = Object.values(formErrors).some(error => error !== '');
    if (hasErrors) {
        return;
    }

    try {
      const dataToSend = {
        serial_number: asset.serial_number || '',
        inventory_number: asset.inventory_number || '',
        type_id: asset.type_id || '',
        brand: asset.brand || '',
        model: asset.model || '',
        status_id: asset.status_id || '',
        actual_user: asset.actual_user || '',
        responsible_person: asset.responsible_person || '',
        department_id: asset.department_id || '', // Отправляем текущее значение
        room: asset.room || '',
        purchase_date: asset.purchase_date || '',
        comments: asset.comments || '',
      };

      dynamicFields.forEach(fieldObj => {
        dataToSend[fieldObj.fieldName] = fieldObj.value;
      });

      console.log("Отправляемые данные (dataToSend):", dataToSend);

      const response = await axios.put(
        `${API_BASE_URL}/api/assets/${id}`,
        dataToSend,
        { withCredentials: true }
      );

      alert('Данные успешно обновлены');
      setAsset(response.data);
      setErrors({});
      setFieldErrors({});
      setTouched({});
      setIsEditing(false);

    } catch (err) {
      console.error('Ошибка при сохранении изменений:', err);
      let errorMessage = 'Неизвестная ошибка';
      if (err.response) {
        if (err.response.data && err.response.data.error) {
          errorMessage = err.response.data.error;
          if (err.response.data.details) {
            errorMessage += ` (${err.response.data.details})`;
          }
        } else if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else {
          errorMessage = `Ошибка ${err.response.status}: ${err.response.statusText}`;
        }
      } else if (err.request) {
        errorMessage = 'Нет ответа от сервера';
      } else {
        errorMessage = err.message;
      }
      alert(`Ошибка при сохранении изменений: ${errorMessage}`);
    }
  };
  
  const renderDynamicField = (field) => {
    return (
      <Grid item xs={12} sm={6} key={field.id}>
        <TextField
          label={field.name}
          name={field.fieldName}
          value={field.value}
          onChange={(e) => handleDynamicFieldChange(field.fieldName, e.target.value)}
          fullWidth
          margin="normal"
          sx={{ mb: -1 }}
          disabled={!currentUser || currentUser.role !== 'admin'}
        />
      </Grid>
    );
  };
  // <<< ДОБАВИЛ: Функция для проверки валидности конкретного поля
  const validateField = (name, value) => {
    // Определяем обязательные поля
    const requiredFields = ['inventory_number', 'type_id', 'status_id', 'responsible_person', 'department_id', 'purchase_date'];
    if (requiredFields.includes(name)) {
      // Для department_id проверяем, что оно не null/undefined/пустая строка
      // Остальные поля проверяются на пустоту
      if (name === 'department_id') {
        return (value !== null && value !== undefined && value !== '') ? '' : 'Обязательное поле';
      } else if (name === 'purchase_date') {
         // Дата может быть объектом Date или строкой
         return (value !== null && value !== undefined && value !== '') ? '' : 'Обязательное поле';
      } else {
        // Для строковых полей проверяем trim
        return (value && typeof value === 'string' && value.trim() !== '') ? '' : 'Обязательное поле';
      }
    }
    // Для необязательных полей или уже заполненных ошибочных возвращаем пустую строку
    return '';
  };
  // <<< ДОБАВИЛ: Функция для проверки всей формы
  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['inventory_number', 'type_id', 'status_id', 'responsible_person', 'department_id', 'purchase_date'];
    
    requiredFields.forEach(field => {
      let value;
      if (field === 'department_id' || field === 'responsible_person') {
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


  // Условный рендеринг состояний загрузки/ошибки/отсутствия данных
  if (loading) return (
    <Container maxWidth="md" style={{ marginTop: '20px', textAlign: 'center' }}>
      <CircularProgress />
      <Typography>Загрузка...</Typography>
    </Container>
  );
  if (error) return (
    <Container maxWidth="md" style={{ marginTop: '20px' }}>
      <Alert severity="error">{error}</Alert>
    </Container>
  );
  if (!asset) return (
    <Container maxWidth="md" style={{ marginTop: '20px' }}>
      <Alert severity="warning">Актив не найден</Alert>
    </Container>
  );

  return (
    <Container maxWidth="md">
      <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
        <Typography variant="h5" gutterBottom> {types.find(t => t.id === (isEditing ? editedAsset.type_id : asset.type_id))?.name || 'Без типа'} {isEditing ? editedAsset.brand : asset.brand} {isEditing ? editedAsset.model : asset.model} </Typography>

        <Grid container spacing={2}>
          {/* Пара 1: Серийный номер | Инвентарный номер */}
          <Grid item xs={12} sm={6}>
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
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Инвентарный номер *"
              name="inventory_number"
              value={asset.inventory_number || ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
              sx={{ mb: -1,
                ...(!isEditing ? {} : {}),
                ...(isFieldError('inventory_number') ? { '& .MuiOutlinedInput-notchedOutline': { borderColor: 'error.main' } } : {})
              }}
              disabled={!currentUser || currentUser.role !== 'admin'}
            />
          </Grid>

          {/* Пара 2: Тип устройства | Производитель */}
          <Grid item xs={12} sm={6}>
            <FormControl 
              fullWidth 
              margin="normal" 
              error={isFieldError('type_id')}
              sx={{ mb: -2 }}
            >
              <InputLabel id="edit-type-label">Тип устройства *</InputLabel>
              <Select
                labelId="edit-type-label"
                label="Тип устройства *"
                name="type_id"
                value={asset.type_id || ''}
                onChange={handleTypeChange}
                sx={{ mb: -2 }}
                disabled={!currentUser || currentUser.role !== 'admin'}
              >
                {types.map(type => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
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
          </Grid>

          {/* Пара 3: Модель | Динамические поля (первая часть) */}
          <Grid item xs={12} sm={6}>
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
          </Grid>

          {dynamicFields.map(renderDynamicField)}

          {/* Статус | Фактический пользователь */}
          <Grid item xs={12} sm={6}>
            <FormControl 
              fullWidth 
              margin="normal" 
              error={isFieldError('status_id')}
            >
              <InputLabel id="edit-status-label">Статус *</InputLabel>
              <Select
                labelId="edit-status-label"
                label="Статус *"
                name="status_id"
                value={asset.status_id || ''}
                onChange={handleChange}
                sx={{ mb: -2 }}
                disabled={!currentUser || currentUser.role !== 'admin'}
              >
                {statuses.map(stat => (
                  <MenuItem key={stat.id} value={stat.id}>
                    {stat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="actual-user-label">Фактический пользователь</InputLabel>
              <Select
                labelId="actual-user-label"
                label="Фактический пользователь"
                name="actual_user"
                value={asset.actual_user || ''}
                onChange={handleChange}
                sx={{ mb: -2 }}
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

          {/* Ответственный | Отдел (подразделение) - ВСЕГДА СЕРЫЙ и ОТКЛЮЧЕННЫЙ */}
          <Grid item xs={12} sm={6}>
            <FormControl 
              fullWidth 
              margin="normal" 
              error={isFieldError('responsible_person')} // <<< ИЗМЕНЕНО: Используем новую систему ошибок
            >
              <InputLabel id="edit-responsible-person-label">Ответственный *</InputLabel>
              <Select
                labelId="edit-responsible-person-label"
                label="Ответственный *"
                name="responsible_person"
                value={asset.responsible_person || ''}
                onChange={handleChange}
                sx={{ mb: -2 }}
                disabled={!currentUser || currentUser.role !== 'admin'}
              >
                {employees.map(emp => (
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
              error={isFieldError('department_id')} // <<< ИЗМЕНЕНО: Используем новую систему ошибок
            >
              <InputLabel id="edit-department-label">Отдел (подразделение)</InputLabel>
              <Select
                labelId="edit-department-label"
                label="Отдел (подразделение)"
                name="department_id"
                value={asset.department_id || ''}
                disabled
                style={{
                  backgroundColor: '#f5f5f5', // Серый фон
                  color: 'rgba(0, 0, 0, 0.87)', // Цвет текста
                  cursor: 'not-allowed' // Курсор "запрещено"
                }}
                sx={{
                  mb: -2,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                  '& .MuiSelect-select': { color: 'rgba(0, 0, 0, 0.87)' }
                }}
              >
                {departments.map(dept => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Помещение | Дата покупки */}
          <Grid item xs={12} sm={6}>
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
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Дата покупки *"
              name="purchase_date"
              type="date"
              value={asset.purchase_date ? new Date(asset.purchase_date).toISOString().split('T')[0] : ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
              sx={{
                ...(isFieldError('purchase_date') ? { '& .MuiOutlinedInput-notchedOutline': { borderColor: 'error.main' } } : {}),
                mb: -1
              }}
              error={isFieldError('purchase_date')}
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                inputProps: {
                  min: "1000-01-01",
                  max: "9999-12-31"
                }
              }}
              disabled={!currentUser || currentUser.role !== 'admin'}
            />
          </Grid>

          {/* Комментарий - растянут на всю ширину */}
          <Grid item xs={12}>
            <TextField
              label="Комментарий"
              name="comments"
              value={asset.comments || ''}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              margin="normal"
              sx={{ mb: -1 }}
              disabled={!currentUser || currentUser.role !== 'admin'}
            />
          </Grid>
          <Grid item xs={12} display="flex" justifyContent="center" mt={2}>
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt={`QR-код для актива ${asset.inventory_number}`}
                style={{ maxWidth: '200px', height: 'auto' }}
              />
            ) : (
              <Typography>Загрузка QR-кода...</Typography>
            )}
          </Grid>
        </Grid>
      </Box>

        <Box mt={0.5} display="flex" justifyContent="center">
          <Button variant="contained" color="primary" onClick={handlePrintQRCode}>
            Печать QR
          </Button>
        </Box>        

        <Box mt={4.5} display="flex" justifyContent="space-between" alignItems="center">
          <Button onClick={() => navigate('/assets')} variant="outlined">
            Назад
          </Button>

          <Box>
            {currentUser && currentUser.role === 'admin' && (
              <>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleOpenDeleteDialog}
                  disabled={!currentUser || currentUser.role !== 'admin'}
                  sx={{ mr: '16px' }}
                >
                  Удалить
                </Button>


                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSave}
                  disabled={!currentUser || currentUser.role !== 'admin'}

                >
                  Сохранить
                </Button>
              </>
            )}
          </Box>
        </Box>

      {/* Диалог подтверждения удаления */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Подтвердите удаление"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Вы уверены, что хотите удалить актив "{asset.inventory_number}"?
            Это действие нельзя отменить.
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" style={{ marginTop: '10px' }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Отмена
          </Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AssetDetails;