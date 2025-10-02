// AJR Medical Imaging System - Core JavaScript Functions
// Main application logic and utilities

class AJRMedicalSystem {
    constructor() {
        this.currentUser = null;
        this.patients = [];
        this.studies = [];
        this.images = [];
        this.isLive = false;
        this.totalDose = 0;
        this.studyStartTime = null;
        
        this.initializeSystem();
    }

    initializeSystem() {
        this.loadSampleData();
        this.setupEventListeners();
        this.initializeAnimations();
    }

    loadSampleData() {
        // Sample patient data
        this.patients = [
            {
                id: 'PT001',
                name: 'John Smith',
                gender: 'Male',
                age: 45,
                dob: '1979-03-15',
                procedure: 'Orthopedic',
                study: 'Knee Joint',
                status: 'scheduled',
                previousImages: 2
            },
            {
                id: 'PT002',
                name: 'Sarah Johnson',
                gender: 'Female',
                age: 32,
                dob: '1992-07-22',
                procedure: 'Vascular',
                study: 'Abdominal Aorta',
                status: 'scheduled',
                previousImages: 0
            },
            {
                id: 'PT003',
                name: 'Michael Brown',
                gender: 'Male',
                age: 67,
                dob: '1957-11-08',
                procedure: 'Cardiac',
                study: 'Coronary Angiography',
                status: 'emergency',
                previousImages: 1
            }
        ];

        // Sample studies data
        this.studies = [
            {
                id: 'ST001',
                patientId: 'PT001',
                patientName: 'John Smith',
                procedure: 'Orthopedic',
                studyType: 'Knee Joint - Fluoroscopy',
                images: 15,
                dateTime: new Date().toLocaleString(),
                status: 'Completed',
                type: 'fluoro',
                dose: 2.3,
                duration: 12
            },
            {
                id: 'ST002',
                patientId: 'PT002',
                patientName: 'Sarah Johnson',
                procedure: 'Vascular',
                studyType: 'Abdominal Aorta - DSA',
                images: 8,
                dateTime: new Date().toLocaleString(),
                status: 'Completed',
                type: 'fluoro',
                dose: 1.8,
                duration: 8
            }
        ];
    }

