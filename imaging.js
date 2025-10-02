// AJR Medical Imaging System - Imaging Functions
// Advanced image processing and visualization

class MedicalImagingProcessor {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.currentImage = null;
        this.imageData = null;
        this.originalImageData = null;
        this.processingSettings = {
            contrast: 1.0,
            brightness: 0,
            sharpness: 1.0,
            gamma: 1.0,
            windowLevel: 400,
            windowWidth: 1000
        };
        
        this.measurements = [];
        this.annotations = [];
        this.rois = [];
        
        this.initializeImaging();
    }

    initializeImaging() {
        this.setupCanvas();
        this.setupImageProcessing();
        this.setupMeasurementTools();
        this.setupAnnotationTools();
    }

    setupCanvas() {
        // Create or get canvas element
        this.canvas = document.getElementById('imageCanvas') || this.createCanvas();
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas properties for medical imaging
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.id = 'imageCanvas';
        canvas.width = 512;
        canvas.height = 512;
        canvas.style.display = 'none';
        document.body.appendChild(canvas);
        return canvas;
    }

    setupImageProcessing() {
        // Initialize Web Workers for heavy processing if available
        if (typeof Worker !== 'undefined') {
            this.initializeWebWorkers();
        }
        
        // Set up real-time processing pipeline
        this.processingPipeline = [
            this.applyWindowLevel.bind(this),
            this.applyContrast.bind(this),
            this.applyBrightness.bind(this),
            this.applySharpening.bind(this),
            this.applyNoiseReduction.bind(this)
        ];
    }

    initializeWebWorkers() {
        // Web Worker for image processing
        const workerScript = `
            self.onmessage = function(e) {
                const { imageData, operations } = e.data;
                const data = imageData.data;
                
                operations.forEach(operation => {
                    switch (operation.type) {
                        case 'brightness':
                            adjustBrightness(data, operation.value);
                            break;
                        case 'contrast':
                            adjustContrast(data, operation.value);
                            break;
                        case 'sharpen':
                            applySharpening(data, imageData.width, imageData.height);
                            break;
                    }
                });
                
                self.postMessage({ imageData: imageData });
            };
            
            function adjustBrightness(data, value) {
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, Math.max(0, data[i] + value));
                    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + value));
                    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + value));
                }
            }
            
            function adjustContrast(data, value) {
                const factor = (259 * (value + 255)) / (255 * (259 - value));
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
                    data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
                    data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
                }
            }
            
            function applySharpening(data, width, height) {
                // Simplified sharpening kernel
                const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
                const tempData = new Uint8ClampedArray(data);
                
                for (let y = 1; y < height - 1; y++) {
                    for (let x = 1; x < width - 1; x++) {
                        const idx = (y * width + x) * 4;
                        let r = 0, g = 0, b = 0;
                        
                        for (let ky = -1; ky <= 1; ky++) {
                            for (let kx = -1; kx <= 1; kx++) {
                                const kidx = ((y + ky) * width + (x + kx)) * 4;
                                const k = kernel[(ky + 1) * 3 + (kx + 1)];
                                r += tempData[kidx] * k;
                                g += tempData[kidx + 1] * k;
                                b += tempData[kidx + 2] * k;
                            }
                        }
                        
                        data[idx] = Math.min(255, Math.max(0, r));
                        data[idx + 1] = Math.min(255, Math.max(0, g));
                        data[idx + 2] = Math.min(255, Math.max(0, b));
                    }
                }
            }
        `;
        
        try {
            const blob = new Blob([workerScript], { type: 'application/javascript' });
            this.imageWorker = new Worker(URL.createObjectURL(blob));
            
            this.imageWorker.onmessage = (e) => {
                this.processedImageData = e.data.imageData;
                this.displayProcessedImage();
            };
        } catch (error) {
            console.warn('Web Worker initialization failed:', error);
        }
    }

    // Image loading and display
    loadImage(imageSource) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                this.currentImage = img;
                this.displayImage(img);
                resolve(img);
            };
            
            img.onerror = (error) => {
                reject(error);
            };
            
            if (typeof imageSource === 'string') {
                img.src = imageSource;
            } else if (imageSource instanceof File) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    img.src = e.target.result;
                };
                reader.readAsDataURL(imageSource);
            } else {
                reject(new Error('Invalid image source'));
            }
        });
    }

    displayImage(img) {
        // Resize canvas to fit image while maintaining aspect ratio
        const maxSize = 512;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
            if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
            }
        } else {
            if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
            }
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Draw image
        this.ctx.drawImage(img, 0, 0, width, height);
        
        // Store original image data
        this.originalImageData = this.ctx.getImageData(0, 0, width, height);
        this.imageData = new ImageData(
            new Uint8ClampedArray(this.originalImageData.data),
            width,
            height
        );
        
        // Apply initial processing
        this.processImage();
    }

    displayProcessedImage() {
        if (this.processedImageData) {
            this.ctx.putImageData(this.processedImageData, 0, 0);
        }
    }

    // Image processing functions
    processImage() {
        if (!this.imageData) return;
        
        // Reset to original
        this.imageData.data.set(this.originalImageData.data);
        
        // Apply processing pipeline
        this.processingPipeline.forEach(operation => {
            operation(this.imageData);
        });
        
        // Update display
        this.ctx.putImageData(this.imageData, 0, 0);
    }

    applyWindowLevel(imageData) {
        const { windowLevel, windowWidth } = this.processingSettings;
        const minValue = windowLevel - windowWidth / 2;
        const maxValue = windowLevel + windowWidth / 2;
        const range = maxValue - minValue;
        
        for (let i = 0; i < imageData.data.length; i += 4) {
            // Apply to grayscale (assuming medical image)
            const gray = imageData.data[i];
            const normalized = Math.max(0, Math.min(255, ((gray - minValue) / range) * 255));
            
            imageData.data[i] = normalized;     // R
            imageData.data[i + 1] = normalized; // G
            imageData.data[i + 2] = normalized; // B
            // Alpha channel remains unchanged
        }
    }

    applyContrast(imageData) {
        const contrast = this.processingSettings.contrast;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        
        for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = Math.min(255, Math.max(0, factor * (imageData.data[i] - 128) + 128));
            imageData.data[i + 1] = Math.min(255, Math.max(0, factor * (imageData.data[i + 1] - 128) + 128));
            imageData.data[i + 2] = Math.min(255, Math.max(0, factor * (imageData.data[i + 2] - 128) + 128));
        }
    }

    applyBrightness(imageData) {
        const brightness = this.processingSettings.brightness;
        
        for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = Math.min(255, Math.max(0, imageData.data[i] + brightness));
            imageData.data[i + 1] = Math.min(255, Math.max(0, imageData.data[i + 1] + brightness));
            imageData.data[i + 2] = Math.min(255, Math.max(0, imageData.data[i + 2] + brightness));
        }
    }

    applySharpening(imageData) {
        if (this.processingSettings.sharpness <= 1.0) return;
        
        const width = imageData.width;
        const height = imageData.height;
        const tempData = new Uint8ClampedArray(imageData.data);
        
        // Sharpening kernel
        const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
        const kernelWeight = 1;
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                
                for (let channel = 0; channel < 3; channel++) {
                    let sum = 0;
                    
                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            const kidx = ((y + ky) * width + (x + kx)) * 4 + channel;
                            const k = kernel[(ky + 1) * 3 + (kx + 1)];
                            sum += tempData[kidx] * k;
                        }
                    }
                    
                    imageData.data[idx + channel] = Math.min(255, Math.max(0, sum / kernelWeight));
                }
            }
        }
    }

    applyNoiseReduction(imageData) {
        // Simple Gaussian blur for noise reduction
        const width = imageData.width;
        const height = imageData.height;
        const tempData = new Uint8ClampedArray(imageData.data);
        
        // 3x3 Gaussian kernel
        const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
        const kernelWeight = 16;
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                
                for (let channel = 0; channel < 3; channel++) {
                    let sum = 0;
                    
                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            const kidx = ((y + ky) * width + (x + kx)) * 4 + channel;
                            const k = kernel[(ky + 1) * 3 + (kx + 1)];
                            sum += tempData[kidx] * k;
                        }
                    }
                    
                    imageData.data[idx + channel] = sum / kernelWeight;
                }
            }
        }
    }

    // Measurement tools
    setupMeasurementTools() {
        this.measurements = [];
        this.currentMeasurement = null;
    }

    startLengthMeasurement(x, y) {
        this.currentMeasurement = {
            type: 'length',
            startX: x,
            startY: y,
            endX: x,
            endY: y,
            completed: false
        };
    }

    updateLengthMeasurement(x, y) {
        if (this.currentMeasurement && this.currentMeasurement.type === 'length') {
            this.currentMeasurement.endX = x;
            this.currentMeasurement.endY = y;
            this.redrawMeasurements();
        }
    }

    completeLengthMeasurement() {
        if (this.currentMeasurement) {
            this.currentMeasurement.completed = true;
            this.currentMeasurement.length = this.calculateDistance(
                this.currentMeasurement.startX,
                this.currentMeasurement.startY,
                this.currentMeasurement.endX,
                this.currentMeasurement.endY
            );
            
            this.measurements.push(this.currentMeasurement);
            this.currentMeasurement = null;
            this.redrawMeasurements();
        }
    }

    calculateDistance(x1, y1, x2, y2) {
        const pixelSpacing = 0.5; // mm/pixel (should come from DICOM)
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        return distance * pixelSpacing;
    }

    startAngleMeasurement(x, y) {
        this.currentMeasurement = {
            type: 'angle',
            points: [{ x, y }],
            completed: false
        };
    }

    addAnglePoint(x, y) {
        if (this.currentMeasurement && this.currentMeasurement.type === 'angle') {
            this.currentMeasurement.points.push({ x, y });
            
            if (this.currentMeasurement.points.length === 3) {
                this.completeAngleMeasurement();
            }
        }
    }

    completeAngleMeasurement() {
        if (this.currentMeasurement && this.currentMeasurement.points.length === 3) {
            const p1 = this.currentMeasurement.points[0];
            const p2 = this.currentMeasurement.points[1];
            const p3 = this.currentMeasurement.points[2];
            
            const angle = this.calculateAngle(p1, p2, p3);
            this.currentMeasurement.angle = angle;
            this.currentMeasurement.completed = true;
            
            this.measurements.push(this.currentMeasurement);
            this.currentMeasurement = null;
            this.redrawMeasurements();
        }
    }

    calculateAngle(p1, p2, p3) {
        const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
        const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
        
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        
        const cosAngle = dot / (mag1 * mag2);
        const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
        
        return angle * (180 / Math.PI); // Convert to degrees
    }

    redrawMeasurements() {
        // Redraw the base image
        if (this.imageData) {
            this.ctx.putImageData(this.imageData, 0, 0);
        }
        
        // Draw all completed measurements
        this.measurements.forEach(measurement => {
            this.drawMeasurement(measurement);
        });
        
        // Draw current measurement if exists
        if (this.currentMeasurement) {
            this.drawMeasurement(this.currentMeasurement);
        }
    }

    drawMeasurement(measurement) {
        this.ctx.save();
        this.ctx.strokeStyle = '#FF3B30';
        this.ctx.lineWidth = 2;
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#FF3B30';
        
        if (measurement.type === 'length') {
            this.ctx.beginPath();
            this.ctx.moveTo(measurement.startX, measurement.startY);
            this.ctx.lineTo(measurement.endX, measurement.endY);
            this.ctx.stroke();
            
            if (measurement.completed) {
                const midX = (measurement.startX + measurement.endX) / 2;
                const midY = (measurement.startY + measurement.endY) / 2;
                this.ctx.fillText(`${measurement.length.toFixed(2)} mm`, midX + 5, midY - 5);
            }
        } else if (measurement.type === 'angle' && measurement.points.length >= 2) {
            this.ctx.beginPath();
            for (let i = 1; i < measurement.points.length; i++) {
                const prev = measurement.points[i - 1];
                const curr = measurement.points[i];
                this.ctx.moveTo(prev.x, prev.y);
                this.ctx.lineTo(curr.x, curr.y);
            }
            this.ctx.stroke();
            
            if (measurement.completed) {
                const center = measurement.points[1];
                this.ctx.fillText(`${measurement.angle.toFixed(1)}°`, center.x + 5, center.y - 5);
            }
        }
        
        this.ctx.restore();
    }

    // Annotation tools
    setupAnnotationTools() {
        this.annotations = [];
        this.currentAnnotation = null;
    }

    addTextAnnotation(x, y, text) {
        const annotation = {
            type: 'text',
            x: x,
            y: y,
            text: text,
            color: '#007AFF',
            fontSize: 14
        };
        
        this.annotations.push(annotation);
        this.redrawAnnotations();
    }

    addArrowAnnotation(x1, y1, x2, y2) {
        const annotation = {
            type: 'arrow',
            startX: x1,
            startY: y1,
            endX: x2,
            endY: y2,
            color: '#FF3B30'
        };
        
        this.annotations.push(annotation);
        this.redrawAnnotations();
    }

    redrawAnnotations() {
        // Redraw the base image with measurements
        this.redrawMeasurements();
        
        // Draw annotations
        this.annotations.forEach(annotation => {
            this.drawAnnotation(annotation);
        });
    }

    drawAnnotation(annotation) {
        this.ctx.save();
        
        if (annotation.type === 'text') {
            this.ctx.font = `${annotation.fontSize}px Arial`;
            this.ctx.fillStyle = annotation.color;
            this.ctx.fillText(annotation.text, annotation.x, annotation.y);
        } else if (annotation.type === 'arrow') {
            this.ctx.strokeStyle = annotation.color;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(annotation.startX, annotation.startY);
            this.ctx.lineTo(annotation.endX, annotation.endY);
            this.ctx.stroke();
            
            // Draw arrowhead
            this.drawArrowhead(annotation.endX, annotation.endY, annotation.startX, annotation.startY);
        }
        
        this.ctx.restore();
    }

    drawArrowhead(x, y, fromX, fromY) {
        const headLength = 10;
        const angle = Math.atan2(y - fromY, x - fromX);
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(
            x - headLength * Math.cos(angle - Math.PI / 6),
            y - headLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(
            x - headLength * Math.cos(angle + Math.PI / 6),
            y - headLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
    }

    // Processing settings
    updateProcessingSettings(settings) {
        this.processingSettings = { ...this.processingSettings, ...settings };
        this.processImage();
    }

    resetProcessing() {
        this.processingSettings = {
            contrast: 1.0,
            brightness: 0,
            sharpness: 1.0,
            gamma: 1.0,
            windowLevel: 400,
            windowWidth: 1000
        };
        
        if (this.originalImageData) {
            this.imageData = new ImageData(
                new Uint8ClampedArray(this.originalImageData.data),
                this.originalImageData.width,
                this.originalImageData.height
            );
            this.processImage();
        }
    }

    // Export functions
    exportImage(format = 'png', quality = 0.9) {
        if (!this.canvas) return null;
        
        return this.canvas.toDataURL(`image/${format}`, quality);
    }

    exportProcessedImageData() {
        if (!this.imageData) return null;
        
        return {
            width: this.imageData.width,
            height: this.imageData.height,
            data: Array.from(this.imageData.data)
        };
    }

    // Utility functions
    getImageStats() {
        if (!this.imageData) return null;
        
        const data = this.imageData.data;
        let min = 255, max = 0, sum = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i]; // Assuming grayscale
            min = Math.min(min, gray);
            max = Math.max(max, gray);
            sum += gray;
        }
        
        const mean = sum / (data.length / 4);
        
        return {
            min: min,
            max: max,
            mean: mean,
            range: max - min,
            std: this.calculateStandardDeviation(data, mean)
        };
    }

    calculateStandardDeviation(data, mean) {
        let sumSquaredDiff = 0;
        let count = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i];
            sumSquaredDiff += Math.pow(gray - mean, 2);
            count++;
        }
        
        return Math.sqrt(sumSquaredDiff / count);
    }
}

