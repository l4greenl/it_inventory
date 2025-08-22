// frontend/src/components/Sidebar.js

import React from 'react';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DevicesIcon from '@mui/icons-material/Devices';
import PeopleIcon from '@mui/icons-material/People';
import BookIcon from '@mui/icons-material/Book';
import HistoryIcon from '@mui/icons-material/History';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

const Sidebar = ({currentUser}) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ width: 250, backgroundColor: '#f4f4f4', height: '100vh', position: 'sticky', top: 0 }}>
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('/assets')}>
            <ListItemIcon><DevicesIcon /></ListItemIcon>
            <ListItemText primary="Оборудования" />
          </ListItemButton>
        </ListItem>


        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('/moves')}>
            <ListItemIcon><SwapHorizIcon /></ListItemIcon>
            <ListItemText primary="Перемещения" />
          </ListItemButton>
        </ListItem> 

        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('/changes')}>
            <ListItemIcon><HistoryIcon /></ListItemIcon>
            <ListItemText primary="Изменения" />
          </ListItemButton>
        </ListItem> 

        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('/employees')}>
            <ListItemIcon><PeopleIcon /></ListItemIcon>
            <ListItemText primary="Сотрудники" />
          </ListItemButton>
        </ListItem>
        
        {currentUser && currentUser.role === 'admin' && (
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate('/directory')}>
              <ListItemIcon><BookIcon /></ListItemIcon>
              <ListItemText primary="Справочник" />
            </ListItemButton>
          </ListItem> 
        )}       
      </List>
    </Box>
  );
};

export default Sidebar;