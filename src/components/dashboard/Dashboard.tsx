import { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Paper, 
  Typography, 
  ToggleButton, 
  ToggleButtonGroup,
  Grid
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { mockStudents, mockAttendanceRecords, generateAttendanceData, getAttendanceByStatus, getAttendanceByCourse } from '../../utils/mockData';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler  // Add Filler plugin for the 'fill' option
);

const Dashboard = () => {
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days'>('7days');
  
  // Get metrics
  const totalStudents = mockStudents.length;
  const studentsWithConsent = mockStudents.filter(student => student.consentStatus).length;
  const consentPercentage = Math.round((studentsWithConsent / totalStudents) * 100);
  
  const presentRecords = mockAttendanceRecords.filter(record => record.status === 'Present').length;
  const lateRecords = mockAttendanceRecords.filter(record => record.status === 'Late').length;
  const absentRecords = mockAttendanceRecords.filter(record => record.status === 'Absent').length;
  const totalRecords = presentRecords + lateRecords + absentRecords;
  
  const averageAttendance = totalRecords > 0 
    ? Math.round(((presentRecords + lateRecords) / totalRecords) * 100) 
    : 0;

  // Get chart data
  const handleDateRangeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newDateRange: '7days' | '30days' | '90days',
  ) => {
    if (newDateRange !== null) {
      setDateRange(newDateRange);
    }
  };
  
  const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
  const attendanceData = generateAttendanceData(days);
  
  // Line chart for historical trends
  const lineChartData = {
    labels: attendanceData.labels,
    datasets: [
      {
        label: 'Present',
        data: attendanceData.present,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      },
      {
        label: 'Late',
        data: attendanceData.late,
        borderColor: 'rgba(255, 206, 86, 1)',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        fill: true,
      },
      {
        label: 'Absent',
        data: attendanceData.absent,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
      },
    ],
  };
  
  // Pie chart for status distribution
  const statusData = getAttendanceByStatus();
  const pieChartData = {
    labels: statusData.labels,
    datasets: [
      {
        data: statusData.data,
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Bar chart for course distribution
  const courseData = getAttendanceByCourse();
  const barChartData = {
    labels: courseData.labels,
    datasets: [
      {
        label: 'Attendance Count',
        data: courseData.data,
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Registered Students
              </Typography>
              <Typography variant="h3">
                {totalStudents}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {consentPercentage}% with consent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Average Attendance
              </Typography>
              <Typography variant="h3">
                {averageAttendance}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Based on {totalRecords} records
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Present Today
              </Typography>
              <Typography variant="h3">
                {attendanceData.present[attendanceData.present.length - 1]}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                of {totalStudents} students
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Late Today
              </Typography>
              <Typography variant="h3">
                {attendanceData.late[attendanceData.late.length - 1]}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                of {totalStudents} students
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Date Range Selector */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <ToggleButtonGroup
          value={dateRange}
          exclusive
          onChange={handleDateRangeChange}
          aria-label="date range"
          size="small"
        >
          <ToggleButton value="7days" aria-label="7 days">
            7 Days
          </ToggleButton>
          <ToggleButton value="30days" aria-label="30 days">
            30 Days
          </ToggleButton>
          <ToggleButton value="90days" aria-label="90 days">
            90 Days
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Attendance Trends
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line 
                data={lineChartData} 
                options={{ 
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Student Count'
                      }
                    }
                  }
                }} 
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Attendance Distribution
            </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <Pie 
                data={pieChartData}
                options={{ 
                  responsive: true,
                  maintainAspectRatio: false
                }} 
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Attendance by Course
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar 
                data={barChartData}
                options={{ 
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Attendance Count'
                      }
                    }
                  }
                }} 
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;