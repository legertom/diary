import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AudioRecorder from '../components/AudioRecorder';
import AppHeader from '../components/common/AppHeader';
import Button from '../components/common/Button';
import WeekStatus from '../components/dashboard/WeekStatus';
import EntriesList from '../components/entries/EntriesList';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useWeeks from '../hooks/useWeeks';
import useEntries from '../hooks/useEntries';
import apiClient from '../api/apiClient';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { weeks, getCurrentWeek, refetch: refetchWeeks } = useWeeks(user?.id);
    const currentWeek = getCurrentWeek();
    const { entries, entryCount, refetch: refetchEntries } = useEntries(
        currentWeek?._id,
        user?.id
    );

    const handleRecordingComplete = async () => {
        console.log('🔄 Recording complete, refreshing dashboard...');
        // Small delay to ensure database has been updated
        await new Promise(resolve => setTimeout(resolve, 500));
        refetchWeeks();
        refetchEntries();
        console.log('✅ Dashboard refreshed');
    };

    const handleGenerateReflection = async () => {
        if (!confirm('Generate reflection for this week now? This is for testing purposes.')) return;
        try {
            if (weeks.length > 0) {
                const weekId = weeks[0]._id;
                alert('Generating reflection... This may take a minute.');
                await apiClient.post(`/weeks/${weekId}/generate-reflection`);
                alert('Reflection generated! Check the Reflections page.');
                refetchWeeks();
                refetchEntries();
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
