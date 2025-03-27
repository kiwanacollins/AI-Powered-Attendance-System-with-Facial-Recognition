import { useEffect, useRef, useState } from 'react';
import { Box, Button, Card, FormControl, Paper, Typography, Alert, CircularProgress, Select, InputLabel, MenuItem, Grid } from '@mui/material';
import * as faceapi from 'face-api.js';
import { Course, Student } from '../../types';
import { mockCourses, mockStudents } from '../../utils/mockData';
import { useAppContext } from '../../context/AppContext';
import { 
  initializeFaceApi, 
  areModelsLoaded, 
  mockFaceRecognition, 
  createFaceMatcher,
  logModelLoadingError,
  setSystemLogHandler // Import the new function
} from '../../services/faceRecognitionService';

const LiveFeed = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [detectedStudents, setDetectedStudents] = useState<Student[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [courses] = useState<Course[]>(mockCourses);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [students] = useState<Student[]>(mockStudents);
  const [usingMockDetection, setUsingMockDetection] = useState(false);
  const { addSystemLog } = useAppContext();

  // Load face-api models using the improved service
  useEffect(() => {
    // Register the system log handler to be used by the faceRecognitionService
    setSystemLogHandler(addSystemLog);
    
    const loadModels = async () => {
      try {
        setLoading(true);
        setModelLoadError(null);
        setUsingMockDetection(false);
        
        // Use the centralized service to load models
        const modelUrl = `${window.location.origin}/models`;
        console.log('Loading models from:', modelUrl);
        
        // Log start of model loading
        addSystemLog({
          type: 'Info',
          message: 'Starting face recognition model initialization',
          severity: 'Low'
        });
        
        const success = await initializeFaceApi(modelUrl);
        
        if (success) {
          if (areModelsLoaded()) {
            console.log('Face detection models loaded successfully');
            setModelsLoaded(true);
            
            // Log successful loading
            addSystemLog({
              type: 'Info',
              message: 'Face recognition models loaded successfully',
              severity: 'Low'
            });
          } else {
            console.warn('Model loading reported success but models are not loaded, using mock detection');
            setUsingMockDetection(true);
            setModelsLoaded(true); // Allow the user to continue with mock detection
            setModelLoadError('Models not fully initialized, using simulated face detection');
            
            // Log fallback to mock detection
            addSystemLog({
              type: 'Warning',
              message: 'Face recognition models not fully initialized, using simulated detection',
              severity: 'Medium',
              errorCode: 'FACE_API_002',
              suggestedResolution: 'Check browser console for detailed errors'
            });
          }
        } else {
          throw new Error('Model loading failed');
        }
      } catch (error) {
        console.error('Error loading face detection models:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error loading models';
        
        setModelLoadError(errorMessage);
        logModelLoadingError(error);
        
        // Enable mock detection as fallback
        setUsingMockDetection(true);
        setModelsLoaded(true); // Allow the user to continue with mock detection
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, [addSystemLog]);

  // Initialize camera stream
  useEffect(() => {
    if (modelsLoaded) {
      startVideo();
    }
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [modelsLoaded]);

  const startVideo = async () => {
    try {
      if (videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        
        // Log camera initialization
        addSystemLog({
          type: 'Info',
          message: 'Camera access granted and initialized',
          severity: 'Low'
        });
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      setModelLoadError('Camera access failed. Please check permissions and try again.');
      
      // Log camera error
      addSystemLog({
        type: 'Error',
        message: 'Camera access failed',
        severity: 'High',
        errorCode: 'CAM_ACCESS_001',
        suggestedResolution: 'Check browser camera permissions and ensure a camera is connected'
      });
    }
  };

  // Face detection logic
  useEffect(() => {
    if (!isTracking || !videoRef.current || !canvasRef.current || !modelsLoaded) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Make sure canvas dimensions are set correctly
    if (video.videoWidth > 0 && canvas.width === 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    
    const intervalId = setInterval(async () => {
      if (video.readyState === 4) {
        if (usingMockDetection) {
          // Use mock detection instead of real face-api.js
          const mockDetected = mockFaceRecognition(students);
          
          // Clear canvas and draw fake detection boxes
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw fake detection boxes with names
            mockDetected.forEach((student, index) => {
              ctx.strokeStyle = 'green';
              ctx.lineWidth = 2;
              
              // Create random positions for demo boxes
              const x = 50 + (index * 100);
              const y = 50;
              const width = 120;
              const height = 120;
              
              ctx.strokeRect(x, y, width, height);
              
              // Add name label
              ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
              ctx.fillRect(x, y + height, width, 24);
              
              ctx.fillStyle = 'white';
              ctx.font = '12px Arial';
              ctx.fillText(student.name, x + 5, y + height + 16);
            });
          }
          
          // Add detected students if not already in list
          mockDetected.forEach(student => {
            if (!detectedStudents.some(s => s.id === student.id)) {
              setDetectedStudents(prev => [...prev, student]);
            }
          });
          
          return; // Skip the real detection code
        }
        
        // Real face detection with face-api if models are loaded
        try {
          // Adjust canvas dimensions to match video
          const displaySize = { width: video.videoWidth, height: video.videoHeight };
          faceapi.matchDimensions(canvas, displaySize);

          // Detect faces
          const detections = await faceapi.detectAllFaces(video)
            .withFaceLandmarks()
            .withFaceDescriptors();

          // Resize detections to match display size
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          
          // Clear previous drawings
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);

          // Create face matcher from student data
          // In a real app, you'd use actual face descriptors from your database
          // For demo purposes, we're using mock data with dummy descriptors
          const mockLabeledDescriptors = students
            .filter(student => student.consentGiven) // Only include students who gave consent
            .map(student => {
              // Create a mock descriptor - in a real app, you would use stored descriptors
              const descriptor = new Float32Array(128);
              for (let i = 0; i < 128; i++) {
                descriptor[i] = Math.random() * 0.5; // Generate random values
              }
              
              return new faceapi.LabeledFaceDescriptors(
                student.name,
                [descriptor]
              );
            });
          
          if (mockLabeledDescriptors.length > 0) {
            const faceMatcher = new faceapi.FaceMatcher(mockLabeledDescriptors, 0.6);
            
            // Find best matches for each detected face
            const results = resizedDetections.map(detection => {
              return faceMatcher.findBestMatch(detection.descriptor);
            });
            
            // Draw boxes and labels
            results.forEach((result, i) => {
              const box = resizedDetections[i].detection.box;
              const drawBox = new faceapi.draw.DrawBox(box, { 
                label: result.toString(),
                boxColor: result.distance < 0.6 ? 'green' : 'red'
              });
              drawBox.draw(canvas);
              
              // Add to detected students if not already in list
              // In a real app, you would match with actual student records
              if (result.distance < 0.6 && result.label !== 'unknown') {
                const student = students.find(s => s.name === result.label);
                if (student && !detectedStudents.some(s => s.id === student.id)) {
                  setDetectedStudents(prev => [...prev, student]);
                }
              }
            });
          }
        } catch (error) {
          console.error('Error during face detection:', error);
          
          // If real detection fails, fallback to mock detection
          if (!usingMockDetection) {
            console.warn('Falling back to mock detection due to error');
            
            // Log detection error
            addSystemLog({
              type: 'Error',
              message: `Face detection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              severity: 'Medium',
              errorCode: 'FACE_DETECT_001',
              suggestedResolution: 'System will use simulated detection instead'
            });
            
            setUsingMockDetection(true);
          }
        }
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [isTracking, modelsLoaded, students, detectedStudents, usingMockDetection, addSystemLog]);

  const toggleTracking = () => {
    setIsTracking(!isTracking);
    if (!isTracking) {
      setDetectedStudents([]);
      
      // Log tracking status
      addSystemLog({
        type: 'Info',
        message: 'Face detection tracking started',
        severity: 'Low'
      });
    } else {
      // Log tracking status
      addSystemLog({
        type: 'Info',
        message: 'Face detection tracking stopped',
        severity: 'Low'
      });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleCourseChange = (event: any) => {
    setSelectedCourse(event.target.value);
  };

  const handlePostAttendance = () => {
    if (!selectedCourse) {
      alert('Please select a course before posting attendance.');
      return;
    }

    // In a real app, this would send data to your backend
    console.log('Posting attendance for course:', selectedCourse);
    console.log('Students present:', detectedStudents.map(s => s.name));
    
    // Log attendance posting
    addSystemLog({
      type: 'Info',
      message: `Posted attendance for ${detectedStudents.length} students in course ${
        courses.find(c => c.id === selectedCourse)?.code || selectedCourse
      }`,
      severity: 'Low'
    });
    
    // Reset after posting
    setDetectedStudents([]);
    setIsTracking(false);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={isFullscreen ? 12 : 8}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h5" gutterBottom>
            Live Camera Feed {usingMockDetection ? '(Simulated Detection)' : ''}
          </Typography>
          
          {modelLoadError && (
            <Alert severity={usingMockDetection ? "warning" : "error"} sx={{ mb: 2 }}>
              {usingMockDetection 
                ? "Using simulated face detection due to model loading issue. The system will randomly detect students for demonstration purposes."
                : `Error loading face detection models: ${modelLoadError}`}
            </Alert>
          )}
          
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 4 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>
                Loading face detection models...
              </Typography>
            </Box>
          )}
          
          <Box sx={{ position: 'relative', width: '100%', bgcolor: 'black' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                borderRadius: '8px',
                display: (loading) ? 'none' : 'block'
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
            />
          </Box>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="contained"
              color={isTracking ? "error" : "primary"}
              onClick={toggleTracking}
              disabled={!modelsLoaded || loading}
            >
              {isTracking ? "Stop Tracking" : "Start Tracking"}
            </Button>
            <Button
              variant="outlined"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? "Minimize Feed" : "Maximize Feed"}
            </Button>
          </Box>
        </Paper>
      </Grid>
      
      {!isFullscreen && (
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h5" gutterBottom>
              Detected Students
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="course-select-label">Select Course</InputLabel>
              <Select
                labelId="course-select-label"
                value={selectedCourse}
                label="Select Course"
                onChange={handleCourseChange}
              >
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box sx={{ mb: 2, maxHeight: '300px', overflow: 'auto' }}>
              {detectedStudents.length === 0 ? (
                <Typography variant="body1" color="text.secondary">
                  No students detected yet. Start tracking to detect students.
                </Typography>
              ) : (
                detectedStudents.map((student) => (
                  <Card key={student.id} sx={{ mb: 1, p: 1 }}>
                    <Typography variant="subtitle1">{student.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {student.studentId}
                    </Typography>
                  </Card>
                ))
              )}
            </Box>
            
            <Button
              variant="contained"
              color="success"
              fullWidth
              onClick={handlePostAttendance}
              disabled={!isTracking || detectedStudents.length === 0 || !selectedCourse}
            >
              Post Attendance
            </Button>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
};

export default LiveFeed;