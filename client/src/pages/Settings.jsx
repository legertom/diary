import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/Settings.css';

const Settings = () => {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        reflectionDay: 0,
        reflectionTime: '18:00'
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                reflectionDay: user.reflectionDay !== undefined ? user.reflectionDay : 0,
                reflectionTime: user.reflectionTime || '18:00',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });
        }
    }, [user]);

    const days = [
        { value: 0, label: 'Sunday' },
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' },
        { value: 6, label: 'Saturday' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'reflectionDay' ? parseInt(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put('http://localhost:3000/api/auth/settings', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage(response.data.message);

            // Update local user state immediately
            updateUser(response.data.user);

            // If schedule changed, show explanation
            if (response.data.message.includes('adjusted')) {
                alert('Your reflection schedule has been updated. Your current week has been adjusted to match the new cycle.');
            }

            // No need to reload anymore!

        } catch (err) {
            console.error('Settings update error:', err);
            setError(err.response?.data?.error || 'Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <header>
                <h1>⚙️ Settings</h1>
                <div className="user-info">
                    <Link to="/" className="btn-secondary">Back to Dashboard</Link>
                </div>
            </header>

            <main className="settings-main">
                <div className="settings-card">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">Display Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-section">
                            <h3>Reflection Schedule</h3>
                            <p className="helper-text">
                                Choose when you want to receive your weekly reflection.
                                Changing this will adjust your current week's cycle.
                            </p>

                            <div className="form-group">
                                <label htmlFor="reflectionDay">Weekly Reflection Day</label>
                                <select
                                    id="reflectionDay"
                                    name="reflectionDay"
                                    value={formData.reflectionDay}
                                    onChange={handleChange}
                                >
                                    {days.map(day => (
                                        <option key={day.value} value={day.value}>
                                            {day.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="reflectionTime">Time (Local)</label>
                                <input
                                    type="time"
                                    id="reflectionTime"
                                    name="reflectionTime"
                                    value={formData.reflectionTime}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {message && <div className="success-message">{message}</div>}
                        {error && <div className="error-message">{error}</div>}

                        <div className="form-actions">
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="danger-zone">
                    <h3>Account Actions</h3>
                    <button onClick={logout} className="btn-secondary logout-btn">
                        Log Out
                    </button>
                </div>
            </main>
        </div>
    );
};

export default Settings;
