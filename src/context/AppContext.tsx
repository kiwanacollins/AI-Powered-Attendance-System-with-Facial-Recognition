import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Student, 
  Course, 
  AttendanceRecord, 
  SystemLog, 
  SystemConfig, 
  AppContextState
} from '../types';
import { 
  mockStudents, 
  mockCourses, 
  mockAttendanceRecords, 
  mockSystemLogs 
} from '../utils/mockData';
import { setSystemLogHandler } from '../services/faceRecognitionService';

// Interfaces for attendance metrics
interface AttendanceMetrics {
  totalStudents: number;
  averageAttendance: number;
  minAttendance: number;
  maxAttendance: number;
}

interface AttendanceDistribution {
  present: number;
  late: number;
  absent: number;
}

// Extended context props interface
interface AppContextProps extends AppContextState {
  getAttendanceMetrics: () => AttendanceMetrics;
  getAttendanceDistribution: () => AttendanceDistribution;
  addBulkAttendance: (records: Omit<AttendanceRecord, 'id'>[]) => void;
}

// Create a default system config
const defaultSystemConfig: SystemConfig = {
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

// Create the context with default values
const AppContext = createContext<AppContextProps>({
  students: [],
  courses: [],
  attendanceRecords: [],
  systemLogs: [],
  systemConfig: defaultSystemConfig,
  addStudent: () => {},
  updateStudent: () => {},
  deleteStudent: () => {},
  addAttendanceRecord: () => {},
  addBulkAttendance: () => {},
  addSystemLog: () => {},
  clearSystemLogs: () => {},
  updateSystemConfig: () => {},
  getAttendanceMetrics: () => ({ 
    totalStudents: 0, 
    averageAttendance: 0, 
    minAttendance: 0, 
    maxAttendance: 0 
  }),
  getAttendanceDistribution: () => ({ 
    present: 0, 
    late: 0, 
    absent: 0 
  }),
});

// Provider component to wrap the application
export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state with mock data
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(mockSystemLogs);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(defaultSystemConfig);
  
  // Function to add a new student
  const addStudent = (student: Omit<Student, 'id' | 'createdAt'>) => {
    const newStudent: Student = {
      ...student,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setStudents(prevStudents => [...prevStudents, newStudent]);
    
    // Log the action
    addSystemLog({
      type: 'Info',
      message: `New student added: ${student.name}`,
      severity: 'Low',
    });
  };
  
  // Function to update an existing student
  const updateStudent = (id: string, studentData: Partial<Student>) => {
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student.id === id ? { ...student, ...studentData } : student
      )
    );
    
    // Log the action
    addSystemLog({
      type: 'Info',
      message: `Student updated: ${id}`,
      severity: 'Low',
    });
  };
  
  // Function to delete a student
  const deleteStudent = (id: string) => {
    const studentToDelete = students.find(s => s.id === id);
    setStudents(prevStudents => prevStudents.filter(student => student.id !== id));
    
    // Log the action
    if (studentToDelete) {
      addSystemLog({
        type: 'Info',
        message: `Student deleted: ${studentToDelete.name}`,
        severity: 'Medium',
      });
    }
  };
  
  // Function to add an attendance record
  const addAttendanceRecord = (record: Omit<AttendanceRecord, 'id'>) => {
    const newRecord: AttendanceRecord = {
      ...record,
      id: uuidv4(),
    };
    setAttendanceRecords(prevRecords => [...prevRecords, newRecord]);
    
    // Find the student and course names for the log message
    const student = students.find(s => s.id === record.studentId);
    const course = courses.find(c => c.id === record.courseId);
    
    // Log the action
    addSystemLog({
      type: 'Info',
      message: `Attendance recorded: ${student?.name || 'Unknown student'} - ${course?.code || 'Unknown course'} - ${record.status}`,
      severity: 'Low',
    });
  };
  
  // Function to add multiple attendance records at once
  const addBulkAttendance = (records: Omit<AttendanceRecord, 'id'>[]) => {
    const newRecords = records.map(record => ({
      ...record,
      id: uuidv4()
    }));
    
    setAttendanceRecords(prevRecords => [...prevRecords, ...newRecords]);
    
    // Log the action
    addSystemLog({
      type: 'Info',
      message: `Bulk attendance recorded: ${newRecords.length} entries`,
      severity: 'Medium',
    });
  };
  
  // Function to add a system log
  const addSystemLog = (log: Omit<SystemLog, 'id' | 'timestamp'>) => {
    const newLog: SystemLog = {
      ...log,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    };
    setSystemLogs(prevLogs => [newLog, ...prevLogs]);
  };
  
  // Function to clear all system logs
  const clearSystemLogs = () => {
    setSystemLogs([]);
    
    // Add a log for clearing logs
    const newLog: SystemLog = {
      id: uuidv4(),
      type: 'Info',
      message: 'All system logs cleared',
      severity: 'Medium',
      timestamp: new Date().toISOString(),
    };
    setSystemLogs([newLog]);
  };
  
  // Function to update system configuration
  const updateSystemConfig = (config: Partial<SystemConfig>) => {
    setSystemConfig(prevConfig => ({
      ...prevConfig,
      ...config,
      // Handle nested objects
      cameraSettings: {
        ...prevConfig.cameraSettings,
        ...(config.cameraSettings || {})
      },
      detectionSettings: {
        ...prevConfig.detectionSettings,
        ...(config.detectionSettings || {})
      },
      security: {
        ...prevConfig.security,
        ...(config.security || {})
      },
      logging: {
        ...prevConfig.logging,
        ...(config.logging || {})
      }
    }));
    
    // Log config update
    addSystemLog({
      type: 'Info',
      message: 'System configuration updated',
      severity: 'Low'
    });
  };
  
  // Dashboard metrics functions
  const getAttendanceMetrics = useCallback((): AttendanceMetrics => {
    const totalStudents = students.length;
    
    // Count course attendances
    const courseAttendance: Record<string, number> = {};
    
    courses.forEach(course => {
      const courseRecords = attendanceRecords.filter(
        record => record.courseId === course.id &&
                (record.status === 'Present' || record.status === 'Late')
      );
      
      const studentIdsPresent = new Set(courseRecords.map(record => record.studentId));
      courseAttendance[course.id] = studentIdsPresent.size;
    });
    
    // Calculate average, min, and max attendance
    const attendanceValues = Object.values(courseAttendance);
    const totalCourses = attendanceValues.length;
    
    const averageAttendance = totalCourses > 0
      ? attendanceValues.reduce((sum, count) => sum + count, 0) / totalCourses
      : 0;
      
    const minAttendance = totalCourses > 0
      ? Math.min(...attendanceValues)
      : 0;
      
    const maxAttendance = totalCourses > 0
      ? Math.max(...attendanceValues)
      : 0;
    
    return {
      totalStudents,
      averageAttendance,
      minAttendance,
      maxAttendance
    };
  }, [students, courses, attendanceRecords]);
  
  const getAttendanceDistribution = useCallback((): AttendanceDistribution => {
    const present = attendanceRecords.filter(record => record.status === 'Present').length;
    const late = attendanceRecords.filter(record => record.status === 'Late').length;
    const absent = attendanceRecords.filter(record => record.status === 'Absent').length;
    
    return {
      present,
      late,
      absent
    };
  }, [attendanceRecords]);
  
  // Register our log handler with the face recognition service
  useEffect(() => {
    setSystemLogHandler(addSystemLog);
    
    // Add an initialization log
    addSystemLog({
      type: 'Info',
      message: 'System initialized',
      severity: 'Low',
    });
    
    // Check for locally stored system configuration
    const storedConfig = localStorage.getItem('systemConfig');
    if (storedConfig) {
      try {
        const parsedConfig = JSON.parse(storedConfig);
        setSystemConfig(prevConfig => ({
          ...prevConfig,
          ...parsedConfig,
        }));
        
        addSystemLog({
          type: 'Info',
          message: 'Loaded saved system configuration',
          severity: 'Low',
        });
      } catch (error) {
        console.error('Failed to parse stored system configuration:', error);
        addSystemLog({
          type: 'Warning',
          message: 'Failed to load saved system configuration',
          severity: 'Medium',
          errorCode: 'CONFIG_001',
          suggestedResolution: 'Check browser storage or reset configuration'
        });
      }
    }
  }, []);
  
  // Save configuration to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('systemConfig', JSON.stringify(systemConfig));
    } catch (error) {
      console.error('Failed to save system configuration to localStorage:', error);
      addSystemLog({
        type: 'Warning',
        message: 'Failed to save system configuration',
        severity: 'Medium',
        errorCode: 'CONFIG_002',
        suggestedResolution: 'Check browser storage permissions'
      });
    }
  }, [systemConfig]);
  
  // Combine all values and functions to be provided
  const contextValue: AppContextProps = {
    students,
    courses,
    attendanceRecords,
    systemLogs,
    systemConfig,
    addStudent,
    updateStudent,
    deleteStudent,
    addAttendanceRecord,
    addBulkAttendance,
    addSystemLog,
    clearSystemLogs,
    updateSystemConfig,
    getAttendanceMetrics,
    getAttendanceDistribution
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Export an alias for AppContextProvider as AppProvider to match imports in main.tsx
export const AppProvider = AppContextProvider;

// Custom hook for using the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  
  return context;
};