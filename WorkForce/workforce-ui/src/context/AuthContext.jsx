import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [profileImg, setProfileImg] = useState(null);

  useEffect(() => {
    const hasToken = localStorage.getItem('workforce_soft_token');
    const storedUserRaw = localStorage.getItem('workforce_user');
    if (hasToken && storedUserRaw) {
      try {
        const storedUser = JSON.parse(storedUserRaw);
        setLoggedInUser(storedUser);
        setUserName(storedUser.fullName || '');
        setIsUserAuthenticated(true);
      } catch {
        localStorage.clear();
      }
    }
  }, []);

  const login = (userData) => {
    // Store user data with proper structure
    const user = {
      userId: userData.userId,
      fullName: userData.fullName,
      mobileNumber: userData.mobileNumber,
      industry: userData.industry,
      role: userData.role,
      isVerified: userData.isVerified,
    };
    
    localStorage.setItem('workforce_soft_token', 'true');
    localStorage.setItem('workforce_user', JSON.stringify(user));
    setLoggedInUser(user);
    setUserName(user.fullName || '');
    setIsUserAuthenticated(true);
  };

  const logout = () => {
    localStorage.clear();
    setIsUserAuthenticated(false);
    setLoggedInUser(null);
    setUserName('');
    window.location.reload();
  };

  const value = {
    isUserAuthenticated,
    setIsUserAuthenticated,
    loggedInUser,
    setLoggedInUser,
    userName,
    setUserName,
    profileImg,
    setProfileImg,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};