'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as authApi from '../services/auth.service';
import { getToken, setToken, clearToken, getSession, setSession } from '@/shared/utils/tokenStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'authenticated' | 'guest'

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setStatus('guest');
      return;
    }

    const cached = getSession();
    if (cached) {
      setUser(cached.user);
      setPermissions(cached.permissions || []);
    }

    authApi
      .getMe()
      .then((data) => {
        setUser(data.user);
        setPermissions(data.permissions || []);
        setSession(data);
        setStatus('authenticated');
      })
      .catch(() => {
        clearToken();
        setUser(null);
        setPermissions([]);
        setStatus('guest');
      });
  }, []);

  const login = async (username, password) => {
    const data = await authApi.login(username, password);
    setToken(data.token);
    setUser(data.user);
    setPermissions(data.permissions || []);
    setSession({ user: data.user, permissions: data.permissions });
    setStatus('authenticated');
    return data;
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setPermissions([]);
    setStatus('guest');
    router.replace('/login');
  };

  const hasPermission = (key) => permissions.includes(key);

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        status,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
