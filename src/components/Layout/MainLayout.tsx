import React from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Terrain as ApiaryIcon,
  Hive as HiveIcon,
  BugReport as InspectionIcon,
  Agriculture as HarvestIcon,
  Healing as TreatmentIcon,
  Inventory as EquipmentIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationsMenu from '../Notifications/NotificationsMenu';
import MobileNavigation from './MobileNavigation';

const drawerWidth = 240;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // Keep track of any screen size changes here
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { signOut, isPremium } = useAuth();
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Apiaries', icon: <ApiaryIcon />, path: '/apiaries' },
    { text: 'Hives', icon: <HiveIcon />, path: '/hives' },
    { text: 'Inspections', icon: <InspectionIcon />, path: '/inspections' },
    { text: 'Harvests', icon: <HarvestIcon />, path: '/harvests' },
    { text: 'Treatments', icon: <TreatmentIcon />, path: '/treatments' },
    {
      text: 'Equipment',
      icon: <EquipmentIcon />,
      path: '/equipment',
      premium: true,
    },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          BeeKeeper Pro
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => {
          // Skip premium features if user is not premium
          if (item.premium && !isPremium) return null;

          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
              >
                <ListItemIcon
                  sx={{
                    color:
                      location.pathname === item.path
                        ? theme.palette.primary.main
                        : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleSignOut}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Sign Out" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find((item) => item.path === location.pathname)?.text ||
              'BeeKeeper Pro'}
          </Typography>
          {isPremium ? (
            <Button
              color="secondary"
              variant="contained"
              size="small"
              sx={{ borderRadius: '16px', px: 2 }}
            >
              Premium
            </Button>
          ) : (
            <Button
              color="secondary"
              variant="outlined"
              size="small"
              component={Link}
              to="/premium"
              sx={{ borderRadius: '16px', px: 2 }}
            >
              Upgrade
            </Button>
          )}
          <NotificationsMenu />
        </Toolbar>
      </AppBar>
      {/* Desktop Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Mobile Navigation */}
      <MobileNavigation onSignOut={handleSignOut} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          mb: { xs: 7, sm: 0 }, // Bottom margin for mobile navigation
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;
