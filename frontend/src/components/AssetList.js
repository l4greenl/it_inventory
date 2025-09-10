// frontend/src/components/AssetList.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Импортируем useLocation
import {
  Container,
  Typography,
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Snackbar,
  TablePagination,
  TableSortLabel,
  Checkbox,
  MenuItem,
  Menu,
  IconButton,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { API_BASE_URL } from '../config'; // Импорт базового URL

const AssetList = ({ currentUser }) => {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [types, setTypes] = useState([]); // Для отображения имени типа
  const [statuses, setStatuses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [sortColumn, setSortColumn] = useState('inventory_number');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetsToDelete, setAssetsToDelete] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // <<<--- НОВОЕ: Состояния для управления дополнительными колонками
  const [extraColumns, setExtraColumns] = useState([]); // Массив ключей дополнительных колонок
  const [anchorEl, setAnchorEl] = useState(null); // Для управления меню
  const openMenu = Boolean(anchorEl);

  // <<<--- НОВОЕ: Состояние для диалога подтверждения навигации
  const [navDialogOpen, setNavDialogOpen] = useState(false);
  const [nextLocation, setNextLocation] = useState(null);
  const [confirmedNavigation, setConfirmedNavigation] = useState(false);

  const navigate = useNavigate();
  const location = useLocation(); // Получаем текущую локацию

  const formatEmployeeName = useCallback((fullName) => {
    if (!fullName) return '';
    
    // Удаляем возможные скобки и содержимое в скобках (должность)
    // Например: "Тетерин Александр Викторович (инженер)" -> "Тетерин Александр Викторович"
    let nameWithoutPosition = fullName.replace(/\s*\(.*?\)\s*$/, '').trim();
    
    if (!nameWithoutPosition) return '';
    
    const parts = nameWithoutPosition.split(/\s+/);
    
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];
    
    // Для каждой части имени (кроме первой - фамилии) проверяем, 
    // заканчивается ли она на точку. Если да - берем как есть, 
    // если нет - берем первую букву и добавляем точку
    const initials = parts.slice(1).map(part => {
      if (part.endsWith('.')) {
        // Уже является инициалом (например, "А.В.")
        // Берем часть до последней точки
        const cleanPart = part.slice(0, -1);
        // Если там несколько букв (например, "А.В"), превращаем в "А.В."
        if (cleanPart.length > 1) {
          return cleanPart.split('').join('.') + '.';
        }
        // Если одна буква, возвращаем как есть
        return part;
      } else {
        // Обычное имя, берем первую букву
        return part.charAt(0).toUpperCase() + '.';
      }
    }).join('');
    
    return `${parts[0]} ${initials}`.trim();
  }, []);

  // <<<--- НОВОЕ: Обработчик beforeunload
  const handleBeforeUnload = useCallback((event) => {
    if (selectedAssets.length > 0) {
      event.preventDefault();
      // Chrome требует установку returnValue
      event.returnValue = '';
      return '';
    }
  }, [selectedAssets]);

  // <<<--- НОВОЕ: Эффект для установки/снятия beforeunload listener
  useEffect(() => {
    if (selectedAssets.length > 0) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [selectedAssets, handleBeforeUnload]);

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [assetsRes, typesRes, statusesRes, departmentsRes, employeesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/assets`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/types`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/statuses`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/departments`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/employees`, { withCredentials: true }),
        ]);

        setAssets(assetsRes.data);
        setTypes(typesRes.data);
        setStatuses(statusesRes.data);
        setDepartments(departmentsRes.data);
        setEmployees(employeesRes.data);
        setFilteredAssets(assetsRes.data);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        if (err.response && err.response.status === 401) {
          setError('Ошибка аутентификации. Пожалуйста, войдите снова.');
        } else {
          setError('Ошибка загрузки данных. Пожалуйста, попробуйте позже.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Функции для получения имен по ID
  const getTypeName = useCallback((typeId) => {
    const type = types.find(t => t.id === typeId);
    return type ? type.name : '';
  }, [types]); // Зависит только от types

  const getStatusName = useCallback((statusId) => {
    const status = statuses.find(s => s.id === statusId);
    return status ? status.name : '';
  }, [statuses]); // Зависит только от statuses

  const getDepartmentName = useCallback((deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : '';
  }, [departments]); // Зависит только от departments

  // Функция для получения отформатированного имени сотрудника по его ID
  const getEmployeeName = useCallback((empId) => {
    if (!empId) return ''; // Возвращаем пустую строку, если ID не передан
    const employee = employees.find(emp => emp.id === empId); // Ищем сотрудника в списке
    // Если сотрудник найден, применяем formatEmployeeName к его имени, иначе возвращаем пустую строку
    return employee ? formatEmployeeName(employee.name) : '';
    // Предполагается, что employee.name содержит полное ФИО, например, "Иванов Иван Иванович"
  }, [employees]); // Зависит от списка сотрудников

  // Фильтрация и сортировка
  useEffect(() => {
    let result = assets;

    // Поиск
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(asset => {
        // Создаем составное "Наименование"
        // Используем ?? '' для защиты от null/undefined в отдельных частях имени
        const fullName = `${getTypeName(asset.type_id) ?? ''} ${asset.brand ?? ''} ${asset.model ?? ''}`.toLowerCase().trim();

        // Базовые поля для поиска
        const baseFieldsMatch =
          (asset.inventory_number && asset.inventory_number.toLowerCase().includes(term)) ||
          fullName.includes(term) ||
          (asset.responsible_person && getEmployeeName(asset.responsible_person).toLowerCase().includes(term)) || // Проверка на null перед вызовом getEmployeeName
          (asset.department_id && getDepartmentName(asset.department_id).toLowerCase().includes(term)) || // Проверка на null
          (asset.room && asset.room.toLowerCase().includes(term));

        // Дополнительные поля для поиска
        let extraFieldsMatch = false;
        if (extraColumns.length > 0) {
          extraFieldsMatch = extraColumns.some(colKey => {
            // Для всех полей сначала получаем значение, затем проверяем его тип и содержание
            let fieldValue;

            // Определяем значение поля в зависимости от colKey
            switch (colKey) {
              case 'serial_number':
                fieldValue = asset.serial_number;
                break;
              case 'CPU':
                fieldValue = asset.CPU;
                break;
              case 'RAM':
                fieldValue = asset.RAM;
                break;
              case 'Drive':
                fieldValue = asset.Drive;
                break;
              case 'OS':
                fieldValue = asset.OS;
                break;
              case 'IP_address':
                fieldValue = asset.IP_address;
                break;
              case 'status_id':
                fieldValue = asset.status_id;
                break;
              case 'actual_user':
                fieldValue = asset.actual_user;
                break;
              case 'purchase_date':
                fieldValue = asset.purchase_date;
                break;
              case 'number':
                fieldValue = asset.number;
                break;
              default:
                fieldValue = null;
            }

            if (fieldValue != null && typeof fieldValue === 'string') {
              return fieldValue.toLowerCase().includes(term);
            }
            if (typeof fieldValue === 'number') {
                 return fieldValue.toString().includes(term); // Поиск подстроки в строковом представлении числа
            }
            return false; // Если поле не подходит или не найдено совпадение
          });
        }

        return baseFieldsMatch || extraFieldsMatch;
      });
    }

    result = [...result].sort((a, b) => {
      let aValue = a[sortColumn];
      let bValue = b[sortColumn];

      const safeStringify = (val) => {
        if (val == null) return ''; // Преобразуем null/undefined в пустую строку
        if (val instanceof Date) return val.toISOString();
        return String(val);
      };

      if (sortColumn === 'type_id') {
        aValue = getTypeName(aValue) ?? ''; // Используем ?? для защиты
        bValue = getTypeName(bValue) ?? '';
      } else if (sortColumn === 'status_id') {
        aValue = getStatusName(aValue) ?? '';
        bValue = getStatusName(bValue) ?? '';
      } else if (sortColumn === 'actual_user') {
        aValue = getEmployeeName(aValue) ?? '';
        bValue = getEmployeeName(bValue) ?? '';
      } else if (sortColumn === 'department_id') {
        aValue = getDepartmentName(aValue) ?? '';
        bValue = getDepartmentName(bValue) ?? '';
      } else if (sortColumn === 'responsible_person') {
        aValue = getEmployeeName(aValue) ?? '';
        bValue = getEmployeeName(bValue) ?? '';
      } else if (sortColumn === 'purchase_date') {
        const dateA = aValue ? new Date(aValue) : new Date(0);
        const dateB = bValue ? new Date(bValue) : new Date(0);
        if (dateA < dateB) return sortOrder === 'asc' ? -1 : 1;
        if (dateA > dateB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      }
      else {
        aValue = safeStringify(aValue);
        bValue = safeStringify(bValue);
      }

      const aStr = aValue.toLowerCase();
      const bStr = bValue.toLowerCase();

      if (aStr < bStr) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aStr > bStr) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredAssets(result);
    setPage(0); // Сбросить на первую страницу после фильтрации/сортировки
  }, [assets, searchTerm, sortColumn, sortOrder, types, statuses, departments, employees, extraColumns, getEmployeeName, getDepartmentName, getStatusName, getTypeName]);

  // Сортировка
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  // Пагинация
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Выбор активов
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = paginatedAssets.map((asset) => asset.id);
      setSelectedAssets(newSelected);
      return;
    }
    setSelectedAssets([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selectedAssets.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedAssets, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedAssets.slice(1));
    } else if (selectedIndex === selectedAssets.length - 1) {
      newSelected = newSelected.concat(selectedAssets.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedAssets.slice(0, selectedIndex),
        selectedAssets.slice(selectedIndex + 1),
      );
    }

    setSelectedAssets(newSelected);
  };

  const isSelected = (id) => selectedAssets.indexOf(id) !== -1;

  // Пагинация
  const paginatedAssets = filteredAssets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const isAllSelected = paginatedAssets.length > 0 && selectedAssets.length === paginatedAssets.length;

  // <<<--- НОВОЕ: Логика для дополнительных колонок
  const availableExtraColumns = [
    { key: 'serial_number', label: 'Серийный номер' },
    { key: 'CPU', label: 'Процессор' },
    { key: 'RAM', label: 'Оперативная память (ГБ)' },
    { key: 'Drive', label: 'Диск (HDD/SSD)' },
    { key: 'OS', label: 'Операционная система' },
    { key: 'IP_address', label: 'IP-адрес' }, // Используем имя из JSON
    { key: 'status_id', label: 'Статус' },
    { key: 'actual_user', label: 'Фактический пользователь' },
    { key: 'purchase_date', label: 'Дата покупки' },
    { key: 'number', label: 'Номер' },
    { key: 'username', label: 'Имя устройства' },
    { key: 'add_serial_number', label: 'Доп. серийный номер' },
  ];

  const handleAddColumnClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleAddColumnClose = () => {
    setAnchorEl(null);
  };

  const handleAddColumnSelect = (columnKey) => {
    if (!extraColumns.includes(columnKey)) {
      setExtraColumns([...extraColumns, columnKey]);
    }
    handleAddColumnClose();
  };

  const handleRemoveExtraColumn = (columnKeyToRemove) => {
    setExtraColumns(extraColumns.filter(key => key !== columnKeyToRemove));
  };

  // Печать QR-кодов
  const handlePrintQRCode = async () => {
    if (selectedAssets.length === 0) {
      setSnackbar({ open: true, message: 'Выберите хотя бы один актив', severity: 'warning' });
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/api/qrcodes`, {
        ids: selectedAssets
      }, { withCredentials: true });

      const codes = res.data;

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
                width: 3cm;
                height: 3cm;
                position: relative;
                text-align: center;
                font-size: 10px;
                box-sizing: border-box;
                page-break-inside: avoid;
                break-inside: avoid;
              }

              .qr-container {
                width: 100%;
                height: calc (100%);
                display: flex;
                justify-content: center;
                align-items: center;
              }

              img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
              }

              .text-top,
              .text-bottom {
                position: absolute;
                left: 50%;
                transform: translateX(-50%);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                width: 90%;
                font-size: 8px;
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

      const itemsPerPage = 48;

      for (let i = 0; i < codes.length; i += itemsPerPage) {
        const pageItems = codes.slice(i, i + itemsPerPage);

        htmlContent += `<div class="page">`;

        pageItems.forEach((code) => {
          htmlContent += `
            <div class="qr-wrapper">
              <div class="qr-container">
                <img src="data:image/png;base64,${code.qr_base64}" />
              </div>
              <span class="text-top">${code.full_name || ''}</span>
              <span class="text-bottom">${code.inventory_number || ''}</span>
            </div>
          `;
        });

        htmlContent += `</div>`;
      }

      htmlContent += '</body></html>';

      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } catch (err) {
      console.error('Ошибка при генерации QR-кодов:', err);
      setSnackbar({ open: true, message: 'Не удалось получить QR-коды с сервера', severity: 'error' });
    }
  };

  // Экспорт в Excel
  const handleExportExcel = () => {
    if (selectedAssets.length === 0) {
      setSnackbar({ open: true, message: 'Выберите хотя бы один актив для экспорта', severity: 'warning' });
      return;
    }

    const selectedAssetObjects = assets.filter(asset => selectedAssets.includes(asset.id));

    // Подготавливаем данные для экспорта, включая все отображаемые колонки
    const dataToExport = selectedAssetObjects.map(asset => {
      const row = {
        'Инвентарный номер': asset.inventory_number || '',
        'Наименование': `${getTypeName(asset.type_id) || ''} ${asset.brand || ''} ${asset.model || ''}`.trim(),
        'Ответственный': getEmployeeName(asset.responsible_person),
        'Отдел (подразделение)': getDepartmentName(asset.department_id),
        'Помещение': asset.room || ''
      };

      // Добавляем данные для дополнительных колонок
      extraColumns.forEach(colKey => {
        const columnDef = availableExtraColumns.find(col => col.key === colKey);
        if (columnDef) {
          if (colKey === 'status_id') {
            row[columnDef.label] = getStatusName(asset.status_id);
          } else if (colKey === 'purchase_date' && asset.purchase_date) {
            row[columnDef.label] = new Date(asset.purchase_date).toLocaleDateString();
          } else if (colKey === 'actual_user') {
            row[columnDef.label] = getEmployeeName(asset.actual_user);
          } else {
            // Для остальных полей используем имя из JSON
            row[columnDef.label] = asset[colKey] || '';
          }
        }
      });

      return row;
    });

    // Создаем CSV контент
    const allHeaders = Object.keys(dataToExport[0]);
    const headers = allHeaders.join(';') + '\n';
    const rows = dataToExport.map(obj => Object.values(obj).map(value => `"${value}"`).join(';')).join('\n');
    const csvContent = '\uFEFF' + headers + rows; // BOM для UTF-8

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Оборудование_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Удаление активов
  const handleDeleteSelected = () => {
    if (selectedAssets.length === 0) {
      setSnackbar({ open: true, message: 'Выберите активы для удаления', severity: 'warning' });
      return;
    }
    setAssetsToDelete(selectedAssets);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await Promise.all(
        assetsToDelete.map(id =>
          axios.delete(`${API_BASE_URL}/api/assets/${id}`, { withCredentials: true })
        )
      );
      setAssets(assets.filter(asset => !assetsToDelete.includes(asset.id)));
      setSelectedAssets([]); // Очищаем выбор
      setAssetsToDelete([]); // Очищаем список на удаление
      setSnackbar({ open: true, message: 'Активы успешно удалены', severity: 'success' });
    } catch (err) {
      console.error('Ошибка при удалении активов:', err);
      setSnackbar({ open: true, message: 'Ошибка при удалении активов', severity: 'error' });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setAssetsToDelete([]);
  };

  // <<<--- НОВОЕ: Обработчики для диалога навигации
  const handleNavDialogClose = (agree = false) => {
    setNavDialogOpen(false);
    if (agree && nextLocation) {
      setConfirmedNavigation(true);
      // Навигация на отложенную локацию
      setTimeout(() => navigate(nextLocation), 0);
    } else {
      // Сброс состояния, если пользователь отменил
      setNextLocation(null);
    }
  };

  // <<<--- НОВОЕ: Эффект для сброса confirmedNavigation после навигации
  useEffect(() => {
    if (confirmedNavigation) {
      setConfirmedNavigation(false);
      setSelectedAssets([]); // Опционально: сбросить выбор после навигации
    }
  }, [location, confirmedNavigation]);

  // Уведомления
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

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

  // <<<--- НОВОЕ: Определяем количество базовых колонок + 1 (для кнопки +)
  const baseColumnCount = 5 + 1; // Инвентарный номер, Наименование, Ответственный, Отдел, Помещение, кнопка +
  const totalColumnCount = baseColumnCount + extraColumns.length;

  return (
    <Container maxWidth="100%" style={{ marginTop: '20px' }}>
      <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
        <Typography variant="h5" gutterBottom style={{ textAlign: 'center', fontSize: '30px' }}>
          <strong>Оборудование</strong>
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
      

        {/* Кнопки действий под строкой поиска */}
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          <Button
            variant="contained"
            color="primary"
            onClick={handleExportExcel}
            disabled={selectedAssets.length === 0}
          >
            Печать Excel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handlePrintQRCode}
            disabled={selectedAssets.length === 0}
          >
            Печать QR
          </Button>
          {currentUser && currentUser.role === 'admin' && (
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteSelected}
              disabled={selectedAssets.length === 0}
            >
              Удалить
            </Button>
          )}
          {currentUser && currentUser.role === 'admin' && (
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                if (selectedAssets.length > 0) {
                  if (window.confirm("У вас есть выделенные активы. Вы уверены, что хотите покинуть страницу?")) {
                    setSelectedAssets([]); // Очищаем выбор перед навигацией
                    navigate('/assets/new');
                  }
                } else {
                  navigate('/assets/new');
                }
              }}
            >
              Добавить
            </Button>
          )}
        </Box>

          <Typography variant="body2" color="textSecondary" align="left" gutterBottom>
            Выделено: {selectedAssets.length}
          </Typography>

        <TableContainer component={Paper}>
          <Table>
            {/* <<<--- ИЗМЕНЕНО: Заголовки таблицы с динамическими колонками */}
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedAssets.length > 0 && selectedAssets.length < paginatedAssets.length}
                    checked={isAllSelected}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                {/* Базовые колонки */}
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sortColumn === 'inventory_number'}
                    direction={sortColumn === 'inventory_number' ? sortOrder : 'asc'}
                    onClick={() => handleSort('inventory_number')}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Инвентарный номер
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sortColumn === 'type_id'}
                    direction={sortColumn === 'type_id' ? sortOrder : 'asc'}
                    onClick={() => handleSort('type_id')}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Наименование
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sortColumn === 'responsible_person'}
                    direction={sortColumn === 'responsible_person' ? sortOrder : 'asc'}
                    onClick={() => handleSort('responsible_person')}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Ответственный
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sortColumn === 'department_id'}
                    direction={sortColumn === 'department_id' ? sortOrder : 'asc'}
                    onClick={() => handleSort('department_id')}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Отдел (подразделение)
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sortColumn === 'room'}
                    direction={sortColumn === 'room' ? sortOrder : 'asc'}
                    onClick={() => handleSort('room')}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Помещение
                  </TableSortLabel>
                </TableCell>
                {/* Кнопка "+" для добавления колонок */}
                <TableCell sx={{ fontWeight: 'bold', width: '50px' }}>
                  <IconButton
                    color="success" // Зелёная кнопка
                    onClick={handleAddColumnClick}
                    size="small"
                    aria-label="Добавить колонку"
                  >
                    <AddIcon />
                  </IconButton>
                  {/* Меню для выбора колонок */}
                  <Menu
                    anchorEl={anchorEl}
                    open={openMenu}
                    onClose={handleAddColumnClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'center',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'center',
                    }}
                  >
                    {availableExtraColumns
                      .filter(col => !extraColumns.includes(col.key)) // Показываем только НЕдобавленные
                      .map(col => (
                        <MenuItem key={col.key} onClick={() => handleAddColumnSelect(col.key)}>
                          {col.label}
                        </MenuItem>
                      ))}
                    {availableExtraColumns.filter(col => !extraColumns.includes(col.key)).length === 0 && (
                      <MenuItem disabled>Нет доступных колонок</MenuItem>
                    )}
                  </Menu>
                </TableCell>
                {/* Динамические дополнительные колонки */}
                {extraColumns.map(colKey => {
                  const columnDef = availableExtraColumns.find(col => col.key === colKey);
                  return (
                    <TableCell key={colKey} sx={{ fontWeight: 'bold', position: 'relative' }}>
                      <TableSortLabel
                        active={sortColumn === colKey}
                        direction={sortColumn === colKey ? sortOrder : 'asc'}
                        onClick={() => handleSort(colKey)}
                        sx={{ fontWeight: 'bold', paddingRight: '24px' }} // Отступ для крестика
                      >
                        {columnDef ? columnDef.label : colKey}
                      </TableSortLabel>
                      {/* Кнопка "крестик" для удаления колонки */}
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveExtraColumn(colKey)}
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          right: 0,
                          transform: 'translateY(-50%)',
                          color: 'red', // Красный крестик
                          opacity: 0, // Скрыто по умолчанию
                          transition: 'opacity 0.2s',
                          padding: '2px',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 0, 0, 0.1)'
                          }
                        }}
                        className="remove-column-button" // Для стилей наведения
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAssets.length > 0 ? (
                paginatedAssets.map((asset) => {
                  const isItemSelected = isSelected(asset.id);
                  return (
                    <TableRow
                      key={asset.id}
                      hover
                      onClick={(event) => {
                        if (event.target.type !== 'checkbox') {
                          // <<<--- ИЗМЕНЕНО: Проверка перед навигацией
                          if (selectedAssets.length > 0) {
                            if (window.confirm("У вас есть выделенные активы. Вы уверены, что хотите открыть карточку?")) {
                              navigate(`/assets/${asset.id}`);
                            }
                          } else {
                            navigate(`/assets/${asset.id}`);
                          }
                        }
                      }}
                      selected={isItemSelected}
                      style={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isItemSelected}
                          onChange={(event) => handleClick(event, asset.id)}
                          onClick={(event) => event.stopPropagation()} // Останавливаем всплытие, чтобы не открывать карточку
                        />
                      </TableCell>
                      <TableCell>{asset.inventory_number}</TableCell>
                      <TableCell>{`${getTypeName(asset.type_id) || ''} ${asset.brand || ''} ${asset.model || ''}`.trim() || ''}</TableCell>
                      <TableCell>{getEmployeeName(asset.responsible_person) || ''}</TableCell>
                      <TableCell>{getDepartmentName(asset.department_id) || ''}</TableCell>
                      <TableCell>{asset.room || ''}</TableCell>
                      <TableCell></TableCell>
                      {extraColumns.map(colKey => {
                        if (colKey === 'status_id') {
                          return <TableCell key={colKey}>{getStatusName(asset.status_id) || ''}</TableCell>;
                        }
                        if (colKey === 'purchase_date' && asset.purchase_date) {
                          return <TableCell key={colKey}>{new Date(asset.purchase_date).toLocaleDateString()}</TableCell>;
                        }
                        if (colKey === 'actual_user') {
                          return <TableCell key={colKey}>{getEmployeeName(asset.actual_user) || ''}</TableCell>;
                        }
                        return <TableCell key={colKey}>{asset[colKey] || ''}</TableCell>;
                      })}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={totalColumnCount} align="center">
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
          count={filteredAssets.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Строк на странице:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
        />

        {/* Диалог подтверждения удаления */}
        <Dialog
          open={deleteDialogOpen}
          onClose={closeDeleteDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {"Подтвердите удаление"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Вы уверены, что хотите удалить {assetsToDelete.length} актив(ов)?
              Это действие нельзя отменить.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDeleteDialog} color="primary">
              Отмена
            </Button>
            <Button onClick={confirmDelete} color="error" autoFocus>
              Удалить
            </Button>
          </DialogActions>
        </Dialog>

        {/* <<<--- НОВОЕ: Диалог подтверждения навигации */}
        <Dialog
          open={navDialogOpen}
          onClose={() => handleNavDialogClose(false)}
          aria-labelledby="nav-dialog-title"
          aria-describedby="nav-dialog-description"
        >
          <DialogTitle id="nav-dialog-title">
            {"Подтвердите переход"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="nav-dialog-description">
              У вас есть выделенные активы. Вы уверены, что хотите покинуть страницу?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleNavDialogClose(false)} color="primary">
              Остаться
            </Button>
            <Button onClick={() => handleNavDialogClose(true)} color="error" autoFocus>
              Покинуть
            </Button>
          </DialogActions>
        </Dialog>

        {/* Уведомления */}
        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
        <style>{`
          .MuiTableCell-root:hover .remove-column-button {
            opacity: 1;
          }
        `}</style>
      </Paper>
    </Container>
  );
};

export default AssetList;