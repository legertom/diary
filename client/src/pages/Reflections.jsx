import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
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
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:3000/api/weeks?userId=${user.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setWeeks(response.data.weeks || []);
            setLoading(false);
        } catch (error) {
            console.error('Error loading weeks:', error);
            setLoading(false);
        }
    };

    const viewWeek = async (weekId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:3000/api/weeks/${weekId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

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
        return <div className="loading">Loading reflections...</div>;
    }

    return (
        <div className="container">
            <header>
                <h1>📔 Past Reflections</h1>
                <div className="user-info">
                    <Link to="/" className="btn-secondary">Back to Recording</Link>
                    <button onClick={logout} className="btn-secondary">Logout</button>
                </div>
            </header>

            <main>
                <div className="weeks-list">
                    {weeks.length === 0 ? (
                        <p className="empty-state">
                            No reflections yet. Complete your first week to see reflections here!
                        </p>
                    ) : (
                        weeks.map(week => {
                            const startDate = new Date(week.weekStart).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                            });
                            const endDate = new Date(week.weekEnd).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            });
                            const statusClass = week.status === 'complete' ? 'complete' : 'recording';
                            const statusText = week.status === 'complete' ? 'Complete' : 'In Progress';
                            const summary = week.insights?.moodTrend
                                ? `Mood: ${week.insights.moodTrend}`
                                : 'Reflection pending...';

                            return (
                                <div
                                    key={week._id}
                                    className="week-card"
                                    onClick={() => viewWeek(week._id)}
                                >
                                    <div className="week-header">
                                        <div className="week-title">Week of {startDate} - {endDate}</div>
                                        <div className={`week-status-badge ${statusClass}`}>{statusText}</div>
                                    </div>
                                    <div className="week-summary">{summary}</div>
                                </div>
                            );
                        })
                    )}
                </div>

                {selectedWeek && (
                    <div className="modal" onClick={(e) => e.target.className === 'modal' && closeModal()}>
                        <div className="modal-content">
                            <button className="modal-close" onClick={closeModal}>×</button>
                            <WeekDetail week={selectedWeek} entries={entries} />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const WeekDetail = ({ week, entries }) => {
    const startDate = new Date(week.weekStart).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric'
    });
    const endDate = new Date(week.weekEnd).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <div>
            <h2>Week of {startDate} - {endDate}</h2>
            <p style={{ color: 'var(--gray)', marginBottom: '24px' }}>{entries.length} entries</p>

            {week.status === 'complete' && week.insights ? (
                <>
                    {week.summary && (
                        <div style={{ marginBottom: '32px' }}>
                            <h3>Weekly Summary</h3>
                            <p style={{ lineHeight: 1.6, color: 'var(--dark)' }}>{week.summary}</p>
                        </div>
                    )}

                    <div style={{ marginBottom: '32px' }}>
                        <h3>Mood Trend</h3>
                        <p style={{ fontSize: '1.25rem', color: 'var(--primary)', fontWeight: 600 }}>
                            {week.insights.moodTrend}
                        </p>
                    </div>

                    {week.insights.keyThemes && week.insights.keyThemes.length > 0 && (
                        <div style={{ marginBottom: '32px' }}>
                            <h3>Key Themes</h3>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {week.insights.keyThemes.map((theme, i) => (
                                    <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                        {theme}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {week.insights.highlights && week.insights.highlights.length > 0 && (
                        <div style={{ marginBottom: '32px' }}>
                            <h3>Highlights</h3>
                            <ul style={{ listStyle: 'disc', paddingLeft: '20px', lineHeight: 1.8 }}>
                                {week.insights.highlights.map((highlight, i) => (
                                    <li key={i}>{highlight}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {week.insights.locationInsights && (
                        <div style={{
                            marginBottom: '32px',
                            background: 'var(--light-gray)',
                            padding: '20px',
                            borderRadius: '12px'
                        }}>
                            <h3>Movement & Location Insights</h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                gap: '16px',
                                marginTop: '16px'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--gray)' }}>Unique Locations</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                                        {week.insights.locationInsights.totalUniqueLocations}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--gray)' }}>Distance Traveled</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                                        {week.insights.locationInsights.distanceTraveled.toFixed(1)} km
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--gray)' }}>Mobility Score</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                                        {week.insights.locationInsights.mobilityScore}/100
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--gray)' }}>Time at Home</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                                        {week.insights.locationInsights.timeAtHome}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {week.transcriptions && week.transcriptions.length > 0 && (
                        <div style={{ marginBottom: '32px' }}>
                            <h3>Transcriptions</h3>
                            {week.transcriptions.map((t, index) => {
                                const date = new Date(t.recordedAt);
                                const dateStr = date.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'short',
                                    day: 'numeric'
                                });
                                const timeStr = date.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });

                                return (
                                    <div
                                        key={index}
                                        style={{
                                            background: 'var(--light-gray)',
                                            padding: '16px',
                                            borderRadius: '8px',
                                            marginBottom: '12px'
                                        }}
                                    >
                                        <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--dark)' }}>
                                            Entry {index + 1} - {dateStr} at {timeStr} {t.location?.address ? `• ${t.location.address}` : ''}
                                        </div>
                                        <div style={{ lineHeight: 1.6, color: 'var(--gray)' }}>
                                            {t.text}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--gray)' }}>
                    <p>Reflection for this week is still in progress.</p>
                    <p style={{ marginTop: '12px' }}>Check back after your reflection day!</p>
                </div>
            )}
        </div>
    );
};

export default Reflections;