// Advanced Imaging Modes Extension
class AdvancedImagingModes extends MedicalImagingProcessor {
    constructor() {
        super();
        this.currentMode = 'normal';
    }
    
    // Fluoroscopy mode with real-time noise and contrast enhancement
    applyFluoroscopyMode() {
        this.currentMode = 'fluoroscopy';
        
        if (!this.imageData) return;
        
        const data = this.imageData.data;
        const originalData = this.originalImageData.data;
        
        // Apply fluoroscopy characteristics
        for (let i = 0; i < data.length; i += 4) {
            const pixel = originalData[i];
            
            // Add quantum noise (Poisson distribution approximation)
            const noise = this.generateQuantumNoise(pixel);
            let adjusted = pixel + noise;
            
            // Apply gamma correction for fluoroscopy
            adjusted = Math.pow(adjusted / 255, 0.8) * 255;
            
            // Add green tint characteristic of fluoroscopy
            data[i] = Math.max(0, Math.min(255, adjusted * 0.9));     // Red (slightly reduced)
            data[i + 1] = Math.max(0, Math.min(255, adjusted * 1.1)); // Green (enhanced)
            data[i + 2] = Math.max(0, Math.min(255, adjusted * 0.9)); // Blue (slightly reduced)
        }
        
        this.updateCanvas();
    }
    
