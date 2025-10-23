import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import authService from "./AuthService";

const AuthHandler: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  /**
   * Handler redirect from AICON page
  */
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const code = query.get("code");
    const userIdParam = query.get("userid");
    const accessToken = authService.getAccessToken();

    // If haven't access token
    if (!accessToken) {
      if (code) {
        authService.authenticate(code, false)
          .then((res) => {
            login(res.access_token, res.refresh_token);
            // Clear query code in URL
            window.history.replaceState({}, document.title, "/");
            navigate("/", { replace: true });
          })
          .catch((err) => {
            console.error("Authentication failed", err);
            navigate("/login", { replace: true });
          });
      } else {
        // If hasn't access token and code
        navigate("/login", { replace: true });
      }
      return;
    }

    // If have access token
    if (userIdParam) {
      const userIdInToken = authService.getUserIdFromToken();
      if (userIdParam !== userIdInToken) {
        // Diffirent userid → logout + navigation to login page
        logout();
        navigate("/login", { replace: true });
        return;
      } else {
        // userId matched → navigation to home and clear userid in URL
        window.history.replaceState({}, document.title, "/");
        navigate("/", { replace: true });
        return;
      }
    }

    // Haven't userid, continue
    console.log("Haven't userid, continue");
  }, [location.search, login, logout, navigate]);

  return null;
};

export default AuthHandler;
