import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Student, 
  Course, 
  AttendanceRecord, 
  SystemLog, 
  SystemConfig,
  AttendanceMetrics,
  AttendanceDistribution
} from '../types';
import { 
  mockStudents, 
  mockCourses, 
  mockAttendanceRecords, 
  mockSystemLogs 
} from '../utils/mockData';

// Default system configuration
const defaultSystemConfig: SystemConfig = {
  cameraSettings: {
    deviceId: ''
  },
  detectionSettings: {
    sensitivity: 'Medium',
    recognitionThreshold: 0.6
  },
  security: {
    loginRequired: false,
    sessionTimeout: 30
  },
  logging: {
    interval: 5,
    localStorageFallback: true
  }
};

// Define the shape of our context
interface AppContextProps {
  // Data collections
  students: Student[];
  courses: Course[];
  attendanceRecords: AttendanceRecord[];
  systemLogs: SystemLog[];
  systemConfig: SystemConfig;
  
  // Student management
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (updatedStudent: Student) => void;
  deleteStudent: (studentId: string) => void;
  
  // Attendance management
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id'>) => void;
  addBulkAttendance: (records: Omit<AttendanceRecord, 'id'>[]) => void;
  
  // System logs
  addSystemLog: (log: Omit<SystemLog, 'id' | 'timestamp'>) => void;
  clearSystemLogs: () => void;
  
  // System configuration
  updateSystemConfig: (config: Partial<SystemConfig>) => void;
  
  // Dashboard metrics
  getAttendanceMetrics: () => AttendanceMetrics;
  getAttendanceDistribution: () => AttendanceDistribution;
}

// Create the context
const AppContext = createContext<AppContextProps | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for data collections
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(mockSystemLogs);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(defaultSystemConfig);

  // Initialize camera device on mount
  useEffect(() => {
    const initCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (videoDevices.length > 0) {
          setSystemConfig(prevConfig => ({
            ...prevConfig,
            cameraSettings: {
              ...prevConfig.cameraSettings,
              deviceId: videoDevices[0].deviceId
            }
          }));
          
          // Log camera initialization
          addSystemLog({
            type: 'Info',
            message: `Found ${videoDevices.length} camera device(s)`,
            severity: 'Low'
          });
        } else {
          // Log error if no camera found
          addSystemLog({
            type: 'Warning',
            message: 'No camera devices found',
            severity: 'Medium',
            suggestedResolution: 'Connect a webcam or enable camera access'
          });
        }
      } catch (error) {
        console.error('Error initializing camera:', error);
        
        // Log error
        addSystemLog({
          type: 'Error',
          message: 'Failed to initialize camera devices',
          severity: 'High',
          errorCode: 'CAM_INIT_001',
          suggestedResolution: 'Check browser permissions and try refreshing the page'
        });
      }
    };
    
    initCamera();
  }, []);

  // Student management functions
  const addStudent = useCallback((student: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...student,
      id: uuidv4()
    };
    
    setStudents(prevStudents => [...prevStudents, newStudent]);
    
    // Log student addition
    addSystemLog({
      type: 'Info',
      message: `Added new student: ${student.name} (${student.studentId})`,
      severity: 'Low'
    });
  }, []);

  const updateStudent = useCallback((updatedStudent: Student) => {
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student.id === updatedStudent.id ? updatedStudent : student
      )
    );
    
    // Log student update
    addSystemLog({
      type: 'Info',
      message: `Updated student: ${updatedStudent.name} (${updatedStudent.studentId})`,
      severity: 'Low'
    });
  }, []);

  const deleteStudent = useCallback((studentId: string) => {
    const studentToDelete = students.find(s => s.id === studentId);
    
    setStudents(prevStudents => 
      prevStudents.filter(student => student.id !== studentId)
    );
    
    // Log student deletion
    if (studentToDelete) {
      addSystemLog({
        type: 'Warning',
        message: `Deleted student: ${studentToDelete.name} (${studentToDelete.studentId})`,
        severity: 'Medium'
      });
    }
  }, [students]);

  // Attendance management functions
  const addAttendanceRecord = useCallback((record: Omit<AttendanceRecord, 'id'>) => {
    const newRecord: AttendanceRecord = {
      ...record,
      id: uuidv4()
    };
    
    setAttendanceRecords(prevRecords => [...prevRecords, newRecord]);
    
    // Find student and course details for the log
    const student = students.find(s => s.id === record.studentId);
    const course = courses.find(c => c.id === record.courseId);
    
    // Log attendance record
    addSystemLog({
      type: 'Info',
      message: `Recorded ${record.status} attendance for ${student?.name || 'Unknown Student'} in ${course?.code || 'Unknown Course'}`,
      severity: 'Low'
    });
  }, [students, courses]);

  const addBulkAttendance = useCallback((records: Omit<AttendanceRecord, 'id'>[]) => {
    const newRecords = records.map(record => ({
      ...record,
      id: uuidv4()
    }));
    
    setAttendanceRecords(prevRecords => [...prevRecords, ...newRecords]);
    
    // Get course details
    const courseId = records[0]?.courseId;
    const course = courses.find(c => c.id === courseId);
    
    // Count records by status
    const presentCount = records.filter(r => r.status === 'Present').length;
    const lateCount = records.filter(r => r.status === 'Late').length;
    const absentCount = records.filter(r => r.status === 'Absent').length;
    
    // Log bulk attendance
    addSystemLog({
      type: 'Info',
      message: `Bulk attendance recorded for ${course?.code || 'Unknown Course'}: ${presentCount} present, ${lateCount} late, ${absentCount} absent`,
      severity: 'Low'
    });
  }, [courses]);

  // System logs functions
  const addSystemLog = useCallback((log: Omit<SystemLog, 'id' | 'timestamp'>) => {
    const newLog: SystemLog = {
      ...log,
      id: uuidv4(),
      timestamp: new Date().toISOString()
    };
    
    setSystemLogs(prevLogs => [newLog, ...prevLogs]);
  }, []);

  const clearSystemLogs = useCallback(() => {
    setSystemLogs([]);
    
    // Add a log entry about clearing the logs
    const newLog: SystemLog = {
      id: uuidv4(),
      type: 'Warning',
      message: 'All system logs cleared',
      severity: 'Medium',
      timestamp: new Date().toISOString()
    };
    
    setSystemLogs([newLog]);
  }, []);

  // System configuration function
  const updateSystemConfig = useCallback((config: Partial<SystemConfig>) => {
    setSystemConfig(prevConfig => ({
      ...prevConfig,
      ...config
    }));
    
    // Log config update
    addSystemLog({
      type: 'Info',
      message: 'System configuration updated',
      severity: 'Low'
    });
  }, []);

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

// Custom hook for using the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  
  return context;
};