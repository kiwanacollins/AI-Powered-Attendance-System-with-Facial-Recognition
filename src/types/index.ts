// Basic data models for the attendance system

// Student model
export interface Student {
  id: string;
  name: string;
  studentId: string;
  email: string;
  enrolledCourses: string[]; // Array of course IDs
  faceDescriptor?: Float32Array; // Face recognition descriptor
  profileImageUrl?: string;
  consentGiven: boolean;
  contactInfo: {
    phone?: string;
    address?: string;
    emergencyContact?: string;
  };
  createdAt: string; // ISO date string
}

// Course model
export interface Course {
  id: string;
  code: string; // e.g., "CS101"
  name: string;
  instructor: string;
  schedule: {
    days: string[]; // e.g., ["Monday", "Wednesday"]
    startTime: string; // e.g., "09:00"
    endTime: string; // e.g., "10:30"
  };
  location: string;
  semester: string;
  year: number;
}

// Attendance record model
export interface AttendanceRecord {
  id: string;
  studentId: string;
  courseId: string;
  timestamp: string; // ISO date string
  status: 'Present' | 'Late' | 'Absent';
  captureMethod: 'Automatic' | 'Manual';
  notes?: string;
}

// System log model for error monitoring
export interface SystemLog {
  id: string;
  type: 'Error' | 'Warning' | 'Info';
  message: string;
  severity: 'High' | 'Medium' | 'Low';
  timestamp: string; // ISO date string
  errorCode?: string;
  suggestedResolution?: string;
  context?: Record<string, any>;
}

// System configuration model
export interface SystemConfig {
  cameraSettings: {
    deviceId: string;
    resolution?: {
      width: number;
      height: number;
    };
  };
  detectionSettings: {
    sensitivity: 'Low' | 'Medium' | 'High';
    recognitionThreshold: number; // 0-1 value for face recognition confidence
  };
  security: {
    loginRequired: boolean;
    sessionTimeout: number; // minutes
  };
  logging: {
    interval: number; // minutes
    localStorageFallback: boolean;
  };
}

// Dashboard metrics models
export interface AttendanceMetrics {
  totalStudents: number;
  averageAttendance: number;
  minAttendance: number;
  maxAttendance: number;
}

export interface AttendanceDistribution {
  present: number;
  late: number;
  absent: number;
}

// Camera detection result
export interface DetectionResult {
  studentId: string;
  confidence: number;
  timestamp: string;
}