import * as faceapi from 'face-api.js';
import { Student, SystemLog } from '../types';
import * as tf from '@tensorflow/tfjs';

// Ensure TensorFlow.js is using the CPU backend for Raspberry Pi compatibility
const setupTensorFlowBackend = async () => {
  try {
    // Force CPU backend
    await tf.setBackend('cpu');
    console.log('TensorFlow.js backend set to:', tf.getBackend());
    return true;
  } catch (error) {
    console.error('Failed to set TensorFlow.js backend:', error);
    return false;
  }
};

// Global variable to store the system log function
let systemLogFunction: ((log: SystemLog) => void) | null = null;

// Function to set the system log handler from a component
export const setSystemLogHandler = (logHandler: (log: SystemLog) => void) => {
  systemLogFunction = logHandler;
};

// Variables to track model loading state
let modelsLoading = false;
let modelsLoaded = false;

/**
 * Check if models are loaded
 * @returns boolean indicating if models are loaded
 */
export const areModelsLoaded = (): boolean => {
  // Check both our local flag and face-api's internal state
  if (!modelsLoaded) {
    const faceApiReportsLoaded = (
      faceapi.nets.ssdMobilenetv1.isLoaded &&
      faceapi.nets.faceLandmark68Net.isLoaded &&
      faceapi.nets.faceRecognitionNet.isLoaded
    );
    
    // Update our local flag if face-api reports models are loaded
    if (faceApiReportsLoaded) {
      console.log('Face-api reports models are loaded');
      modelsLoaded = true;
    }
    
    return faceApiReportsLoaded;
  }
  
  return true;
};

/**
 * Initialize the face-api.js models
 * @param modelUrl Base URL for the models
 * @returns Promise that resolves to true if models loaded successfully
 */
export const initializeFaceApi = async (modelUrl: string): Promise<boolean> => {
  try {
    // If models are already loaded, return success
    if (areModelsLoaded()) {
      console.log('Models are already loaded');
      return true;
    }

    // If models are currently loading, wait for completion
    if (modelsLoading) {
      console.log('Models are currently loading');
      // Wait for models to finish loading
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (!modelsLoading) {
            clearInterval(interval);
            resolve(true);
          }
        }, 100);
      });
      return modelsLoaded;
    }

    // Set loading flag
    modelsLoading = true;
    
    // Setup TensorFlow backend first to ensure CPU usage on limited devices like Raspberry Pi
    await setupTensorFlowBackend();

    // Ensure model URL doesn't have a trailing slash
    const baseUrl = modelUrl.endsWith('/') ? modelUrl.slice(0, -1) : modelUrl;

    console.log('Attempting to load models from:', baseUrl);

    // Try loading models with explicit path resolution
    try {
      // First verify if model files are accessible
      const manifestFiles = [
        'ssd_mobilenetv1_model-weights_manifest.json',
        'face_landmark_68_model-weights_manifest.json',
        'face_recognition_model-weights_manifest.json'
      ];

      // Check if manifest files exist
      const manifestChecks = await Promise.all(
        manifestFiles.map(async (file) => {
          const response = await fetch(`${baseUrl}/${file}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch model file: ${file}`);
          }
          const json = await response.json().catch(() => {
            throw new Error(`Invalid JSON in model file: ${file}`);
          });
          return json;
        })
      );

      if (!manifestChecks.every(ok => ok)) {
        throw new Error('Model manifest files not accessible');
      }

      // Now load the models one by one
      await faceapi.nets.ssdMobilenetv1.loadFromUri(baseUrl);
      console.log('SSD MobileNet model loaded');

      await faceapi.nets.faceLandmark68Net.loadFromUri(baseUrl);
      console.log('Face landmark model loaded');

      await faceapi.nets.faceRecognitionNet.loadFromUri(baseUrl);
      console.log('Face recognition model loaded');

      // Verify models loaded correctly
      if (areModelsLoaded()) {
        console.log('All models loaded successfully');
        modelsLoading = false;
        modelsLoaded = true;

        if (systemLogFunction) {
          systemLogFunction({
            type: 'Info',
            message: 'Face recognition models loaded successfully',
            severity: 'Low'
          });
        }

        return true;
      }

      throw new Error('Models did not load properly after loading attempt');

    } catch (error) {
      console.error('Error during model loading:', error);
      throw error;
    }

  } catch (error) {
    console.error('Failed to load face detection models:', error);
    modelsLoading = false; // Reset loading flag on error
    modelsLoaded = false;

    if (systemLogFunction) {
      systemLogFunction({
        type: 'Error',
        message: `Failed to load face detection models: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'High',
        errorCode: 'FACE_API_001',
        suggestedResolution: 'Check if the model files are accessible in the public/models directory. Try running npm run setup-models to restore model files.'
      });
    }

    return false;
  }
};

/**
 * Create a face matcher from student data
 * @param students Array of students with face descriptors
 * @returns FaceMatcher object or null if no valid descriptors
 */
export const createFaceMatcher = (students: Student[]): faceapi.FaceMatcher | null => {
  try {
    // Filter students with face descriptors and consent
    const studentsWithDescriptors = students.filter(student => 
      student.consentGiven && 
      student.faceDescriptor && 
      student.faceDescriptor.length === 128
    );
    
    if (studentsWithDescriptors.length === 0) {
      console.warn('No students with valid face descriptors found');
      return null;
    }
    
    // Create labeled descriptors
    const labeledDescriptors = studentsWithDescriptors.map(student => {
      // Convert the stored number array back to Float32Array
      const descriptor = new Float32Array(student.faceDescriptor as number[]);
      
      return new faceapi.LabeledFaceDescriptors(
        student.name,
        [descriptor]
      );
    });
    
    // Create and return the face matcher with a suitable threshold
    return new faceapi.FaceMatcher(labeledDescriptors, 0.5);
  } catch (error) {
    console.error('Error creating face matcher:', error);
    
    if (systemLogFunction) {
      systemLogFunction({
        type: 'Error',
        message: `Error creating face matcher: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'Medium',
        errorCode: 'FACE_MATCHER_001',
        suggestedResolution: 'Check student face data for consistency'
      });
    }
    
    return null;
  }
};

