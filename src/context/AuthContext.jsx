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

  const refreshUser = async () => {
    if (token) {
      const response = await getProfile(token);
      if (response.id) {
        setUser(response);
      } else {
        logout();
      }
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (credentials) => {
    const response = await loginService(credentials);
    if (response.token) {
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('token', response.token);
    }
    return response;
  };

  const register = async (userData) => {
    const response = await registerService(userData);
    if (response.token) {
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('token', response.token);
    }
    return response;
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