import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import authService from "./AuthService";

const AuthHandler: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  /**
   * Handler redirect from AICON page
  */
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const code = query.get("code");

    if (code) {
      //use code value for authen (get access token and refresh token)
      authService.authenticate(code, false)
        .then((res) => {
          login(res.access_token, res.refresh_token);
          // replaceState for remove ?code= on url
          window.history.replaceState({}, document.title, "/");
          navigate("/", { replace: true });
        })
        .catch((err) => {
          console.error("Authentication failed", err);
          navigate("/login");
        });
    }
  }, []);

  return null;
};

export default AuthHandler;
