import { NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MenuComponent } from "../menu/menu.component";
import { HeaderComponent } from "../header/header.component";

@Component({
  selector: 'app-default',
  imports: [RouterOutlet, NgClass, MenuComponent, HeaderComponent],
  templateUrl: './default.component.html',
  styleUrl: './default.component.scss'
})
export class DefaultComponent implements OnInit {
  router = inject(Router);
  device: string = '';
  constructor() { }

  ngOnInit(): void {
    this.detectDevice();
  }

  /**
   * Detect the device type based on the screen width and set it in local storage
   */
  detectDevice(): void {
    this.device = localStorage.getItem('device') ?? 'tablet';
  }

  /**
   * Check if the current page is the login page
   * @returns : boolean
   */
  isLoginPage(): boolean {
    return this.router.url === '/login';
  }

  /**
   * Set the device type in local storage
   * @param device : string
   */
  selectedDevice(device: string) {
    this.device = device;
    localStorage.setItem('device', device);
  }
}
