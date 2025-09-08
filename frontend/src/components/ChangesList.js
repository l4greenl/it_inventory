import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TablePagination // <<< ДОБАВИЛ: Импорт TablePagination
} from '@mui/material';
import { API_BASE_URL } from '../config'; // Импорт базового URL


// Форматируем дату под нужный вид
const formatDate = (dateString) => {
  if (!dateString) return '';

  // 1. Создаем объект Date из строки.
  // Предполагаем, что dateString содержит время в формате UTC,
  // например, "2023-10-27T20:00:00".
  // new Date("2023-10-27T20:00:00") интерпретирует это как 20:00 UTC.
  let utcDate = new Date(dateString);

  // 2. Проверяем, является ли результат допустимой датой
  if (isNaN(utcDate.getTime())) {
    console.error('Некорректная строка даты (UTC):', dateString);
    return 'Некорректная дата';
  }

  // 3. Прибавляем 3 часа (смещение MSK относительно UTC) к объекту даты.
  // Это корректно изменит и время, и дату, если нужно.
  // Например: Fri Oct 27 2023 20:00:00 GMT+0000 (UTC) + 3h
  // станет:    Sat Oct 28 2023 23:00:00 GMT+0000 (UTC)
  // (Внутренне объект Date хранит время в миллисекундах от эпохи Unix,
  // и прибавление миллисекунд корректно обрабатывает переходы через полночь).
  const mskDate = new Date(utcDate.getTime() + (3 * 60 * 60 * 1000));

  // 4. Теперь у нас есть объект Date, представляющий московское время.
  // Извлекаем компоненты даты и времени для форматирования.
  // Используем обычные методы (getYear, getMonth и т.д.), так как
  // объект mskDate теперь содержит правильное московское время.
  const day = String(mskDate.getDate()).padStart(2, '0');
  const month = String(mskDate.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
  const year = mskDate.getFullYear();
  const hours = String(mskDate.getHours()).padStart(2, '0');
  const minutes = String(mskDate.getMinutes()).padStart(2, '0');

  // 5. Формируем и возвращаем строку в нужном формате.
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

// <<< ДОБАВИЛ: Объект сопоставления полей
const FIELD_NAME_MAP = {
  // Основные поля
  'serial_number': 'серийного номера',
  'inventory_number': 'инвентарного номера',
  'type_id': 'типа устройства',
  'brand': 'производителя',
  'model': 'модели',
  'status_id': 'статуса',
  'actual_user': 'фактического пользователя',
  'responsible_person': 'ответственного',
  'department_id': 'отдела',
  'room': 'помещения',
  'purchase_date': 'даты покупки',
  'comments': 'комментария',
  // Динамические поля
  'diagonal': 'диагонали',
  'OS': 'операционной системы',
  'CPU': 'процессора',
  'RAM': 'оперативной памяти',
  'Drive': 'диска',
  'IP_address': 'IP-адреса',
  'number': 'номера',
  // Можно добавить другие поля, если они есть в базе
};

// Переводим action в человеко-читаемое название
const getActionDescription = (action, field = null) => {
  let baseAction = '';
  switch (action) {
    case 'created':
      return 'Создание';
    case 'updated':
      baseAction = 'Редактирование';
      break;
    case 'deleted':
      return 'Удаление';
    default:
      return action;
  }

  // Если действие 'updated' и указано поле
  if (action === 'updated' && field) {
    // Пытаемся получить русское название поля
    const fieldNameRU = FIELD_NAME_MAP[field];
    if (fieldNameRU) {
      return `${baseAction} ${fieldNameRU}`;
    } else {
      // Если поле не найдено в сопоставлении, показываем оригинальное имя
      return `${baseAction} ${field}`;
    }
  }

  // Если действие 'updated', но поле не указано (например, для старых записей)
  return baseAction;
};

const ChangesList = () => {
  const [changes, setChanges] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // <<< ДОБАВИЛ: Состояния для пагинации
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25); // По умолчанию 25 строк

  // Загружаем историю изменений
  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/changes`)
      .then(res => setChanges(res.data))
      .catch(err => console.error('Ошибка загрузки истории:', err));
  }, []);

  // Фильтруем данные по поиску
  const filteredChanges = changes.filter(change => {
    const searchLower = searchTerm.toLowerCase();
    const label = getActionDescription(change.action).toLowerCase();

    const assetInfo = [
      formatDate(change.changed_at),
      change.inventory_number?.toLowerCase(),
      change.asset_name?.toLowerCase(),
      label,
      change.old_value?.toLowerCase(),
      change.new_value?.toLowerCase()
    ].join(' ').toLowerCase();

    return assetInfo.includes(searchLower);
  });

  // <<< ДОБАВИЛ: Обработчики пагинации
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Сброс на первую страницу при изменении количества строк
  };

  // <<< ДОБАВИЛ: Получаем данные для текущей страницы
  const paginatedChanges = filteredChanges.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
        <Typography variant="h5" gutterBottom style={{ textAlign: 'center', fontSize: '30px' }}>
          <strong>История изменений</strong>
        </Typography>

        {/* Поисковая строка */}
        <TextField
          label="Поиск"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: '20px' }}
        />

        {/* Таблица */}
        <Table size="small">
          <TableBody>
            {paginatedChanges.length > 0 ? (
              paginatedChanges.map((change) => {
                const isUpdate = change.action === 'updated';

                return (
                  <TableRow key={change.id}>
                    <TableCell>
                      <strong>Дата:</strong> {formatDate(change.changed_at)}<br />
                      <strong>Инвентарный номер:</strong> {change.inventory_number || ''}<br />
                      <strong>Наименование:</strong> {change.asset_name || ''}<br />
                      <strong>Действие:</strong> {getActionDescription(change.action, change.field)}<br />

                      {/* Показываем "Было" и "Стало" только для action === 'updated' */}
                      {isUpdate && (
                        <>
                          <strong>Было:</strong> {change.old_value || ''}<br />
                          <strong>Стало:</strong> {change.new_value || ''}<br />
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell align="center">Нет записей об изменениях</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {/* <<< ДОБАВИЛ: Компонент пагинации */}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredChanges.length} // Используем длину отфильтрованного массива
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Строк на странице:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} из ${count !== -1 ? count : `больше чем ${to}`}`
          }
        />
      </Paper>
    </Container>
  );
};

export default ChangesList;