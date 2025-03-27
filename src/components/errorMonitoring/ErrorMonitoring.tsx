import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  Button,
  TextField,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip,
  useTheme,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  ErrorOutline as ErrorOutlineIcon,
  WarningAmber as WarningAmberIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useAppContext } from '../../context/AppContext';
import { SystemLog } from '../../types';

const ErrorMonitoring: React.FC = () => {
  const theme = useTheme();
  const { systemLogs, clearSystemLogs, addSystemLog } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Filter logs based on search term and filters
  const filteredLogs = useMemo(() => {
    return systemLogs.filter((log) => {
      // Search term filtering
      const matchesSearch =
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.errorCode && log.errorCode.toLowerCase().includes(searchTerm.toLowerCase()));

      // Type filtering
      const matchesType =
        filterType === 'all' || log.type.toLowerCase() === filterType.toLowerCase();

      // Severity filtering
      const matchesSeverity =
        filterSeverity === 'all' || log.severity.toLowerCase() === filterSeverity.toLowerCase();

      return matchesSearch && matchesType && matchesSeverity;
    });
  }, [systemLogs, searchTerm, filterType, filterSeverity]);

  // Count logs by type
  const logCounts = useMemo(() => {
    const counts = {
      error: systemLogs.filter((log) => log.type === 'Error').length,
      warning: systemLogs.filter((log) => log.type === 'Warning').length,
      info: systemLogs.filter((log) => log.type === 'Info').length,
    };
    return counts;
  }, [systemLogs]);

  // Toggle log details expansion
  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  // Handle log deletion confirmation
  const handleClearLogs = () => {
    setOpenDialog(true);
  };

  // Confirm log deletion
  const confirmClearLogs = () => {
    clearSystemLogs();
    setOpenDialog(false);
  };

  // Export logs as JSON
  const exportLogs = () => {
    try {
      const dataStr = JSON.stringify(systemLogs, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `system_logs_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      // Log this action
      addSystemLog({
        type: 'Info',
        message: 'System logs exported successfully',
        severity: 'Low',
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      
      // Log the error
      addSystemLog({
        type: 'Error',
        message: 'Failed to export system logs',
        severity: 'Medium',
        errorCode: 'EXP_001',
        suggestedResolution: 'Try again or contact IT support if the issue persists',
      });
    }
  };

  // Get icon for log type
  const getLogIcon = (type: string, severity: string) => {
    switch (type) {
      case 'Error':
        return <ErrorOutlineIcon color="error" />;
      case 'Warning':
        return <WarningAmberIcon color="warning" />;
      case 'Info':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon />;
    }
  };

  // Get color for severity
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High':
        return theme.palette.error.main;
      case 'Medium':
        return theme.palette.warning.main;
      case 'Low':
        return theme.palette.success.main;
      default:
        return theme.palette.info.main;
    }
  };

  return (
    <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Error Monitoring & System Logs
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                bgcolor: theme.palette.error.main,
                color: theme.palette.getContrastText(theme.palette.error.main),
                mb: 2 
              }}
              className="card-hover-effect"
            >
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Errors
                </Typography>
                <Typography variant="h3">{logCounts.error}</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                bgcolor: theme.palette.warning.main,
                color: theme.palette.getContrastText(theme.palette.warning.main),
                mb: 2 
              }}
              className="card-hover-effect"
            >
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Warnings
                </Typography>
                <Typography variant="h3">{logCounts.warning}</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                bgcolor: theme.palette.info.main,
                color: theme.palette.getContrastText(theme.palette.info.main),
                mb: 2 
              }}
              className="card-hover-effect"
            >
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Info Logs
                </Typography>
                <Typography variant="h3">{logCounts.info}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          sx={{ mb: 2 }}
          alignItems="center"
        >
          <TextField
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            variant="outlined"
            size="small"
            sx={{ flexGrow: 1 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="filter-type-label">Type</InputLabel>
            <Select
              labelId="filter-type-label"
              value={filterType}
              label="Type"
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="error">Errors</MenuItem>
              <MenuItem value="warning">Warnings</MenuItem>
              <MenuItem value="info">Info</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="filter-severity-label">Severity</InputLabel>
            <Select
              labelId="filter-severity-label"
              value={filterSeverity}
              label="Severity"
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              <MenuItem value="all">All Levels</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Export Logs">
            <IconButton onClick={exportLogs} color="primary">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Clear All Logs">
            <IconButton onClick={handleClearLogs} color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
        
        <Divider sx={{ mb: 2 }} />
        
        {filteredLogs.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            No logs found matching your filters.
          </Alert>
        ) : (
          <Stack spacing={2}>
            {filteredLogs.map((log) => (
              <Paper 
                key={log.id} 
                variant="outlined" 
                sx={{ 
                  p: 2,
                  borderLeft: `4px solid ${getSeverityColor(log.severity)}`,
                }}
              >
                <Stack 
                  direction="row" 
                  alignItems="center" 
                  justifyContent="space-between"
                  sx={{ mb: 1 }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {getLogIcon(log.type, log.severity)}
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {log.message}
                    </Typography>
                  </Stack>
                  
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Chip 
                      label={log.type} 
                      size="small" 
                      color={log.type === 'Error' 
                             ? 'error' 
                             : log.type === 'Warning' 
                               ? 'warning' 
                               : 'info'} 
                      variant="outlined" 
                    />
                    <Chip 
                      label={log.severity} 
                      size="small" 
                      sx={{ 
                        bgcolor: getSeverityColor(log.severity),
                        color: '#fff'
                      }}
                    />
                    <Tooltip title="Toggle Details">
                      <IconButton 
                        size="small" 
                        onClick={() => toggleExpand(log.id)}
                        sx={{ 
                          transform: expandedLogId === log.id ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.3s'
                        }}
                      >
                        <ExpandMoreIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
                
                <Typography variant="caption" color="text.secondary">
                  {format(parseISO(log.timestamp), 'PPpp')}
                </Typography>
                
                {expandedLogId === log.id && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    {log.errorCode && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Error Code:</strong> {log.errorCode}
                      </Typography>
                    )}
                    
                    {log.suggestedResolution && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          Suggested Resolution:
                        </Typography>
                        <Typography variant="body2">
                          {log.suggestedResolution}
                        </Typography>
                      </Box>
                    )}
                    
                    <Stack 
                      direction="row" 
                      alignItems="center" 
                      spacing={1} 
                      sx={{ mt: 2 }}
                    >
                      <Chip 
                        label="Copy Details" 
                        size="small" 
                        variant="outlined"
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(log, null, 2))}
                      />
                    </Stack>
                  </Box>
                )}
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>
      
      {/* Clear Logs Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Clear All System Logs?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action will permanently delete all system logs and cannot be undone. 
            Are you sure you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmClearLogs} color="error" variant="contained">
            Clear All Logs
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ErrorMonitoring;