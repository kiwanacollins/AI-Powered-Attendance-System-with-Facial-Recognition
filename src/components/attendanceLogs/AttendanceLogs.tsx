import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2'; // Using Grid v2
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { AttendanceRecord } from '../../types';
import { mockAttendanceRecords, mockStudents, mockCourses } from '../../utils/mockData';

const AttendanceLogs = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Handle pagination
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search and filtering
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    applyFilters(event.target.value, startDate, endDate);
  };

  const handleDateChange = (date: Date | null, type: 'start' | 'end') => {
    if (type === 'start') {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
    applyFilters(searchTerm, type === 'start' ? date : startDate, type === 'end' ? date : endDate);
  };

  const applyFilters = (search: string, start: Date | null, end: Date | null) => {
    let filtered = [...records];
    
    // Apply search filter
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(record => {
        const student = mockStudents.find(s => s.id === record.studentId);
        const course = mockCourses.find(c => c.id === record.courseId);
        
        return (
          student?.name.toLowerCase().includes(term) ||
          student?.studentId.toLowerCase().includes(term) ||
          course?.code.toLowerCase().includes(term) ||
          course?.name.toLowerCase().includes(term) ||
          record.status.toLowerCase().includes(term)
        );
      });
    }
    
    // Apply date range filter
    if (start || end) {
      filtered = filtered.filter(record => {
        const recordDate = parseISO(record.timestamp);
        
        if (start && end) {
          return isWithinInterval(recordDate, { start, end });
        } else if (start) {
          return recordDate >= start;
        } else if (end) {
          return recordDate <= end;
        }
        
        return true;
      });
    }
    
    setFilteredRecords(filtered);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStartDate(null);
    setEndDate(null);
    setFilteredRecords(records);
  };

  // Export to CSV (mock implementation)
  const handleExport = () => {
    alert('Exporting attendance records to CSV');
  };

  // Delete older records (mock implementation)
  const handleClearOldRecords = () => {
    if (confirm('Are you sure you want to clear records older than 60 days? This action cannot be undone.')) {
      alert('Records cleared');
    }
  };

  // Get student and course details
  const getStudentName = (studentId: string) => {
    const student = mockStudents.find(s => s.id === studentId);
    return student ? `${student.name} (${student.studentId})` : 'Unknown Student';
  };

  const getCourseInfo = (courseId: string) => {
    const course = mockCourses.find(c => c.id === courseId);
    return course ? `${course.code} - ${course.name}` : 'Unknown Course';
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'success';
      case 'Late':
        return 'warning';
      case 'Absent':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Attendance Logs
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, minWidth: '200px' }}
        />
        
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(date) => handleDateChange(date, 'start')}
            slotProps={{ textField: { size: 'small' } }}
          />
          
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(date) => handleDateChange(date, 'end')}
            slotProps={{ textField: { size: 'small' } }}
          />
        </LocalizationProvider>
        
        <Button variant="outlined" onClick={handleClearFilters}>
          Clear Filters
        </Button>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Button 
          variant="outlined" 
          startIcon={<FileDownloadIcon />}
          onClick={handleExport}
        >
          Export CSV
        </Button>
        
        <Button 
          variant="outlined" 
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleClearOldRecords}
        >
          Clear Old Records
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date & Time</TableCell>
              <TableCell>Student</TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRecords
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {format(parseISO(record.timestamp), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>{getStudentName(record.studentId)}</TableCell>
                  <TableCell>{getCourseInfo(record.courseId)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={record.status} 
                      color={getStatusColor(record.status) as any}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            {filteredRecords.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No records found. Try adjusting your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredRecords.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      
      <Typography variant="caption" sx={{ display: 'block', mt: 2, textAlign: 'right' }}>
        Records are automatically archived after 60 days. Total records: {records.length}
      </Typography>
    </Box>
  );
};

export default AttendanceLogs;