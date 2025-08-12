import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private config: any = null;

  // Path to config file in assets folder
  private readonly configUrl = 'assets/configs/configs.json';

  constructor(
    private readonly http: HttpClient
  ) { }

  /**
   * Load configuration from external JSON file
   * @returns : Observable<any>
   */
  loadConfig(): Observable<any> {
    return this.http.get(this.configUrl)
      .pipe(
        tap((config) => {
          this.config = config;
          console.log('Configuration loaded successfully');
        }),
        catchError(error => {
          console.error('Error loading configuration file:', error);
          return throwError(() => new Error('Could not load config file'));
        })
      );
  }

  /**
   * Get configuration value by key
   * @param key : string
   * @param defaultValue : any
   * @returns : any
   */
  get(key: string, defaultValue: any = null): any {
    if (!this.config) {
      console.warn('Configuration not loaded yet');
      return defaultValue;
    }

    let result = null;

    if (this.config[key] !== undefined) {
      result = this.config[key];
    }

    return result;
  }
}
