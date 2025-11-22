import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

const AudioRecorder = ({ onRecordingComplete }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [locationStatus, setLocationStatus] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingStartTimeRef = useRef(null);
    const intervalRef = useRef(null);
    const currentLocationRef = useRef(null);

    // Audio visualization refs
    const canvasRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const animationFrameRef = useRef(null);
    const streamRef = useRef(null);

    const { user } = useAuth();

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    // Start visualization when recording starts and canvas is ready
    useEffect(() => {
        if (isRecording && canvasRef.current && streamRef.current) {
            startVisualization(streamRef.current);
        }
    }, [isRecording]);

    const requestLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    currentLocationRef.current = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString()
                    };
                    setLocationStatus({ captured: true, message: 'Location captured' });
                },
                (error) => {
                    console.log('Location permission denied:', error);
                    currentLocationRef.current = null;
                    setLocationStatus({ captured: false, message: 'Location unavailable' });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        }
    };

    const startVisualization = (stream) => {
        if (!canvasRef.current) return;

        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);

        sourceRef.current.connect(analyserRef.current);

        // Use smaller FFT size for cleaner visualization on small canvas
        analyserRef.current.fftSize = 512;
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');

        const draw = () => {
            // Keep the loop running
            animationFrameRef.current = requestAnimationFrame(draw);

            // Get time-domain data for waveform
            analyserRef.current.getByteTimeDomainData(dataArray);

            // Clear canvas with a darker background for contrast
            canvasCtx.fillStyle = 'rgb(30, 30, 40)'; // Dark background
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            // Create gradient
            const gradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, 'rgb(79, 70, 229)'); // Indigo 600
            gradient.addColorStop(1, 'rgb(147, 51, 234)'); // Purple 600

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = gradient;
            canvasCtx.fillStyle = gradient; // For filled shape if desired, but line looks cleaner for waveform

            canvasCtx.beginPath();

            const sliceWidth = canvas.width * 1.0 / bufferLength;
            let x = 0;

            // Draw the waveform
            // We'll draw it centered vertically
            const centerY = canvas.height / 2;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0; // 1.0 is silence
                const deviation = v - 1.0;

                // Amplify the signal so it's more visible
                const amplifiedDeviation = deviation * 4.0;

                const y = centerY + (amplifiedDeviation * centerY);

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasCtx.lineTo(canvas.width, centerY);
            canvasCtx.stroke();

            // Optional: Add a mirrored faint fill for a "tech" look
            // This is a second pass to draw a filled area with lower opacity
            /*
            canvasCtx.beginPath();
            canvasCtx.moveTo(0, centerY);
            x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const deviation = v - 1.0;
                const amplifiedDeviation = deviation * 2.0;
                const y = centerY + (amplifiedDeviation * centerY);
                canvasCtx.lineTo(x, y);
                x += sliceWidth;
            }
            canvasCtx.lineTo(canvas.width, centerY);
            canvasCtx.lineTo(0, centerY);
            canvasCtx.globalAlpha = 0.2;
            canvasCtx.fill();
            canvasCtx.globalAlpha = 1.0;
            */
        };

        draw();
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Request location
            requestLocation();

            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.addEventListener('dataavailable', (event) => {
                audioChunksRef.current.push(event.data);
            });

            mediaRecorderRef.current.addEventListener('stop', uploadRecording);

            mediaRecorderRef.current.start();
            recordingStartTimeRef.current = Date.now();

            // Store stream for visualization
            streamRef.current = stream;

            // Set recording state - this will trigger useEffect to start visualization
            setIsRecording(true);

            // Start timer
            intervalRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
                setRecordingTime(elapsed);
            }, 1000);

        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Could not access microphone. Please grant permission and try again.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            clearInterval(intervalRef.current);

            // Stop visualization
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            // Stop all tracks
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

            setIsRecording(false);
            setRecordingTime(0);
        }
    };

    const uploadRecording = async () => {
        console.log('🎤 Starting upload...');
        const duration = (Date.now() - recordingStartTimeRef.current) / 1000;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        console.log('Duration:', duration);
        console.log('Blob size:', audioBlob.size);
        console.log('User ID:', user.id);

        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('duration', duration);
        formData.append('userId', user.id);

        if (currentLocationRef.current) {
            console.log('Location:', currentLocationRef.current);
            formData.append('location', JSON.stringify(currentLocationRef.current));
        }

        try {
            console.log('Sending POST request to /api/entries...');
            const response = await apiClient.post('/entries', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('✅ Upload successful:', response.data);

            // Hide location status after 3 seconds
            setTimeout(() => {
                setLocationStatus(null);
            }, 3000);

            // Reset location for next recording
            currentLocationRef.current = null;

            // Notify parent component
            if (onRecordingComplete) {
                onRecordingComplete();
            }

        } catch (error) {
            console.error('❌ Error uploading recording:', error);
            console.error('Error response:', error.response?.data);
            alert('Failed to upload recording. Please try again.');
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="recording-section">
            <div className="recording-controls">
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`btn-record ${isRecording ? 'recording' : ''}`}
                >
                    <span className="record-icon">🎙️</span>
                    <span className="record-text">
                        {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </span>
                </button>

                {isRecording && (
                    <div className="recording-status">
                        <div className="pulse"></div>
                        <span>{formatTime(recordingTime)}</span>
                    </div>
                )}
            </div>

            {isRecording && (
                <canvas
                    ref={canvasRef}
                    width="600"
                    height="120"
                    className="audio-visualizer"
                    style={{ borderRadius: '8px', marginTop: '16px' }}
                />
            )}

            {locationStatus && (
                <div className="location-status">
                    <span>{locationStatus.captured ? '📍' : '📍'}</span>
                    <span>{locationStatus.message}</span>
                </div>
            )}
        </div>
    );
};

export default AudioRecorder;
