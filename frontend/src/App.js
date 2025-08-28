// frontend/src/App.js

import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material'; // Убран useMediaQuery

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

const theme = createTheme();

function AppContent({ currentUser, setCurrentUser, handleLogin }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Добавлено состояние для сворачивания Sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // УБРАЛИ isSmallScreen = useMediaQuery(...)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Функция для переключения свернутого состояния Sidebar
  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div style={{ display: 'flex', minHeight: '50vh' }}>
      <Sidebar
        currentUser={currentUser}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        // Передаем новые пропсы для сворачивания
        isSidebarCollapsed={isSidebarCollapsed}
        toggleSidebarCollapse={toggleSidebarCollapse}
      />

      <div
        style={{
          // УБРАЛИ зависимость от isSmallScreen
          marginLeft: isSidebarOpen ? (isSidebarCollapsed ? -10 : -10) : -10, // Используем прямые значения ширины
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '50vh',
        }}
      >
        <Header 
          currentUser={currentUser} 
          setCurrentUser={setCurrentUser} 
          toggleSidebar={toggleSidebar} 
          isSidebarOpen={isSidebarOpen} 
        />

        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            backgroundColor: '#f9f9f9',
          }}
        >
          <Routes>
            <Route path="/assets" element={<AssetList currentUser={currentUser} />} />
            <Route path="/assets/:id" element={<AssetDetails currentUser={currentUser} />} />
            <Route path="/assets/new" element={<AddAsset currentUser={currentUser} />} />
            <Route path="/employees" element={<EmployeeList currentUser={currentUser} />} />
            <Route path="/directory" element={<Directory currentUser={currentUser} />} />
            <Route path="/changes" element={<ChangesList currentUser={currentUser} />} />
            <Route path="/moves" element={<MovesList currentUser={currentUser} />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/" element={<AssetList currentUser={currentUser} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
  };

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AppContent
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          handleLogin={handleLogin}
        />
      </Router>
    </ThemeProvider>
  );
}

export default App;