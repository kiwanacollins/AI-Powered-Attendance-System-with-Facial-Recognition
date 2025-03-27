import { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Typography,
  Toolbar,
  AppBar,
  Badge,
  Switch,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Videocam as VideocamIcon,
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  Settings as SettingsIcon,
  Error as ErrorIcon,
  MenuOpen as MenuOpenIcon,
  Menu as MenuIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';

// Define navigation items
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { id: 'live-feed', label: 'Live Feed', icon: <VideocamIcon /> },
  { id: 'students', label: 'Students', icon: <PeopleIcon /> },
  { id: 'attendance-logs', label: 'Attendance Logs', icon: <CalendarIcon /> },
  { id: 'system-config', label: 'System Config', icon: <SettingsIcon /> },
  { id: 'error-monitoring', label: 'Error Monitoring', icon: <ErrorIcon /> },
];

// Define drawer width
const drawerWidth = 240;

interface NavigationProps {
  activeView: string;
  onNavChange: (view: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const Navigation = ({
  activeView,
  onNavChange,
  isDarkMode,
  onToggleTheme,
}: NavigationProps) => {
  const { systemLogs } = useAppContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);

  // Count high severity errors
  const errorCount = systemLogs.filter(
    log => log.type === 'Error' && log.severity === 'High'
  ).length;

  // Toggle drawer
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Render drawer content
  const drawerContent = (
    <>
      <Toolbar sx={{ justifyContent: 'center', position: 'relative' }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          AI Attendance System
        </Typography>
        {isMobile && (
          <IconButton
            onClick={toggleDrawer}
            sx={{ position: 'absolute', right: 8 }}
            edge="end"
          >
            <MenuOpenIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={activeView === item.id}
              onClick={() => {
                onNavChange(item.id);
                if (isMobile) setDrawerOpen(false);
              }}
            >
              <ListItemIcon>
                {item.id === 'error-monitoring' && errorCount > 0 ? (
                  <Badge badgeContent={errorCount} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body2">Dark Mode</Typography>
        <Switch
          checked={isDarkMode}
          onChange={onToggleTheme}
          color="primary"
          inputProps={{ 'aria-label': 'toggle dark mode' }}
          icon={<Brightness7Icon />}
          checkedIcon={<Brightness4Icon />}
        />
      </Box>
    </>
  );

  return (
    <>
      {/* App bar for mobile */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleDrawer}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              {navItems.find(item => item.id === activeView)?.label || 'Dashboard'}
            </Typography>
            
            <Tooltip title="Notifications">
              <IconButton color="inherit">
                <Badge badgeContent={errorCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton color="inherit" onClick={onToggleTheme}>
                {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
      )}

      {/* Drawer - responsive behavior */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Offset for mobile app bar */}
      {isMobile && <Toolbar />}
    </>
  );
};

export default Navigation;