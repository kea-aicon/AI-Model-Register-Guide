import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  constructor(
    private readonly router: Router
  ) { }

  /**
   * Start chat with the chatbot
   */
  startChat() {
    this.router.navigate(['/chatbot']);
  }
}