    // Roadmap mode for DSA procedures
    applyRoadmapMode() {
        this.currentMode = 'roadmap';
        
        if (!this.imageData) return;
        
        const data = this.imageData.data;
        const originalData = this.originalImageData.data;
        
        // Invert and enhance contrast for roadmap
        for (let i = 0; i < data.length; i += 4) {
            const pixel = originalData[i];
            
            // Invert image
            let inverted = 255 - pixel;
            
            // Enhance contrast
            inverted = ((inverted - 128) * 1.5) + 128;
            inverted = Math.max(0, Math.min(255, inverted));
            
            data[i] = data[i + 1] = data[i + 2] = inverted;
        }
        
        this.updateCanvas();
    }
    
    // Cine mode for dynamic studies
    applyCineMode() {
        this.currentMode = 'cine';
        
        if (!this.imageData) return;
        
        const data = this.imageData.data;
        const originalData = this.originalImageData.data;
        
        // High contrast for cine mode
        for (let i = 0; i < data.length; i += 4) {
            const pixel = originalData[i];
            
            // Apply high contrast
            let contrast = ((pixel - 128) * 1.8) + 128;
            contrast = Math.max(0, Math.min(255, contrast));
            
            data[i] = data[i + 1] = data[i + 2] = contrast;
        }
        
        this.updateCanvas();
    }
    
