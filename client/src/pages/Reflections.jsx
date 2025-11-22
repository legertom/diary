import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/common/AppHeader';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import WeekCard from '../components/weeks/WeekCard';
import WeekDetail from '../components/weeks/WeekDetail';
import useWeeks from '../hooks/useWeeks';
import useWeekDetail from '../hooks/useWeekDetail';
import '../styles/Reflections.css';

const Reflections = () => {
    const { user, logout } = useAuth();
    const { weeks, loading } = useWeeks(user?.id);
    const [selectedWeekId, setSelectedWeekId] = useState(null);
    const { week: selectedWeek, entries, loading: detailLoading } = useWeekDetail(selectedWeekId);

    const viewWeek = (weekId) => {
        setSelectedWeekId(weekId);
    };

    const closeModal = () => {
        setSelectedWeekId(null);
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

                <Modal isOpen={!!selectedWeekId} onClose={closeModal}>
                    {detailLoading ? (
                        <LoadingSpinner message="Loading week details..." />
                    ) : (
                        selectedWeek && <WeekDetail week={selectedWeek} entries={entries} />
                    )}
                </Modal>
            </main>
        </div>
    );
};

export default Reflections;
