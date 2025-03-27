#!/usr/bin/env node

/**
 * This script downloads the required face-api.js models for facial recognition
 * and places them in the public/models directory so they're accessible to the app
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define models path
const modelsDir = path.join(__dirname, '../public/models');

// Define required models and their URLs
const models = [
  {
    name: 'face_landmark_68_model-shard1',
    url: 'https://github.com/justadudewhohacks/face-api.js/blob/master/weights/face_landmark_68_model-shard1?raw=true',
    outputPath: path.join(modelsDir, 'face_landmark_68_model-shard1')
  },
  {
    name: 'face_landmark_68_model-weights_manifest.json',
    url: 'https://github.com/justadudewhohacks/face-api.js/blob/master/weights/face_landmark_68_model-weights_manifest.json?raw=true',
    outputPath: path.join(modelsDir, 'face_landmark_68_model-weights_manifest.json')
  },
  {
    name: 'face_recognition_model-shard1',
    url: 'https://github.com/justadudewhohacks/face-api.js/blob/master/weights/face_recognition_model-shard1?raw=true',
    outputPath: path.join(modelsDir, 'face_recognition_model-shard1')
  },
  {
    name: 'face_recognition_model-shard2',
    url: 'https://github.com/justadudewhohacks/face-api.js/blob/master/weights/face_recognition_model-shard2?raw=true',
    outputPath: path.join(modelsDir, 'face_recognition_model-shard2')
  },
  {
    name: 'face_recognition_model-weights_manifest.json',
    url: 'https://github.com/justadudewhohacks/face-api.js/blob/master/weights/face_recognition_model-weights_manifest.json?raw=true',
    outputPath: path.join(modelsDir, 'face_recognition_model-weights_manifest.json')
  },
  {
    name: 'ssd_mobilenetv1_model-shard1',
    url: 'https://github.com/justadudewhohacks/face-api.js/blob/master/weights/ssd_mobilenetv1_model-shard1?raw=true',
    outputPath: path.join(modelsDir, 'ssd_mobilenetv1_model-shard1')
  },
  {
    name: 'ssd_mobilenetv1_model-shard2',
    url: 'https://github.com/justadudewhohacks/face-api.js/blob/master/weights/ssd_mobilenetv1_model-shard2?raw=true',
    outputPath: path.join(modelsDir, 'ssd_mobilenetv1_model-shard2')
  },
  {
    name: 'ssd_mobilenetv1_model-weights_manifest.json',
    url: 'https://github.com/justadudewhohacks/face-api.js/blob/master/weights/ssd_mobilenetv1_model-weights_manifest.json?raw=true',
    outputPath: path.join(modelsDir, 'ssd_mobilenetv1_model-weights_manifest.json')
  }
];

// Create models directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
  console.log(`Creating models directory at ${modelsDir}`);
  fs.mkdirSync(modelsDir, { recursive: true });
}

// Function to download a file
const downloadFile = (url, outputPath) => {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${path.basename(outputPath)}...`);
    
    const file = fs.createWriteStream(outputPath);
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${path.basename(outputPath)}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(outputPath);
      console.error(`Error downloading ${path.basename(outputPath)}: ${err.message}`);
      reject(err);
    });
  });
};

// Download all models
async function downloadModels() {
  console.log('Starting download of face-api.js models...');
  
  try {
    // Download models in parallel
    await Promise.all(models.map(model => downloadFile(model.url, model.outputPath)));
    console.log('All models downloaded successfully!');
  } catch (error) {
    console.error('Error downloading models:', error);
    process.exit(1);
  }
}

// Run the download
downloadModels();