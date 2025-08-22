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
} from '@mui/material';

// Форматируем дату под нужный вид
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы с 0
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

// Переводим action в человеко-читаемое название
const getActionLabel = (action) => {
  switch (action) {
    case 'created':
      return 'Создание';
    case 'updated':
      return 'Редактирование';
    case 'deleted':
      return 'Удаление';
    default:
      return action;
  }
};

const ChangesList = () => {
  const [changes, setChanges] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Загружаем историю изменений
  useEffect(() => {
    axios.get('http://localhost:5000/api/changes')
      .then(res => setChanges(res.data))
      .catch(err => console.error('Ошибка загрузки истории:', err));
  }, []);

  // Фильтруем данные по поиску
  const filteredChanges = changes.filter(change => {
    const searchLower = searchTerm.toLowerCase();
    const label = getActionLabel(change.action).toLowerCase();

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
            {filteredChanges.length > 0 ? (
              filteredChanges.map((change) => {
                const isUpdate = change.action === 'updated';

                return (
                  <TableRow key={change.id}>
                    <TableCell>
                      <strong>Дата:</strong> {formatDate(change.changed_at)}<br />
                      <strong>Инвентарный номер:</strong> {change.inventory_number || ''}<br />
                      <strong>Наименование:</strong> {change.asset_name || ''}<br />
                      <strong>Действие:</strong> {getActionLabel(change.action)}<br />

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
      </Paper>
    </Container>
  );
};

export default ChangesList;