    // DSA (Digital Subtraction Angiography) mode
    applyDSAMode() {
        this.currentMode = 'dsa';
        
        if (!this.imageData) return;
        
        const data = this.imageData.data;
        const originalData = this.originalImageData.data;
        
        // High contrast black and white for DSA
        for (let i = 0; i < data.length; i += 4) {
            const pixel = originalData[i];
            
            // Threshold to black and white
            const threshold = pixel > 100 ? 255 : 0;
            
            data[i] = data[i + 1] = data[i + 2] = threshold;
        }
        
        this.updateCanvas();
    }
    
    // Trace mode with edge enhancement
    applyTraceMode() {
        this.currentMode = 'trace';
        
        if (!this.imageData) return;
        
        const data = this.imageData.data;
        const originalData = this.originalImageData.data;
        const width = this.canvas.width;
        
        // Apply edge enhancement
        for (let i = 0; i < data.length; i += 4) {
            const pixel = originalData[i];
            const edge = this.calculateEdgeStrength(i, originalData, width);
            const enhanced = pixel + (edge * 0.5);
            
            data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, enhanced));
        }
        
        this.updateCanvas();
    }
    
    // Rad mode for radiographic images
    applyRadMode() {
        this.currentMode = 'rad';
        
        if (!this.imageData) return;
        
        const data = this.imageData.data;
        const originalData = this.originalImageData.data;
        
        // High resolution, high contrast for radiographic images
        for (let i = 0; i < data.length; i += 4) {
            const pixel = originalData[i];
            
            // Enhance contrast and sharpness
            let enhanced = ((pixel - 128) * 1.2) + 128;
            enhanced = Math.max(0, Math.min(255, enhanced));
            
            data[i] = data[i + 1] = data[i + 2] = enhanced;
        }
        
        this.updateCanvas();
    }
    
    // Generate quantum noise for fluoroscopy simulation
    generateQuantumNoise(signal) {
        // Simulate quantum noise based on signal strength
        const noiseLevel = Math.sqrt(Math.max(1, signal)) * 2;
        return (Math.random() - 0.5) * noiseLevel;
    }
    
    // Calculate edge strength for trace mode
    calculateEdgeStrength(index, data, width) {
        const x = (index / 4) % width;
        const y = Math.floor((index / 4) / width);
        
        if (x < 1 || x >= width - 1 || y < 1 || y >= width - 1) {
            return 0;
        }
        
        const current = data[index];
        const left = data[index - 4];
        const right = data[index + 4];
        const top = data[index - (width * 4)];
        const bottom = data[index + (width * 4)];
        
        const gradientX = Math.abs(right - left);
        const gradientY = Math.abs(bottom - top);
        
        return Math.sqrt(gradientX * gradientX + gradientY * gradientY);
    }
    
    // Reset to normal mode
    applyNormalMode() {
        this.currentMode = 'normal';
        this.processImage(); // Reset to original processing pipeline
    }
    
    // Get current imaging mode
    getCurrentMode() {
        return this.currentMode;
    }
    
    // Image enhancement functions
    enhanceContrast(factor) {
        this.processingSettings.contrast = factor;
        this.applyImageEnhancements();
    }
    
    adjustBrightness(value) {
        this.processingSettings.brightness = value;
        this.applyImageEnhancements();
    }
    
    adjustGamma(gamma) {
        this.processingSettings.gamma = gamma;
        this.applyImageEnhancements();
    }
    
    applyImageEnhancements() {
        if (!this.imageData) return;
        
        const data = this.imageData.data;
        const originalData = this.originalImageData.data;
        const contrast = this.processingSettings.contrast;
        const brightness = this.processingSettings.brightness;
        const gamma = this.processingSettings.gamma;
        
        for (let i = 0; i < data.length; i += 4) {
            const pixel = originalData[i];
            
            // Apply contrast
            let adjusted = ((pixel - 128) * contrast) + 128;
            
            // Apply brightness
            adjusted += brightness;
            
            // Apply gamma correction
            adjusted = Math.pow(Math.max(0, adjusted) / 255, gamma) * 255;
            
            // Clamp to valid range
            adjusted = Math.max(0, Math.min(255, adjusted));
            
            data[i] = data[i + 1] = data[i + 2] = Math.floor(adjusted);
        }
        
        this.updateCanvas();
    }
    
    // Real-time image processing for live fluoroscopy
    startLiveProcessing(mode = 'fluoroscopy') {
        this.liveProcessingInterval = setInterval(() => {
            if (this.currentMode === 'fluoroscopy') {
                this.applyFluoroscopyMode();
            }
        }, 100); // Update every 100ms for live effect
    }
    
    stopLiveProcessing() {
        if (this.liveProcessingInterval) {
            clearInterval(this.liveProcessingInterval);
            this.liveProcessingInterval = null;
        }
    }
    
    // Image analysis functions
    calculateROIStatistics(x, y, width, height) {
        if (!this.imageData) return null;
        
        const data = this.imageData.data;
        let sum = 0;
        let min = 255;
        let max = 0;
        let count = 0;
        
        for (let py = y; py < y + height && py < this.canvas.height; py++) {
            for (let px = x; px < x + width && px < this.canvas.width; px++) {
                const index = (py * this.canvas.width + px) * 4;
                const pixel = data[index];
                
                sum += pixel;
                min = Math.min(min, pixel);
                max = Math.max(max, pixel);
                count++;
            }
        }
        
        return {
            mean: sum / count,
            min: min,
            max: max,
            std: this.calculateStandardDeviation(data, x, y, width, height),
            area: count,
            pixels: count
        };
    }
    
    calculateStandardDeviation(data, x, y, width, height) {
        let sum = 0;
        let sumSquared = 0;
        let count = 0;
        
        for (let py = y; py < y + height && py < this.canvas.height; py++) {
            for (let px = x; px < x + width && px < this.canvas.width; px++) {
                const index = (py * this.canvas.width + px) * 4;
                const pixel = data[index];
                
                sum += pixel;
                sumSquared += pixel * pixel;
                count++;
            }
        }
        
        const mean = sum / count;
        const variance = (sumSquared / count) - (mean * mean);
        
        return Math.sqrt(variance);
    }
}

