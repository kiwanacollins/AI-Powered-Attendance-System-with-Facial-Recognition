import { v4 as uuidv4 } from 'uuid';
import { Student, Course, AttendanceRecord, SystemLog } from '../types';

// Generate consistent mock face descriptors (128-dimensional vector)
const generateConsistentDescriptor = (seed: number): Float32Array => {
  const descriptor = new Float32Array(128);
  const random = (x: number) => Math.sin(x * 100) * 0.5 + 0.5; // Deterministic "random" function
  
  for (let i = 0; i < 128; i++) {
    // Create a consistent but unique value for each position in the descriptor
    descriptor[i] = random(seed + (i / 128)) * 0.8 - 0.4; // Values roughly between -0.4 and 0.4
  }
  
  return descriptor;
};

// Generate realistic mock data for development and testing

// Mock Students with consistent face descriptors
export const mockStudents: Student[] = [
  {
    id: uuidv4(),
    name: 'Sarah Johnson',
    studentId: 'SJ1001',
    email: 'sarah.johnson@university.edu',
    enrolledCourses: ['course1', 'course2', 'course3'],
    profileImageUrl: 'https://randomuser.me/api/portraits/women/1.jpg',
    consentGiven: true,
    faceDescriptor: Array.from(generateConsistentDescriptor(1)), // Add consistent descriptor
    contactInfo: {
      phone: '555-123-4567',
      address: '123 University Ave, College Town',
      emergencyContact: 'John Johnson (Father): 555-987-6543'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'Michael Chen',
    studentId: 'MC2002',
    email: 'michael.chen@university.edu',
    enrolledCourses: ['course1', 'course3'],
    profileImageUrl: 'https://randomuser.me/api/portraits/men/2.jpg',
    consentGiven: true,
    faceDescriptor: Array.from(generateConsistentDescriptor(2)), // Add consistent descriptor
    contactInfo: {
      phone: '555-234-5678',
      address: '456 College Blvd, College Town'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'Jessica Williams',
    studentId: 'JW3003',
    email: 'jessica.w@university.edu',
    enrolledCourses: ['course2', 'course3'],
    profileImageUrl: 'https://randomuser.me/api/portraits/women/3.jpg',
    consentGiven: false,
    faceDescriptor: Array.from(generateConsistentDescriptor(3)), // Add consistent descriptor
    contactInfo: {
      phone: '555-345-6789',
      address: '789 Scholar St, College Town'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'David Rodriguez',
    studentId: 'DR4004',
    email: 'david.r@university.edu',
    enrolledCourses: ['course1', 'course2'],
    profileImageUrl: 'https://randomuser.me/api/portraits/men/4.jpg',
    consentGiven: true,
    faceDescriptor: Array.from(generateConsistentDescriptor(4)), // Add consistent descriptor
    contactInfo: {
      phone: '555-456-7890'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'Emma Thompson',
    studentId: 'ET5005',
    email: 'emma.t@university.edu',
    enrolledCourses: ['course1', 'course3'],
    profileImageUrl: 'https://randomuser.me/api/portraits/women/5.jpg',
    consentGiven: true,
    faceDescriptor: Array.from(generateConsistentDescriptor(5)), // Add consistent descriptor
    contactInfo: {
      phone: '555-567-8901',
      address: '101 Academic Way, College Town'
    },
    createdAt: new Date().toISOString()
  }
];

// Mock Courses
export const mockCourses: Course[] = [
  {
    id: 'course1',
    code: 'CS101',
    name: 'Introduction to Computer Science',
    instructor: 'Dr. Alan Turing',
    schedule: {
      days: ['Monday', 'Wednesday'],
      startTime: '09:00',
      endTime: '10:30'
    },
    location: 'Building A, Room 101',
    semester: 'Spring',
    year: 2025
  },
  {
    id: 'course2',
    code: 'MATH202',
    name: 'Linear Algebra',
    instructor: 'Dr. Katherine Johnson',
    schedule: {
      days: ['Tuesday', 'Thursday'],
      startTime: '11:00',
      endTime: '12:30'
    },
    location: 'Building B, Room 205',
    semester: 'Spring',
    year: 2025
  },
  {
    id: 'course3',
    code: 'PHYS150',
    name: 'Physics for Engineers',
    instructor: 'Dr. Richard Feynman',
    schedule: {
      days: ['Monday', 'Wednesday', 'Friday'],
      startTime: '14:00',
      endTime: '15:00'
    },
    location: 'Building C, Room 310',
    semester: 'Spring',
    year: 2025
  }
];

// Mock Attendance Records
export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: uuidv4(),
    studentId: mockStudents[0].id,
    courseId: 'course1',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    status: 'Present',
    captureMethod: 'Automatic'
  },
  {
    id: uuidv4(),
    studentId: mockStudents[1].id,
    courseId: 'course1',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    status: 'Late',
    captureMethod: 'Automatic',
    notes: 'Arrived 10 minutes late'
  },
  {
    id: uuidv4(),
    studentId: mockStudents[2].id,
    courseId: 'course2',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    status: 'Absent',
    captureMethod: 'Manual',
    notes: 'Notified professor in advance'
  },
  {
    id: uuidv4(),
    studentId: mockStudents[3].id,
    courseId: 'course2',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    status: 'Present',
    captureMethod: 'Automatic'
  },
  {
    id: uuidv4(),
    studentId: mockStudents[4].id,
    courseId: 'course3',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    status: 'Present',
    captureMethod: 'Automatic'
  }
];

// Mock System Logs
export const mockSystemLogs: SystemLog[] = [
  {
    id: uuidv4(),
    type: 'Info',
    message: 'System initialized successfully',
    severity: 'Low',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 5)).toISOString()
  },
  {
    id: uuidv4(),
    type: 'Warning',
    message: 'Camera connection unstable',
    severity: 'Medium',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 3)).toISOString(),
    suggestedResolution: 'Check USB connection and try reconnecting the camera'
  },
  {
    id: uuidv4(),
    type: 'Error',
    message: 'Failed to save attendance record',
    severity: 'High',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 2)).toISOString(),
    errorCode: 'DB_CONN_001',
    suggestedResolution: 'Verify database connection and retry'
  },
  {
    id: uuidv4(),
    type: 'Info',
    message: 'New student profile created',
    severity: 'Low',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 1)).toISOString()
  },
  {
    id: uuidv4(),
    type: 'Error',
    message: 'Face detection failed',
    severity: 'Medium',
    timestamp: new Date().toISOString(),
    errorCode: 'AI_PROC_002',
    suggestedResolution: 'Ensure proper lighting conditions and camera positioning'
  }
];

