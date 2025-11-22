import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            if (token) {
                try {
                    const response = await axios.get('http://localhost:3000/api/auth/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (response.data.success) {
                        setUser(response.data.user);
                        localStorage.setItem('user', JSON.stringify(response.data.user));
                    }
                } catch (error) {
                    console.error('AuthContext: Failed to fetch user', error);
                    // If token is invalid, logout
                    if (error.response && error.response.status === 401) {
                        logout();
                    }
                }
            }
            setLoading(false);
        };

        fetchUser();
    }, [token]);

    const login = async (email, password) => {
        const response = await axios.post('http://localhost:3000/api/auth/login', {
            email,
            password
        });

        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setToken(token);
        setUser(user);

        return response.data;
    };

    const register = async (name, email, password, reflectionDay, reflectionTime) => {
        console.log('AuthContext: register called');
        try {
            const response = await axios.post('http://localhost:3000/api/auth/register', {
                name,
                email,
                password,
                reflectionDay,
                reflectionTime,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });
            console.log('AuthContext: API response received', response.data);

            const { token, user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setToken(token);
            setUser(user);

            return response.data;
        } catch (error) {
            console.error('AuthContext: Register API error', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const value = {
        user,
        token,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!token,
        loading
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
