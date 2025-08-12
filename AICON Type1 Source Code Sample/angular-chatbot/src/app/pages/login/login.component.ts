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
   * Redirect to the login page of the KAB
   */
  actionLogin() {
    const url = this.appConfigService.get('kabLogin') + "?client_id=" + this.appConfigService.get('clientID') + "&redirect_uri=" + window.location.origin;
    window.open(url, "_self");
  }
}
