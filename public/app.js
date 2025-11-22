const API_URL = 'http://localhost:3000/api';
let mediaRecorder;
let audioChunks = [];
let recordingStartTime;
let recordingInterval;
let currentLocation = null;
let audioContext;
let analyser;
let animationId;

// Check authentication on page load
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    loadUserData();
    loadWeekStatus();
});

function loadUserData() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('userName').textContent = user.name;
        updateNextReflection(user.nextReflectionAt);
    }
}

function updateNextReflection(nextReflectionAt) {
    const date = new Date(nextReflectionAt);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[date.getDay()];
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    document.getElementById('nextReflection').textContent = `${dayName} at ${time}`;
}

async function loadWeekStatus() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    try {
        const response = await fetch(`${API_URL}/weeks?userId=${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (data.weeks && data.weeks.length > 0) {
            const currentWeek = data.weeks[0];
            await loadEntries(currentWeek._id);
        }

    } catch (error) {
        console.error('Error loading week status:', error);
    }
}

async function loadEntries(weekId) {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    try {
        const response = await fetch(`${API_URL}/entries?userId=${user.id}&weekId=${weekId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        document.getElementById('entryCount').textContent = data.count || 0;

        if (data.entries && data.entries.length > 0) {
            displayEntries(data.entries);
        }

    } catch (error) {
        console.error('Error loading entries:', error);
    }
}

function displayEntries(entries) {
    const listEl = document.getElementById('entriesList');

    if (entries.length === 0) {
        listEl.innerHTML = '<p class="empty-state">No entries yet. Start recording to begin your week!</p>';
        return;
    }

    listEl.innerHTML = entries.map(entry => {
        const date = new Date(entry.recordedAt);
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const duration = formatDuration(entry.duration);
        const hasLocation = entry.location ? '📍' : '';

        return `
      <div class="entry-card">
        <div class="entry-info">
          <div class="entry-date">${dateStr} at ${timeStr} ${hasLocation}</div>
          <div class="entry-duration">${duration}</div>
        </div>
      </div>
    `;
    }).join('');
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Recording functionality
document.getElementById('recordBtn').addEventListener('click', toggleRecording);

async function toggleRecording() {
    const btn = document.getElementById('recordBtn');

    if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopRecording();
    } else {
        await startRecording();
    }
}

async function startRecording() {
    try {
        // Request microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Request location permission (optional)
        requestLocation();

        // Setup Web Audio API for visualization
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.addEventListener('dataavailable', event => {
            audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener('stop', uploadRecording);

        mediaRecorder.start();
        recordingStartTime = Date.now();

        // Update UI
        const btn = document.getElementById('recordBtn');
        btn.classList.add('recording');
        btn.querySelector('.record-text').textContent = 'STOP';

        document.getElementById('recordingStatus').classList.remove('hidden');
        document.getElementById('visualizerContainer').classList.remove('hidden');

        // Start timer
        recordingInterval = setInterval(updateRecordingTime, 1000);

        // Start visualizer
        visualize(dataArray, bufferLength);

    } catch (error) {
        console.error('Error starting recording:', error);
        alert('Could not access microphone. Please grant permission and try again.');
    }
}

function requestLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toISOString()
                };

                // Show location captured status
                document.getElementById('locationStatus').classList.remove('hidden');
                document.getElementById('locationText').textContent = 'Location captured';
                document.getElementById('locationIcon').textContent = '📍';
            },
            (error) => {
                console.log('Location permission denied or unavailable:', error);
                currentLocation = null;

                // Show location unavailable status
                document.getElementById('locationStatus').classList.remove('hidden');
                document.getElementById('locationText').textContent = 'Location unavailable';
                document.getElementById('locationIcon').textContent = '📍';
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }
}

function updateRecordingTime() {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    document.getElementById('recordingTime').textContent =
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        clearInterval(recordingInterval);

        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach(track => track.stop());

        // Stop visualizer
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }

        // Update UI
        const btn = document.getElementById('recordBtn');
        btn.classList.remove('recording');
        btn.querySelector('.record-text').textContent = 'RECORD';

        document.getElementById('recordingStatus').classList.add('hidden');
        document.getElementById('visualizerContainer').classList.add('hidden');
    }
}

async function uploadRecording() {
    const duration = (Date.now() - recordingStartTime) / 1000;
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('duration', duration);

    const user = JSON.parse(localStorage.getItem('user'));
    formData.append('userId', user.id);

    if (currentLocation) {
        formData.append('location', JSON.stringify(currentLocation));
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/entries`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }

        console.log('Recording uploaded successfully:', data);

        // Hide location status after successful upload
        setTimeout(() => {
            document.getElementById('locationStatus').classList.add('hidden');
        }, 3000);

        // Reset location for next recording
        currentLocation = null;

        // Reload entries
        loadWeekStatus();

    } catch (error) {
        console.error('Error uploading recording:', error);
        alert('Failed to upload recording. Please try again.');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Audio Visualizer
function visualize(dataArray, bufferLength) {
    const canvas = document.getElementById('visualizer');
    const canvasCtx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    function draw() {
        animationId = requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        // Clear canvas with slight transparency for trail effect
        canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        const barWidth = (WIDTH / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * HEIGHT * 0.8;

            // Create gradient for each bar
            const gradient = canvasCtx.createLinearGradient(0, HEIGHT - barHeight, 0, HEIGHT);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(0.5, '#764ba2');
            gradient.addColorStop(1, '#667eea');

            canvasCtx.fillStyle = gradient;
            canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    }

    draw();
}
