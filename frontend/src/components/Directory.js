// привет

// frontend/src/components/Directory.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Input,
  FormControl,
  InputLabel,
  Chip,
  Grid,
  // <<<--- ИМПОРТЫ ДЛЯ ИКОНОК И НОВЫХ КОМПОНЕНТОВ
  IconButton,
  Tooltip
} from '@mui/material';
// <<<--- ИМПОРТЫ ИКОНОК
import EditIcon from '@mui/icons-material/Edit';
import TuneIcon from '@mui/icons-material/Tune';
import DeleteIcon from '@mui/icons-material/Delete';

import axios from 'axios';
// Импортируем базовый URL из config.js
import { API_BASE_URL } from '../config';

const Directory = ({ currentUser }) => {
  // === Состояния для Типов устройств ===
  const [types, setTypes] = useState([]);
  const [newType, setNewType] = useState('');
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [editingTypeName, setEditingTypeName] = useState('');
  const [openTypeModal, setOpenTypeModal] = useState(false);

  // === Состояния для Свойств (для модального окна редактирования типа) ===
  const [allProperties, setAllProperties] = useState([]); // Все доступные свойства
  const [selectedPropertyIds, setSelectedPropertyIds] = useState([]); // ID выбранных свойств для текущего типа
  const [editingTypeProperties, setEditingTypeProperties] = useState([]); // Подробная информация о выбранных свойствах

  // === Состояния для Статусов ===
  const [statuses, setStatuses] = useState([]);
  const [newStatus, setNewStatus] = useState('');
  const [editingStatusId, setEditingStatusId] = useState(null);
  const [editingStatusName, setEditingStatusName] = useState('');

  // === Состояния для Отделов ===
  const [departments, setDepartments] = useState([]);
  const [newDepartment, setNewDepartment] = useState('');
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);
  const [editingDepartmentName, setEditingDepartmentName] = useState('');

  // === Состояния для Сотрудников ===
  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({ name: '', department_id: '' });
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState({ name: '', department_id: '' });

  // === Общие состояния ===
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);

  // === Загрузка данных ===
  useEffect(() => {
    fetchData();
    fetchProperties(); // Загружаем все свойства один раз
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // ВАЖНО: Все GET-запросы также должны использовать withCredentials,
      // если API требует аутентификации для чтения
      const [typesRes, statusesRes, departmentsRes, employeesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/types`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/api/statuses`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/api/departments`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/api/employees`, { withCredentials: true }),
      ]);
      setTypes(typesRes.data);
      setStatuses(statusesRes.data);
      setDepartments(departmentsRes.data);
      setEmployees(employeesRes.data);
    } catch (err) {
      console.error('Ошибка при загрузке данных:', err);
      // Проверим, связана ли ошибка с аутентификацией
      if (err.response && err.response.status === 401) {
         showSnackbar('Ошибка аутентификации. Пожалуйста, войдите снова.', 'error');
         // Здесь можно вызвать функцию выхода или перенаправить на логин
         // Например: logout(); // если такая функция есть
      } else {
         showSnackbar('Ошибка при загрузке данных', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Загрузка всех свойств для выбора
  const fetchProperties = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/properties`, { withCredentials: true });
      setAllProperties(res.data);
    } catch (err) {
      console.error('Ошибка при загрузке свойств:', err);
      showSnackbar('Ошибка при загрузке списка свойств', 'error');
    }
  };

  // === Уведомления ===
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // === Логика для Типов устройств ===
  const handleAddType = async () => {
    if (!newType.trim()) {
      showSnackbar('Название типа не может быть пустым', 'warning');
      return;
    }
    try {
      // ВАЖНО: Добавлен withCredentials: true
      const res = await axios.post(`${API_BASE_URL}/api/types`, { name: newType }, { withCredentials: true });
      setTypes([...types, res.data]);
      setNewType('');
      showSnackbar('Тип устройства добавлен');
    } catch (err) {
      console.error('Ошибка при добавлении типа:', err);
      // Проверим, связана ли ошибка с аутентификацией
      if (err.response && err.response.status === 401) {
         showSnackbar('Ошибка аутентификации. Пожалуйста, войдите снова.', 'error');
      } else {
         showSnackbar('Ошибка при добавлении типа', 'error');
      }
    }
  };

  const handleUpdateType = async () => {
    if (!editingTypeName.trim()) {
      showSnackbar('Название типа не может быть пустым', 'warning');
      return;
    }
    try {
      // ВАЖНО: Добавлен withCredentials: true
      await axios.put(`${API_BASE_URL}/api/types/${editingTypeId}`, { name: editingTypeName }, { withCredentials: true });
      setTypes(types.map(t => (t.id === editingTypeId ? { ...t, name: editingTypeName } : t)));
      setEditingTypeId(null);
      setEditingTypeName('');
      showSnackbar('Тип устройства обновлён');
    } catch (err) {
      console.error('Ошибка при обновлении типа:', err);
      // Проверим, связана ли ошибка с аутентификацией
      if (err.response && err.response.status === 401) {
         showSnackbar('Ошибка аутентификации. Пожалуйста, войдите снова.', 'error');
      } else {
         showSnackbar('Ошибка при обновлении типа', 'error');
      }
    }
  };

  const handleDeleteType = async (id) => {
    // Простая защита от случайного удаления, можно улучшить с подтверждением
    if (!window.confirm('Вы уверены, что хотите удалить этот тип?')) return;
    try {
      // ВАЖНО: Добавлен withCredentials: true
      await axios.delete(`${API_BASE_URL}/api/types/${id}`, { withCredentials: true });
      setTypes(types.filter(t => t.id !== id));
      showSnackbar('Тип устройства удалён');
    } catch (err) {
      console.error('Ошибка при удалении типа:', err);
      // Проверим, связана ли ошибка с аутентификацией
      if (err.response && err.response.status === 401) {
         showSnackbar('Ошибка аутентификации. Пожалуйста, войдите снова.', 'error');
      } else {
         showSnackbar('Ошибка при удалении типа. Возможно, он используется.', 'error');
      }
    }
  };

  // === Логика для Свойств Типа (Модальное окно) ===
  const handleOpenPropertiesModal = async (typeId) => {
    try {
      // 1. Получить текущие свойства типа
      // ВАЖНО: Добавлен withCredentials: true
      const propertiesRes = await axios.get(`${API_BASE_URL}/api/types/${typeId}/properties`, { withCredentials: true });
      const currentPropertyIds = propertiesRes.data.map(p => p.id);
      
      setEditingTypeId(typeId); // Сохраняем ID типа, с которым работаем
      setSelectedPropertyIds(currentPropertyIds);
      setEditingTypeProperties(propertiesRes.data); // Для отображения в модалке
      setOpenTypeModal(true);
    } catch (err) {
      console.error('Ошибка при загрузке свойств типа:', err);
      // Проверим, связана ли ошибка с аутентификацией
      if (err.response && err.response.status === 401) {
         showSnackbar('Ошибка аутентификации. Пожалуйста, войдите снова.', 'error');
      } else {
         showSnackbar('Ошибка при загрузке свойств типа', 'error');
      }
    }
  };

  const handleClosePropertiesModal = () => {
    setOpenTypeModal(false);
    setEditingTypeId(null);
    setSelectedPropertyIds([]);
    setEditingTypeProperties([]);
  };

  // Сохранение выбранных свойств для типа
  const handleSaveTypeProperties = async () => {
    if (!editingTypeId) return;
    try {
      // ВАЖНО: Добавлен withCredentials: true
      await axios.put(
        `${API_BASE_URL}/api/types/${editingTypeId}/properties`, 
        { property_ids: selectedPropertyIds }, 
        { withCredentials: true }
      );
      showSnackbar('Свойства типа обновлены');
      handleClosePropertiesModal();
      // Опционально: перезагрузить список типов или обновить конкретный тип в состоянии
    } catch (err) {
      console.error('Ошибка при сохранении свойств типа:', err);
      // Проверим, связана ли ошибка с аутентификацией
      if (err.response && err.response.status === 401) {
         showSnackbar('Ошибка аутентификации. Пожалуйста, войдите снова.', 'error');
      } else {
         showSnackbar('Ошибка при сохранении свойств типа', 'error');
      }
    }
  };

  // Обработка выбора/отмены выбора свойства в модальном окне
  const handlePropertyToggle = (propertyId) => {
    setSelectedPropertyIds(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId) 
        : [...prev, propertyId]
    );
  };

  // === Логика для Статусов ===
  const handleAddStatus = async () => {
    if (!newStatus.trim()) {
      showSnackbar('Название статуса не может быть пустым', 'warning');
      return;
    }
    try {
      // ВАЖНО: Добавлен withCredentials: true
      const res = await axios.post(`${API_BASE_URL}/api/statuses`, { name: newStatus }, { withCredentials: true });
      setStatuses([...statuses, res.data]);
      setNewStatus('');
      showSnackbar('Статус добавлен');
    } catch (err) {
      console.error('Ошибка при добавлении статуса:', err);
      // Проверим, связана ли ошибка с аутентификацией
      if (err.response && err.response.status === 401) {
         showSnackbar('Ошибка аутентификации. Пожалуйста, войдите снова.', 'error');
      } else {
         showSnackbar('Ошибка при добавлении статуса', 'error');
      }
    }
  };

  const handleUpdateStatus = async () => {
    if (!editingStatusName.trim()) {
      showSnackbar('Название статуса не может быть пустым', 'warning');
      return;
    }
    try {
      // ВАЖНО: Добавлен withCredentials: true
      await axios.put(`${API_BASE_URL}/api/statuses/${editingStatusId}`, { name: editingStatusName }, { withCredentials: true });
      setStatuses(statuses.map(s => (s.id === editingStatusId ? { ...s, name: editingStatusName } : s)));
      setEditingStatusId(null);
      setEditingStatusName('');
      showSnackbar('Статус обновлён');
    } catch (err) {
      console.error('Ошибка при обновлении статуса:', err);
      // Проверим, связана ли ошибка с аутентификацией
      if (err.response && err.response.status === 401) {
         showSnackbar('Ошибка аутентификации. Пожалуйста, войдите снова.', 'error');
      } else {
         showSnackbar('Ошибка при обновлении статуса', 'error');
      }
    }
  };

  const handleDeleteStatus = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот статус?')) return;
    try {
      // ВАЖНО: Добавлен withCredentials: true
      await axios.delete(`${API_BASE_URL}/api/statuses/${id}`, { withCredentials: true });
      setStatuses(statuses.filter(s => s.id !== id));
      showSnackbar('Статус удалён');
    } catch (err) {
      console.error('Ошибка при удалении статуса:', err);
      // Проверим, связана ли ошибка с аутентификацией
      if (err.response && err.response.status === 401) {
         showSnackbar('Ошибка аутентификации. Пожалуйста, войдите снова.', 'error');
      } else {
         showSnackbar('Ошибка при удалении статуса. Возможно, он используется.', 'error');
      }
    }
  };

  // === Логика для Отделов ===
  const handleAddDepartment = async () => {
    if (!newDepartment.trim()) {
      showSnackbar('Название отдела не может быть пустым', 'warning');
      return;
    }
    try {
      // ВАЖНО: Добавлен withCredentials: true
      const res = await axios.post(`${API_BASE_URL}/api/departments`, { name: newDepartment }, { withCredentials: true });
      setDepartments([...departments, res.data]);
      setNewDepartment('');
      showSnackbar('Отдел добавлен');
    } catch (err) {
      console.error('Ошибка при добавлении отдела:', err);
      // Проверим, связана ли ошибка с аутентификацией
      if (err.response && err.response.status === 401) {
         showSnackbar('Ошибка аутентификации. Пожалуйста, войдите снова.', 'error');
      } else {
         showSnackbar('Ошибка при добавлении отдела', 'error');
      }
    }
  };

  const handleUpdateDepartment = async () => {
    if (!editingDepartmentName.trim()) {
      showSnackbar('Название отдела не может быть пустым', 'warning');
      return;
    }
    try {
      // ВАЖНО: Добавлен withCredentials: true
      await axios.put(`${API_BASE_URL}/api/departments/${editingDepartmentId}`, { name: editingDepartmentName }, { withCredentials: true });
      setDepartments(departments.map(d => (d.id === editingDepartmentId ? { ...d, name: editingDepartmentName } : d)));
      setEditingDepartmentId(null);
      setEditingDepartmentName('');
      showSnackbar('Отдел обновлён');
    } catch (err) {
      console.error('Ошибка при обновлении отдела:', err);
      // Проверим, связана ли ошибка с аутентификацией
      if (err.response && err.response.status === 401) {
         showSnackbar('Ошибка аутентификации. Пожалуйста, войдите снова.', 'error');
      } else {
         showSnackbar('Ошибка при обновлении отдела', 'error');
      }
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот отдел?')) return;
    try {
      // ВАЖНО: Добавлен withCredentials: true
      await axios.delete(`${API_BASE_URL}/api/departments/${id}`, { withCredentials: true });
      setDepartments(departments.filter(d => d.id !== id));
      showSnackbar('Отдел удалён');
    } catch (err) {
      console.error('Ошибка при удалении отдела:', err);
      // Проверим, связана ли ошибка с аутентификацией
      if (err.response && err.response.status === 401) {
         showSnackbar('Ошибка аутентификации. Пожалуйста, войдите снова.', 'error');
      } else {
         showSnackbar('Ошибка при удалении отдела. Возможно, он используется.', 'error');
      }
    }
  };

  // === Логика для Сотрудников ===
  const handleAddEmployee = async () => {
    if (!newEmployee.name.trim() || !newEmployee.department_id) {
      showSnackbar('Имя и отдел обязательны', 'warning');
      return;
    }
    try {
      // ВАЖНО: Добавлен withCredentials: true
      const res = await axios.post(`${API_BASE_URL}/api/employees`, newEmployee, { withCredentials: true });
      // Получаем полную информацию о сотруднике с отделом для отображения
      setEmployees([...employees, res.data]);
      setNewEmployee({ name: '', department_id: '' });
      showSnackbar('Сотрудник добавлен');
    } catch (err) {
      console.error('Ошибка при добавлении сотрудника:', err);
      // Проверим, связана ли ошибка с аутентификацией
      if (err.response && err.response.status === 401) {
         showSnackbar('Ошибка аутентификации. Пожалуйста, войдите снова.', 'error');
      } else {
         showSnackbar('Ошибка при добавлении сотрудника', 'error');
      }
    }
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee.name.trim() || !editingEmployee.department_id) {
      showSnackbar('Имя и отдел обязательны', 'warning');
      return;
    }
    try {
      // ВАЖНО: Добавлен withCredentials: true
      await axios.put(`${API_BASE_URL}/api/employees/${editingEmployeeId}`, editingEmployee, { withCredentials: true });
      setEmployees(employees.map(e => (e.id === editingEmployeeId ? { ...e, ...editingEmployee } : e)));
      setEditingEmployeeId(null);
      setEditingEmployee({ name: '', department_id: '' });
      showSnackbar('Сотрудник обновлён');
    } catch (err) {
      console.error('Ошибка при обновлении сотрудника:', err);
      // Проверим, связана ли ошибка с аутентификацией
      if (err.response && err.response.status === 401) {
         showSnackbar('Ошибка аутентификации. Пожалуйста, войдите снова.', 'error');
      } else {
         showSnackbar('Ошибка при обновлении сотрудника', 'error');
      }
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) return;
    try {
      // ВАЖНО: Добавлен withCredentials: true
      await axios.delete(`${API_BASE_URL}/api/employees/${id}`, { withCredentials: true });
      setEmployees(employees.filter(e => e.id !== id));
      showSnackbar('Сотрудник удалён');
    } catch (err) {
      console.error('Ошибка при удалении сотрудника:', err);
      // Проверим, связана ли ошибка с аутентификацией
      if (err.response && err.response.status === 401) {
         showSnackbar('Ошибка аутентификации. Пожалуйста, войдите снова.', 'error');
      } else {
         showSnackbar('Ошибка при удалении сотрудника. Возможно, он используется.', 'error');
      }
    }
  };

  // === Рендер ===
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <Container maxWidth="md" style={{ marginTop: '20px' }}>
        <Typography variant="h6" color="error">
          Доступ запрещён. Только для администраторов.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" style={{ marginTop: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Справочник
      </Typography>

      {loading && <Typography>Загрузка...</Typography>}

      <Grid container spacing={4}>
        {/* === Типы устройств === */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: '20px' }}>
            <Typography variant="h6" gutterBottom>
              Типы устройств
            </Typography>
            <Box display="flex" mb={2}>
              <TextField
                label="Новый тип"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                fullWidth
                size="small"
              />
              <Button variant="contained" onClick={handleAddType} color="success" style={{ marginLeft: '10px' }}>
                Добавить
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {types.map((type) => (
                    // <<<--- ИЗМЕНЕНИЯ ДЛЯ НАВЕДЕНИЯ НА СТРОКУ
                    <TableRow
                      key={type.id}
                      onMouseEnter={(e) => {
                        const buttons = e.currentTarget.querySelector('.edit-delete-buttons');
                        if (buttons) {
                          buttons.style.visibility = 'visible';
                          buttons.style.opacity = '1';
                        }
                      }}
                      onMouseLeave={(e) => {
                        const buttons = e.currentTarget.querySelector('.edit-delete-buttons');
                        if (buttons) {
                          buttons.style.visibility = 'hidden';
                          buttons.style.opacity = '0';
                        }
                      }}
                    >
                      <TableCell>{type.name}</TableCell>
                      <TableCell align="right">
                        {/* <<<--- ИЗМЕНЕНИЯ ДЛЯ ИКОНОК */}
                        <Box
                          className="edit-delete-buttons"
                          sx={{
                            display: 'flex',
                            gap: 1,
                            visibility: 'hidden',
                            opacity: 0,
                            transition: 'opacity 0.2s, visibility 0.2s',
                            cursor: 'pointer',
                            justifyContent: 'flex-end' // Выравнивание вправо
                          }}
                        >
                          <Tooltip title="Редактировать">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => { setEditingTypeId(type.id); setEditingTypeName(type.name); }}
                              aria-label="Редактировать"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Свойства">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleOpenPropertiesModal(type.id)}
                              aria-label="Свойства"
                            >
                              <TuneIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Удалить">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDeleteType(type.id)}
                              aria-label="Удалить"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Модальное окно для редактирования названия типа */}
            <Dialog open={editingTypeId && !openTypeModal} onClose={() => { setEditingTypeId(null); setEditingTypeName(''); }}>
              <DialogTitle>Редактировать тип</DialogTitle>
              <DialogContent>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Название типа"
                  fullWidth
                  value={editingTypeName}
                  onChange={(e) => setEditingTypeName(e.target.value)}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => { setEditingTypeId(null); setEditingTypeName(''); }}>Отмена</Button>
                <Button onClick={handleUpdateType} color="primary">
                  Сохранить
                </Button>
              </DialogActions>
            </Dialog>

            {/* Модальное окно для управления свойствами типа */}
            <Dialog open={openTypeModal} onClose={handleClosePropertiesModal} maxWidth="sm" fullWidth>
              <DialogTitle>Управление свойствами для типа: {types.find(t => t.id === editingTypeId)?.name || '...'}</DialogTitle>
              <DialogContent>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="properties-select-label">Выберите свойства</InputLabel>
                  <Select
                    labelId="properties-select-label"
                    multiple
                    value={selectedPropertyIds}
                    onChange={(e) => setSelectedPropertyIds(e.target.value)}
                    input={<Input />}
                    renderValue={(selected) => (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {selected.map((id) => {
                          const property = allProperties.find(p => p.id === id);
                          return property ? <Chip key={id} label={property.name} size="small" /> : null;
                        })}
                      </div>
                    )}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                    }}
                  >
                    {allProperties.map((property) => (
                      <MenuItem key={property.id} value={property.id}>
                        <Checkbox checked={selectedPropertyIds.includes(property.id)} />
                        <ListItemText primary={property.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {editingTypeProperties.length > 0 && (
                  <>
                    <Typography variant="subtitle1" gutterBottom style={{ marginTop: '16px' }}>
                      Текущие свойства типа:
                    </Typography>
                    <ul>
                      {editingTypeProperties.map((prop) => (
                        <li key={prop.id}>{prop.name}</li>
                      ))}
                    </ul>
                  </>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClosePropertiesModal}>Отмена</Button>
                <Button onClick={handleSaveTypeProperties} color="primary">
                  Сохранить свойства
                </Button>
              </DialogActions>
            </Dialog>
          </Paper>
        </Grid>

        {/* === Статусы === */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: '20px' }}>
            <Typography variant="h6" gutterBottom>
              Статусы
            </Typography>
            <Box display="flex" mb={2}>
              <TextField
                label="Новый статус"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                fullWidth
                size="small"
              />
              <Button variant="contained" onClick={handleAddStatus} color="success" style={{ marginLeft: '10px' }}>
                Добавить
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {statuses.map((status) => (
                    // <<<--- ИЗМЕНЕНИЯ ДЛЯ НАВЕДЕНИЯ НА СТРОКУ
                    <TableRow
                      key={status.id}
                      onMouseEnter={(e) => {
                        const buttons = e.currentTarget.querySelector('.edit-delete-buttons');
                        if (buttons) {
                          buttons.style.visibility = 'visible';
                          buttons.style.opacity = '1';
                        }
                      }}
                      onMouseLeave={(e) => {
                        const buttons = e.currentTarget.querySelector('.edit-delete-buttons');
                        if (buttons) {
                          buttons.style.visibility = 'hidden';
                          buttons.style.opacity = '0';
                        }
                      }}
                    >
                      <TableCell>{status.name}</TableCell>
                      <TableCell align="right">
                        {/* <<<--- ИЗМЕНЕНИЯ ДЛЯ ИКОНОК */}
                        <Box
                          className="edit-delete-buttons"
                          sx={{
                            display: 'flex',
                            gap: 1,
                            visibility: 'hidden',
                            opacity: 0,
                            transition: 'opacity 0.2s, visibility 0.2s',
                            cursor: 'pointer',
                            justifyContent: 'flex-end'
                          }}
                        >
                          <Tooltip title="Редактировать">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => { setEditingStatusId(status.id); setEditingStatusName(status.name); }}
                              aria-label="Редактировать"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* У статусов, вероятно, нет свойств, поэтому кнопку TuneIcon можно убрать или оставить для будущего функционала */}
                          {/* <Tooltip title="Свойства">
                            <IconButton color="primary" size="small" aria-label="Свойства">
                              <TuneIcon fontSize="small" />
                            </IconButton>
                          </Tooltip> */}

                          <Tooltip title="Удалить">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDeleteStatus(status.id)}
                              aria-label="Удалить"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Dialog open={!!editingStatusId} onClose={() => { setEditingStatusId(null); setEditingStatusName(''); }}>
              <DialogTitle>Редактировать статус</DialogTitle>
              <DialogContent>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Название статуса"
                  fullWidth
                  value={editingStatusName}
                  onChange={(e) => setEditingStatusName(e.target.value)}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => { setEditingStatusId(null); setEditingStatusName(''); }}>Отмена</Button>
                <Button onClick={handleUpdateStatus} color="primary">
                  Сохранить
                </Button>
              </DialogActions>
            </Dialog>
          </Paper>
        </Grid>

        {/* === Отделы (подразделения) === */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: '20px' }}>
            <Typography variant="h6" gutterBottom>
              Отделы (подразделения)
            </Typography>
            <Box display="flex" mb={2}>
              <TextField
                label="Новый отдел"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                fullWidth
                size="small"
              />
              <Button variant="contained" onClick={handleAddDepartment} color="success" style={{ marginLeft: '10px' }}>
                Добавить
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {departments.map((department) => (
                    // <<<--- ИЗМЕНЕНИЯ ДЛЯ НАВЕДЕНИЯ НА СТРОКУ
                    <TableRow
                      key={department.id}
                      onMouseEnter={(e) => {
                        const buttons = e.currentTarget.querySelector('.edit-delete-buttons');
                        if (buttons) {
                          buttons.style.visibility = 'visible';
                          buttons.style.opacity = '1';
                        }
                      }}
                      onMouseLeave={(e) => {
                        const buttons = e.currentTarget.querySelector('.edit-delete-buttons');
                        if (buttons) {
                          buttons.style.visibility = 'hidden';
                          buttons.style.opacity = '0';
                        }
                      }}
                    >
                      <TableCell>{department.name}</TableCell>
                      <TableCell align="right">
                        {/* <<<--- ИЗМЕНЕНИЯ ДЛЯ ИКОНОК */}
                        <Box
                          className="edit-delete-buttons"
                          sx={{
                            display: 'flex',
                            gap: 1,
                            visibility: 'hidden',
                            opacity: 0,
                            transition: 'opacity 0.2s, visibility 0.2s',
                            cursor: 'pointer',
                            justifyContent: 'flex-end'
                          }}
                        >
                          <Tooltip title="Редактировать">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => { setEditingDepartmentId(department.id); setEditingDepartmentName(department.name); }}
                              aria-label="Редактировать"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* У отделов, вероятно, нет свойств */}
                          {/* <Tooltip title="Свойства">
                            <IconButton color="primary" size="small" aria-label="Свойства">
                              <TuneIcon fontSize="small" />
                            </IconButton>
                          </Tooltip> */}

                          <Tooltip title="Удалить">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDeleteDepartment(department.id)}
                              aria-label="Удалить"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Dialog open={!!editingDepartmentId} onClose={() => { setEditingDepartmentId(null); setEditingDepartmentName(''); }}>
              <DialogTitle>Редактировать отдел</DialogTitle>
              <DialogContent>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Название отдела"
                  fullWidth
                  value={editingDepartmentName}
                  onChange={(e) => setEditingDepartmentName(e.target.value)}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => { setEditingDepartmentId(null); setEditingDepartmentName(''); }}>Отмена</Button>
                <Button onClick={handleUpdateDepartment} color="primary">
                  Сохранить
                </Button>
              </DialogActions>
            </Dialog>
          </Paper>
        </Grid>

        {/* === Сотрудники === */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: '20px' }}>
            <Typography variant="h6" gutterBottom>
              Сотрудники
            </Typography>
            <Box display="flex" flexWrap="wrap" mb={2} gap={1}>
              <TextField
                label="Имя сотрудника"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                size="small"
                style={{ flexGrow: 1, minWidth: '150px' }}
              />
              <FormControl size="small" style={{ minWidth: '150px' }}>
                <InputLabel>Отдел</InputLabel>
                <Select
                  value={newEmployee.department_id}
                  onChange={(e) => setNewEmployee({ ...newEmployee, department_id: e.target.value })}
                  label="Отдел"
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="contained" color="success" onClick={handleAddEmployee} color="success">
                Добавить
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {employees.map((employee) => (
                    // <<<--- ИЗМЕНЕНИЯ ДЛЯ НАВЕДЕНИЯ НА СТРОКУ
                    <TableRow
                      key={employee.id}
                      onMouseEnter={(e) => {
                        const buttons = e.currentTarget.querySelector('.edit-delete-buttons');
                        if (buttons) {
                          buttons.style.visibility = 'visible';
                          buttons.style.opacity = '1';
                        }
                      }}
                      onMouseLeave={(e) => {
                        const buttons = e.currentTarget.querySelector('.edit-delete-buttons');
                        if (buttons) {
                          buttons.style.visibility = 'hidden';
                          buttons.style.opacity = '0';
                        }
                      }}
                    >
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>
                        {departments.find(d => d.id === employee.department_id)?.name || 'Не указан'}
                      </TableCell>
                      <TableCell align="right">
                        {/* <<<--- ИЗМЕНЕНИЯ ДЛЯ ИКОНОК */}
                        <Box
                          className="edit-delete-buttons"
                          sx={{
                            display: 'flex',
                            gap: 1,
                            visibility: 'hidden',
                            opacity: 0,
                            transition: 'opacity 0.2s, visibility 0.2s',
                            cursor: 'pointer',
                            justifyContent: 'flex-end'
                          }}
                        >
                          <Tooltip title="Редактировать">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => {
                                setEditingEmployeeId(employee.id);
                                setEditingEmployee({
                                  name: employee.name,
                                  department_id: employee.department_id,
                                });
                              }}
                              aria-label="Редактировать"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* У сотрудников, вероятно, нет свойств */}
                          {/* <Tooltip title="Свойства">
                            <IconButton color="primary" size="small" aria-label="Свойства">
                              <TuneIcon fontSize="small" />
                            </IconButton>
                          </Tooltip> */}

                          <Tooltip title="Удалить">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDeleteEmployee(employee.id)}
                              aria-label="Удалить"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Dialog open={!!editingEmployeeId} onClose={() => { setEditingEmployeeId(null); setEditingEmployee({ name: '', department_id: '' }); }}>
              <DialogTitle>Редактировать сотрудника</DialogTitle>
              <DialogContent>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Имя сотрудника"
                  fullWidth
                  value={editingEmployee.name}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                />
                <FormControl fullWidth margin="dense">
                  <InputLabel>Отдел</InputLabel>
                  <Select
                    value={editingEmployee.department_id}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, department_id: e.target.value })}
                    label="Отдел"
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => { setEditingEmployeeId(null); setEditingEmployee({ name: '', department_id: '' }); }}>Отмена</Button>
                <Button onClick={handleUpdateEmployee} color="primary">
                  Сохранить
                </Button>
              </DialogActions>
            </Dialog>
          </Paper>
        </Grid>
      </Grid>

      {/* Уведомления */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Directory;
