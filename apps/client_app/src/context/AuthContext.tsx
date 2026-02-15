'use client';

import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import { api } from '@/lib/axios';
import { User, Profile } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
}

export interface SignupData {
  email: string;
  password: string;
  username: string;
  displayName: string;
  birthday: string;
  bio?: string;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initializeRef = useRef(false);

  const getCurrentUser = useCallback(async () => {
    try {
      const response = await api.get('/users/current_user');
      const userData = response.data;
      setUser({
        id: userData.id,
        email: userData.email,
        username: userData.username,
        role: userData.role,
      });
      if (userData.profile) {
        setProfile(userData.profile);
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
      setUser(null);
      setProfile(null);
      localStorage.removeItem('accessToken');
    }
  }, []);

  useEffect(() => {
    if (initializeRef.current) return;
    initializeRef.current = true;

    const token = localStorage.getItem('accessToken');
    if (token) {
      getCurrentUser().finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [getCurrentUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const response = await api.post('/auth/login', { email, password });
        const { accessToken, refreshTokenId } = response.data;

        if (!accessToken) {
          throw new Error('No access token in response');
        }

        localStorage.setItem('accessToken', accessToken);
        if (refreshTokenId) {
          localStorage.setItem('refreshTokenId', refreshTokenId);
        }
        await getCurrentUser();
      } catch (error) {
        console.error('Login error:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshTokenId');
        setUser(null);
        setProfile(null);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [getCurrentUser],
  );

  const signup = useCallback(
    async (data: SignupData) => {
      setIsLoading(true);
      try {
        const response = await api.post('/auth/signup', data);
        const { accessToken, refreshTokenId } = response.data;

        if (!accessToken) {
          throw new Error('No access token in response');
        }

        localStorage.setItem('accessToken', accessToken);
        if (refreshTokenId) {
          localStorage.setItem('refreshTokenId', refreshTokenId);
        }
        await getCurrentUser();
      } catch (error) {
        console.error('Signup error:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshTokenId');
        setUser(null);
        setProfile(null);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [getCurrentUser],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshTokenId');
      setUser(null);
      setProfile(null);
    }
  }, []);

  const value = {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    getCurrentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
