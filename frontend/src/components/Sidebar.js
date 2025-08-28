// frontend/src/components/Sidebar.js

import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Drawer,
  IconButton,
  useTheme,
  Tooltip,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DevicesIcon from '@mui/icons-material/Devices';
import PeopleIcon from '@mui/icons-material/People';
import BookIcon from '@mui/icons-material/Book';
import HistoryIcon from '@mui/icons-material/History';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

// Определяем ширину Sidebar
const drawerWidth = 220;
// Определяем ширину свернутого Sidebar (только иконки)
const drawerWidthCollapsed = 40;

const Sidebar = ({ currentUser, isSidebarOpen, toggleSidebar, isSidebarCollapsed, toggleSidebarCollapse }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <>
      {/* Основной Sidebar */}
      <Drawer
        variant="permanent"
        open={isSidebarOpen}
        sx={{
          width: isSidebarCollapsed ? drawerWidthCollapsed : drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: isSidebarCollapsed ? drawerWidthCollapsed : drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#f4f4f4',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          },
        }}
      >
        <Box
          sx={{
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          {/* Контейнер для кнопки сворачивания/разворачивания */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-end',
              padding: isSidebarCollapsed ? 1 : '8px 16px',
              minHeight: 49,
            }}
          >
            {/* Кнопка сворачивания/разворачивания */}
            {/* Отображается всегда, когда Sidebar открыт, без проверки размера экрана */}
            {isSidebarOpen && (
              <Tooltip title={isSidebarCollapsed ? "Развернуть" : "Свернуть"} placement="right">
                <IconButton onClick={toggleSidebarCollapse}>
                  {theme.direction === 'rtl' ? 
                    (isSidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />) : 
                    (isSidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />)
                  }
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Divider />

          {/* Список навигационных элементов */}
          <List
            sx={{
              transition: theme.transitions.create(['opacity', 'width'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
            }}
          >
            {/* Оборудование */}
            <ListItem disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                onClick={() => navigate('/assets')}
                sx={{
                  minHeight: 48,
                  justifyContent: isSidebarCollapsed ? 'center' : 'initial',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isSidebarCollapsed ? 0 : 3,
                    justifyContent: 'center',
                  }}
                >
                  <DevicesIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Оборудование"
                  sx={{
                    opacity: isSidebarCollapsed ? 0 : 1,
                    width: isSidebarCollapsed ? 0 : 'auto',
                    overflow: 'hidden',
                  }}
                />
              </ListItemButton>
            </ListItem>

            {/* Перемещения */}
            <ListItem disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                onClick={() => navigate('/moves')}
                sx={{
                  minHeight: 48,
                  justifyContent: isSidebarCollapsed ? 'center' : 'initial',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isSidebarCollapsed ? 0 : 3,
                    justifyContent: 'center',
                  }}
                >
                  <SwapHorizIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Перемещения"
                  sx={{
                    opacity: isSidebarCollapsed ? 0 : 1,
                    width: isSidebarCollapsed ? 0 : 'auto',
                    overflow: 'hidden',
                  }}
                />
              </ListItemButton>
            </ListItem>

            {/* Изменения */}
            <ListItem disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                onClick={() => navigate('/changes')}
                sx={{
                  minHeight: 48,
                  justifyContent: isSidebarCollapsed ? 'center' : 'initial',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isSidebarCollapsed ? 0 : 3,
                    justifyContent: 'center',
                  }}
                >
                  <HistoryIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Изменения"
                  sx={{
                    opacity: isSidebarCollapsed ? 0 : 1,
                    width: isSidebarCollapsed ? 0 : 'auto',
                    overflow: 'hidden',
                  }}
                />
              </ListItemButton>
            </ListItem>

            {/* Сотрудники */}
            <ListItem disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                onClick={() => navigate('/employees')}
                sx={{
                  minHeight: 48,
                  justifyContent: isSidebarCollapsed ? 'center' : 'initial',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isSidebarCollapsed ? 0 : 3,
                    justifyContent: 'center',
                  }}
                >
                  <PeopleIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Сотрудники"
                  sx={{
                    opacity: isSidebarCollapsed ? 0 : 1,
                    width: isSidebarCollapsed ? 0 : 'auto',
                    overflow: 'hidden',
                  }}
                />
              </ListItemButton>
            </ListItem>

            {/* Справочник (только для админов) */}
            {currentUser && currentUser.role === 'admin' && (
              <ListItem disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  onClick={() => navigate('/directory')}
                  sx={{
                    minHeight: 48,
                    justifyContent: isSidebarCollapsed ? 'center' : 'initial',
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: isSidebarCollapsed ? 0 : 3,
                      justifyContent: 'center',
                  }}
                >
                  <BookIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Справочник"
                  sx={{
                    opacity: isSidebarCollapsed ? 0 : 1,
                    width: isSidebarCollapsed ? 0 : 'auto',
                    overflow: 'hidden',
                  }}
                />
              </ListItemButton>
            </ListItem>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Sidebar;