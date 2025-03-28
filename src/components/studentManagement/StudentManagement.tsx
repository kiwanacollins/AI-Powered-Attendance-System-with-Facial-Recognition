import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
  Grid,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Student, Course } from '../../types';
import { mockCourses } from '../../utils/mockData';
import { useAppContext } from '../../context/AppContext';
import { v4 as uuidv4 } from 'uuid';
import { SelectChangeEvent } from '@mui/material/Select';
import { 
  extractFaceDescriptorFromFile, 
  initializeFaceApi, 
  areModelsLoaded,
  setSystemLogHandler
} from '../../services/faceRecognitionService';

type Order = 'asc' | 'desc';

interface FormState extends Omit<Student, 'id'> {
  id?: string;
}

const StudentManagement = () => {
  const { addStudent, updateStudent, deleteStudent, students, addSystemLog } = useAppContext();
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(students);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof Student>('name');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [processingImage, setProcessingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [modelStatus, setModelStatus] = useState<'loading' | 'loaded' | 'error' | 'uninitialized'>('uninitialized');
  const [modelLoadProgress, setModelLoadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial form state
  const blankStudent: FormState = {
    name: '',
    studentId: '',
    email: '',
    enrolledCourses: [],
    consentGiven: false,
    contactInfo: {
      phone: '',
      address: '',
      emergencyContact: ''
    },
    createdAt: new Date().toISOString(),
    profileImageUrl: ''
  };
  
  const [formData, setFormData] = useState<FormState>(blankStudent);

  // Register the system log handler
  useEffect(() => {
    setSystemLogHandler(addSystemLog);
  }, [addSystemLog]);

  // Initialize face-api models 
  const initModels = async () => {
    try {
      if (!areModelsLoaded()) {
        setModelStatus('loading');
        
        // Start the loading progress simulation
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 5;
          if (progress > 95) {
            setModelLoadProgress(95);
          } else {
            setModelLoadProgress(progress);
          }
        }, 100);
        
        // Log model loading start
        addSystemLog({
          type: 'Info',
          message: 'Loading face recognition models for student photo processing',
          severity: 'Low'
        });
        
        // Use an absolute URL to ensure correct path resolution
        const modelUrl = window.location.origin + '/models';
        const success = await initializeFaceApi(modelUrl);
        
        // Clear the progress interval
        clearInterval(progressInterval);
        setModelLoadProgress(100);
        
        if (!success) {
          throw new Error("Failed to load face recognition models");
        }
        
        // Verify models loaded correctly
        if (!areModelsLoaded()) {
          throw new Error("Models did not load properly");
        }
        
        setModelStatus('loaded');
        
        addSystemLog({
          type: 'Info',
          message: 'Face recognition models loaded successfully',
          severity: 'Low'
        });
      } else {
        setModelStatus('loaded');
      }
      
      return true;
    } catch (error) {
      console.error("Error loading face models:", error);
      
      setModelStatus('error');
      
      addSystemLog({
        type: 'Error',
        message: `Failed to load face recognition models: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'High',
        errorCode: 'FACE_API_003',
        suggestedResolution: 'Check network connectivity and model files'
      });
      
      return false;
    }
  };

  // Handle sorting
  const handleRequestSort = (property: keyof Student) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Handle pagination
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        student.name.toLowerCase().includes(term) ||
        student.studentId.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term)
      );
      setFilteredStudents(filtered);
    }
  };

  // Dialog handlers
  const handleOpenDialog = async (student: Student | null = null) => {
    if (student) {
      setFormData({ ...student });
      setCurrentStudent(student);
      setPhotoPreview(student.profileImageUrl || null);
      setSelectedCourses(student.enrolledCourses);
    } else {
      setFormData({ ...blankStudent });
      setCurrentStudent(null);
      setPhotoPreview(null);
      setSelectedCourses([]);
    }
    setImageError(null);
    setOpenDialog(true);
    
    // Pre-load face detection models when dialog opens if consent is given
    if (student?.consentGiven || !student) {
      await initModels().catch(console.error);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setPhotoPreview(null);
    setImageError(null);
  };

  // Form handlers
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown; checked?: boolean; type?: string }>) => {
    const target = e.target as any;
    const { name, value, checked, type } = target;
    
    if (!name) return;
    
    if (name.startsWith('contactInfo.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        contactInfo: {
          ...formData.contactInfo,
          [field]: value
        }
      });
    } else if (type === 'checkbox') {
      // If it's the consent checkbox being toggled on, start loading the models
      if (name === 'consentGiven' && checked && modelStatus === 'uninitialized') {
        initModels().catch(console.error);
      }
      
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      setImageError('Please select an image file');
      return;
    }
    
    // Make sure models are loaded
    if (modelStatus !== 'loaded') {
      // Try to initialize the models if they're not already loading
      if (modelStatus !== 'loading') {
        const success = await initModels();
        if (!success) {
          setImageError('Unable to process face image - model loading failed');
          return;
        }
      } else {
        setImageError('Please wait for face recognition models to finish loading');
        return;
      }
    }
    
    try {
      // Start loading state
      setProcessingImage(true);
      setImageError(null);
      
      addSystemLog({
        type: 'Info',
        message: 'Processing student face image',
        severity: 'Low'
      });
      
      // Read the file and create a data URL for preview
      const reader = new FileReader();
      
      // Create promise to handle the file reading
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = (event) => {
          if (!event.target?.result) {
            reject(new Error("Failed to read file"));
            return;
          }
          resolve(event.target.result as string);
        };
        
        reader.onerror = () => {
          reject(new Error("Error reading file"));
        };
        
        reader.readAsDataURL(file);
      });
      
      // Set the photo preview with the data URL
      setPhotoPreview(dataUrl);
      
      // Process the face in the uploaded image
      const descriptor = await extractFaceDescriptorFromFile(file);
      
      if (!descriptor) {
        // Set warning but allow saving the image anyway
        setImageError("No face was detected in the image. Please upload a clear front-facing photo for face recognition to work.");
        
        // Update form with image but no descriptor
        setFormData(prev => ({
          ...prev,
          profileImageUrl: dataUrl,
          faceDescriptor: undefined
        }));
      } else {
        console.log("Face successfully detected and descriptor extracted");
        
        addSystemLog({
          type: 'Info',
          message: 'Face successfully detected in student photo',
          severity: 'Low'
        });
        
        // Update form with both image and descriptor
        setFormData(prev => ({
          ...prev,
          profileImageUrl: dataUrl,
          faceDescriptor: Array.from(descriptor) // Convert Float32Array to regular array for storage
        }));
      }
    } catch (error) {
      console.error("Error processing face image:", error);
      setImageError(`Error processing image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      addSystemLog({
        type: 'Error',
        message: `Failed to process student face image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'Medium',
        errorCode: 'FACE_EXTRACT_002',
        suggestedResolution: 'Try uploading a different image with a clear face'
      });
      
      // Still set the image even if face processing failed
      if (file) {
        const url = URL.createObjectURL(file);
        setPhotoPreview(url);
        setFormData(prev => ({
          ...prev,
          profileImageUrl: url
        }));
      }
    } finally {
      setProcessingImage(false);
    }
  };

  // Add course selection handler
  const handleCourseSelection = (event: SelectChangeEvent<string[]>) => {
    const courses = typeof event.target.value === 'string' 
      ? [event.target.value] 
      : event.target.value;
    
    setSelectedCourses(courses);
    setFormData(prev => ({
      ...prev,
      enrolledCourses: courses
    }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.studentId || !formData.email) {
      setImageError('Please fill in all required fields');
      return;
    }
    
    // Create a properly structured student object
    const studentData: Student = {
      ...formData,
      id: currentStudent?.id || uuidv4(),
      consentGiven: Boolean(formData.consentGiven),
      enrolledCourses: selectedCourses,
      createdAt: formData.createdAt || new Date().toISOString(),
      contactInfo: {
        ...formData.contactInfo,
        phone: formData.contactInfo?.phone || '',
        address: formData.contactInfo?.address || '',
        emergencyContact: formData.contactInfo?.emergencyContact || ''
      }
    };
    
    // Call the appropriate context method
    if (currentStudent) {
      updateStudent(studentData);
      
      addSystemLog({
        type: 'Info',
        message: `Updated student record: ${studentData.name} (${studentData.studentId})`,
        severity: 'Low'
      });
    } else {
      addStudent(studentData);
      
      addSystemLog({
        type: 'Info',
        message: `Added new student: ${studentData.name} (${studentData.studentId})`,
        severity: 'Low'
      });
    }
    
    // Update the filtered students list to reflect changes immediately
    if (currentStudent) {
      setFilteredStudents(prev => 
        prev.map(s => s.id === studentData.id ? studentData : s)
      );
    } else {
      setFilteredStudents(prev => [...prev, studentData]);
    }
    
    // Close the dialog
    handleCloseDialog();
  };

  // Delete handler
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      const studentToDelete = students.find(s => s.id === id);
      deleteStudent(id);
      setFilteredStudents(students.filter(student => student.id !== id));
      
      if (studentToDelete) {
        addSystemLog({
          type: 'Info',
          message: `Deleted student: ${studentToDelete.name} (${studentToDelete.studentId})`,
          severity: 'Medium'
        });
      }
    }
  };

  // Sort function
  function getComparator<Key extends keyof Student>(
    order: Order,
    orderBy: Key,
  ): (a: Student, b: Student) => number {
    return order === 'desc'
      ? (a, b) => {
          const aVal = a[orderBy];
          const bVal = b[orderBy];
          if (aVal === undefined && bVal === undefined) return 0;
          if (aVal === undefined) return 1;
          if (bVal === undefined) return -1;
          if (bVal < aVal) return -1;
          if (bVal > aVal) return 1;
          return 0;
        }
      : (a, b) => {
          const aVal = a[orderBy];
          const bVal = b[orderBy];
          if (aVal === undefined && bVal === undefined) return 0;
          if (aVal === undefined) return 1;
          if (bVal === undefined) return -1;
          if (aVal < bVal) return -1;
          if (aVal > bVal) return 1;
          return 0;
        };
  }

  // Sorting stabilizer
  function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
    const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  }

  // Import/Export handlers (mock implementation)
  const handleImport = () => {
    alert('Import functionality would be implemented here');
  };

  const handleExport = () => {
    alert('Export functionality would be implemented here');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Student Management
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <TextField
          label="Search Students"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearch}
          size="small"
        />
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<FileUploadIcon />}
            onClick={handleImport}
            sx={{ mr: 1 }}
          >
            Import CSV
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            sx={{ mr: 1 }}
          >
            Export CSV
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Student
          </Button>
        </Box>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Photo</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                  onClick={() => handleRequestSort('name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'studentId'}
                  direction={orderBy === 'studentId' ? order : 'asc'}
                  onClick={() => handleRequestSort('studentId')}
                >
                  Student ID
                </TableSortLabel>
              </TableCell>
              <TableCell>Contact Info</TableCell>
              <TableCell>Enrolled Courses</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'consentGiven'}
                  direction={orderBy === 'consentGiven' ? order : 'asc'}
                  onClick={() => handleRequestSort('consentGiven')}
                >
                  Consent Status
                </TableSortLabel>
              </TableCell>
              <TableCell>Face Data</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stableSort(filteredStudents, getComparator(order, orderBy))
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Avatar 
                      src={student.profileImageUrl} 
                      alt={student.name}
                      sx={{ width: 40, height: 40 }}
                    />
                  </TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.studentId}</TableCell>
                  <TableCell>
                    <Typography variant="body2">Email: {student.email}</Typography>
                    {student.contactInfo?.phone && (
                      <Typography variant="body2">Phone: {student.contactInfo.phone}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {student.enrolledCourses.map((courseId: string) => {
                      const course = mockCourses.find((c: Course) => c.id === courseId);
                      return course ? (
                        <Typography key={courseId} variant="body2">
                          {course.code} - {course.name}
                        </Typography>
                      ) : null;
                    })}
                  </TableCell>
                  <TableCell>
                    {student.consentGiven ? 'Granted' : 'Not Granted'}
                  </TableCell>
                  <TableCell>
                    {student.faceDescriptor ? (
                      <Chip 
                        label="Face Enrolled" 
                        color="success" 
                        size="small" 
                      />
                    ) : (
                      <Chip 
                        label="No Face Data" 
                        color="default" 
                        size="small" 
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(student)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(student.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredStudents.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      
      {/* Add/Edit Student Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentStudent ? 'Edit Student' : 'Add New Student'}
        </DialogTitle>
        <DialogContent>
          {imageError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {imageError}
            </Alert>
          )}

          {modelStatus === 'loading' && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <Typography variant="caption">
                Loading face recognition models ({modelLoadProgress}%)...
              </Typography>
              <LinearProgress variant="determinate" value={modelLoadProgress} />
            </Box>
          )}
          
          {modelStatus === 'error' && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load face recognition models. Face detection will not be available.
              <Button 
                size="small" 
                sx={{ ml: 1 }} 
                onClick={() => initModels()}
              >
                Retry
              </Button>
            </Alert>
          )}
          
          <Box component="form" sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="name"
                  label="Full Name"
                  value={formData.name}
                  onChange={handleFormChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="studentId"
                  label="Student ID"
                  value={formData.studentId}
                  onChange={handleFormChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="contactInfo.phone"
                  label="Phone (Optional)"
                  value={formData.contactInfo?.phone || ''}
                  onChange={handleFormChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="consentGiven"
                      checked={Boolean(formData.consentGiven)}
                      onChange={handleFormChange}
                    />
                  }
                  label="Student has provided consent for facial recognition (GDPR Compliant)"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Upload Student Photo
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {photoPreview && (
                    <Avatar 
                      src={photoPreview} 
                      alt="Preview" 
                      sx={{ width: 100, height: 100 }}
                    />
                  )}
                  <Button 
                    variant="outlined" 
                    component="label"
                    disabled={!formData.consentGiven || processingImage || modelStatus === 'loading'}
                    startIcon={processingImage ? <CircularProgress size={18} /> : null}
                  >
                    {processingImage ? 'Processing...' : 'Choose File'}
                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={processingImage || modelStatus === 'loading'}
                    />
                  </Button>
                </Box>
                <Typography variant="caption" display="block" sx={{ mt: 1, color: !formData.consentGiven ? 'error.main' : 'text.secondary' }}>
                  {!formData.consentGiven 
                    ? 'Student must provide consent before uploading a photo.'
                    : 'Photo will be used for facial recognition. Student has provided consent.'}
                </Typography>
                {formData.faceDescriptor && (
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: 'success.main' }}>
                    Face descriptor successfully extracted. This student can be recognized by the system.
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="courses-label">Enrolled Courses</InputLabel>
                  <Select
                    labelId="courses-label"
                    multiple
                    value={formData.enrolledCourses}
                    onChange={handleCourseSelection}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((courseId) => {
                          const course = mockCourses.find((c: Course) => c.id === courseId);
                          return course ? (
                            <Chip key={courseId} label={`${course.code}`} />
                          ) : null;
                        })}
                      </Box>
                    )}
                  >
                    {mockCourses.map((course: Course) => (
                      <MenuItem key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name || !formData.studentId || !formData.email || processingImage}
          >
            {currentStudent ? 'Save Changes' : 'Add Student'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentManagement;