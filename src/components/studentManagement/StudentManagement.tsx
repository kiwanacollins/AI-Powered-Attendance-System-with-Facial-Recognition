import { useState } from 'react';
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
  Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Student } from '../../types';
import { mockCourses, mockStudents } from '../../utils/mockData';

type Order = 'asc' | 'desc';

const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(mockStudents);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof Student>('name');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

  // Initial form state
  const blankStudent: Student = {
    id: '',
    name: '',
    enrolledCourses: [],
    studentId: '',
    contactInfo: {
      email: '',
      phone: ''
    },
    consentStatus: false
  };

  const [formData, setFormData] = useState<Student>(blankStudent);

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
        student.contactInfo.email.toLowerCase().includes(term)
      );
      setFilteredStudents(filtered);
    }
  };

  // Dialog handlers
  const handleOpenDialog = (student: Student | null = null) => {
    if (student) {
      setFormData({ ...student });
      setCurrentStudent(student);
    } else {
      setFormData({ ...blankStudent, id: crypto.randomUUID() });
      setCurrentStudent(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Form handlers
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    
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

  const handleSubmit = () => {
    if (currentStudent) {
      // Update existing student
      const updatedStudents = students.map(student => 
        student.id === formData.id ? formData : student
      );
      setStudents(updatedStudents);
      setFilteredStudents(updatedStudents);
    } else {
      // Add new student
      const newStudents = [...students, formData];
      setStudents(newStudents);
      setFilteredStudents(newStudents);
    }
    handleCloseDialog();
  };

  // Delete handler
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      const updatedStudents = students.filter(student => student.id !== id);
      setStudents(updatedStudents);
      setFilteredStudents(updatedStudents);
    }
  };

  // Sort function
  function getComparator<Key extends keyof Student>(
    order: Order,
    orderBy: Key,
  ): (a: Student, b: Student) => number {
    return order === 'desc'
      ? (a, b) => {
          if (b[orderBy] < a[orderBy]) return -1;
          if (b[orderBy] > a[orderBy]) return 1;
          return 0;
        }
      : (a, b) => {
          if (a[orderBy] < b[orderBy]) return -1;
          if (a[orderBy] > b[orderBy]) return 1;
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
                  active={orderBy === 'consentStatus'}
                  direction={orderBy === 'consentStatus' ? order : 'asc'}
                  onClick={() => handleRequestSort('consentStatus')}
                >
                  Consent Status
                </TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stableSort(filteredStudents, getComparator(order, orderBy))
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.studentId}</TableCell>
                  <TableCell>
                    <Typography variant="body2">Email: {student.contactInfo.email}</Typography>
                    {student.contactInfo.phone && (
                      <Typography variant="body2">Phone: {student.contactInfo.phone}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {student.enrolledCourses.map(courseId => {
                      const course = mockCourses.find(c => c.id === courseId);
                      return course ? (
                        <Typography key={courseId} variant="body2">
                          {course.code} - {course.name}
                        </Typography>
                      ) : null;
                    })}
                  </TableCell>
                  <TableCell>
                    {student.consentStatus ? 'Granted' : 'Not Granted'}
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
          <Grid container spacing={2} sx={{ mt: 1 }}>
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
                name="contactInfo.email"
                label="Email"
                type="email"
                value={formData.contactInfo.email}
                onChange={handleFormChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="contactInfo.phone"
                label="Phone (Optional)"
                value={formData.contactInfo.phone || ''}
                onChange={handleFormChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="consentStatus"
                    checked={formData.consentStatus}
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
              <Button variant="outlined" component="label">
                Choose File
                <input
                  type="file"
                  hidden
                  accept="image/*"
                />
              </Button>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Photo will be used for facial recognition. Student must provide consent.
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name || !formData.studentId || !formData.contactInfo.email}
          >
            {currentStudent ? 'Save Changes' : 'Add Student'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentManagement;