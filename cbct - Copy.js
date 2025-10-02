// CBCT Workflow JavaScript - AJR Medical Imaging System

let currentStep = 1;
let selectedArea = '';
let laserActive = false;
let confirmation0 = false;
let confirmation90 = false;
let collisionCheckComplete = false;
let scanInProgress = false;
let currentAngle = 0;
let scanProgress = 0;
let currentFrame = 0;
let patientData = null;

// Initialize the CBCT workflow
document.addEventListener('DOMContentLoaded', function() {
    initializeCBCTWorkflow();
    setupEventListeners();
    updateProgressIndicator();
});

function initializeCBCTWorkflow() {
    // Load patient data from localStorage
    const patientDataStr = localStorage.getItem('currentPatient');
    if (patientDataStr) {
        patientData = JSON.parse(patientDataStr);
        document.getElementById('patientName').textContent = patientData.name;
    }
    
    // Initialize step display
    showStep(1);
    updateStepDisplay();
}

function setupEventListeners() {
    // Step 1 - Area Selection
    document.querySelectorAll('.anatomy-selector').forEach(selector => {
        selector.addEventListener('click', function() {
            selectAnatomicalArea(this.dataset.area);
        });
    });
    
    document.getElementById('step1Next').addEventListener('click', () => nextStep());
    
    // Step 2 - Patient Centering
    document.getElementById('turnOnLaser').addEventListener('click', turnOnLaser);
    document.getElementById('confirmLaser').addEventListener('click', confirmLaserCentering);
    
    document.getElementById('moveTo0').addEventListener('click', () => moveToAngle(0));
    document.getElementById('moveTo90').addEventListener('click', () => moveToAngle(90));
    
    document.getElementById('fire0').addEventListener('click', () => fireXRay(0));
    document.getElementById('fire90').addEventListener('click', () => fireXRay(90));
    
    document.getElementById('confirm0').addEventListener('click', () => toggleConfirmation(0));
    document.getElementById('confirm90').addEventListener('click', () => toggleConfirmation(90));
    
    document.getElementById('step2Back').addEventListener('click', () => prevStep());
    document.getElementById('step2Next').addEventListener('click', () => nextStep());
    
    // Step 3 - Collision Check
    document.getElementById('startCollisionCheck').addEventListener('click', startCollisionCheck);
    document.getElementById('step3Back').addEventListener('click', () => prevStep());
    document.getElementById('step3Next').addEventListener('click', () => nextStep());
    
    // Step 4 - Scan Execution
    document.getElementById('startScan').addEventListener('click', startCBCTScan);
    document.getElementById('pauseScan').addEventListener('click', pauseCBCTScan);
    document.getElementById('stopScan').addEventListener('click', stopCBCTScan);
    document.getElementById('step4Back').addEventListener('click', () => prevStep());
    document.getElementById('completeScan').addEventListener('click', completeScan);
    
    // Emergency stop
    document.getElementById('emergencyStop').addEventListener('click', emergencyStop);
}

function selectAnatomicalArea(area) {
    // Remove previous selection
    document.querySelectorAll('.anatomy-selector').forEach(selector => {
        selector.classList.remove('selected');
    });
    
    // Select new area
    document.querySelector(`[data-area="${area}"]`).classList.add('selected');
    selectedArea = area;
    
    // Enable next button
    document.getElementById('step1Next').disabled = false;
    document.getElementById('step1Next').classList.remove('disabled:opacity-50', 'disabled:cursor-not-allowed');
    
    // Animate C-arm model
    animateCArmModel(area);
}

function animateCArmModel(area) {
    const cArm = document.getElementById('cArmPath');
    const source = document.getElementById('xraySource');
    const detector = document.getElementById('detectorPanel');
    
    // Animate based on selected area
    anime({
        targets: [cArm, source, detector],
        rotate: area === 'head' ? -15 : area === 'chest' ? 0 : area === 'abdomen' ? 15 : 25,
        duration: 1000,
        easing: 'easeOutQuad'
    });
}

function turnOnLaser() {
    laserActive = true;
    const laserBtn = document.getElementById('turnOnLaser');
    const confirmBtn = document.getElementById('confirmLaser');
    
    // Update laser button
    laserBtn.textContent = 'Laser Active';
    laserBtn.classList.add('laser-indicator');
    
    // Enable confirm button
    confirmBtn.disabled = false;
    
    showNotification('Laser positioning system activated', 'success');
}

function confirmLaserCentering() {
    if (!laserActive) return;
    
    showNotification('Laser centering confirmed', 'success');
    
    // Add visual feedback
    anime({
        targets: '#confirmLaser',
        scale: [1, 0.95, 1],
        backgroundColor: ['#007AFF', '#34C759', '#007AFF'],
        duration: 300,
        easing: 'easeOutQuad'
    });
}

function moveToAngle(angle) {
    currentAngle = angle;
    
    // Update angle displays
    document.getElementById('centeringAngle').textContent = angle + '°';
    document.getElementById('currentAngle').textContent = angle + '°';
    
    // Animate C-arm movement
    const centeringArm = document.getElementById('centeringArm');
    const centeringSource = document.getElementById('centeringSource');
    const centeringDetector = document.getElementById('centeringDetector');
    
    anime({
        targets: [centeringArm, centeringSource, centeringDetector],
        rotate: angle,
        duration: 2000,
        easing: 'easeInOutQuad',
        complete: function() {
            // Enable fire button after movement
            document.getElementById(`fire${angle}`).disabled = false;
        }
    });
    
    showNotification(`Moved to ${angle}° position`, 'info');
}

function fireXRay(angle) {
    const fireBtn = document.getElementById(`fire${angle}`);
    const xrayDisplay = document.getElementById('xrayDisplay');
    
    // Animate fire button
    anime({
        targets: fireBtn,
        scale: [1, 0.9, 1],
        duration: 200,
        easing: 'easeOutQuad'
    });
    
    // Simulate X-ray flash
    xrayDisplay.classList.add('xray-indicator');
    xrayDisplay.textContent = `X-Ray Fired at ${angle}°`;
    
    setTimeout(() => {
        xrayDisplay.classList.remove('xray-indicator');
        xrayDisplay.textContent = `X-Ray Complete at ${angle}°`;
    }, 500);
    
    showNotification(`X-Ray fired at ${angle}°`, 'success');
}

function toggleConfirmation(angle) {
    const checkbox = document.getElementById(`confirm${angle}`);
    const isChecked = checkbox.classList.contains('checked');
    
    if (isChecked) {
        checkbox.classList.remove('checked');
        if (angle === 0) confirmation0 = false;
        else confirmation90 = false;
    } else {
        checkbox.classList.add('checked');
        if (angle === 0) confirmation0 = true;
        else confirmation90 = true;
    }
    
    // Enable/disable move to 90° button
    if (confirmation0) {
        document.getElementById('moveTo90').disabled = false;
    }
    
    // Enable next step if both confirmations are done
    if (confirmation0 && confirmation90) {
        document.getElementById('step2Next').disabled = false;
    }
}

function startCollisionCheck() {
    collisionCheckComplete = false;
    let collisionAngle = 0;
    let collisionDetected = false;
    
    const collisionArm = document.getElementById('collisionArm');
    const collisionSource = document.getElementById('collisionSource');
    const collisionDetector = document.getElementById('collisionDetector');
    const collisionWarning = document.getElementById('collisionWarning');
    const collisionStatus = document.getElementById('collisionStatus');
    const collisionLog = document.getElementById('collisionLog');
    
    // Simulate collision check
    const checkInterval = setInterval(() => {
        collisionAngle += 2;
        
        // Update angle display
        document.getElementById('collisionAngle').textContent = collisionAngle + '°';
        document.getElementById('scanAngle').textContent = collisionAngle + '°';
        
        // Animate C-arm
        anime({
            targets: [collisionArm, collisionSource, collisionDetector],
            rotate: collisionAngle,
            duration: 100,
            easing: 'linear'
        });
        
        // Simulate collision detection
        if (collisionAngle > 180 && collisionAngle < 200 && !collisionDetected) {
            collisionDetected = true;
            collisionWarning.classList.remove('hidden');
            collisionStatus.className = 'p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg mb-4';
            collisionStatus.innerHTML = `
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-red-400 rounded-full collision-warning"></div>
                    <span class="font-semibold">Collision Detected!</span>
                </div>
                <p class="text-sm text-gray-300 mt-2">Collision at ${collisionAngle}° - Adjust patient position</p>
            `;
            
            // Add to log
            const logEntry = document.createElement('div');
            logEntry.textContent = `⚠️ Collision detected at ${collisionAngle}°`;
            logEntry.className = 'text-red-400';
            collisionLog.appendChild(logEntry);
        }
        
        // Complete check
        if (collisionAngle >= 360) {
            clearInterval(checkInterval);
            collisionCheckComplete = true;
            
            if (!collisionDetected) {
                collisionStatus.className = 'p-4 bg-green-500 bg-opacity-20 border border-green-500 rounded-lg mb-4';
                collisionStatus.innerHTML = `
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span class="font-semibold">No Collision Detected</span>
                    </div>
                    <p class="text-sm text-gray-300 mt-2">System ready for scanning</p>
                `;
                
                document.getElementById('step3Next').disabled = false;
            }
            
            const logEntry = document.createElement('div');
            logEntry.textContent = '✅ Collision check completed';
            logEntry.className = 'text-green-400';
            collisionLog.appendChild(logEntry);
        }
    }, 50);
    
    showNotification('Starting collision detection...', 'info');
}

function startCBCTScan() {
    if (scanInProgress) return;
    
    scanInProgress = true;
    scanProgress = 0;
    currentFrame = 0;
    
    const startBtn = document.getElementById('startScan');
    const pauseBtn = document.getElementById('pauseScan');
    const stopBtn = document.getElementById('stopScan');
    const completeBtn = document.getElementById('completeScan');
    
    // Update button states
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
    
    // Start scanning animation
    animateScanning();
    
    showNotification('CBCT scan started', 'success');
}

function animateScanning() {
    if (!scanInProgress) return;
    
    const scanArm = document.getElementById('scanArm');
    const scanSource = document.getElementById('scanSource');
    const scanDetector = document.getElementById('scanDetector');
    
    // Update progress
    scanProgress += 0.5;
    currentFrame = Math.floor(scanProgress * 3);
    
    // Update displays
    document.getElementById('scanProgress').textContent = Math.min(scanProgress, 100).toFixed(1) + '%';
    document.getElementById('scanProgressBar').style.width = Math.min(scanProgress, 100) + '%';
    document.getElementById('currentFrame').textContent = currentFrame;
    document.getElementById('scanAngleDisplay').textContent = Math.floor(scanProgress * 3.6) + '°';
    document.getElementById('scanDose').textContent = (scanProgress * 0.05).toFixed(1) + ' mGy';
    
    // Calculate time remaining
    const remainingSeconds = Math.floor((100 - scanProgress) * 0.6);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    document.getElementById('timeRemaining').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Animate C-arm rotation
    const rotationAngle = (scanProgress * 3.6) % 360;
    anime({
        targets: [scanArm, scanSource, scanDetector],
        rotate: rotationAngle,
        duration: 100,
        easing: 'linear'
    });
    
    // Continue scanning or complete
    if (scanProgress < 100) {
        setTimeout(animateScanning, 100);
    } else {
        completeScanning();
    }
}

function pauseCBCTScan() {
    scanInProgress = false;
    
    const startBtn = document.getElementById('startScan');
    const pauseBtn = document.getElementById('pauseScan');
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    startBtn.textContent = 'Resume Scan';
    
    showNotification('Scan paused', 'warning');
}

function stopCBCTScan() {
    scanInProgress = false;
    scanProgress = 0;
    currentFrame = 0;
    
    const startBtn = document.getElementById('startScan');
    const pauseBtn = document.getElementById('pauseScan');
    const stopBtn = document.getElementById('stopScan');
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    startBtn.textContent = 'Start CBCT Scan';
    
    // Reset progress display
    document.getElementById('scanProgress').textContent = '0%';
    document.getElementById('scanProgressBar').style.width = '0%';
    document.getElementById('currentFrame').textContent = '0';
    
    showNotification('Scan stopped', 'error');
}

function completeScanning() {
    scanInProgress = false;
    
    const startBtn = document.getElementById('startScan');
    const pauseBtn = document.getElementById('pauseScan');
    const stopBtn = document.getElementById('stopScan');
    const completeBtn = document.getElementById('completeScan');
    
    startBtn.disabled = true;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    completeBtn.disabled = false;
    
    showNotification('CBCT scan completed successfully', 'success');
}

function completeScan() {
    // Show reconstruction modal
    showReconstructionModal();
    
    // Simulate reconstruction process
    simulateReconstruction();
}

function showReconstructionModal() {
    const modal = document.getElementById('reconstructionModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function simulateReconstruction() {
    let progress = 0;
    const statusMessages = [
        'Initializing reconstruction...',
        'Processing raw data...',
        'Applying reconstruction algorithm...',
        'Generating 3D volume...',
        'Finalizing images...'
    ];
    
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // Navigate to reconstruction display after completion
            setTimeout(() => {
                navigateToReconstruction();
            }, 1000);
        }
        
        // Update progress bar
        document.getElementById('reconstructionProgress').style.width = progress + '%';
        
        // Update status message
        const messageIndex = Math.floor(progress / 20);
        if (messageIndex < statusMessages.length) {
            document.getElementById('reconstructionStatus').textContent = statusMessages[messageIndex];
        }
    }, 500);
}

function navigateToReconstruction() {
    // Store scan data
    const scanData = {
        patient: patientData,
        area: selectedArea,
        frames: currentFrame,
        dose: (scanProgress * 0.05).toFixed(1),
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('cbctScanData', JSON.stringify(scanData));
    
    // Navigate to reconstruction display page
    window.location.href = 'reconstruction-display.html';
}

function emergencyStop() {
    // Stop all operations
    scanInProgress = false;
    
    // Reset all controls
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        if (btn.id !== 'emergencyStop') {
            btn.disabled = true;
        }
    });
    
    showNotification('EMERGENCY STOP ACTIVATED - All operations halted', 'error');
}

function nextStep() {
    if (currentStep < 4) {
        currentStep++;
        showStep(currentStep);
        updateStepDisplay();
        updateProgressIndicator();
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
        updateStepDisplay();
        updateProgressIndicator();
    }
}

function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.step-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Show current step
    document.getElementById(`step${step}`).classList.remove('hidden');
    
    // Update step cards
    document.querySelectorAll('.step-card').forEach((card, index) => {
        card.classList.remove('active', 'completed');
        if (index + 1 === step) {
            card.classList.add('active');
        } else if (index + 1 < step) {
            card.classList.add('completed');
        }
    });
}

function updateStepDisplay() {
    document.getElementById('currentStep').textContent = `${currentStep} of 4`;
}

