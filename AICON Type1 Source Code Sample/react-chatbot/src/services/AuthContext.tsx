import React, { createContext, useContext, useState, useEffect } from "react";
import authService from "./AuthService";

interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null); //userid
  const [loading, setLoading] = useState<boolean>(true); //loading status
  useEffect(() => {
    //When app loadm check local storage
    if (authService.isLoggedIn()) {
      setIsAuthenticated(true);
      setUserId(authService.getUserIdFromToken());
    }
    setLoading(false);
  }, []);

  const login = (accessToken: string, refreshToken: string) => {
    authService.saveToken(accessToken, refreshToken);
    setIsAuthenticated(true);
    setUserId(authService.getUserIdFromToken());
  };

  const logout = () => {
    authService.removeToken();
    setIsAuthenticated(false);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) 
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
