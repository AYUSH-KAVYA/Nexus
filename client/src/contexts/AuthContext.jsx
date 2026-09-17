import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('nexus_token') || null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const { data } = await client.get('/auth/me');
          setUser(data.user || data);
        } catch (error) {
          localStorage.removeItem('nexus_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    localStorage.setItem('nexus_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const signup = async (name, email, password, globalRole) => {
    const { data } = await client.post('/auth/signup', { name, email, password, globalRole });
    localStorage.setItem('nexus_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('nexus_token');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  const isAdmin = user?.globalRole === 'admin';
  const isPM = user?.globalRole === 'pm';
  const isStakeholder = user?.globalRole === 'stakeholder';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        login,
        signup,
        logout,
        isAdmin,
        isPM,
        isStakeholder,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