// Advanced visualization using WebGL for performance
class WebGLImageRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }
        
        this.initializeWebGL();
    }

    initializeWebGL() {
        const vertexShaderSource = `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            uniform vec2 u_resolution;
            varying vec2 v_texCoord;
            
            void main() {
                vec2 clipSpace = ((a_position / u_resolution) * 2.0 - 1.0) * vec2(1, -1);
                gl_Position = vec4(clipSpace, 0, 1);
                v_texCoord = a_texCoord;
            }
        `;
        
        const fragmentShaderSource = `
            precision mediump float;
            uniform sampler2D u_image;
            uniform float u_contrast;
            uniform float u_brightness;
            uniform float u_gamma;
            uniform float u_windowLevel;
            uniform float u_windowWidth;
            varying vec2 v_texCoord;
            
            void main() {
                vec4 color = texture2D(u_image, v_texCoord);
                
                // Window/Level adjustment
                float minVal = u_windowLevel - u_windowWidth / 2.0;
                float maxVal = u_windowLevel + u_windowWidth / 2.0;
                float normalized = (color.r - minVal) / (maxVal - minVal);
                normalized = clamp(normalized, 0.0, 1.0);
                
                // Gamma correction
                normalized = pow(normalized, 1.0 / u_gamma);
                
                // Brightness and contrast
                normalized = (normalized - 0.5) * u_contrast + 0.5 + u_brightness;
                normalized = clamp(normalized, 0.0, 1.0);
                
                gl_FragColor = vec4(normalized, normalized, normalized, color.a);
            }
        `;
        
        this.program = this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
        this.gl.useProgram(this.program);
        
        // Set up attributes and uniforms
        this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.texCoordLocation = this.gl.getAttribLocation(this.program, 'a_texCoord');
        this.resolutionLocation = this.gl.getUniformLocation(this.program, 'u_resolution');
        this.imageLocation = this.gl.getUniformLocation(this.program, 'u_image');
        this.contrastLocation = this.gl.getUniformLocation(this.program, 'u_contrast');
        this.brightnessLocation = this.gl.getUniformLocation(this.program, 'u_brightness');
        this.gammaLocation = this.gl.getUniformLocation(this.program, 'u_gamma');
        this.windowLevelLocation = this.gl.getUniformLocation(this.program, 'u_windowLevel');
        this.windowWidthLocation = this.gl.getUniformLocation(this.program, 'u_windowWidth');
        
        this.setupBuffers();
        this.setupTexture();
    }

    createShaderProgram(vertexSource, fragmentSource) {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            throw new Error('Shader program linking failed: ' + this.gl.getProgramInfoLog(program));
        }
        
        return program;
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            throw new Error('Shader compilation failed: ' + this.gl.getShaderInfoLog(shader));
        }
        
        return shader;
    }

    setupBuffers() {
        // Create vertex buffer
        const positions = new Float32Array([
            0, 0, 0, 0,
            this.canvas.width, 0, 1, 0,
            0, this.canvas.height, 0, 1,
            0, this.canvas.height, 0, 1,
            this.canvas.width, 0, 1, 0,
            this.canvas.width, this.canvas.height, 1, 1
        ]);
        
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
        
        // Set up attributes
        this.gl.enableVertexAttribArray(this.positionLocation);
        this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 16, 0);
        
        this.gl.enableVertexAttribArray(this.texCoordLocation);
        this.gl.vertexAttribPointer(this.texCoordLocation, 2, this.gl.FLOAT, false, 16, 8);
    }

    setupTexture() {
        this.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        
        // Set texture parameters
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    }

    loadImageData(imageData) {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            imageData.width,
            imageData.height,
            0,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            imageData.data
        );
        
        // Update canvas size
        this.canvas.width = imageData.width;
        this.canvas.height = imageData.height;
        this.gl.viewport(0, 0, imageData.width, imageData.height);
        
        // Set resolution uniform
        this.gl.uniform2f(this.resolutionLocation, imageData.width, imageData.height);
    }

    setProcessingParameters(params) {
        this.gl.uniform1f(this.contrastLocation, params.contrast || 1.0);
        this.gl.uniform1f(this.brightnessLocation, params.brightness || 0.0);
        this.gl.uniform1f(this.gammaLocation, params.gamma || 1.0);
        this.gl.uniform1f(this.windowLevelLocation, params.windowLevel || 400.0);
        this.gl.uniform1f(this.windowWidthLocation, params.windowWidth || 1000.0);
    }

    render() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MedicalImagingProcessor, WebGLImageRenderer };
}

// Initialize imaging processor globally
let imagingProcessor;

document.addEventListener('DOMContentLoaded', function() {
    try {
        imagingProcessor = new MedicalImagingProcessor();
        window.imagingProcessor = imagingProcessor;
        
        console.log('Medical Imaging Processor initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Medical Imaging Processor:', error);
    }
});