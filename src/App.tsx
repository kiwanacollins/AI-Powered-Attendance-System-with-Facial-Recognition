import { useState } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Dashboard from './components/dashboard/Dashboard';
import StudentManagement from './components/studentManagement/StudentManagement';
import AttendanceLogs from './components/attendanceLogs/AttendanceLogs';
import LiveFeed from './components/liveFeed/LiveFeed';
import SystemConfig from './components/systemConfig/SystemConfig';
import ErrorMonitoring from './components/errorMonitoring/ErrorMonitoring';
import Navigation from './components/Navigation';
import './App.css';

// Create a theme instance
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

function App() {
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Function to handle navigation changes
  const handleNavChange = (view: string) => {
    setActiveView(view);
  };

  // Toggle between dark and light mode
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Render the active view component
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'live-feed':
        return <LiveFeed />;
      case 'students':
        return <StudentManagement />;
      case 'attendance-logs':
        return <AttendanceLogs />;
      case 'system-config':
        return <SystemConfig />;
      case 'error-monitoring':
        return <ErrorMonitoring />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <Box sx={{ display: 'flex', height: '100vh' }}>
          <Navigation 
            activeView={activeView} 
            onNavChange={handleNavChange} 
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              p: 3, 
              overflowY: 'auto',
              bgcolor: 'background.default'
            }}
          >
            {renderView()}
          </Box>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
