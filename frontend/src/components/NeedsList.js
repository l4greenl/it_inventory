// frontend/src/components/NeedsList.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  TableSortLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Snackbar,
  CircularProgress,
  Checkbox, // <<< ДОБАВИЛ: Импорт Checkbox
  TablePagination,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Предполагаемая функция для получения названия отдела по ID
const getDepartmentName = (deptId, departments) => {
  const dept = departments.find(d => d.id === deptId);
  return dept ? dept.name : `ID: ${deptId}`;
};

// Предполагаемая функция для получения названия типа устройства по ID
const getTypeName = (typeId, types) => {
  const type = types.find(t => t.id === typeId);
  return type ? type.name : `ID: ${typeId}`;
};

// Форматирование даты
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU'); // Формат ДД.ММ.ГГГГ
};

const NeedsList = ({ currentUser }) => {
  const navigate = useNavigate();
  const theme = useTheme(); // <<< ДОБАВИЛ: Получение темы для стилей

  const [needs, setNeeds] = useState([]);
  const [filteredNeeds, setFilteredNeeds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc'); // По умолчанию по убыванию даты
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [types, setTypes] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // <<< ДОБАВИЛ: Состояния для множественного выбора
  const [selectedNeeds, setSelectedNeeds] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  // <<< ДОБАВИЛ: Состояния для модального окна изменения статуса
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [availableStatuses, setAvailableStatuses] = useState(['Принято', 'В процессе', 'Исполнено']); // Для списка статусов в модалке

  // <<< ДОБАВИЛ: Состояния для модального окна подтверждения удаления
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25); // Начальное значение, например, 25

  const handleNavigationWithCheck = (path) => {
  if (selectedNeeds.length > 0) {
    if (window.confirm('У вас есть выделенные потребности. Вы уверены, что хотите покинуть страницу?')) {
      setSelectedNeeds([]); // Очищаем выбор
      navigate(path);
    }
  } else {
    navigate(path);
  }
};

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // <<< ИЗМЕНЕНО: Добавлена загрузка статусов для модального окна
        const [needsRes, deptsRes, typesRes, statusesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/needs`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/departments`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/types`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/statuses`, { withCredentials: true }), // <<< ДОБАВИЛ
        ]);
        setNeeds(needsRes.data);
        setFilteredNeeds(needsRes.data);
        setDepartments(deptsRes.data);
        setTypes(typesRes.data);
        setAvailableStatuses(statusesRes.data); // <<< ДОБАВИЛ
      } catch (err) {
        console.error('Ошибка загрузки потребностей:', err);
        setError('Не удалось загрузить список потребностей.');
        setSnackbar({
          open: true,
          message: 'Ошибка загрузки данных',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // <<< ДОБАВИЛ: Эффект для управления состоянием "выбрать все"
  useEffect(() => {
    if (filteredNeeds.length > 0 && selectedNeeds.length === filteredNeeds.length) {
      setIsAllSelected(true);
    } else {
      setIsAllSelected(false);
    }
  }, [selectedNeeds, filteredNeeds]);

  // Фильтрация и сортировка
  useEffect(() => {
    let result = [...needs];

    // Поиск
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(need => {
        const fullName = `${getDepartmentName(need.department_id, departments)} ${getTypeName(need.asset_type_id, types)} ${need.status || ''} ${need.note || ''}`.toLowerCase();
        const formattedDate = formatDate(need.date);
        const formattedReasonDate = formatDate(need.reason_date);
        const quantityStr = need.quantity ? need.quantity.toString() : '';
        // Поиск также по строке "Докладная записка от ..."
        const reasonDisplayText = `докладная записка от ${formattedReasonDate}`.toLowerCase();

        return (
          fullName.includes(term) ||
          formattedDate.includes(term) ||
          formattedReasonDate.includes(term) ||
          reasonDisplayText.includes(term) ||
          quantityStr.includes(term)
        );
      });
    }

    // Сортировка
    result.sort((a, b) => {
      let aValue, bValue;
      switch (sortColumn) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'department_id':
          aValue = getDepartmentName(a.department_id, departments).toLowerCase();
          bValue = getDepartmentName(b.department_id, departments).toLowerCase();
          break;
        case 'asset_type_id':
          aValue = getTypeName(a.asset_type_id, types).toLowerCase();
          bValue = getTypeName(b.asset_type_id, types).toLowerCase();
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'reason_date':
          aValue = new Date(a.reason_date);
          bValue = new Date(b.reason_date);
          break;
        case 'status':
          aValue = (a.status || '').toLowerCase();
          bValue = (b.status || '').toLowerCase();
          break;
        case 'note':
          aValue = (a.note || '').toLowerCase();
          bValue = (b.note || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredNeeds(result);
    // <<< ДОБАВИЛ: Сброс выбора при изменении фильтров/сортировки
    // setSelectedNeeds([]);
  }, [needs, searchTerm, sortColumn, sortOrder, departments, types]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredNeeds.map((need) => need.id);
      setSelectedNeeds(newSelected);
      return;
    }
    setSelectedNeeds([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selectedNeeds.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedNeeds, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedNeeds.slice(1));
    } else if (selectedIndex === selectedNeeds.length - 1) {
      newSelected = newSelected.concat(selectedNeeds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedNeeds.slice(0, selectedIndex),
        selectedNeeds.slice(selectedIndex + 1),
      );
    }

    setSelectedNeeds(newSelected);
  };

const handleRowClick = (needId) => {
  // <<<--- ДОБАВИЛ: Проверка роли пользователя ---
  if (currentUser && currentUser.role === 'admin') {
    navigate(`/needs/${needId}`);
  } else {
    // Опционально: Показать уведомление, что доступ запрещен
    setSnackbar({
      open: true,
      message: 'Просмотр деталей потребности доступен только администраторам.',
      severity: 'warning',
    });
    // return;
  }
};
  
  const isSelected = (id) => selectedNeeds.indexOf(id) !== -1;

  // <<< ДОБАВИЛ: Обработчики для модального окна изменения статуса
  const handleOpenStatusDialog = () => {
    if (selectedNeeds.length === 0) {
      setSnackbar({
        open: true,
        message: 'Пожалуйста, выберите хотя бы одну потребность.',
        severity: 'warning',
      });
      return;
    }
    setStatusDialogOpen(true);
  };

  const handleCloseStatusDialog = () => {
    setStatusDialogOpen(false);
    setNewStatus(''); // Сброс значения при закрытии
  };

  // Обработчик подтверждения изменения статуса
  const handleConfirmStatusChange = async () => {
    // Проверяем, выбран ли статус
    if (!newStatus) {
      setSnackbar({
        open: true,
        message: 'Пожалуйста, выберите статус',
        severity: 'warning',
      });
      return;
    }

    try {
      // Отправляем PATCH-запрос для обновления статуса у выбранных потребностей
      // Предполагается, что бэкенд ожидает массив ID и новое значение статуса
      await axios.patch(
        `${API_BASE_URL}/api/needs/batch-update`,
        {
          ids: selectedNeeds,
          status: newStatus // Отправляем выбранный статус
        },
        { withCredentials: true }
      );

      // Обновляем локальное состояние
      setNeeds((prevNeeds) =>
        prevNeeds.map((need) =>
          selectedNeeds.includes(need.id) ? { ...need, status: newStatus } : need
        )
      );
      setFilteredNeeds((prevFiltered) =>
        prevFiltered.map((need) =>
          selectedNeeds.includes(need.id) ? { ...need, status: newStatus } : need
        )
      );

      setSnackbar({
        open: true,
        message: `Статус успешно изменен для ${selectedNeeds.length} потребностей`,
        severity: 'success',
      });

      setSelectedNeeds([]); // Сброс выбора
      handleCloseStatusDialog();
    } catch (error) {
      console.error('Ошибка при массовом изменении статуса:', error);
      let errorMessage = 'Не удалось изменить статус.';
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = `Ошибка данных: ${error.response.data.error || 'Некорректный запрос.'}`;
        } else if (error.response.status === 401) {
          errorMessage = 'Ошибка авторизации.';
        } else if (error.response.status === 403) {
          errorMessage = 'Доступ запрещен.';
        } else if (error.response.status >= 500) {
          errorMessage = 'Внутренняя ошибка сервера.';
        }
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  // <<< ДОБАВИЛ: Обработчики для модального окна удаления
  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    try {
      // Отправляем DELETE-запрос для удаления выбранных потребностей
      // Предполагается, что у вас есть соответствующий эндпоинт, например, DELETE /api/needs/batch-delete
      // Тело запроса: { ids: [...] }
      await axios.delete(`${API_BASE_URL}/api/needs/batch-delete`, {
        data: { ids: selectedNeeds },
        withCredentials: true
      });

      // Обновляем локальное состояние
      const newNeeds = needs.filter(need => !selectedNeeds.includes(need.id));
      setNeeds(newNeeds);
      setFilteredNeeds(newNeeds.filter(need => filteredNeeds.some(fn => fn.id === need.id)));

      setSnackbar({
        open: true,
        message: `Удалено ${selectedNeeds.length} потребностей`,
        severity: 'success'
      });
      setSelectedNeeds([]); // Сброс выбора
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Ошибка при удалении потребностей:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при удалении потребностей',
        severity: 'error'
      });
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Сброс на первую страницу при изменении количества строк
  };

  const paginatedNeeds = React.useMemo(() => {
    return filteredNeeds.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredNeeds, page, rowsPerPage]);

  if (loading) return (
    <Container maxWidth="xl" style={{ marginTop: '20px', textAlign: 'center' }}>
      <CircularProgress />
      <Typography>Загрузка...</Typography>
    </Container>
  );

  if (error) return (
    <Container maxWidth="xl" style={{ marginTop: '20px' }}>
      <Alert severity="error">{error}</Alert>
    </Container>
  );

  return (
    // <<< ИЗМЕНЕНО: Обернул в Container и Paper с нужными стилями
    <Container maxWidth="xl" style={{ marginTop: '20px' }}>
      <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
        <Typography variant="h5" gutterBottom style={{ textAlign: 'center', fontSize: '30px' }}>
          <strong>Потребности</strong>
        </Typography>

        {/* Поисковая строка */}
        <TextField
          label="Поиск"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: '16px' }}
        />

        <Box display="flex" justifyContent="flex-start" gap={2} mb={2} flexWrap="wrap">
          {/* Кнопка "Изменить статус" - синяя, по центру */}
          {currentUser && currentUser.role === 'admin' && (
            <Button
              variant="contained"
              color="primary" // Синий цвет по умолчанию для primary
              onClick={handleOpenStatusDialog}
              disabled={selectedNeeds.length === 0} // Неактивна без выбора
              sx={{
                minWidth: 120,
                backgroundColor: theme.palette.primary.main, // Явное указание цвета
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
                '&:disabled': {
                  backgroundColor: theme.palette.action.disabledBackground,
                  color: theme.palette.action.disabled,
                }
              }}
            >
              Изменить статус
            </Button>
          )}

          {/* Кнопка "Удалить" - красная, справа */}
          {currentUser && currentUser.role === 'admin' && (
            <Button
              variant="contained"
              color="error" // Красный цвет
              onClick={handleOpenDeleteDialog}
              disabled={selectedNeeds.length === 0} // Неактивна без выбора
              sx={{
                minWidth: 120,
                backgroundColor: theme.palette.error.main,
                '&:hover': {
                  backgroundColor: theme.palette.error.dark,
                },
                '&:disabled': {
                  backgroundColor: theme.palette.action.disabledBackground,
                  color: theme.palette.action.disabled,
                }
              }}
            >
              Удалить
            </Button>
          )}
          {currentUser && currentUser.role === 'admin' && (
            <Button
              variant="contained"
              color="success"
              onClick={() => handleNavigationWithCheck('/needs/new')}
              sx={{ minWidth: 120 }} // Минимальная ширина для согласованности
            >
              Добавить
            </Button>
          )}
        </Box>

          <Typography variant="body2" color="textSecondary" align="left" gutterBottom>
            Выделено: {selectedNeeds.length}
          </Typography>

        {/* Таблица */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {/* <<< ДОБАВИЛ: Чекбокс "Выбрать все" */}
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedNeeds.length > 0 && selectedNeeds.length < filteredNeeds.length}
                    checked={isAllSelected}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sortColumn === 'date'}
                    direction={sortColumn === 'date' ? sortOrder : 'asc'}
                    onClick={() => handleSort('date')}
                  >
                    Дата
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sortColumn === 'department_id'}
                    direction={sortColumn === 'department_id' ? sortOrder : 'asc'}
                    onClick={() => handleSort('department_id')}
                  >
                    Отдел (подразделение)
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sortColumn === 'asset_type_id'}
                    direction={sortColumn === 'asset_type_id' ? sortOrder : 'asc'}
                    onClick={() => handleSort('asset_type_id')}
                  >
                    Наименование потребности
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sortColumn === 'quantity'}
                    direction={sortColumn === 'quantity' ? sortOrder : 'asc'}
                    onClick={() => handleSort('quantity')}
                  >
                    Количество
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sortColumn === 'reason_date'}
                    direction={sortColumn === 'reason_date' ? sortOrder : 'asc'}
                    onClick={() => handleSort('reason_date')}
                  >
                    Основание
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sortColumn === 'status'}
                    direction={sortColumn === 'status' ? sortOrder : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Статус
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sortColumn === 'note'}
                    direction={sortColumn === 'note' ? sortOrder : 'asc'}
                    onClick={() => handleSort('note')}
                  >
                    Примечание
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredNeeds.length > 0 ? (
                filteredNeeds.map((need) => {
                  const isItemSelected = isSelected(need.id);
                  return (
                    <TableRow
                      key={need.id}
                      hover
                      selected={isItemSelected}
                      // <<<--- ИЗМЕНЕНО: Объединённая логика клика ---
                      onClick={(event) => {
                        // Проверяем, не кликнули ли по интерактивному элементу (чекбокс, кнопка и т.д.)
                        if (
                          event.target.type !== 'checkbox' &&
                          event.target.tagName !== 'BUTTON' &&
                          event.target.tagName !== 'INPUT'
                        ) {
                          // 1. Проверка роли пользователя
                          if (currentUser && currentUser.role === 'admin') {
                            // 2. Если админ, проверяем выделенные элементы
                            if (selectedNeeds.length > 0) {
                              // Запрашиваем подтверждение
                              if (window.confirm('У вас есть выделенные потребности. Вы уверены, что хотите открыть карточку?')) {
                                setSelectedNeeds([]); // Очищаем выбор
                                navigate(`/needs/${need.id}`); // Переходим
                              }
                              // Если пользователь отменил, ничего не делаем
                            } else {
                              // Нет выделенных, просто переходим
                              navigate(`/needs/${need.id}`);
                            }
                          } else {
                            // 3. Если не админ, показываем уведомление
                            setSnackbar({
                              open: true,
                              message: 'Просмотр деталей потребности доступен только администраторам.',
                              severity: 'warning',
                            });
                            // Блокируем переход
                          }
                        }
                        // Если клик был по чекбоксу/кнопке, ничего не делаем, пусть работают их обработчики
                      }}
                      // --- КОНЕЦ ИЗМЕНЕНИЙ ---
                      sx={{
                        // Меняем курсор: pointer для админов, default для остальных
                        cursor: currentUser && currentUser.role === 'admin' ? 'pointer' : 'default',
                        '&.Mui-selected': {
                          backgroundColor: theme.palette.action.selected,
                        },
                        '&.Mui-selected:hover': {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                    >
                      {/* <<< ДОБАВИЛ: Чекбокс для каждой строки */}
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isItemSelected}
                          onChange={(event) => handleClick(event, need.id)}
                        />
                      </TableCell>
                      <TableCell>{formatDate(need.date)}</TableCell>
                      <TableCell>{getDepartmentName(need.department_id, departments)}</TableCell>
                      <TableCell>{getTypeName(need.asset_type_id, types)}</TableCell>
                      <TableCell>{need.quantity}</TableCell>
                      <TableCell>{`Докладная записка от ${formatDate(need.reason_date)}`}</TableCell>
                      <TableCell>{need.status}</TableCell>
                      <TableCell>{need.note || ''}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  {/* <<< ИЗМЕНЕНО: colspan с учетом чекбокса */}
                  <TableCell colSpan={8} align="center">
                    Нет данных
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredNeeds.length} // Общее количество отфильтрованных элементов
          rowsPerPage={rowsPerPage}   // Текущее количество строк на странице
          page={page}                  // Текущая страница (индекс с 0)
          onPageChange={handleChangePage} // Обработчик смены страницы
          onRowsPerPageChange={handleChangeRowsPerPage} // Обработчик смены кол-ва строк
          labelRowsPerPage="Строк на странице:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} из ${count !== -1 ? count : `больше чем ${to}`}`
          }
        />

        {/* Уведомления */}
        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* <<< ДОБАВИЛ: Модальное окно для изменения статуса */}
        <Dialog
          open={statusDialogOpen}
          onClose={handleCloseStatusDialog}
          aria-labelledby="status-dialog-title"
          aria-describedby="status-dialog-description"
        >
          <DialogTitle id="status-dialog-title">
            Изменить статус для {selectedNeeds.length} потребностей
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="status-dialog-description" sx={{ mb: 2 }}>
              Введите новый статус из списка:
            </DialogContentText>

            {/* <<< ИЗМЕНЕНО: TextField вместо Select */}
            <FormControl fullWidth variant="outlined">
              <InputLabel id="new-status-label">Новый статус *</InputLabel>
              <Select
                autoFocus
                margin="dense"
                id="new-status-name"
                label="Новый статус"
                type="text"
                fullWidth
                variant="outlined"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {/* Мапим массив доступных статусов */}
                {availableStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseStatusDialog} color="primary">
              Отмена
            </Button>
            <Button
              onClick={handleConfirmStatusChange}
              color="primary"
              variant="contained"
              // disabled={!newStatus.trim()} // Можно добавить, если нужно
            >
              Изменить
            </Button>
          </DialogActions>
        </Dialog>

        {/* <<< ДОБАВИЛ: Модальное окно подтверждения удаления */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <DialogTitle id="delete-dialog-title">
            Подтвердите удаление
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-description">
              Вы уверены, что хотите удалить {selectedNeeds.length} потребностей?
              Это действие нельзя отменить.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog} color="primary">
              Отмена
            </Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained" autoFocus>
              Удалить
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default NeedsList;