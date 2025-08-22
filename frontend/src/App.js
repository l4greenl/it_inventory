// frontend/src/App.js

import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';

import Sidebar from './components/Sidebar';
import AssetList from './components/AssetList';
import AddAsset from './components/AddAsset';
import AssetDetails from './components/AssetDetails';
import EmployeeList from './components/EmployeeList';
import Directory from './components/Directory';
import ChangesList from './components/ChangesList';
import Login from './components/Login';
import Header from './components/Header';
import MovesList from './components/MovesList';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  // Функция для обработки успешного входа
  const handleLogin = (userData) => {
    setCurrentUser(userData);
  };

  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
        {/* Боковое меню (фиксируем слева) */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 250,
          height: '100vh',
          zIndex: 1200
        }}>
          <Sidebar currentUser={currentUser} />
        </div>

        {/* Основной контент с шапкой и содержимым */}
        <div style={{
          marginLeft: 250,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh'
        }}>
          {/* Шапка сайта */}
          <Header currentUser={currentUser} setCurrentUser={setCurrentUser} />

          {/* Основная область с прокруткой */}
          <main style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            backgroundColor: '#f9f9f9'
          }}>
            <Routes>
              <Route path="/assets" element={<AssetList currentUser={currentUser} />} />
              <Route path="/assets/:id" element={<AssetDetails currentUser={currentUser} />} />
              <Route path="/assets/new" element={<AddAsset currentUser={currentUser} />} />
              <Route path="/employees" element={<EmployeeList currentUser={currentUser} />} />
              <Route path="/directory" element={<Directory currentUser={currentUser} />} />
              <Route path="/changes" element={<ChangesList currentUser={currentUser} />} />
              <Route path="/moves" element={<MovesList currentUser={currentUser} />} />
              
              {/* Страница логина будет доступна по /login */}
              <Route path="/login" element={<Login onLogin={handleLogin} />} />

              {/* Редирект по умолчанию */}
              <Route path="/" element={<AssetList currentUser={currentUser} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;