// Define core types for the AI-Powered Attendance System

// Student type definition
export interface Student {
  id: string;
  name: string;
  studentId: string;
  email: string;
  enrolledCourses: string[];
  profileImageUrl?: string;
  consentGiven: boolean;
  faceDescriptor?: number[]; // Stored as a regular array for JSON serialization
  contactInfo: {
    phone?: string;
    address?: string;
    emergencyContact?: string;
  };
  createdAt: string;
}

// Course type definition
export interface Course {
  id: string;
  code: string;
  name: string;
  instructor: string;
  schedule: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  location: string;
  semester: string;
  year: number;
}

// Attendance record type definition
export interface AttendanceRecord {
  id: string;
  studentId: string;
  courseId: string;
  timestamp: string;
  status: 'Present' | 'Late' | 'Absent';
  captureMethod: 'Automatic' | 'Manual';
  notes?: string;
}

// System log type for error monitoring and event logging
export interface SystemLog {
  id: string;
  type: 'Error' | 'Warning' | 'Info';
  message: string;
  severity: 'High' | 'Medium' | 'Low';
  timestamp: string;
  errorCode?: string;
  suggestedResolution?: string;
}

// System configuration types
export interface CameraSettings {
  deviceId: string;
}

export interface DetectionSettings {
  sensitivity: 'Low' | 'Medium' | 'High';
  recognitionThreshold: number; // Value between 0 and 1, where lower is stricter
}

export interface SecuritySettings {
  loginRequired: boolean;
  sessionTimeout: number; // Minutes
}

export interface LoggingSettings {
  interval: number | 'manual'; // Minutes or 'manual'
  localStorageFallback: boolean;
}

export interface SystemConfig {
  cameraSettings: CameraSettings;
  detectionSettings: DetectionSettings;
  security: SecuritySettings;
  logging: LoggingSettings;
}

// Face recognition types
export interface FaceDetectionResult {
  studentId: string;
  name: string;
  confidence: number;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: number;
  recognized: boolean;
}

// Face recognition model loading status
export enum ModelLoadStatus {
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error',
  NOT_INITIALIZED = 'not_initialized'
}

// Context interfaces
export interface AppContextState {
  students: Student[];
  courses: Course[];
  attendanceRecords: AttendanceRecord[];
  systemLogs: SystemLog[];
  systemConfig: SystemConfig;
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => void;
  updateStudent: (id: string, studentData: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id'>) => void;
  addSystemLog: (log: Omit<SystemLog, 'id' | 'timestamp'>) => void;
  clearSystemLogs: () => void;
  updateSystemConfig: (config: Partial<SystemConfig>) => void;
}

// Dashboard stats
export interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  averageAttendance: number;
  attendanceToday: number;
}

// Chart data interfaces
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}