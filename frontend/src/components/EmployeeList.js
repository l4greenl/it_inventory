// frontend/src/components/EmployeeList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import { API_BASE_URL } from '../config'; // Импорт базового URL


const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [assetCounts, setAssetCounts] = useState({}); // Кол-во активов на сотрудника
  const [totalAssetsByDept, setTotalAssetsByDept] = useState([]); // Общее количество активов по отделам

  // === Загрузка данных ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загружаем сотрудников и отделы
        const empsRes = await axios.get(`${API_BASE_URL}/api/employees`);
        const depsRes = await axios.get(`${API_BASE_URL}/api/departments`);
        const assetsRes = await axios.get(`${API_BASE_URL}/api/assets`);

        const emps = empsRes.data;
        const deps = depsRes.data;
        const allAssets = assetsRes.data;

        console.log('Загруженные сотрудники:', emps);
        console.log('Загруженные отделы:', deps);
        console.log('Загруженные активы:', allAssets);

        setEmployees(emps);
        setDepartments(deps);

        // Подсчитываем оборудование для каждого сотрудника
        const assetCounts = {};

        for (let emp of emps) {
          const count = allAssets.filter(a => a.responsible_person === emp.id).length; // Используем ID сотрудника
          assetCounts[emp.id] = count;
        }

        setAssetCounts(assetCounts);

        // Подсчитываем общее количество активов по отделам
        const totalAssetsByDept = {};

        for (let dept of deps) {
          const count = allAssets.filter(a => a.department_id === dept.id).length;
          totalAssetsByDept[dept.id] = count;
        }

        setTotalAssetsByDept(totalAssetsByDept);
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
      }
    };

    fetchData();
  }, []);

  return (
    <Container maxWidth="md">
      <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
        {/* Отображаем сотрудников по отделам */}
        {departments.map(dept => {
          const deptEmployees = employees.filter(emp => emp.department_id === dept.id);

          if (deptEmployees.length === 0) {
            return null; // Не отображаем пустые отделы
          }

          return (
            <div key={dept.id}>
              <Typography
                variant="h5"
                gutterBottom
                style={{ fontWeight: 'bold', textAlign: 'center', fontSize: '30px' }}
              >
                {dept.name}
              </Typography>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell></TableCell>
                    <TableCell align="right" style={{ fontSize: '12px' }}>Оборудования</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deptEmployees.map(emp => (
                    <TableRow key={emp.id}>
                      <TableCell>{emp.name}</TableCell>
                      <TableCell align="right">{assetCounts[emp.id] || 0}</TableCell>
                    </TableRow>
                  ))}

                  {/* Итоговая строка с суммой оборудования */}
                  <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                    <TableCell><strong>Всего</strong></TableCell>
                    <TableCell align="right"><strong>{totalAssetsByDept[dept.id] || 0}</strong></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          );
        })}
      </Paper>
    </Container>
  );
};

export default EmployeeList;