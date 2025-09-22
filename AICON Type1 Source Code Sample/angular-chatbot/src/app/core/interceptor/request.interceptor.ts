import { HttpHeaders, HttpInterceptorFn, HttpParams, HttpClient, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Observable, switchMap } from 'rxjs';
import { AuthenticationResponse } from '../../dto/authentication-response';
import { Router } from '@angular/router';
import { API_ENDPOINT } from '../api-endpoint';
import { AppConfigService } from '../app-config/app-config.service';

/**
 * Define request interceptor for all http requests
 * @param req : HttpRequest<unknown>
 * @param next : HttpHandlerFn
 * @returns : Observable<HttpEvent<unknown>>
 */
export const requestInterceptor: HttpInterceptorFn = (req, next) => {
  const accessToken = localStorage.getItem('access_token') ?? '';

  if (req.url.includes(API_ENDPOINT.AUTH) || req.url.includes('.json')) {
    // In case the request is for authentication or get configuration file
    return handleRequest(req, next, true);
  } else if (tokenExpired(accessToken)) {
    // If the access token is expired, get a new one using the refresh token

    // Inject dependencies
    const authService = inject(AuthService);

    // Call the function to get a new access token using the refresh token
    return getRefreshToken().pipe(
      switchMap(response => {
        // If the response is successful, save the new access token and refresh token
        authService.saveToken(response.access_token, response.refresh_token);

        // Continue with the request using the new access token
        return handleRequest(req, next, false);
      })
    );
  } else {
    // If the access token is not expired, proceed with the request
    return handleRequest(req, next, false);
  }
};

/**
 * This function handles the request by adding the access token to the headers if it is not for authentication or get configuration file
 * @param req : HttpRequest<unknown>
 * @param next : HttpHandlerFn
 * @param isNeededToken : boolean
 * @returns : Observable<HttpEvent<unknown>>
 */
function handleRequest(req: HttpRequest<unknown>, next: HttpHandlerFn, isNeededToken: boolean) {
  // If the request is for authentication, do not add the access token to the headers

  if (!isNeededToken) {
    // Clone the request and add the access token to the headers
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }
    });
  }

  return next(req);
}

/**
 * This function checks if the token is expired or not
 * @param token : string
 * @returns : boolean
 */
function tokenExpired(token: string): boolean {
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

/**
 * This function gets a new access token using the refresh token
 * @returns : Observable<AuthenticationResponse>
 */
function getRefreshToken(): Observable<AuthenticationResponse> {
  const refreshToken = localStorage.getItem('refresh_token') ?? '';

  if (tokenExpired(refreshToken)) {
    // If the refresh token is expired, redirect to the login page

    // Inject dependencies
    const authService = inject(AuthService);
    const router = inject(Router);

    // Remove the access token and refresh token from local storage
    authService.removeToken();

    // Redirect to the login page
    router.navigate(['/login']);

    // Return an empty observable to avoid further processing
    return new Observable<AuthenticationResponse>();
  } else {
    // If the refresh token is not expired, proceed to get a new access token

    // Inject dependencies
    const httpClient = inject(HttpClient);
    const appConfigService = inject(AppConfigService);

    // Define the URL for the refresh token endpoint
    const url = appConfigService.get('aiConApiEndpoint') + API_ENDPOINT.AUTH;

    const headers: HttpHeaders = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    // Set the parameters for the request
    let params = new HttpParams();
    params = params.set('client_id', appConfigService.get('clientID'));
    params = params.set('client_secret', appConfigService.get('clientSecret'));
    params = params.set('grant_type', appConfigService.get('refreshGrantType'));
    params = params.set('refresh_token', localStorage.getItem('refresh_token') ?? '');

    return httpClient.post<AuthenticationResponse>(url, params.toString(), { headers: headers });
  }
}
