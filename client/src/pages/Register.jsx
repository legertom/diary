import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [reflectionDay, setReflectionDay] = useState(0);
    const [reflectionTime, setReflectionTime] = useState('18:00');
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Form submitted');
        setError('');

        try {
            console.log('Calling register with:', { name, email, reflectionDay, reflectionTime });
            await register(name, email, password, parseInt(reflectionDay), reflectionTime);
            console.log('Registration successful, navigating...');
            navigate('/');
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>📔 Audio Diary</h1>
                <p className="tagline">Reflect on your week, one voice entry at a time</p>

                <h2>Create Account</h2>
                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="reflectionDay">Reflection Day</label>
                        <select
                            id="reflectionDay"
                            value={reflectionDay}
                            onChange={(e) => setReflectionDay(e.target.value)}
                        >
                            {days.map((day, index) => (
                                <option key={index} value={index}>{day}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="reflectionTime">Reflection Time</label>
                        <input
                            type="time"
                            id="reflectionTime"
                            value={reflectionTime}
                            onChange={(e) => setReflectionTime(e.target.value)}
                            required
                        />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <button type="submit" className="btn-primary">Create Account</button>
                </form>
                <p className="switch-auth">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
