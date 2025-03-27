# AI-Powered Attendance System

A modern attendance tracking system using facial recognition technology, built with React, TypeScript, and Material-UI.

## Features

- **Live Face Detection**: Real-time student recognition via webcam
- **Dashboard Analytics**: Visual representation of attendance data
- **Student Management**: CRUD operations for student information
- **Attendance Logs**: Comprehensive attendance record viewing and filtering
- **System Configuration**: Customize detection sensitivity and system settings
- **Error Monitoring**: Track and diagnose system issues

## Technology Stack

- **Frontend**: React + TypeScript + Material-UI
- **Data Visualization**: Chart.js with react-chartjs-2
- **Facial Recognition**: face-api.js
- **Database**: MongoDB (Mongoose) - Mock data in development version
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ai-powered-attendance-system.git
   cd ai-powered-attendance-system
   ```

2. Install dependencies:
   ```
   npm install
   ```
   This will also automatically download the required face-api.js models.

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### Live Feed

1. Allow camera access when prompted
2. Select a course from the dropdown
3. Click "Start Tracking" to begin face detection
4. Detected students will appear in the side panel
5. Click "Post Attendance" to save the attendance record

### Student Management

1. Add new students with their information and photo
2. Students must provide consent for facial recognition to comply with GDPR
3. Import/export student data using CSV functionality

### System Configuration

1. Configure camera and detection settings
2. Adjust recognition threshold based on environment conditions
3. Set up logging preferences and security options

## Deployment

To build for production:

```
npm run build
```

This will create optimized files in the `dist` folder that can be deployed to any static hosting service.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- face-api.js for the facial recognition capabilities
- Material-UI for the component library
- The entire open-source community for their invaluable tools and libraries