// Helper function to generate random attendance data for charts
export const generateAttendanceData = (days: number) => {
  const labels = [];
  const present = [];
  const late = [];
  const absent = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    
    // Generate realistic random data
    const totalStudents = mockStudents.length;
    const presentCount = Math.floor(Math.random() * (totalStudents * 0.8)) + Math.floor(totalStudents * 0.2);
    const lateCount = Math.floor(Math.random() * (totalStudents - presentCount) * 0.7);
    const absentCount = totalStudents - presentCount - lateCount;
    
    present.push(presentCount);
    late.push(lateCount);
    absent.push(absentCount);
  }
  
  return { labels, present, late, absent };
};

// Helper function to get attendance distribution by status
export const getAttendanceByStatus = () => {
  const present = mockAttendanceRecords.filter(record => record.status === 'Present').length;
  const late = mockAttendanceRecords.filter(record => record.status === 'Late').length;
  const absent = mockAttendanceRecords.filter(record => record.status === 'Absent').length;
  
  return {
    labels: ['Present', 'Late', 'Absent'],
    data: [present, late, absent]
  };
};

// Helper function to get attendance by course
export const getAttendanceByCourse = () => {
  const courseData: Record<string, number> = {};
  
  // Initialize with 0 for each course
  mockCourses.forEach(course => {
    courseData[course.id] = 0;
  });
  
  // Count attendance records per course
  mockAttendanceRecords.forEach(record => {
    if (record.status === 'Present' || record.status === 'Late') {
      courseData[record.courseId] = (courseData[record.courseId] || 0) + 1;
    }
  });
  
  // Convert to chart-friendly format
  return {
    labels: mockCourses.map(course => course.code),
    data: Object.values(courseData)
  };
};