import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Configure axios base URL
    const api = axios.create({
        baseURL: 'http://localhost:8000/api',
    });

    // Add token to requests if exists
    api.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    // Handle 401 responses globally
    api.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('token');
                setUser(null);
            }
            return Promise.reject(error);
        }
    );

    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await api.get('/users/me');
                    setUser(response.data);
                } catch (error) {
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    const login = async (username, password) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const response = await api.post('/token', formData);
        const { access_token } = response.data;

        localStorage.setItem('token', access_token);
        const userResponse = await api.get('/users/me');
        setUser(userResponse.data);
        return userResponse.data;
    };

    const logout = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                await api.post('/logout');
            } catch (error) {
                console.error("Logout error", error);
            }
        }
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, api }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
