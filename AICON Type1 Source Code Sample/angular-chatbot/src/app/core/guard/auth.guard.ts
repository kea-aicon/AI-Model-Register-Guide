import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthenticationResponse } from '../../dto/authentication-response';
import { map, catchError, of } from 'rxjs';

/**
 * Define auth guard for login page
 * @param route : ActivatedRouteSnapshot
 * @param state : RouterStateSnapshot
 * @returns : True if user is not authenticated, false if user is authenticated
 */
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    return true;
  }

  const authService = inject(AuthService);
  // Get 'userid' from token
  const tokenUserId = authService.getUserIdFromToken(accessToken);
  // Get 'userid' from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const userIdParam = urlParams.get('userid');
  if (tokenUserId && userIdParam) {
    if (userIdParam === tokenUserId) {
      router.navigate(['/home']);
      return false;
    }
    else {
      authService.removeToken();
      return true;
    }
  } else {
    router.navigate(['/home']);
    return false;
  }
};

/**
 * Define auth guard for home and chatbot page
 * @param route : ActivatedRouteSnapshot
 * @param state : RouterStateSnapshot
 * @returns : True if user is authenticated, false if user is not authenticated
 */
export const canActive: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const accessToken = localStorage.getItem('access_token');
  // Inject dependencies
  const router = inject(Router);
  const authService = inject(AuthService);

  if (accessToken) {
    // Get 'userid' from token
    const tokenUserId = authService.getUserIdFromToken(accessToken);
    // Get 'userid' from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('userid');
    if (tokenUserId && userIdParam && userIdParam !== tokenUserId) {
      authService.removeToken();
      router.navigate(['/login']);
      return false;
    }
    // If access token is present, user is authenticated
    return true;
  } else {
    // Get 'code' from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const authorizationCode = urlParams.get('code');

    // If 'code' is present, call the authentication service to get the access token
    if (authorizationCode) {
      return authService.authenticate(authorizationCode).pipe(
        map((response: AuthenticationResponse) => {
          // Save the access token and refresh token in local storage
          authService.saveToken(response.access_token, response.refresh_token);
          return true;
        }),
        catchError(() => {
          router.navigate(['/login']);
          return of(false);
        })
      );
    } else {
      // If 'code' is not present, redirect to the login page
      router.navigate(['/login']);
      return false;
    }
  }
};