/**
 * Log model loading errors to system logs
 * @param error The error to log
 */
export const logModelLoadingError = (error: any): void => {
  if (systemLogFunction) {
    systemLogFunction({
      type: 'Error',
      message: `Face detection model loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'High',
      errorCode: 'FACE_API_002',
      suggestedResolution: 'Check network connectivity and model files. Try running npm run setup-models to reinstall the models.'
    });
  } else {
    console.error('Face detection model loading failed:', error);
  }
};

/**
 * Extract face descriptor from an uploaded image file
 * @param file The uploaded image file
 * @returns Promise with extracted face descriptor or null if no face detected
 */
export const extractFaceDescriptorFromFile = async (
  file: File
): Promise<Float32Array | null> => {
  try {
    // Check if models are loaded
    if (!areModelsLoaded()) {
      throw new Error('Face detection models not loaded. Please initialize models first.');
    }
    
    // Create an image element to process
    const img = document.createElement('img');
    
    // Wait for the image to load from the file
    await new Promise<void>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        resolve();
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
    
    // Detect the face with landmarks and descriptor
    const detection = await faceapi.detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    // Release the object URL
    URL.revokeObjectURL(img.src);
    
    if (!detection) {
      console.warn('No face detected in the uploaded image');
      
      if (systemLogFunction) {
        systemLogFunction({
          type: 'Warning',
          message: 'No face detected in the uploaded image',
          severity: 'Medium',
          suggestedResolution: 'Upload an image with a clearly visible face'
        });
      }
      
      return null;
    }
    
    return detection.descriptor;
  } catch (error) {
    console.error('Error extracting face descriptor from file:', error);
    
    if (systemLogFunction) {
      systemLogFunction({
        type: 'Error',
        message: `Failed to process face image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'Medium',
        errorCode: 'FACE_EXTRACT_001',
        suggestedResolution: 'Try uploading a different image with a clear face'
      });
    }
    
    throw error;
  }
};

/**
 * Debug utility to test face recognition with different thresholds
 * @param testImg The image element to test against
 * @param students Array of students with face descriptors
 * @returns Promise with detailed matching results
 */
export const debugFaceRecognition = async (
  testImg: HTMLImageElement | HTMLVideoElement,
  students: Student[]
): Promise<any> => {
  try {
    if (!areModelsLoaded()) {
      throw new Error('Face detection models not loaded');
    }
    
    // Detect face in test image
    const detection = await faceapi.detectSingleFace(testImg)
      .withFaceLandmarks()
      .withFaceDescriptor();
      
    if (!detection) {
      return {
        success: false,
        error: 'No face detected in test image'
      };
    }
    
    // Filter valid students
    const validStudents = students.filter(s => 
      s.consentGiven && 
      s.faceDescriptor && 
      Array.isArray(s.faceDescriptor) && 
      s.faceDescriptor.length === 128
    );
    
    if (validStudents.length === 0) {
      return {
        success: false,
        error: 'No valid student face descriptors available'
      };
    }
    
    // Create descriptor objects for each student
    const labeledDescriptors = validStudents.map(student => {
      const descriptor = new Float32Array(student.faceDescriptor as number[]);
      return {
        student: student.name,
        descriptor
      };
    });
    
    // Test with multiple thresholds
    const thresholds = [0.4, 0.5, 0.6, 0.7, 0.8];
    const results = thresholds.map(threshold => {
      const faceMatcher = new faceapi.FaceMatcher(
        labeledDescriptors.map(d => 
          new faceapi.LabeledFaceDescriptors(d.student, [d.descriptor])
        ), 
        threshold
      );
      
      const match = faceMatcher.findBestMatch(detection.descriptor);
      
      return {
        threshold,
        bestMatch: match.label,
        distance: match.distance,
        isMatch: match.distance < threshold
      };
    });
    
    return {
      success: true,
      testImage: 'Face detected',
      detectionConfidence: detection.detection.score,
      studentsChecked: validStudents.map(s => s.name),
      results
    };
  } catch (error) {
    console.error('Error in debug face recognition:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};