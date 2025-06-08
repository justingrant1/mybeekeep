import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Badge,
  Box,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Menu as MenuIcon,
  Terrain as ApiaryIcon,
  Hive as HiveIcon,
  Assessment as AnalyticsIcon,
  Inventory as EquipmentIcon,
  WbSunny as WeatherIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationsContext';

interface MobileNavigationProps {
  onSignOut: () => Promise<void>;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ onSignOut }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPremium } = useAuth();
  const { unreadCount } = useNotifications();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Determine active path for bottom navigation
  const getActiveValue = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/apiaries')) return 'apiaries';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/weather')) return 'weather';
    if (path.includes('/equipment')) return 'equipment';
    return 'dashboard'; // Default
  };

  // Toggle drawer
  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

  // Handle navigation
  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  // Menu items for the drawer
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', premium: false },
    { text: 'Apiaries', icon: <ApiaryIcon />, path: '/apiaries', premium: false },
    { text: 'Hives', icon: <HiveIcon />, path: '/hives', premium: false },
    { 
      text: 'Equipment', 
      icon: <EquipmentIcon />, 
      path: '/equipment', 
      premium: true 
    },
    { 
      text: 'Analytics', 
      icon: <AnalyticsIcon />, 
      path: '/analytics', 
      premium: true 
    },
    { 
      text: 'Weather', 
      icon: <WeatherIcon />, 
      path: '/weather', 
      premium: true 
    },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings', premium: false },
    // Add more menu items as needed
  ];

  // Filter out premium features if user is not premium
  const filteredMenuItems = menuItems.filter(item => !item.premium || isPremium);

  return (
    <>
      {/* Bottom Navigation */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: { xs: 'block', sm: 'none' },
        }}
        elevation={3}
      >
        <BottomNavigation
          value={getActiveValue()}
          onChange={(_, newValue) => {
            if (newValue === 'menu') {
              setDrawerOpen(true);
            } else {
              navigate(`/${newValue}`);
            }
          }}
          showLabels
        >
          <BottomNavigationAction
            label="Dashboard"
            value="dashboard"
            icon={<DashboardIcon />}
          />
          <BottomNavigationAction
            label="Apiaries"
            value="apiaries"
            icon={<ApiaryIcon />}
          />
          {isPremium && (
            <BottomNavigationAction
              label="Analytics"
              value="analytics"
              icon={<AnalyticsIcon />}
            />
          )}
          <BottomNavigationAction
            label="Menu"
            value="menu"
            icon={<MenuIcon />}
          />
        </BottomNavigation>
      </Paper>

      {/* Drawer for full menu */}
      <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box
          sx={{ width: 280 }}
          role="presentation"
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              p: 2,
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              BeeKeeper Pro
            </Typography>
            {isPremium && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Premium Account
              </Typography>
            )}
          </Box>
          <Divider />
          <List>
            {filteredMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  selected={location.pathname === item.path}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                  {item.text === 'Dashboard' && unreadCount > 0 && (
                    <Badge badgeContent={unreadCount} color="error" />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            {!isPremium && (
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation('/premium')}>
                  <ListItemIcon>
                    <Badge badgeContent="⭐" color="primary">
                      <SettingsIcon />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText 
                    primary="Upgrade to Premium" 
                    primaryTypographyProps={{ 
                      color: 'primary',
                      fontWeight: 'medium',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )}
            <ListItem disablePadding>
              <ListItemButton onClick={onSignOut}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Sign Out" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Bottom spacing to prevent content from being hidden behind the bottom nav */}
      <Box sx={{ height: { xs: 56, sm: 0 } }} />
    </>
  );
};

export default MobileNavigation;
