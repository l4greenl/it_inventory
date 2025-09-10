// frontend/src/components/Directory.js
import React, { useState, useEffect, useMemo } from 'react'; // <<< ДОБАВИЛ useMemo
import axios from 'axios';
// Импортируем компоненты из @mui/material
import {
  Container,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Box,
  Paper,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  // Другие необходимые компоненты MUI
} from '@mui/material';
// Импортируем иконки из @mui/icons-material
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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
  const [allProperties, setAllProperties] = useState([]);
  const [typeProperties, setTypeProperties] = useState([]);
  const [availableProperties, setAvailableProperties] = useState([]);

  // === Состояния для Статусов ===
  const [statuses, setStatuses] = useState([]);
  const [newStatus, setNewStatus] = useState('');
  const [editingStatusId, setEditingStatusId] = useState(null);
  const [editingStatusName, setEditingStatusName] = useState('');
  const [openStatusModal, setOpenStatusModal] = useState(false);

  // === Состояния для Отделов ===
  const [departments, setDepartments] = useState([]);
  const [newDepartment, setNewDepartment] = useState('');
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);
  const [editingDepartmentName, setEditingDepartmentName] = useState('');
  const [openDepartmentModal, setOpenDepartmentModal] = useState(false);

  // === Состояния для Сотрудников ===
  const [employees, setEmployees] = useState([]);
  // <<< ИЗМЕНЕНО: newEmployee теперь объект с name и department_id
  const [newEmployee, setNewEmployee] = useState({ name: '', department_id: '' });
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  // <<< ИЗМЕНЕНО: editingEmployee теперь объект
  const [editingEmployee, setEditingEmployee] = useState({ name: '', department_id: '' });
  const [openEmployeeModal, setOpenEmployeeModal] = useState(false);
  const [employeeDeptSearch, setEmployeeDeptSearch] = useState('');

  // === Состояния для модальных окон подтверждения удаления ===
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    title: '',
    content: '',
    onConfirm: null,
  });

  // <<< ДОБАВИЛ: Мемоизация отфильтрованных отделов для выпадающего списка сотрудников
  const filteredDepartments = useMemo(() => {
    const term = employeeDeptSearch.toLowerCase();
    return departments
      .filter(dept => dept.name.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [departments, employeeDeptSearch]); // Зависимости: departments и employeeDeptSearch

  // === Состояния для Snackbar (уведомлений) ===
  // Предполагается, что Snackbar управляется из App.js или родительского компонента
  // const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // === НОВЫЕ СОСТОЯНИЯ ДЛЯ УПРАВЛЕНИЯ СПИСКАМИ И ПОИСКОМ ===
  // Управление открытием/закрытием списков
  const [expandedLists, setExpandedLists] = useState({
    types: false,
    statuses: false,
    departments: false,
    employees: false,
  });

  // Поисковые запросы для каждого списка
  const [searchTerms, setSearchTerms] = useState({
    types: '',
    statuses: '',
    departments: '',
    employees: '',
  });

  // <<< ДОБАВИЛ: Поисковый запрос для фильтрации отделов в выпадающем списке сотрудников

  // === Загрузка данных при монтировании компонента ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        // ИСПРАВЛЕНО: Путь к свойствам, предполагая /api/properties
        const [typesRes, statusesRes, departmentsRes, employeesRes, propertiesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/types`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/statuses`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/departments`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/employees`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/properties`, { withCredentials: true }), // <<< ИСПРАВЛЕНО
        ]);
        
        setTypes(typesRes.data);
        setStatuses(statusesRes.data);
        setDepartments(departmentsRes.data);
        setEmployees(employeesRes.data);
        setAllProperties(propertiesRes.data);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        // setSnackbar({ open: true, message: 'Ошибка при загрузке данных', severity: 'error' });
      }
    };
    fetchData();
  }, []);


  // === Функции для управления списками и поиском ===

  const toggleList = (listName) => {
    setExpandedLists(prev => ({
      ...prev,
      [listName]: !prev[listName]
    }));
  };

  const handleSearchChange = (listName, value) => {
    setSearchTerms(prev => ({
      ...prev,
      [listName]: value
    }));
  };

  // Функция для получения отфильтрованных и отсортированных элементов
  const getFilteredAndSortedItems = (items, searchTerm, itemNameField = 'name') => {
    const term = searchTerm.toLowerCase();
    let filtered = items.filter(item =>
      item[itemNameField] && item[itemNameField].toLowerCase().includes(term)
    );
    // Сортируем отфильтрованные результаты по алфавиту
    filtered.sort((a, b) => a[itemNameField].localeCompare(b[itemNameField], 'ru'));
    return filtered;
  };

  // === Вспомогательные функции ===
  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : 'Неизвестный отдел';
  };

  const handleOpenDeleteDialog = (title, content, onConfirm) => {
    setDeleteDialog({ open: true, title, content, onConfirm });
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog({ open: false, title: '', content: '', onConfirm: null });
  };

  const handleConfirmDelete = () => {
    if (deleteDialog.onConfirm) deleteDialog.onConfirm();
    handleCloseDeleteDialog();
  };

  // const handleCloseSnackbar = () => {
  //   setSnackbar({ ...snackbar, open: false });
  // };

  // === CRUD функции для Типов ===
  const handleAddType = async () => {
    if (!newType.trim()) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/api/types`, { name: newType }, { withCredentials: true });
      setTypes([...types, res.data]);
      setNewType('');
      // <<< ДОБАВИЛ: Очистка поиска после добавления
      handleSearchChange('types', '');
      // setSnackbar({ open: true, message: 'Тип устройства добавлен', severity: 'success' });
    } catch (error) {
      console.error('Ошибка при добавлении типа:', error);
      // setSnackbar({ open: true, message: 'Ошибка при добавлении типа', severity: 'error' });
    }
  };

  const handleOpenEditType = async (type) => {
    setEditingTypeId(type.id);
    setEditingTypeName(type.name);

    try {
      const propertiesRes = await axios.get(`${API_BASE_URL}/api/types/${type.id}/properties`, { withCredentials: true });
      const associatedProps = propertiesRes.data;
      const associatedPropIds = associatedProps.map(p => p.id);

      setTypeProperties(associatedPropIds);
      setAvailableProperties(allProperties.filter(prop => !associatedPropIds.includes(prop.id)));
      setOpenTypeModal(true);
    } catch (error) {
      console.error('Ошибка при загрузке свойств типа для редактирования:', error);
      setTypeProperties([]);
      setAvailableProperties(allProperties);
      setOpenTypeModal(true);
    }
  };

  const handleUpdateType = async () => {
    if (!editingTypeName.trim()) return;
    try {
      await axios.put(`${API_BASE_URL}/api/types/${editingTypeId}`, { name: editingTypeName }, { withCredentials: true });
      await axios.put(`${API_BASE_URL}/api/types/${editingTypeId}/properties`, { property_ids: typeProperties }, { withCredentials: true });

      setTypes(types.map(t => t.id === editingTypeId ? { ...t, name: editingTypeName } : t));
      setOpenTypeModal(false);
      setEditingTypeId(null);
      setEditingTypeName('');
      setTypeProperties([]);
      setAvailableProperties([]);
    } catch (error) {
      console.error('Ошибка при обновлении типа:', error);
    }
  };

  const handleDeleteType = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/types/${id}`, { withCredentials: true });
      setTypes(types.filter(t => t.id !== id));
    } catch (error) {
      console.error('Ошибка при удалении типа:', error);
    }
  };

  // === CRUD функции для Статусов ===
  const handleAddStatus = async () => {
    if (!newStatus.trim()) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/api/statuses`, { name: newStatus }, { withCredentials: true });
      setStatuses([...statuses, res.data]);
      setNewStatus('');
      // <<< ДОБАВИЛ: Очистка поиска после добавления
      handleSearchChange('statuses', '');
      // setSnackbar({ open: true, message: 'Статус добавлен', severity: 'success' });
    } catch (error) {
      console.error('Ошибка при добавлении статуса:', error);
      // setSnackbar({ open: true, message: 'Ошибка при добавлении статуса', severity: 'error' });
    }
  };

  const handleOpenEditStatus = (status) => {
    setEditingStatusId(status.id);
    setEditingStatusName(status.name);
    setOpenStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!editingStatusName.trim()) return;
    try {
      await axios.put(`${API_BASE_URL}/api/statuses/${editingStatusId}`, { name: editingStatusName }, { withCredentials: true });
      setStatuses(statuses.map(s => s.id === editingStatusId ? { ...s, name: editingStatusName } : s));
      setOpenStatusModal(false);
      setEditingStatusId(null);
      setEditingStatusName('');
    } catch (error) {
      console.error('Ошибка при обновлении статуса:', error);
    }
  };

  const handleDeleteStatus = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/statuses/${id}`, { withCredentials: true });
      setStatuses(statuses.filter(s => s.id !== id));
    } catch (error) {
      console.error('Ошибка при удалении статуса:', error);
    }
  };

  // === CRUD функции для Отделов ===
  const handleAddDepartment = async () => {
    if (!newDepartment.trim()) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/api/departments`, { name: newDepartment }, { withCredentials: true });
      setDepartments([...departments, res.data]);
      setNewDepartment('');
      // <<< ДОБАВИЛ: Очистка поиска после добавления
      handleSearchChange('departments', '');
      // setSnackbar({ open: true, message: 'Отдел добавлен', severity: 'success' });
    } catch (error) {
      console.error('Ошибка при добавлении отдела:', error);
      // setSnackbar({ open: true, message: 'Ошибка при добавлении отдела', severity: 'error' });
    }
  };

  const handleOpenEditDepartment = (department) => {
    setEditingDepartmentId(department.id);
    setEditingDepartmentName(department.name);
    setOpenDepartmentModal(true);
  };

  const handleUpdateDepartment = async () => {
    if (!editingDepartmentName.trim()) return;
    try {
      await axios.put(`${API_BASE_URL}/api/departments/${editingDepartmentId}`, { name: editingDepartmentName }, { withCredentials: true });
      setDepartments(departments.map(d => d.id === editingDepartmentId ? { ...d, name: editingDepartmentName } : d));
      setOpenDepartmentModal(false);
      setEditingDepartmentId(null);
      setEditingDepartmentName('');
    } catch (error) {
      console.error('Ошибка при обновлении отдела:', error);
    }
  };

  const handleDeleteDepartment = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/departments/${id}`, { withCredentials: true });
      setDepartments(departments.filter(d => d.id !== id));
    } catch (error) {
      console.error('Ошибка при удалении отдела:', error);
    }
  };

  // === CRUD функции для Сотрудников ===
  // <<< ИЗМЕНЕНО: handleAddEmployee теперь использует объект newEmployee
  const handleAddEmployee = async () => {
    if (!newEmployee.name.trim() || !newEmployee.department_id) {
      return;
    }
    try {
      const res = await axios.post(`${API_BASE_URL}/api/employees`, newEmployee, { withCredentials: true });
      setEmployees([...employees, res.data]);
      // Очищаем форму добавления
      setNewEmployee({ name: '', department_id: '' });
      // <<< ДОБАВИЛ: Очистка поиска после добавления
      handleSearchChange('employees', '');
      // <<< ДОБАВИЛ: Очистка поиска по отделам в выпадающем списке
      setEmployeeDeptSearch('');
      // setSnackbar({ open: true, message: 'Сотрудник добавлен', severity: 'success' });
    } catch (error) {
      console.error('Ошибка при добавлении сотрудника:', error);
      // setSnackbar({ open: true, message: 'Ошибка при добавлении сотрудника', severity: 'error' });
    }
  };

  const handleOpenEditEmployee = (employee) => {
    setEditingEmployeeId(employee.id);
    setEditingEmployee({ name: employee.name, department_id: employee.department_id });
    setOpenEmployeeModal(true);
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee.name.trim() || !editingEmployee.department_id) {
      return;
    }
    try {
      await axios.put(`${API_BASE_URL}/api/employees/${editingEmployeeId}`, editingEmployee, { withCredentials: true });
      setEmployees(employees.map(e => e.id === editingEmployeeId ? { ...e, ...editingEmployee } : e));
      setOpenEmployeeModal(false);
      setEditingEmployeeId(null);
      setEditingEmployee({ name: '', department_id: '' });
    } catch (error) {
      console.error('Ошибка при обновлении сотрудника:', error);
    }
  };

  const handleDeleteEmployee = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/employees/${id}`, { withCredentials: true });
      setEmployees(employees.filter(e => e.id !== id));
    } catch (error) {
      console.error('Ошибка при удалении сотрудника:', error);
    }
  };

  // === Функция для рендеринга одного списка ===
  const renderListSection = ({
    listName,
    title,
    items,
    itemNameField,
    newItemValue,
    setNewItemValue,
    handleAdd,
    handleEdit,
    handleDelete,
    placeholder,
    showDepartment = false,
    showDepartmentSelect = false,
    filteredDepartments = [] // Значение по умолчанию для других списков
  }) => {
    const searchTerm = searchTerms[listName];
    const isExpanded = expandedLists[listName];

    // Сортируем исходный список по алфавиту
    const sortedItems = [...items].sort((a, b) => a[itemNameField].localeCompare(b[itemNameField], 'ru'));

    // Фильтруем и сортируем результаты поиска
    const filteredItems = getFilteredAndSortedItems(items, searchTerm, itemNameField);

    return (
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>

        {/* <<< ИЗМЕНЕНО: Единый контейнер для всех элементов управления вводом */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          
          {/* Поле ввода */}
          <TextField
            // Уменьшаем базовую ширину, чтобы уступить место другим элементам
            sx={{ flexGrow: 1, minWidth: 120 }} 
            variant="outlined"
            size="small"
            placeholder={placeholder}
            value={typeof newItemValue === 'string' ? newItemValue : newItemValue.name || ''}
            onChange={(e) => {
              if (typeof newItemValue === 'string') {
                setNewItemValue(e.target.value);
              } else {
                setNewItemValue(prev => ({ ...prev, name: e.target.value }));
              }
            }}
            onInput={(e) => handleSearchChange(listName, e.target.value)}
          />

          {/* Выпадающий список для выбора отдела (только для сотрудников) */}
          {showDepartmentSelect && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              {/* Стиль для полупрозрачного серого текста метки */}
              <InputLabel
                id={`select-dept-label-${listName}`}
                sx={{
                  '&.Mui-focused': {
                    color: 'rgba(0, 0, 0, 0.6)',
                  },
                  '&': {
                    color: 'rgba(0, 0, 0, 0.6)',
                  }
                }}
              >
                Отдел
              </InputLabel>
              <Select
                labelId={`select-dept-label-${listName}`}
                value={newEmployee.department_id}
                label="Отдел"
                onChange={(e) => setNewEmployee(prev => ({ ...prev, department_id: e.target.value }))}
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
                renderValue={(selected) => {
                  const selectedDept = departments.find(d => d.id === selected);
                  return selectedDept ? selectedDept.name : '';
                }}
              >
                {filteredDepartments.length > 0 ? (
                  filteredDepartments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>
                    <em>Отделы не найдены</em>
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          )}

          {/* Кнопка раскрытия/скрытия списка */}
          <IconButton
            color="primary"
            onClick={() => toggleList(listName)}
            // Добавляем минимальную ширину для согласованности
            sx={{ flexShrink: 0 }} 
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>

          {/* Кнопка добавления */}
          <Button
            variant="contained"
            size="small"
            onClick={handleAdd}
            color="success"
            // Добавляем минимальную ширину для согласованности
            sx={{ flexShrink: 0 }} 
            disabled={
              typeof newItemValue === 'string'
                ? !newItemValue.trim()
                : (!newItemValue.name?.trim() || !newItemValue.department_id)
            }
          >
            Добавить
          </Button>
        </Box>
        {/* <<< /ИЗМЕНЕНО: Единый контейнер для всех элементов управления вводом */}

        {/* Список результатов поиска - отображается ТОЛЬКО если список ЗАКРЫТ */}
        {!isExpanded && searchTerm && (
          <List dense sx={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, mt: 1 }}>
            {filteredItems.slice(0, 3).map((item) => (
              <ListItem key={item.id} sx={{ py: 0.5 }}>
                <ListItemText
                  primary={item[itemNameField]}
                  secondary={showDepartment ? getDepartmentName(item.department_id) : null}
                />
                {currentUser && currentUser.role === 'admin' && (
                  <ListItemSecondaryAction>
                    <IconButton color="primary" edge="end" aria-label="edit" onClick={() => handleEdit(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton color="error" edge="end" aria-label="delete" onClick={() => {
                      handleOpenDeleteDialog(
                        `Удалить ${title.slice(0, -1)}?`,
                        `Вы уверены, что хотите удалить "${item[itemNameField]}"? Это действие нельзя отменить.`,
                        () => handleDelete(item.id)
                      );
                    }} sx={{ ml: 1 }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
            {filteredItems.length === 0 && (
              <ListItem>
                <ListItemText primary="Ничего не найдено" />
              </ListItem>
            )}
            {filteredItems.length > 3 && (
              <ListItem>
                <ListItemText primary={`... и ещё ${filteredItems.length - 3}`} />
              </ListItem>
            )}
          </List>
        )}

        {/* Полный список (виден только если список развернут) */}
        {isExpanded && (
          <List dense sx={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, mt: 1 }}>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <ListItem key={item.id} sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={item[itemNameField]}
                    secondary={showDepartment ? getDepartmentName(item.department_id) : null}
                  />
                  {currentUser && currentUser.role === 'admin' && (
                    <ListItemSecondaryAction>
                      <IconButton color="primary" edge="end" aria-label="edit" onClick={() => handleEdit(item)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton color="error" edge="end" aria-label="delete" onClick={() => {
                        handleOpenDeleteDialog(
                          `Удалить ${title.slice(0, -1)}?`,
                          `Вы уверены, что хотите удалить "${item[itemNameField]}"? Это действие нельзя отменить.`,
                          () => handleDelete(item.id)
                        );
                      }} sx={{ ml: 1 }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText primary={`По запросу "${searchTerm}" ничего не найдено`} />
              </ListItem>
            )}
          </List>
        )}
      </Paper>
    );
  };

  return (
    // <<< ИЗМЕНЕНО: Увеличил maxWidth с md на lg
    <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        Справочники
      </Typography>



      {/* Список Отделов */}
      {renderListSection({
        listName: 'departments',
        title: 'Отделы (подразделения)',
        items: departments,
        itemNameField: 'name',
        newItemValue: newDepartment,
        setNewItemValue: setNewDepartment,
        handleAdd: handleAddDepartment,
        handleEdit: handleOpenEditDepartment,
        handleDelete: handleDeleteDepartment,
        placeholder: 'Введите отдел...'
      })}

      {/* Список Сотрудников */}
      {renderListSection({
        listName: 'employees',
        title: 'Сотрудники (должность)',
        items: employees,
        itemNameField: 'name',
        newItemValue: newEmployee,
        setNewItemValue: setNewEmployee,
        handleAdd: handleAddEmployee,
        handleEdit: handleOpenEditEmployee,
        handleDelete: handleDeleteEmployee,
        placeholder: 'Введите ФИО сотрудника...',
        showDepartment: true,
        showDepartmentSelect: true,
        filteredDepartments: filteredDepartments 
      })}

      {/* Модальное окно редактирования Типа устройства (с выбором свойств) */}
      <Dialog
        open={openTypeModal}
        onClose={() => setOpenTypeModal(false)}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            maxHeight: '80vh',
          }
        }}
      >
        <DialogTitle>Редактировать тип устройства</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название типа"
            type="text"
            fullWidth
            variant="outlined"
            value={editingTypeName}
            onChange={(e) => setEditingTypeName(e.target.value)}
            sx={{ mb: 2 }}
          />

          <DialogContentText sx={{ mb: 1 }}>
            Выберите свойства для этого типа устройства:
          </DialogContentText>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Доступные свойства</Typography>
              <List dense sx={{ border: '1px solid #e0e0e0', borderRadius: 1, maxHeight: 300, overflowY: 'auto' }}>
                {availableProperties
                  .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
                  .map(prop => (
                    <ListItem key={prop.id} sx={{ py: 0.5 }}>
                      <ListItemText primary={prop.name} />
                      <IconButton
                        color="success"
                        edge="end"
                        aria-label="add"
                        onClick={() => {
                          setTypeProperties([...typeProperties, prop.id]);
                          setAvailableProperties(availableProperties.filter(p => p.id !== prop.id));
                        }}
                      >
                        &rarr;
                      </IconButton>
                    </ListItem>
                  ))}
                {availableProperties.length === 0 && (
                  <ListItem>
                    <ListItemText primary="Нет доступных свойств" />
                  </ListItem>
                )}
              </List>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Связанные свойства</Typography>
              <List dense sx={{ border: '1px solid #e0e0e0', borderRadius: 1, maxHeight: 300, overflowY: 'auto' }}>
                {typeProperties
                  .map(propId => allProperties.find(p => p.id === propId))
                  .filter(Boolean)
                  .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
                  .map(prop => (
                    <ListItem key={prop.id} sx={{ py: 0.5 }}>
                      <ListItemText primary={prop.name} />
                      <IconButton
                        color="error"
                        edge="end"
                        aria-label="remove"
                        onClick={() => {
                          setTypeProperties(typeProperties.filter(id => id !== prop.id));
                          setAvailableProperties([...availableProperties, prop]);
                        }}
                      >
                        &larr;
                      </IconButton>
                    </ListItem>
                  ))}
                {typeProperties.length === 0 && (
                  <ListItem>
                    <ListItemText primary="Нет связанных свойств" />
                  </ListItem>
                )}
              </List>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          <Button onClick={() => setOpenTypeModal(false)} variant="outlined" color="primary">Отмена</Button>
          <Button onClick={handleUpdateType} variant="contained" color="success">Сохранить</Button>
        </DialogActions>
      </Dialog>

      {/* Модальное окно редактирования Статуса */}
      <Dialog open={openStatusModal} onClose={() => setOpenStatusModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Редактировать статус</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название статуса"
            type="text"
            fullWidth
            variant="outlined"
            value={editingStatusName}
            onChange={(e) => setEditingStatusName(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          <Button onClick={() => setOpenStatusModal(false)} variant="outlined" color="primary">Отмена</Button>
          <Button onClick={handleUpdateStatus} variant="contained" color="success">Сохранить</Button>
        </DialogActions>
      </Dialog>

      {/* Модальное окно редактирования Отдела */}
      <Dialog open={openDepartmentModal} onClose={() => setOpenDepartmentModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Редактировать отдел</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название отдела"
            type="text"
            fullWidth
            variant="outlined"
            value={editingDepartmentName}
            onChange={(e) => setEditingDepartmentName(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          <Button onClick={() => setOpenDepartmentModal(false)} variant="outlined" color="primary">Отмена</Button>
          <Button onClick={handleUpdateDepartment} variant="contained" color="success">Сохранить</Button>
        </DialogActions>
      </Dialog>

      {/* Список Типов устройств */}
      {renderListSection({
        listName: 'types',
        title: 'Типы устройств',
        items: types,
        itemNameField: 'name',
        newItemValue: newType,
        setNewItemValue: setNewType,
        handleAdd: handleAddType,
        handleEdit: handleOpenEditType,
        handleDelete: handleDeleteType,
        placeholder: 'Введите тип устройства...'
      })}

      {/* Список Статусов */}
      {renderListSection({
        listName: 'statuses',
        title: 'Статусы',
        items: statuses,
        itemNameField: 'name',
        newItemValue: newStatus,
        setNewItemValue: setNewStatus,
        handleAdd: handleAddStatus,
        handleEdit: handleOpenEditStatus,
        handleDelete: handleDeleteStatus,
        placeholder: 'Введите статус...'
      })}

      {/* Модальное окно редактирования Сотрудника */}
      <Dialog open={openEmployeeModal} onClose={() => setOpenEmployeeModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Редактировать сотрудника</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="ФИО сотрудника"
            type="text"
            fullWidth
            variant="outlined"
            value={editingEmployee.name}
            onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel id="edit-employee-dept-label">Отдел</InputLabel>
            <Select
              labelId="edit-employee-dept-label"
              value={editingEmployee.department_id}
              onChange={(e) => setEditingEmployee({ ...editingEmployee, department_id: e.target.value })}
              label="Отдел"
            >
              {departments
                .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
                .map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          <Button onClick={() => setOpenEmployeeModal(false)} variant="outlined" color="primary">Отмена</Button>
          <Button onClick={handleUpdateEmployee} variant="contained" color="success">Сохранить</Button>
        </DialogActions>
      </Dialog>

      {/* Модальное окно подтверждения удаления */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>{deleteDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteDialog.content}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          <Button onClick={handleCloseDeleteDialog} color="primary" variant="outlined">Отмена</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar для уведомлений */}
      {/* Предполагается, что Snackbar компонент определен в App.js или выше по дереву.
      Если нет, раскомментируйте ниже:
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        severity={snackbar.severity}
      />
      */}
    </Container>
  );
};

export default Directory;