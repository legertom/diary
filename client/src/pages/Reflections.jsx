import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/common/AppHeader';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import WeekCard from '../components/weeks/WeekCard';
import WeekDetail from '../components/weeks/WeekDetail';
import apiClient from '../api/apiClient';
import '../styles/Reflections.css';

const Reflections = () => {
    const { user, logout } = useAuth();
    const [weeks, setWeeks] = useState([]);
    const [selectedWeek, setSelectedWeek] = useState(null);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWeeks();
    }, []);

    const loadWeeks = async () => {
        try {
            const response = await apiClient.get(`/weeks?userId=${user.id}`);

            setWeeks(response.data.weeks || []);
            setLoading(false);
        } catch (error) {
            console.error('Error loading weeks:', error);
            setLoading(false);
        }
    };

    const viewWeek = async (weekId) => {
        try {
            const response = await apiClient.get(`/weeks/${weekId}`);

            setSelectedWeek(response.data.week);
            setEntries(response.data.entries || []);
        } catch (error) {
            console.error('Error loading week detail:', error);
        }
    };

    const closeModal = () => {
        setSelectedWeek(null);
        setEntries([]);
    };

    if (loading) {
        return <LoadingSpinner message="Loading reflections..." />;
    }

    return (
        <div className="container">
            <AppHeader title="📔 Past Reflections">
                <Link to="/">
                    <Button variant="secondary">Back to Recording</Button>
                </Link>
                <Button variant="secondary" onClick={logout}>Logout</Button>
            </AppHeader>

            <main>
                <div className="weeks-list">
                    {weeks.length === 0 ? (
                        <EmptyState 
                            message="No reflections yet. Complete your first week to see reflections here!"
                            icon="📔"
                        />
                    ) : (
                        weeks.map(week => (
                            <WeekCard
                                key={week._id}
                                week={week}
                                onClick={() => viewWeek(week._id)}
                            />
                        ))
                    )}
                </div>

                <Modal isOpen={!!selectedWeek} onClose={closeModal}>
                    {selectedWeek && <WeekDetail week={selectedWeek} entries={entries} />}
                </Modal>
            </main>
        </div>
    );
};

export default Reflections;
