import axios from "axios";
import config from "./Config";

// data type by response authenticate
export interface AuthenticationResponse {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
}

class AuthService {
  /**
   * Authenticate the user using the authorization code received from the KAB
   * @param authorizationCode string
   */
  async authenticate(authorizationCode: string, isRefresh: boolean): Promise<AuthenticationResponse> {
    const url = config.AICONApiEndpoint + "/auth/sso/token";

    const params = new URLSearchParams();
    params.set("client_id", config.clientID);
    params.set("client_secret", config.clientSecret);
    params.set("grant_type", isRefresh ? config.refreshGrantType : config.authenGrantType);
    //Authen by login AICON
    if (!isRefresh && authorizationCode) {
      params.set("code", authorizationCode);
      params.set("redirect_uri", window.location.origin);
    }
    //Authen by refreshToken (case logged)
    else {
      params.set("refresh_token", localStorage.getItem("refresh_token"));
    }

    const response = await axios.post<AuthenticationResponse>(url, params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    return response.data;
  }

  /**
   * Save the access token and refresh token in local storage
   */
  saveToken(accessToken: string, refreshToken: string): void {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
  }

  /**
   * Remove the access token and refresh token from local storage
   */
  removeToken(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem("access_token");
  }

  /**
   * Check if logged in
   */
  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Checks if the token is expired or not
   */
  tokenExpired(token: string): boolean {
    if (!token) {
      return true;
    }

    // Split the token into its parts (header, payload, signature)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return true;
    }

    // Decode the payload part of the token (base64url decode)
    const payload = JSON.parse(atob(tokenParts[1]));

    // Convert to milliseconds
    const expirationTime = payload.exp * 1000;

    // Check if the current time is greater than the expiration time
    return Date.now() > expirationTime;
  }
}

export default new AuthService();
