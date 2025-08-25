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
  Typography,
  TablePagination
} from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../config'; // Импорт базового URL


const MovesList = () => {
  const [moves, setMoves] = useState([]);
  const [filteredMoves, setFilteredMoves] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Состояния для пагинации
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25); // По умолчанию 25 строк

  // Получаем данные с сервера
  useEffect(() => {
    const fetchMoves = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/moves`);
        setMoves(res.data);
        setFilteredMoves(res.data);
        // Исправлено: Удалена попытка установить setFilteredAssets, которого нет
      } catch (error) {
        console.error('Ошибка загрузки истории перемещений:', error);
      }
    };
    fetchMoves();
  }, []);

  // Фильтрация по строке поиска
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMoves(moves);
      return;
    }

    const searchLower = searchTerm.toLowerCase();

    const filtered = moves.filter(move => {
      const formattedDate = new Date(move.date).toLocaleDateString('ru-RU');
      const fieldsToSearch = [
        move.inventory_number || '',
        move.asset_name || '',
        move.from_room || '',
        move.to_room || '',
        formattedDate || ''
      ].join(' ').toLowerCase();

      return fieldsToSearch.includes(searchLower);
    });

    setFilteredMoves(filtered);
    setPage(0); // Сброс на первую страницу после фильтрации
  }, [searchTerm, moves]);

  // Сортировка
  const sortedMoves = [...filteredMoves].sort((a, b) => {
    let comparison = 0;

    switch (sortColumn) {
      case 'date':
        comparison = new Date(a.date) - new Date(b.date);
        break;
      case 'inventory_number':
        comparison = a.inventory_number?.localeCompare(b.inventory_number, undefined, { numeric: true, sensitivity: 'base' }) || 0;
        break;
      case 'asset_name':
        comparison = a.asset_name?.localeCompare(b.asset_name, undefined, { sensitivity: 'base' }) || 0;
        break;
      case 'from_room':
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
    // Исправлено: Логика сортировки была внутри switch, что некорректно
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

  // Обработчики пагинации
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Сброс на первую страницу при изменении количества строк
  };

  // Получаем данные для текущей страницы
  const paginatedMoves = sortedMoves.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Container maxWidth="xl" style={{ marginTop: '20px' }}>
      <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
        <Typography variant="h5" gutterBottom style={{ textAlign: 'center', fontSize: '30px' }}>
          <strong>История перемещений</strong>
        </Typography>

        <TextField
          label="Поиск"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: '16px' }}
        />

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  onClick={() => handleSort('date')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Дата {sortColumn === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell
                  onClick={() => handleSort('inventory_number')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Инвентарный номер{' '}
                  {sortColumn === 'inventory_number' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell
                  onClick={() => handleSort('asset_name')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Наименование{' '}
                  {sortColumn === 'asset_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell
                  onClick={() => handleSort('from_room')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Откуда
                  {sortColumn === 'from_room' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell
                  onClick={() => handleSort('to_room')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Куда
                  {sortColumn === 'to_room' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMoves.length > 0 ? (
                paginatedMoves.map((move) => (
                  <TableRow key={move.id}>
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
        
        {/* Добавлена пагинация */}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={sortedMoves.length} // Используем длину отсортированного массива
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

export default MovesList;