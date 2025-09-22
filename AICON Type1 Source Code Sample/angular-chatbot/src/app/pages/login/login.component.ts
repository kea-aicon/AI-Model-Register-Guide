import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppConfigService } from '../../core/app-config/app-config.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  constructor(
    private readonly appConfigService: AppConfigService
  ) { }

  /**
   * Redirect to the login page of the AICON
   */
  actionLogin() {
    // Build the login URL from configuration
    // Example: https://aicon.or.kr/auth/login 
    const url = this.appConfigService.get('aiConLogin') 
    // Add the client_id query parameter (identifies the application), value clientID get from configuration
    + "?client_id=" + this.appConfigService.get('clientID') 
    // Add the redirect_uri query parameter (where the login server will redirect after success)
    + "&redirect_uri=" + window.location.origin;

    // Open the login URL in the same browser tab ("_self")
    // This effectively redirects the user to the login page
    window.open(url, "_self");
  }
}
