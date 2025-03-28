import { useEffect, useRef, useState } from 'react';
import { Box, Button, Card, FormControl, Paper, Typography, Alert, CircularProgress, Select, InputLabel, MenuItem, Grid, Snackbar } from '@mui/material';
import * as faceapi from 'face-api.js';
import { Course, Student, ModelLoadStatus } from '../../types';
import { mockCourses } from '../../utils/mockData';
import { useAppContext } from '../../context/AppContext';
import { 
  initializeFaceApi, 
  areModelsLoaded, 
  createFaceMatcher,
  logModelLoadingError,
  setSystemLogHandler,
  debugFaceRecognition
} from '../../services/faceRecognitionService';

const LiveFeed = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [detectedStudents, setDetectedStudents] = useState<Student[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [courses] = useState<Course[]>(mockCourses);
  const [modelStatus, setModelStatus] = useState<ModelLoadStatus>(ModelLoadStatus.NOT_INITIALIZED);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [cameraRetryAvailable, setCameraRetryAvailable] = useState(false);
  const { addSystemLog, students } = useAppContext();
  const [processingFrame, setProcessingFrame] = useState(false);
  const [retryModelLoading, setRetryModelLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [debugMode, setDebugMode] = useState(false);
  const [debugResults, setDebugResults] = useState<any>(null);

  // Load face-api models with the improved implementation
  useEffect(() => {
    // Register the system log handler to be used by the faceRecognitionService
    setSystemLogHandler(addSystemLog);
    
    const loadModels = async () => {
      try {
        setLoading(true);
        setModelLoadError(null);
        setModelStatus(ModelLoadStatus.LOADING);
        
        // Use the centralized service to load models with absolute URL to ensure correct path
        const modelUrl = window.location.origin + '/models';
        console.log('Loading models from:', modelUrl);
        
        // Log start of model loading
        addSystemLog({
          type: 'Info',
          message: 'Starting face recognition model initialization',
          severity: 'Low'
        });
        
        // Try to load the models with explicit error handling
        const success = await initializeFaceApi(modelUrl);
        
        if (success) {
          if (areModelsLoaded()) {
            console.log('Face detection models loaded successfully');
            setModelStatus(ModelLoadStatus.LOADED);
            
            // Log successful loading
            addSystemLog({
              type: 'Info',
              message: 'Face recognition models loaded successfully',
              severity: 'Low'
            });
            
            setSnackbarMessage('Face detection models loaded successfully');
            setSnackbarOpen(true);
          } else {
            console.error('Model loading reported success but models are not loaded');
            setModelLoadError('Models not fully initialized. Please check browser console for details.');
            setModelStatus(ModelLoadStatus.ERROR);
            
            // Log error
            addSystemLog({
              type: 'Error',
              message: 'Face recognition models initialization failed',
              severity: 'High',
              errorCode: 'FACE_API_002',
              suggestedResolution: 'Check browser console for detailed errors and try reloading the page'
            });
            
            setRetryModelLoading(true);
          }
        } else {
          throw new Error('Model loading failed');
        }
      } catch (error) {
        console.error('Error loading face detection models:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error loading models';
        
        setModelLoadError(errorMessage);
        setModelStatus(ModelLoadStatus.ERROR);
        logModelLoadingError(error);
        setRetryModelLoading(true);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  // Initialize camera stream
  useEffect(() => {
    if (modelStatus === ModelLoadStatus.LOADED) {
      startVideo();
    }
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [modelStatus]);

  const startVideo = async () => {
    try {
      if (videoRef.current) {
        // Clear any existing streams
        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
        
        console.log("Attempting to access camera...");
        addSystemLog({
          type: 'Info',
          message: 'Attempting to access webcam...',
          severity: 'Low'
        });
        
        // Get list of devices first to identify available cameras
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        console.log(`Found ${videoDevices.length} video devices:`, videoDevices);
        
        if (videoDevices.length === 0) {
          throw new Error("No camera devices found on this system");
        }
        
        // Look specifically for the external Wed Camera
        // The camera ID we're looking for based on user input
        const targetCameraId = "3b18c6b7292718fe04ec61c1b1b5c070d63af2f65c34f9a904f7be9b01bb273c";
        const targetGroupId = "f743bb0528a0902849841df87b2c56cdcfadd3a63eb4e8490cf9ad99ca3121e1";
        
        // First try to find the camera by its exact deviceId
        let wedCamera = videoDevices.find(device => 
          device.deviceId === targetCameraId
        );
        
        // If not found by deviceId, try finding by groupId
        if (!wedCamera) {
          wedCamera = videoDevices.find(device => 
            device.groupId === targetGroupId
          );
        }
        
        // If still not found, try finding by label
        if (!wedCamera) {
          wedCamera = videoDevices.find(device => 
            device.label && device.label.includes('Wed Camera')
          );
        }
        
        console.log("Found Wed Camera:", wedCamera);
        
        // If Wed Camera is found, use it directly
        if (wedCamera) {
          const specificConstraints = {
            audio: false,
            video: {
              deviceId: { exact: wedCamera.deviceId },
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 30 }
            }
          };
          
          console.log("Attempting to connect to Wed Camera specifically...");
          
          const stream = await navigator.mediaDevices.getUserMedia(specificConstraints);
          console.log("Successfully connected to Wed Camera");
          
          // Get video tracks to confirm
          const videoTracks = stream.getVideoTracks();
          if (videoTracks.length > 0) {
            console.log("Using camera:", videoTracks[0].label);
            
            // Log camera info
            addSystemLog({
              type: 'Info',
              message: `Using external webcam: ${videoTracks[0].label}`,
              severity: 'Low'
            });
          }
          
          // Set video source
          videoRef.current.srcObject = stream;
          
          // Force play the video
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              console.log("Video metadata loaded, attempting to play");
              videoRef.current.play()
                .then(() => {
                  console.log("Video playback started successfully");
                  setVideoReady(true);
                  setCameraActive(true);
                })
                .catch(err => {
                  console.error("Error playing video:", err);
                });
            }
          };
          
          // Add event handlers
          videoRef.current.onplaying = () => {
            console.log("Video is now playing");
            setCameraActive(true);
          };
          
          return; // Exit early since we found the Wed Camera
        }
        
        // If Wed Camera isn't found or fails, try generic approach
        console.log("Wed Camera not found or failed, trying generic approach");
        
        const constraints = {
          audio: false,
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length > 0) {
          console.log("Using camera:", videoTracks[0].label);
        }
        
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                setVideoReady(true);
                setCameraActive(true);
              })
              .catch(err => {
                console.error("Error playing video:", err);
              });
          }
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      // Set error state
      setCameraActive(false);
      setVideoReady(false);
      setModelLoadError(`Camera access failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Log camera error
      addSystemLog({
        type: 'Error',
        message: `Camera access failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'High',
        errorCode: 'CAM_ACCESS_001',
        suggestedResolution: 'Check browser permissions, ensure a camera is connected, and try refreshing the page'
      });
      
      // Add a retry button
      setCameraRetryAvailable(true);
    }
  };

  // Face detection logic
  useEffect(() => {
    if (!isTracking || !videoRef.current || !canvasRef.current || modelStatus !== ModelLoadStatus.LOADED || !videoReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Make sure canvas dimensions are set correctly immediately
    if (video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    
    let requestId: number | null = null;
    
    const runFaceDetection = async () => {
      if (processingFrame) return;
      
      if (video.readyState === 4) {
        try {
          setProcessingFrame(true);
          
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

          // Filter students with consent and face descriptors
          const studentsWithFaces = students
            .filter(student => student.consentGiven && student.faceDescriptor);
            
          if (studentsWithFaces.length > 0) {
            console.log('Students with face data:', studentsWithFaces.map(s => ({
              name: s.name,
              hasDescriptor: Boolean(s.faceDescriptor),
              descriptorLength: s.faceDescriptor?.length
            })));
            
            // Create labeled descriptors from student data
            const labeledDescriptors = studentsWithFaces
              .map(student => {
                // Convert the stored number array back to Float32Array
                const descriptor = new Float32Array(student.faceDescriptor as number[]);
                console.log(`Creating descriptor for ${student.name}:`, {
                  descriptorType: descriptor.constructor.name,
                  descriptorLength: descriptor.length,
                  sampleValues: Array.from(descriptor).slice(0, 5)
                });
                
                return new faceapi.LabeledFaceDescriptors(
                  student.name,
                  [descriptor]
                );
              });
            
            // Create a face matcher with appropriate threshold
            // Higher values = less strict matching (more permissive)
            const MATCH_THRESHOLD = 0.7; // Increase threshold to be more permissive for testing
            console.log('Using match threshold:', MATCH_THRESHOLD);
            const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, MATCH_THRESHOLD);
            
            console.log('Detections:', detections.length, 'Face descriptors:', detections.length > 0 ? 'present' : 'none');
            
            // Find best matches for each detected face
            const results = resizedDetections.map(detection => {
              const match = faceMatcher.findBestMatch(detection.descriptor);
              console.log('Face match result:', {
                label: match.label,
                distance: match.distance,
                threshold: MATCH_THRESHOLD,
                isMatch: match.distance < MATCH_THRESHOLD
              });
              return match;
            });
            
            // Draw boxes and labels - use the same threshold everywhere
            results.forEach((result, i) => {
              const box = resizedDetections[i].detection.box;
              const isMatch = result.distance < MATCH_THRESHOLD;
              const drawBox = new faceapi.draw.DrawBox(box, { 
                label: result.toString(),
                boxColor: isMatch ? 'green' : 'red'
              });
              drawBox.draw(canvas);
              
              // Add to detected students if not already in list - use same threshold as matcher
              if (isMatch && result.label !== 'unknown') {
                const student = students.find(s => s.name === result.label);
                if (student && !detectedStudents.some(s => s.id === student.id)) {
                  setDetectedStudents(prev => [...prev, student]);
                  
                  // Log when student is detected for the first time
                  addSystemLog({
                    type: 'Info',
                    message: `Detected student: ${student.name} (confidence: ${(1 - result.distance).toFixed(2)})`,
                    severity: 'Low'
                  });
                  
                  // Show confirmation in snackbar
                  setSnackbarMessage(`Student detected: ${student.name}`);
                  setSnackbarOpen(true);
                }
              }
            });
          } else {
            // If no labeled descriptors, just draw the face detections
            faceapi.draw.drawDetections(canvas, resizedDetections);
            
            // Log warning about missing data
            console.warn('No student face data available for recognition');
          }
        } catch (error) {
          console.error('Error during face detection:', error);
          
          // Log detection error
          addSystemLog({
            type: 'Error',
            message: `Face detection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'Medium',
            errorCode: 'FACE_DETECT_001',
            suggestedResolution: 'Check if the models are properly loaded and the camera is working'
          });
          
          // If we get an error, stop tracking to avoid continuous errors
          if (isTracking) {
            setIsTracking(false);
          }
        } finally {
          setProcessingFrame(false);
        }
      }
      
      // Continue the detection loop if still tracking
      if (isTracking) {
        requestId = requestAnimationFrame(runFaceDetection);
      }
    };
    
    // Start the face detection loop
    requestId = requestAnimationFrame(runFaceDetection);

    return () => {
      // Clean up
      if (requestId) {
        cancelAnimationFrame(requestId);
      }
    };
  }, [isTracking, modelStatus, students, videoReady, processingFrame]);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

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
    
    // Show confirmation
    setSnackbarMessage(`Attendance posted for ${detectedStudents.length} students`);
    setSnackbarOpen(true);
  };
  
  const handleRetryModelLoading = async () => {
    setRetryModelLoading(false);
    setLoading(true);
    setModelLoadError(null);
    
    try {
      const modelUrl = `${window.location.origin}/models`;
      const success = await initializeFaceApi(modelUrl);
      
      if (success && areModelsLoaded()) {
        setModelStatus(ModelLoadStatus.LOADED);
        setSnackbarMessage('Face detection models loaded successfully');
        setSnackbarOpen(true);
      } else {
        setModelLoadError('Failed to load models after retry. Please check console for details.');
        setModelStatus(ModelLoadStatus.ERROR);
      }
    } catch (error) {
      console.error('Error retrying model load:', error);
      setModelLoadError(`Failed to load models: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setModelStatus(ModelLoadStatus.ERROR);
    } finally {
      setLoading(false);
    }
  };

  // Debug face recognition with current frame
  const runDebugFaceRecognition = async () => {
    if (!videoRef.current || !areModelsLoaded()) {
      setSnackbarMessage('Video or models not ready for debug');
      setSnackbarOpen(true);
      return;
    }

    try {
      setLoading(true);
      
      // Log debug start
      addSystemLog({
        type: 'Info',
        message: 'Running face recognition debug...',
        severity: 'Low'
      });
      
      // Test recognition with the current video frame
      const results = await debugFaceRecognition(videoRef.current, students);
      
      console.log('Debug recognition results:', results);
      setDebugResults(results);
      
      // Show result in UI
      if (results.success) {
        setSnackbarMessage('Debug completed - see console for details');
      } else {
        setSnackbarMessage(`Debug error: ${results.error}`);
      }
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error in debug mode:', error);
      setSnackbarMessage(`Debug error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={isFullscreen ? 12 : 8}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h5" gutterBottom>
            Live Camera Feed
          </Typography>
          
          {modelLoadError && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              action={
                retryModelLoading && (
                  <Button 
                    color="inherit" 
                    size="small"
                    onClick={handleRetryModelLoading}
                  >
                    Retry
                  </Button>
                )
              }
            >
              {`Error loading face detection models: ${modelLoadError}`}
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
          
          <Box sx={{ position: 'relative', width: '100%', bgcolor: 'black', minHeight: '480px', overflow: 'hidden' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%', 
                objectFit: 'contain',
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
            {!cameraActive && !loading && (
              <Box sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                borderRadius: '8px',
                padding: 3
              }}>
                <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
                  Camera is not active. Please check permissions and try again.
                </Typography>
                
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => {
                    setCameraRetryAvailable(false);
                    setModelLoadError(null);
                    startVideo();
                  }}
                >
                  Retry Camera Access
                </Button>
              </Box>
            )}
          </Box>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Button
              variant="contained"
              color={isTracking ? "error" : "primary"}
              onClick={toggleTracking}
              disabled={modelStatus !== ModelLoadStatus.LOADED || loading || !cameraActive}
            >
              {isTracking ? "Stop Tracking" : "Start Tracking"}
            </Button>
            
            <Button
              variant="outlined"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? "Minimize Feed" : "Maximize Feed"}
            </Button>
            
            <Button
              variant="outlined"
              color="info"
              onClick={runDebugFaceRecognition}
              disabled={!cameraActive || loading}
            >
              Debug Recognition
            </Button>
          </Box>
          
          {debugResults && debugResults.success && (
            <Box sx={{ mt: 2, p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
              <Typography variant="subtitle1">Debug Results:</Typography>
              {debugResults.studentsChecked.length > 0 ? (
                <>
                  <Typography variant="body2">
                    Tested against {debugResults.studentsChecked.length} students
                  </Typography>
                  {debugResults.results.map((result: any, index: number) => (
                    <Box key={index} sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        Threshold {result.threshold}: {result.bestMatch} 
                        (Distance: {result.distance.toFixed(2)}, 
                        {result.isMatch ? ' MATCH' : ' NO MATCH'})
                      </Typography>
                    </Box>
                  ))}
                </>
              ) : (
                <Typography variant="body2" color="error">
                  No students with valid face descriptors found
                </Typography>
              )}
            </Box>
          )}
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
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </Grid>
  );
};

export default LiveFeed;