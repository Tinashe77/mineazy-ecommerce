import { createContext, useState, useEffect } from 'react';
import {
  login as loginService,
  register as registerService,
  getProfile,
  forgotPassword as forgotPasswordService,
  resetPassword as resetPasswordService,
  changePassword as changePasswordService,
  resendVerification as resendVerificationService,
} from '../services/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('token');
    
    if (storedToken) {
      setLoading(true);
      try {
        const response = await getProfile(storedToken);
        if (response && response.id) {
          setUser(response);
          setToken(storedToken);
        } else {
          // Invalid token or user not found
          logout();
        }
      } catch (error) {
        console.error('Failed to refresh user:', error);
        logout();
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []); // Only run once on mount

  const login = async (credentials) => {
    try {
      const response = await loginService(credentials);
      if (response.token) {
        localStorage.setItem('token', response.token);
        setToken(response.token);
        setUser(response.user);
      }
      return response;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await registerService(userData);
      if (response.token) {
        localStorage.setItem('token', response.token);
        setToken(response.token);
        setUser(response.user);
      }
      return response;
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const forgotPassword = async (email) => {
    return await forgotPasswordService({ email });
  };

  const resetPassword = async (data) => {
    return await resetPasswordService(data);
  };

  const changePassword = async (passwords) => {
    return await changePasswordService(passwords, token);
  };

  const resendVerification = async () => {
    return await resendVerificationService(token);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        register,
        forgotPassword,
        resetPassword,
        changePassword,
        resendVerification,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};