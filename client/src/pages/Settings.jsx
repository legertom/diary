import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/common/AppHeader';
import Button from '../components/common/Button';
import FormInput from '../components/forms/FormInput';
import FormSelect from '../components/forms/FormSelect';
import ErrorMessage from '../components/forms/ErrorMessage';
import SuccessMessage from '../components/forms/SuccessMessage';
import useUserSettings from '../hooks/useUserSettings';
import '../styles/Settings.css';

const Settings = () => {
    const { logout, user } = useAuth();
    const { updateSettings, loading, error: settingsError } = useUserSettings();
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
        setMessage(null);
        setError(null);

        try {
            const response = await updateSettings(formData);
            setMessage(response.message);

            // If schedule changed, show explanation
            if (response.message.includes('adjusted')) {
                alert('Your reflection schedule has been updated. Your current week has been adjusted to match the new cycle.');
            }
        } catch (err) {
            setError(settingsError || 'Failed to update settings');
        }
    };

    return (
        <div className="container">
            <AppHeader title="⚙️ Settings">
                <Link to="/">
                    <Button variant="secondary">Back to Dashboard</Button>
                </Link>
            </AppHeader>

            <main className="settings-main">
                <div className="settings-card">
                    <form onSubmit={handleSubmit}>
                        <FormInput
                            label="Display Name"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />

                        <div className="form-section">
                            <h3>Reflection Schedule</h3>
                            <p className="helper-text">
                                Choose when you want to receive your weekly reflection.
                                Changing this will adjust your current week's cycle.
                            </p>

                            <FormSelect
                                label="Weekly Reflection Day"
                                id="reflectionDay"
                                name="reflectionDay"
                                value={formData.reflectionDay}
                                onChange={handleChange}
                                options={days}
                            />

                            <FormInput
                                label="Time (Local)"
                                id="reflectionTime"
                                name="reflectionTime"
                                type="time"
                                value={formData.reflectionTime}
                                onChange={handleChange}
                            />
                        </div>

                        <SuccessMessage message={message} />
                        <ErrorMessage message={error || settingsError} />

                        <div className="form-actions">
                            <Button type="submit" variant="primary" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="danger-zone">
                    <h3>Account Actions</h3>
                    <Button variant="secondary" onClick={logout} className="logout-btn">
                        Log Out
                    </Button>
                </div>
            </main>
        </div>
    );
};

export default Settings;
