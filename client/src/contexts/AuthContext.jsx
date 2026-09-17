import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [enabledApps, setEnabledApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('nexus_token') || null);
  const navigate = useNavigate();

  const fetchEntitlements = useCallback(async (orgId) => {
    if (!orgId) {
      setEnabledApps([]);
      return;
    }
    try {
      const { data } = await client.get(`/organizations/${orgId}/apps`);
      const active = data.filter(a => a.enabled).map(a => a.app_name);
      setEnabledApps(active);
    } catch (err) {
      console.error('Failed to load organization app entitlements', err);
      setEnabledApps([]);
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const { data } = await client.get('/auth/me');
          const userData = data.user || data;
          setUser(userData);
          if (userData.organizationId) {
            await fetchEntitlements(userData.organizationId);
          }
        } catch (error) {
          localStorage.removeItem('nexus_token');
          setToken(null);
          setUser(null);
          setEnabledApps([]);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token, fetchEntitlements]);

  const login = async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    localStorage.setItem('nexus_token', data.token);
    setToken(data.token);
    setUser(data.user);
    if (data.user.organizationId) {
      await fetchEntitlements(data.user.organizationId);
    }
  };

  const signup = async (name, email, password, globalRole) => {
    const { data } = await client.post('/auth/signup', { name, email, password, globalRole });
    localStorage.setItem('nexus_token', data.token);
    setToken(data.token);
    setUser(data.user);
    if (data.user.organizationId) {
      await fetchEntitlements(data.user.organizationId);
    }
  };

  const logout = () => {
    localStorage.removeItem('nexus_token');
    setToken(null);
    setUser(null);
    setEnabledApps([]);
    navigate('/login');
  };

  const refreshApps = async () => {
    if (user?.organizationId) {
      await fetchEntitlements(user.organizationId);
    }
  };

  const hasApp = (appName) => {
    return enabledApps.includes(appName);
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
        enabledApps,
        hasApp,
        refreshApps
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
