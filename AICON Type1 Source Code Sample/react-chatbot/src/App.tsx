import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import ChatbotPage from "./pages/chatbot/Chatbot";
import { AuthProvider } from "./services/AuthContext";
import ProtectedRoute from "./services/ProtectedRoute";
import AuthHandler from "./services/AuthHandler";
import Layout from "./component/layout/MainLayout";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        {/* run AuthHandler for the code from redirect */}
        <AuthHandler />

        <Routes>
          <Route element={<Layout />}>
          {/* Login page do not protected */}
          <Route path="/login" element={<Login />} />
          {/* Home page and Chatbot page must log in to access*/}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chatbot"
            element={
              <ProtectedRoute>
                <ChatbotPage />
              </ProtectedRoute>
            }
          />
          {/* Redirect to login when no route is matched */}
          <Route path="*" element={<Login />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
