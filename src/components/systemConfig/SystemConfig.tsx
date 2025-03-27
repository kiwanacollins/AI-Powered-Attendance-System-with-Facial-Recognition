import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  Grid,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { DetectionSettings, SystemConfig as SystemConfigType } from '../../types';

// Default configuration
const defaultConfig: SystemConfigType = {
  cameraSettings: {
    deviceId: '',
  },
  detectionSettings: {
    sensitivity: 'Medium',
    recognitionThreshold: 0.6,
  },
  security: {
    loginRequired: true,
    sessionTimeout: 30,
  },
  logging: {
    interval: 5,
    localStorageFallback: true,
  },
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const SystemConfig = () => {
  const [tabValue, setTabValue] = useState(0);
  const [config, setConfig] = useState<SystemConfigType>(defaultConfig);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle camera settings changes
  const handleCameraChange = (event: any) => {
    setConfig({
      ...config,
      cameraSettings: {
        ...config.cameraSettings,
        deviceId: event.target.value,
      },
    });
  };

  // Get available cameras on component mount
  useState(() => {
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(cameras);
        
        // Set first camera as default if none selected
        if (cameras.length > 0 && !config.cameraSettings.deviceId) {
          setConfig({
            ...config,
            cameraSettings: {
              ...config.cameraSettings,
              deviceId: cameras[0].deviceId,
            },
          });
        }
      } catch (error) {
        console.error('Error getting cameras:', error);
      }
    };
    
    getCameras();
  }, []);

  // Handle detection settings changes
  const handleSensitivityChange = (event: any) => {
    setConfig({
      ...config,
      detectionSettings: {
        ...config.detectionSettings,
        sensitivity: event.target.value,
      },
    });
  };

  const handleThresholdChange = (_event: any, newValue: number | number[]) => {
    setConfig({
      ...config,
      detectionSettings: {
        ...config.detectionSettings,
        recognitionThreshold: newValue as number,
      },
    });
  };

  // Handle security settings changes
  const handleLoginToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({
      ...config,
      security: {
        ...config.security,
        loginRequired: event.target.checked,
      },
    });
  };

  const handleTimeoutChange = (event: any) => {
    setConfig({
      ...config,
      security: {
        ...config.security,
        sessionTimeout: parseInt(event.target.value),
      },
    });
  };

  // Handle logging settings changes
  const handleIntervalChange = (event: any) => {
    setConfig({
      ...config,
      logging: {
        ...config.logging,
        interval: event.target.value,
      },
    });
  };

  const handleFallbackToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({
      ...config,
      logging: {
        ...config.logging,
        localStorageFallback: event.target.checked,
      },
    });
  };

  // Show camera preview
  const handlePreviewCamera = () => {
    setPreviewOpen(true);
    // In a real app, this would open the camera in a modal
    setTimeout(() => setPreviewOpen(false), 1500);
  };

  // Save configuration
  const handleSaveConfig = () => {
    // In a real app, this would save to a backend or localStorage
    console.log('Saving configuration:', config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Configuration
      </Typography>
      
      {saveSuccess && (
        <Paper 
          elevation={0} 
          sx={{ 
            bgcolor: 'success.light', 
            color: 'success.contrastText', 
            p: 2, 
            mb: 3 
          }}
        >
          <Typography>Configuration saved successfully!</Typography>
        </Paper>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="configuration tabs">
          <Tab label="Camera Settings" id="config-tab-0" />
          <Tab label="Detection Settings" id="config-tab-1" />
          <Tab label="Security" id="config-tab-2" />
          <Tab label="Logging" id="config-tab-3" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Camera Device
                </Typography>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="camera-select-label">Select Camera</InputLabel>
                  <Select
                    labelId="camera-select-label"
                    value={config.cameraSettings.deviceId}
                    label="Select Camera"
                    onChange={handleCameraChange}
                  >
                    {availableCameras.map((camera) => (
                      <MenuItem key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || `Camera ${camera.deviceId.substring(0, 5)}...`}
                      </MenuItem>
                    ))}
                    {availableCameras.length === 0 && (
                      <MenuItem disabled value="">
                        No cameras found
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
                
                <Button
                  variant="outlined"
                  startIcon={<CameraAltIcon />}
                  onClick={handlePreviewCamera}
                  disabled={!config.cameraSettings.deviceId || availableCameras.length === 0}
                >
                  {previewOpen ? 'Testing...' : 'Test Camera'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Face Detection Sensitivity
                </Typography>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="sensitivity-select-label">Sensitivity Level</InputLabel>
                  <Select
                    labelId="sensitivity-select-label"
                    value={config.detectionSettings.sensitivity}
                    label="Sensitivity Level"
                    onChange={handleSensitivityChange}
                  >
                    <MenuItem value="Low">Low - Fewer detections, faster processing</MenuItem>
                    <MenuItem value="Medium">Medium - Balanced (Recommended)</MenuItem>
                    <MenuItem value="High">High - More accurate, slower processing</MenuItem>
                  </Select>
                </FormControl>
                
                <Typography gutterBottom>
                  Recognition Threshold: {config.detectionSettings.recognitionThreshold}
                </Typography>
                <Slider
                  value={config.detectionSettings.recognitionThreshold}
                  onChange={handleThresholdChange}
                  step={0.05}
                  marks
                  min={0.3}
                  max={0.9}
                  valueLabelDisplay="auto"
                />
                <Typography variant="caption" color="text.secondary">
                  Lower values increase detection rate but may lead to false positives.
                  Higher values are more strict but may miss some faces.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Login Settings
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.security.loginRequired}
                      onChange={handleLoginToggle}
                    />
                  }
                  label="Require login for system access"
                />
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>
                  Session Timeout
                </Typography>
                <FormControl fullWidth>
                  <InputLabel id="timeout-select-label">Timeout Period</InputLabel>
                  <Select
                    labelId="timeout-select-label"
                    value={config.security.sessionTimeout}
                    label="Timeout Period"
                    onChange={handleTimeoutChange}
                  >
                    <MenuItem value={5}>5 minutes</MenuItem>
                    <MenuItem value={15}>15 minutes</MenuItem>
                    <MenuItem value={30}>30 minutes</MenuItem>
                    <MenuItem value={60}>1 hour</MenuItem>
                    <MenuItem value={120}>2 hours</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Attendance Logging
                </Typography>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="interval-select-label">Logging Interval</InputLabel>
                  <Select
                    labelId="interval-select-label"
                    value={config.logging.interval}
                    label="Logging Interval"
                    onChange={handleIntervalChange}
                  >
                    <MenuItem value={5}>Every 5 minutes</MenuItem>
                    <MenuItem value={10}>Every 10 minutes</MenuItem>
                    <MenuItem value={30}>Every 30 minutes</MenuItem>
                    <MenuItem value="manual">Manual only</MenuItem>
                  </Select>
                </FormControl>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>
                  Offline Mode
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.logging.localStorageFallback}
                      onChange={handleFallbackToggle}
                    />
                  }
                  label="Enable offline mode (store records locally when offline)"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSaveConfig}
        >
          Save Configuration
        </Button>
      </Box>
    </Box>
  );
};

export default SystemConfig;