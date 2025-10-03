import React, { useEffect } from "react";
import "./Login.css";
// Import image
import iconLogin from "../../assets/images/login.svg";
import logoAICON from "../../assets/images/aicon-logo.svg";

const Login: React.FC = () => {
  /**
   * Handler login action
   */
  const actionLogin = () => {
    //Get config key
    const kabLogin = import.meta.env.VITE_AICON_LOGIN;
    const clientID = import.meta.env.VITE_CLIENT_ID;

    //Url for redirect to AICON login
    const url =
      kabLogin +
      "?client_id=" +
      clientID +
      "&redirect_uri=" +
      window.location.origin; //domain app

    window.location.href = url;
  };

  return (
    <div className="login">
      <img src={iconLogin} alt="Login" className="login-image" />
      <div className="title">We need access to AICON</div>
      <div>
          <button className="button-login" onClick={actionLogin}>
              <img src={logoAICON} alt="AICON Logo" className="aicon-logo" />
              Continue with AICON
          </button>
      </div>
      <div className="terms">
          By clicking “Continue with AICON”, you acknowleadge that you have read and understood and agree to AICON’s Terms
          & Conditions and Privacy Policy
      </div>
    </div>
  );
};

export default Login;