    setupEventListeners() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Window resize handler
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });

        // Visibility change handler for auto-save
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.autoSave();
            }
        });
    }

    initializeAnimations() {
        // Set up global animation defaults
        anime.suspendWhenDocumentHidden = false;
        
        // Add loading animations to all buttons
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', this.animateButtonClick);
        });
    }

    handleKeyboardShortcuts(event) {
        // Emergency stop - Space bar
        if (event.code === 'Space' && event.ctrlKey) {
            event.preventDefault();
            this.emergencyStop();
        }

        // Quick save - Ctrl + S
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            this.quickSave();
        }

        // Toggle live imaging - L key
        if (event.key === 'l' && event.ctrlKey) {
            event.preventDefault();
            this.toggleLiveImaging();
        }

        // Navigate to worklist - F1
        if (event.key === 'F1') {
            event.preventDefault();
            window.location.href = 'worklist.html';
        }

        // Navigate to examination - F2
        if (event.key === 'F2') {
            event.preventDefault();
            window.location.href = 'examination.html';
        }

        // Navigate to CBCT - F3
        if (event.key === 'F3') {
            event.preventDefault();
            window.location.href = 'cbct-workflow.html';
        }
    }

    handleWindowResize() {
        // Recalculate layouts and resize charts
        const charts = document.querySelectorAll('[id$="Chart"]');
        charts.forEach(chart => {
            if (chart && typeof echarts !== 'undefined') {
                const chartInstance = echarts.getInstanceByDom(chart);
                if (chartInstance) {
                    chartInstance.resize();
                }
            }
        });
    }

    animateButtonClick(event) {
        const button = event.currentTarget;
        
        // Create ripple effect
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // Authentication functions
    authenticateUser(username, password) {
        // Default credentials
        const defaultCredentials = {
            username: 'ajr',
            password: 's'
        };

        if (username === defaultCredentials.username && password === defaultCredentials.password) {
            this.currentUser = {
                username: username,
                role: 'physician',
                loginTime: new Date(),
                sessionId: this.generateSessionId()
            };
            
            this.startSessionTimer();
            return true;
        }
        
        return false;
    }

    generateSessionId() {
        return 'session_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    startSessionTimer() {
        // Auto-logout after 30 minutes of inactivity
        let inactivityTimer;
        
        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                this.logoutUser();
            }, 30 * 60 * 1000); // 30 minutes
        };
        
        // Reset timer on user activity
        ['click', 'keypress', 'mousemove'].forEach(event => {
            document.addEventListener(event, resetTimer);
        });
        
        resetTimer();
    }

    logoutUser() {
        this.currentUser = null;
        window.location.href = 'index.html';
    }

    // Patient management functions
    addPatient(patientData) {
        const patient = {
            id: this.generatePatientId(),
            ...patientData,
            createdAt: new Date(),
            status: 'registered'
        };
        
        this.patients.push(patient);
        this.saveToLocalStorage();
        return patient;
    }
    
    // Emergency patient registration
    createEmergencyPatient() {
        const emergencyId = 'EMG' + Date.now().toString().slice(-4);
        const emergencyPatient = {
            id: emergencyId,
            name: 'Emergency Patient',
            gender: 'Unknown',
            age: 'Unknown',
            procedure: 'Emergency',
            study: 'Emergency Procedure',
            status: 'emergency',
            priority: 'critical',
            createdAt: new Date()
        };
        
        this.patients.push(emergencyPatient);
        this.saveToLocalStorage();
        return emergencyPatient;
    }
    
    // Study management functions
    startStudy(patientId, studyType) {
        const study = {
            id: 'ST' + Date.now().toString().slice(-6),
            patientId: patientId,
            type: studyType,
            startTime: new Date(),
            status: 'in_progress',
            images: 0,
            dose: 0,
            duration: 0
        };
        
        this.studies.push(study);
        return study;
    }
    
    updateStudyProgress(studyId, images, dose) {
        const study = this.studies.find(s => s.id === studyId);
        if (study) {
            study.images = images;
            study.dose = dose;
            study.duration = Math.floor((new Date() - study.startTime) / 1000);
        }
    }
    
    completeStudy(studyId) {
        const study = this.studies.find(s => s.id === studyId);
        if (study) {
            study.status = 'completed';
            study.endTime = new Date();
            study.duration = Math.floor((study.endTime - study.startTime) / 1000);
        }
    }
    
    // Local storage functions
    saveToLocalStorage() {
        const data = {
            patients: this.patients,
            studies: this.studies,
            images: this.images,
            currentUser: this.currentUser
        };
        localStorage.setItem('ajrMedicalData', JSON.stringify(data));
    }
    
    loadFromLocalStorage() {
        const data = localStorage.getItem('ajrMedicalData');
        if (data) {
            const parsed = JSON.parse(data);
            this.patients = parsed.patients || [];
            this.studies = parsed.studies || [];
            this.images = parsed.images || [];
            this.currentUser = parsed.currentUser || null;
        }
    }

    generatePatientId() {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substr(2, 3).toUpperCase();
        return `PT${timestamp}${random}`;
    }

    getPatient(patientId) {
        return this.patients.find(p => p.id === patientId);
    }

    updatePatient(patientId, updates) {
        const patientIndex = this.patients.findIndex(p => p.id === patientId);
        if (patientIndex !== -1) {
            this.patients[patientIndex] = { ...this.patients[patientIndex], ...updates };
            this.saveToLocalStorage();
            return this.patients[patientIndex];
        }
        return null;
    }

    // Study management functions
    createStudy(patientId, studyData) {
        const patient = this.getPatient(patientId);
        if (!patient) return null;

        const study = {
            id: this.generateStudyId(),
            patientId: patientId,
            patientName: patient.name,
            createdAt: new Date(),
            status: 'in_progress',
            images: 0,
            dose: 0,
            ...studyData
        };
        
        this.studies.push(study);
        this.saveToLocalStorage();
        return study;
    }

    generateStudyId() {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `ST${timestamp}${random}`;
    }

    getStudy(studyId) {
        return this.studies.find(s => s.id === studyId);
    }

    updateStudy(studyId, updates) {
        const studyIndex = this.studies.findIndex(s => s.id === studyId);
        if (studyIndex !== -1) {
            this.studies[studyIndex] = { ...this.studies[studyIndex], ...updates };
            this.saveToLocalStorage();
            return this.studies[studyIndex];
        }
        return null;
    }

    completeStudy(studyId) {
        const study = this.updateStudy(studyId, {
            status: 'completed',
            completedAt: new Date(),
            duration: this.calculateStudyDuration(studyId)
        });
        
        if (study) {
            this.autoSaveStudy(study);
            return study;
        }
        return null;
    }

    calculateStudyDuration(studyId) {
        const study = this.getStudy(studyId);
        if (study && study.createdAt) {
            return Math.floor((new Date() - new Date(study.createdAt)) / 60000); // minutes
        }
        return 0;
    }

    // Image management functions
    addImage(studyId, imageData) {
        const study = this.getStudy(studyId);
        if (!study) return null;

        const image = {
            id: this.generateImageId(),
            studyId: studyId,
            patientId: study.patientId,
            createdAt: new Date(),
            ...imageData
        };
        
        this.images.push(image);
        
        // Update study statistics
        this.updateStudy(studyId, {
            images: study.images + 1,
            dose: study.dose + (imageData.dose || 0.1)
        });
        
        this.saveToLocalStorage();
        return image;
    }

    generateImageId() {
        const timestamp = Date.now().toString().slice(-10);
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        return `IMG${timestamp}${random}`;
    }

    getImagesByStudy(studyId) {
        return this.images.filter(img => img.studyId === studyId);
    }

    // Dose tracking functions
    updateDose(studyId, additionalDose) {
        const study = this.getStudy(studyId);
        if (study) {
            this.updateStudy(studyId, {
                dose: study.dose + additionalDose
            });
            
            // Check for dose limits
            if (study.dose > 10) { // 10 mGy threshold
                this.showDoseWarning(studyId, study.dose);
            }
        }
    }

    showDoseWarning(studyId, currentDose) {
        this.showNotification(
            `High radiation dose detected: ${currentDose.toFixed(2)} mGy`,
            'warning'
        );
    }

    // Safety functions
    emergencyStop() {
        this.isLive = false;
        this.showNotification('Emergency stop activated', 'error');
        
        // Log emergency event
        this.logEvent('emergency_stop', {
            timestamp: new Date(),
            user: this.currentUser?.username
        });
    }

    checkSafetyInterlocks() {
        // Simulate safety checks
        const interlocks = {
            collision: Math.random() > 0.95, // 5% chance of collision
            tubeHeat: Math.random() > 0.98, // 2% chance of overheating
            emergency: false
        };
        
        return !interlocks.collision && !interlocks.tubeHeat && !interlocks.emergency;
    }

    // Live imaging functions
    startLiveImaging(studyId) {
        if (!this.checkSafetyInterlocks()) {
            this.showNotification('Safety interlock active - Cannot start imaging', 'error');
            return false;
        }
        
        this.isLive = true;
        this.studyStartTime = new Date();
        
        // Start dose tracking
        this.startDoseTracking(studyId);
        
        this.logEvent('live_imaging_start', {
            studyId: studyId,
            user: this.currentUser?.username
        });
        
        return true;
    }

    stopLiveImaging() {
        this.isLive = false;
        
        if (this.studyStartTime) {
            const duration = Math.floor((new Date() - this.studyStartTime) / 1000);
            this.logEvent('live_imaging_stop', {
                duration: duration,
                user: this.currentUser?.username
            });
        }
    }

    toggleLiveImaging() {
        if (this.isLive) {
            this.stopLiveImaging();
        } else {
            this.startLiveImaging();
        }
    }

    startDoseTracking(studyId) {
        if (!this.isLive) return;
        
        // Simulate live dose accumulation
        const doseInterval = setInterval(() => {
            if (!this.isLive) {
                clearInterval(doseInterval);
                return;
            }
            
            const doseIncrement = 0.001; // 0.001 mGy per 100ms
            this.updateDose(studyId, doseIncrement);
        }, 100);
    }

    // CBCT workflow functions
    startCBCTScan(studyId, parameters) {
        if (!this.checkSafetyInterlocks()) {
            this.showNotification('Safety interlock active - Cannot start scan', 'error');
            return false;
        }
        
        this.logEvent('cbct_scan_start', {
            studyId: studyId,
            parameters: parameters,
            user: this.currentUser?.username
        });
        
        // Simulate scan progress
        this.simulateCBCTScan(studyId, parameters);
        
        return true;
    }

    simulateCBCTScan(studyId, parameters) {
        let progress = 0;
        const scanInterval = setInterval(() => {
            progress += 1;
            
            // Update progress display
            this.updateScanProgress(progress);
            
            if (progress >= 100) {
                clearInterval(scanInterval);
                this.completeCBCTScan(studyId);
            }
        }, 200); // 20 second scan simulation
    }

    updateScanProgress(progress) {
        const progressBar = document.getElementById('scanProgressBar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    completeCBCTScan(studyId) {
        this.logEvent('cbct_scan_complete', {
            studyId: studyId,
            user: this.currentUser?.username
        });
        
        // Generate CBCT images
        for (let i = 0; i < 400; i++) { // 400 projections
            this.addImage(studyId, {
                type: 'cbct_projection',
                angle: (i * 0.5) - 100, // -100° to +100°
                dose: 0.005
            });
        }
        
        this.showNotification('CBCT scan completed successfully', 'success');
        
        // Start reconstruction
        setTimeout(() => {
            this.startReconstruction(studyId);
        }, 1000);
    }

    startReconstruction(studyId) {
        this.logEvent('reconstruction_start', {
            studyId: studyId,
            user: this.currentUser?.username
        });
        
        // Simulate reconstruction progress
        let progress = 0;
        const reconstructionInterval = setInterval(() => {
            progress += 2;
            
            this.updateReconstructionProgress(progress);
            
            if (progress >= 100) {
                clearInterval(reconstructionInterval);
                this.completeReconstruction(studyId);
            }
        }, 100);
    }

    updateReconstructionProgress(progress) {
        const progressBar = document.getElementById('reconstructionProgress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        const statusElement = document.getElementById('reconstructionStatus');
        if (statusElement) {
            let status = 'Initializing reconstruction...';
            if (progress < 25) status = 'Loading projections...';
            else if (progress < 50) status = 'Preprocessing data...';
            else if (progress < 75) status = 'Reconstructing volumes...';
            else if (progress < 100) status = 'Generating views...';
            else status = 'Reconstruction complete!';
            
            statusElement.textContent = status;
        }
    }

    completeReconstruction(studyId) {
        this.logEvent('reconstruction_complete', {
            studyId: studyId,
            user: this.currentUser?.username
        });
        
        // Generate reconstructed views
        const views = ['axial', 'coronal', 'sagittal', 'mip', 'vr'];
        views.forEach(view => {
            this.addImage(studyId, {
                type: `cbct_${view}`,
                dose: 0
            });
        });
        
        this.showNotification('CBCT reconstruction completed successfully', 'success');
    }

    // Data persistence functions
    saveToLocalStorage() {
        const data = {
            patients: this.patients,
            studies: this.studies,
            images: this.images,
            currentUser: this.currentUser,
            lastSaved: new Date()
        };
        
        try {
            localStorage.setItem('ajr_medical_data', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('ajr_medical_data');
            if (data) {
                const parsed = JSON.parse(data);
                this.patients = parsed.patients || [];
                this.studies = parsed.studies || [];
                this.images = parsed.images || [];
                this.currentUser = parsed.currentUser || null;
                
                return true;
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
        }
        
        return false;
    }

    autoSave() {
        if (this.currentUser) {
            this.saveToLocalStorage();
        }
    }

    quickSave() {
        this.autoSave();
        this.showNotification('Data saved successfully', 'success');
    }

    autoSaveStudy(study) {
        // In a real implementation, this would save to a server
        this.saveToLocalStorage();
        
        // Simulate PACS upload
        setTimeout(() => {
            this.uploadToPACS(study);
        }, 2000);
    }

    uploadToPACS(study) {
        this.logEvent('pacs_upload', {
            studyId: study.id,
            images: study.images,
            user: this.currentUser?.username
        });
        
        this.showNotification('Study uploaded to PACS successfully', 'success');
    }

    // Utility functions
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    generateReport(studyId) {
        const study = this.getStudy(studyId);
        const patient = this.getPatient(study.patientId);
        const images = this.getImagesByStudy(studyId);
        
        const report = {
            studyId: studyId,
            patient: patient,
            study: study,
            images: images.length,
            totalDose: study.dose,
            duration: study.duration,
            generatedAt: new Date(),
            generatedBy: this.currentUser?.username
        };
        
        this.logEvent('report_generated', report);
        return report;
    }

    // Logging functions
    logEvent(eventType, data) {
        const event = {
            type: eventType,
            timestamp: new Date(),
            user: this.currentUser?.username,
            data: data
        };
        
        // In a real implementation, this would send to a logging server
        console.log('AJR Event:', event);
        
        // Store in localStorage for debugging
        try {
            const logs = JSON.parse(localStorage.getItem('ajr_logs') || '[]');
            logs.push(event);
            
            // Keep only last 1000 events
            if (logs.length > 1000) {
                logs.splice(0, logs.length - 1000);
            }
            
            localStorage.setItem('ajr_logs', JSON.stringify(logs));
        } catch (error) {
            console.error('Failed to log event:', error);
        }
    }

    // Notification system
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg text-white font-medium ${
            type === 'success' ? 'bg-green-600' : 
            type === 'error' ? 'bg-red-600' : 
            type === 'warning' ? 'bg-yellow-600' :
            'bg-blue-600'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        if (typeof anime !== 'undefined') {
            anime({
                targets: notification,
                translateX: [300, 0],
                opacity: [0, 1],
                duration: 300,
                easing: 'easeOutQuad'
            });
        }
        
        // Auto remove
        setTimeout(() => {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: notification,
                    translateX: [0, 300],
                    opacity: [1, 0],
                    duration: 300,
                    easing: 'easeOutQuad',
                    complete: function() {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }
                });
            } else {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }
        }, duration);
    }

    // Error handling
    handleError(error, context = '') {
        console.error(`AJR Error (${context}):`, error);
        
        this.logEvent('error', {
            message: error.message,
            stack: error.stack,
            context: context,
            user: this.currentUser?.username
        });
        
        this.showNotification(
            'An error occurred. Please contact support if the problem persists.',
            'error'
        );
    }
}

// Initialize the system when DOM is loaded
let ajrSystem;

document.addEventListener('DOMContentLoaded', function() {
    try {
        ajrSystem = new AJRMedicalSystem();
        
        // Make it globally available for debugging
        window.ajrSystem = ajrSystem;
        
        console.log('AJR Medical Imaging System initialized successfully');
    } catch (error) {
        console.error('Failed to initialize AJR Medical System:', error);
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AJRMedicalSystem;
}