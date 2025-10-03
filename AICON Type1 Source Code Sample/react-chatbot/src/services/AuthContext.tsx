import React, { createContext, useContext, useState, useEffect } from "react";
import authService from "./AuthService";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true); // thêm trạng thái loading
  useEffect(() => {
    //When app loadm check local storage
    if (authService.isLoggedIn()) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (accessToken: string, refreshToken: string) => {
    authService.saveToken(accessToken, refreshToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    authService.removeToken();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
