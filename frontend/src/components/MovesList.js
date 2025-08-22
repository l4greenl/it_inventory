import React, { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography
} from '@mui/material';
import axios from 'axios';
// useNavigate удален, так как навигация больше не используется

const MovesList = () => {
  const [moves, setMoves] = useState([]);
  const [filteredMoves, setFilteredMoves] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc'); // По умолчанию сортировка по дате по убыванию

  // Получаем данные с сервера
  useEffect(() => {
    const fetchMoves = async () => {
      try { // Добавлена обработка ошибок
        const res = await axios.get('http://localhost:5000/api/moves');
        setMoves(res.data);
        setFilteredMoves(res.data);
      } catch (error) {
        console.error('Ошибка загрузки истории перемещений:', error);
        // Можно добавить уведомление об ошибке для пользователя
      }
    };
    fetchMoves();
  }, []);

  // Фильтрация по строке поиска (охватывает все поля, включая отформатированную дату)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMoves(moves);
      return;
    }

    const searchLower = searchTerm.toLowerCase();

    const filtered = moves.filter(move => {
      // Форматируем дату только для отображения и поиска
      const formattedDate = new Date(move.date).toLocaleDateString('ru-RU'); // Формат ДД.ММ.ГГГГ

      const fieldsToSearch = [
        move.inventory_number || '',
        move.asset_name || '',
        move.from_room || '',
        move.to_room || '',
        formattedDate || '' // Используем отформатированную дату для поиска
      ].join(' ').toLowerCase();

      return fieldsToSearch.includes(searchLower);
    });

    setFilteredMoves(filtered);
  }, [searchTerm, moves]);

  // Сортировка активов
  const sortedMoves = [...filteredMoves].sort((a, b) => {
    let comparison = 0;

    switch (sortColumn) {
      case 'date':
        // Сортировка по дате напрямую как объектам Date
        comparison = new Date(a.date) - new Date(b.date); // Исправлено: сортировка по убыванию по умолчанию
        break;
      case 'inventory_number':
        comparison = a.inventory_number?.localeCompare(b.inventory_number, undefined, { numeric: true, sensitivity: 'base' }) || 0;
        break;
      case 'asset_name':
        comparison = a.asset_name?.localeCompare(b.asset_name, undefined, { sensitivity: 'base' }) || 0;
        break;
      case 'from_room':
        // Сортировка с учетом возможных null/undefined значений
        const roomA = (a.from_room || '').toLowerCase();
        const roomB = (b.from_room || '').toLowerCase();
        comparison = roomA.localeCompare(roomB);
        break;
      case 'to_room':
        const toRoomA = (a.to_room || '').toLowerCase();
        const toRoomB = (b.to_room || '').toLowerCase();
        comparison = toRoomA.localeCompare(toRoomB);
        break;
      default:
        return 0;
    }

    // Применяем порядок сортировки
    if (sortOrder === 'desc') {
      comparison = -comparison;
    }

    return comparison;
  });

  // Обработчик клика на заголовок для сортировки
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
        <Typography variant="h5" gutterBottom style={{ textAlign: 'center', fontSize: '30px' }}>
          <strong>История перемещений</strong>
        </Typography>

        {/* Поисковая строка */}
        <TextField
          label="Поиск по всем полям"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: '16px' }}
        />

        {/* Таблица */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {/* Добавлен уникальный ключ для TableRow в TableHead */}
                <TableCell
                  key="date-header"
                  onClick={() => handleSort('date')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }} // Выделение заголовков
                >
                  Дата {sortColumn === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell
                  key="inventory-header"
                  onClick={() => handleSort('inventory_number')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Инвентарный номер{' '}
                  {sortColumn === 'inventory_number' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell
                  key="name-header"
                  onClick={() => handleSort('asset_name')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Наименование{' '}
                  {sortColumn === 'asset_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell
                  key="from-header"
                  onClick={() => handleSort('from_room')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Откуда
                  {sortColumn === 'from_room' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell
                  key="to-header"
                  onClick={() => handleSort('to_room')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Куда
                  {sortColumn === 'to_room' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedMoves.length > 0 ? (
                sortedMoves.map((move) => (
                  // Удален onClick и стили для ховера, связанные с навигацией
                  <TableRow
                    key={move.id} // Добавлен уникальный ключ
                  >
                    {/* Отображаем только дату */}
                    <TableCell>{new Date(move.date).toLocaleDateString('ru-RU')}</TableCell>
                    <TableCell>{move.inventory_number}</TableCell>
                    <TableCell>{move.asset_name}</TableCell>
                    <TableCell>{move.from_room || ''}</TableCell>
                    <TableCell>{move.to_room || ''}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Нет данных
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default MovesList;