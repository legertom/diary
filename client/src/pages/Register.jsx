import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormInput from '../components/forms/FormInput';
import FormSelect from '../components/forms/FormSelect';
import ErrorMessage from '../components/forms/ErrorMessage';
import Button from '../components/common/Button';
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
        setError('');

        try {
            await register(name, email, password, parseInt(reflectionDay), reflectionTime);
            navigate('/');
        } catch (err) {
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
                    <FormInput
                        label="Name"
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <FormInput
                        label="Email"
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <FormInput
                        label="Password"
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                    <FormSelect
                        label="Reflection Day"
                        id="reflectionDay"
                        value={reflectionDay}
                        onChange={(e) => setReflectionDay(e.target.value)}
                        options={days}
                    />
                    <FormInput
                        label="Reflection Time"
                        id="reflectionTime"
                        type="time"
                        value={reflectionTime}
                        onChange={(e) => setReflectionTime(e.target.value)}
                        required
                    />
                    <ErrorMessage message={error} />
                    <Button type="submit" variant="primary">Create Account</Button>
                </form>
                <p className="switch-auth">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
