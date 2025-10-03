import React from "react";
import { Outlet } from "react-router-dom";
import "./MainLayout.css";
// Import image
import logoAICON from "../../assets/images/aicon-logo.svg";

const Layout: React.FC = () => {
  return (
    <div className="wrapper">
      {/* Logo */}
      <div className="logo">
        <img src={logoAICON} alt="AICON Logo" />
      </div>

      {/* Page content */}
      <div className="content">
        <Outlet />
      </div>

      {/* Error UI */}
      <div id="error-ui" data-nosnippet>
        An unhandled error has occurred.
        <a href="." className="reload">Reload</a>
        <span className="dismiss">🗙</span>
      </div>
    </div>
  );
};

export default Layout;
