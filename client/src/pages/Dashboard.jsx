import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AudioRecorder from '../components/AudioRecorder';
import AppHeader from '../components/common/AppHeader';
import Button from '../components/common/Button';
import WeekStatus from '../components/dashboard/WeekStatus';
import EntriesList from '../components/entries/EntriesList';
import apiClient from '../api/apiClient';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [entries, setEntries] = useState([]);
    const [entryCount, setEntryCount] = useState(0);
    const [nextReflection, setNextReflection] = useState('');

    useEffect(() => {
        if (user) {
            loadWeekStatus();
            updateNextReflection();
        }
    }, [user]);

    const updateNextReflection = () => {
        if (!user?.nextReflectionAt) return;

        const date = new Date(user.nextReflectionAt);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[date.getDay()];
        const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        setNextReflection(`${dayName} at ${time}`);
    };

    const loadWeekStatus = async () => {
        try {
            const response = await apiClient.get(`/weeks?userId=${user.id}`);

            if (response.data.weeks && response.data.weeks.length > 0) {
                // Find the week that contains today
                const now = new Date();
                const currentWeek = response.data.weeks.find(week => {
                    const start = new Date(week.weekStart);
                    const end = new Date(week.weekEnd);
                    return now >= start && now <= end;
                }) || response.data.weeks[0]; // Fallback to most recent if not found

                await loadEntries(currentWeek._id);
            }
        } catch (error) {
            console.error('Error loading week status:', error);
        }
    };

    const loadEntries = async (weekId) => {
        try {
            const response = await apiClient.get(
                `/entries?userId=${user.id}&weekId=${weekId}`
            );

            setEntryCount(response.data.count || 0);
            setEntries(response.data.entries || []);
        } catch (error) {
            console.error('Error loading entries:', error);
        }
    };

    const handleRecordingComplete = async () => {
        console.log('🔄 Recording complete, refreshing dashboard...');
        // Small delay to ensure database has been updated
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadWeekStatus();
        console.log('✅ Dashboard refreshed');
    };

    const handleGenerateReflection = async () => {
        if (!confirm('Generate reflection for this week now? This is for testing purposes.')) return;
        try {
            const weeksRes = await apiClient.get(`/weeks?userId=${user.id}`);
            if (weeksRes.data.weeks.length > 0) {
                const weekId = weeksRes.data.weeks[0]._id;
                alert('Generating reflection... This may take a minute.');
                await apiClient.post(`/weeks/${weekId}/generate-reflection`);
                alert('Reflection generated! Check the Reflections page.');
                loadWeekStatus();
            }
        } catch (err) {
            console.error(err);
            alert('Error generating reflection: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="container">
            <AppHeader title="📔 Audio Diary">
                <span>{user?.name}</span>
                <Link to="/settings" style={{ textDecoration: 'none', marginRight: '10px', fontSize: '1.2rem' }}>⚙️</Link>
                <Button variant="secondary" onClick={logout}>Logout</Button>
            </AppHeader>

            <main>
                <WeekStatus 
                    user={user}
                    entryCount={entryCount}
                    onGenerateReflection={handleGenerateReflection}
                />

                <AudioRecorder onRecordingComplete={handleRecordingComplete} />

                <div className="entries-section">
                    <h3>This Week's Entries</h3>
                    <EntriesList 
                        entries={entries}
                        emptyMessage="No entries yet. Start recording to begin your week!"
                        emptyIcon="🎙️"
                    />
                </div>

                <div className="nav-section">
                    <Link to="/reflections">
                        <Button variant="secondary">View Past Reflections</Button>
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