function updateProgressIndicator() {
    const progress = (currentStep / 4) * 100;
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (progress / 100) * circumference;
    
    document.getElementById('progressCircle').style.strokeDashoffset = offset;
    document.getElementById('progressPercent').textContent = Math.round(progress) + '%';
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg text-white font-medium ${
        type === 'success' ? 'bg-green-600' : 
        type === 'error' ? 'bg-red-600' : 
        type === 'warning' ? 'bg-yellow-600' :
        'bg-blue-600'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    anime({
        targets: notification,
        translateX: [300, 0],
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutQuad'
    });
    
    setTimeout(() => {
        anime({
            targets: notification,
            translateX: [0, 300],
            opacity: [1, 0],
            duration: 300,
            easing: 'easeOutQuad',
            complete: function() {
                document.body.removeChild(notification);
            }
        });
    }, 3000);
}onVolume) return null;
        
        const { x, y, z } = this.reconstructionParameters.volumeSize;
        let slice = null;
        
        switch (orientation) {
            case 'axial':
                slice = this.extractAxialSlice(sliceIndex);
                break;
            case 'coronal':
                slice = this.extractCoronalSlice(sliceIndex);
                break;
            case 'sagittal':
                slice = this.extractSagittalSlice(sliceIndex);
                break;
            default:
                slice = this.extractAxialSlice(sliceIndex);
        }
        
        return this.convertToImageData(slice, x, y);
    }

    extractAxialSlice(sliceIndex) {
        const { x, y, z } = this.reconstructionParameters.volumeSize;
        const slice = new Float32Array(x * y);
        
        for (let j = 0; j < y; j++) {
            for (let i = 0; i < x; i++) {
                const volumeIndex = sliceIndex * x * y + j * x + i;
                slice[j * x + i] = this.reconstructionVolume[volumeIndex];
            }
        }
        
        return slice;
    }

    extractCoronalSlice(sliceIndex) {
        const { x, y, z } = this.reconstructionParameters.volumeSize;
        const slice = new Float32Array(x * z);
        
        for (let k = 0; k < z; k++) {
            for (let i = 0; i < x; i++) {
                const volumeIndex = k * x * y + sliceIndex * x + i;
                slice[k * x + i] = this.reconstructionVolume[volumeIndex];
            }
        }
        
        return slice;
    }

    extractSagittalSlice(sliceIndex) {
        const { x, y, z } = this.reconstructionParameters.volumeSize;
        const slice = new Float32Array(y * z);
        
        for (let k = 0; k < z; k++) {
            for (let j = 0; j < y; j++) {
                const volumeIndex = k * x * y + j * x + sliceIndex;
                slice[k * y + j] = this.reconstructionVolume[volumeIndex];
            }
        }
        
        return slice;
    }

    convertToImageData(sliceData, width, height) {
        const imageData = new ImageData(width, height);
        
        // Convert HU values to grayscale
        for (let i = 0; i < sliceData.length; i++) {
            const hu = sliceData[i];
            let gray = 0;
            
            if (hu <= -1000) gray = 0; // Air
            else if (hu >= 1000) gray = 255; // Dense bone
            else gray = ((hu + 1000) / 2000) * 255; // Linear mapping
            
            imageData.data[i * 4] = gray;     // R
            imageData.data[i * 4 + 1] = gray; // G
            imageData.data[i * 4 + 2] = gray; // B
            imageData.data[i * 4 + 3] = 255;  // A
        }
        
        return imageData;
    }

    updateCrosshairPosition(x, y, z) {
        this.crosshairPosition = { x, y, z };
        
        if (this.sliceNavigationEnabled) {
            this.currentSlice.axial = Math.floor(z);
            this.currentSlice.coronal = Math.floor(y);
            this.currentSlice.sagittal = Math.floor(x);
            
            this.onSliceChanged();
        }
    }

    onSliceChanged() {
        // Notify UI components of slice changes
        if (typeof window !== 'undefined' && window.ajrSystem) {
            window.ajrSystem.logEvent('slice_navigation', {
                axial: this.currentSlice.axial,
                coronal: this.currentSlice.coronal,
                sagittal: this.currentSlice.sagittal
            });
        }
    }

    // Quality metrics
    calculateQualityMetrics() {
        if (!this.reconstructionVolume) return null;
        
        return {
            snr: this.calculateSNR(),
            cnr: this.calculateCNR(),
            spatialResolution: this.calculateSpatialResolution(),
            contrastResolution: this.calculateContrastResolution(),
            artifactScore: this.calculateArtifactScore()
        };
    }

    calculateSNR() {
        // Signal-to-noise ratio calculation
        const roiMean = this.calculateROIMean(100, 100, 50, 50);
        const backgroundStd = this.calculateBackgroundStd();
        
        return roiMean / backgroundStd;
    }

    calculateCNR() {
        // Contrast-to-noise ratio calculation
        const softTissueROI = this.calculateROIMean(120, 120, 30, 30);
        const backgroundROI = this.calculateROIMean(100, 100, 30, 30);
        const backgroundStd = this.calculateBackgroundStd();
        
        return Math.abs(softTissueROI - backgroundROI) / backgroundStd;
    }

    calculateROIMean(x, y, width, height) {
        let sum = 0;
        let count = 0;
        
        for (let j = y; j < y + height; j++) {
            for (let i = x; i < x + width; i++) {
                const idx = j * 256 + i; // Assuming 256x256 slices
                sum += this.reconstructionVolume[idx];
                count++;
            }
        }
        
        return sum / count;
    }

    calculateBackgroundStd() {
        // Calculate standard deviation of background region
        const backgroundROI = this.getBackgroundRegion();
        const mean = this.calculateROIMean(
            backgroundROI.x,
            backgroundROI.y,
            backgroundROI.width,
            backgroundROI.height
        );
        
        let sumSquaredDiff = 0;
        let count = 0;
        
        for (let j = backgroundROI.y; j < backgroundROI.y + backgroundROI.height; j++) {
            for (let i = backgroundROI.x; i < backgroundROI.x + backgroundROI.width; i++) {
                const idx = j * 256 + i;
                const diff = this.reconstructionVolume[idx] - mean;
                sumSquaredDiff += diff * diff;
                count++;
            }
        }
        
        return Math.sqrt(sumSquaredDiff / count);
    }

    getBackgroundRegion() {
        // Return coordinates of background region for noise calculation
        return { x: 10, y: 10, width: 50, height: 50 };
    }

    calculateSpatialResolution() {
        // Calculate spatial resolution using edge spread function
        // Simplified implementation
        return 0.5; // mm (based on reconstruction parameters)
    }

    calculateContrastResolution() {
        // Calculate contrast resolution
        // Simplified implementation
        return 10; // HU (based on reconstruction parameters)
    }

    calculateArtifactScore() {
        // Calculate artifact score based on various metrics
        // Lower score is better
        let score = 0;
        
        // Check for streak artifacts
        score += this.detectStreakArtifacts() * 0.3;
        
        // Check for ring artifacts
        score += this.detectRingArtifacts() * 0.3;
        
        // Check for motion artifacts
        score += this.detectMotionArtifacts() * 0.4;
        
        return Math.min(score, 1.0);
    }

    detectStreakArtifacts() {
        // Detect streak artifacts in reconstruction
        // Simplified implementation
        return 0.1;
    }

    detectRingArtifacts() {
        // Detect ring artifacts in reconstruction
        // Simplified implementation
        return 0.05;
    }

    detectMotionArtifacts() {
        // Detect motion artifacts in reconstruction
        // Simplified implementation
        return 0.15;
    }

    // Export functions
    exportReconstruction(format = 'dicom') {
        switch (format) {
            case 'dicom':
                return this.exportAsDICOM();
            case 'nifti':
                return this.exportAsNIFTI();
            case 'raw':
                return this.exportAsRaw();
            default:
                return this.exportAsDICOM();
        }
    }

    exportAsDICOM() {
        // Export reconstruction as DICOM series
        // This is a simplified implementation
        const slices = [];
        
        for (let k = 0; k < this.reconstructionParameters.volumeSize.z; k++) {
            const slice = this.extractAxialSlice(k);
            slices.push(slice);
        }
        
        return {
            format: 'dicom',
            slices: slices,
            parameters: this.reconstructionParameters,
            qualityMetrics: this.calculateQualityMetrics()
        };
    }

    exportAsNIFTI() {
        // Export reconstruction as NIFTI format
        return {
            format: 'nifti',
            volume: this.reconstructionVolume,
            parameters: this.reconstructionParameters,
            qualityMetrics: this.calculateQualityMetrics()
        };
    }

    exportAsRaw() {
        // Export reconstruction as raw data
        return {
            format: 'raw',
            volume: this.reconstructionVolume,
            parameters: this.reconstructionParameters
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CBCTProcessor;
}

// Initialize CBCT processor globally
let cbctProcessor;

document.addEventListener('DOMContentLoaded', function() {
    try {
        cbctProcessor = new CBCTProcessor();
        window.cbctProcessor = cbctProcessor;
        
        console.log('CBCT Processor initialized successfully');
    } catch (error) {
        console.error('Failed to initialize CBCT Processor:', error);
    }
});