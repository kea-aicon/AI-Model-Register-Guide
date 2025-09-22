import { Injectable } from '@angular/core';
import { HttpHeaders, HttpParams, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthenticationResponse } from '../dto/authentication-response';
import { API_ENDPOINT } from '../core/api-endpoint';
import { AppConfigService } from '../core/app-config/app-config.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private readonly http: HttpClient,
    private readonly appConfigService: AppConfigService
  ) { }

  /**
   * Authenticate the user using the authorization code received from the AICON
   * @param authorizationCode : string
   * @returns : Observable<AuthenticationResponse>
   */
  authenticate(authorizationCode: string): Observable<AuthenticationResponse> {
    // Define the URL for the authentication endpoint
    const url = this.appConfigService.get('aiConApiEndpoint') + API_ENDPOINT.AUTH;

    // Set the headers for the request
    const headers: HttpHeaders = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    // Set the parameters for the request
    let params = new HttpParams();
    params = params.set('client_id', this.appConfigService.get('clientID'));
    params = params.set('client_secret', this.appConfigService.get('clientSecret'));
    params = params.set('grant_type', this.appConfigService.get('authenGrantType'));
    params = params.set('code', authorizationCode);
    params = params.set('redirect_uri', window.location.origin);

    return this.http.post<AuthenticationResponse>(url, params.toString(), { headers: headers });
  }

  /**
   * Save the access token and refresh token in local storage
   * @param accessToken : string
   * @param refreshToken : string
   */
  saveToken(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  /**
   * Remove the access token and refresh token from local storage
   */
  removeToken(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}
