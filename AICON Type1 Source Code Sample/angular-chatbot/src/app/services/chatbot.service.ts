import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatbotResponse } from '../dto/chatbot-response';
import { API_ENDPOINT } from '../core/api-endpoint';
import { AppConfigService } from '../core/app-config/app-config.service';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly appConfigService: AppConfigService
  ) { }

  /**
   * Send message to the chatbot and get the response
   * @param messageInput : string
   * @returns : Observable<ChatbotResponse>
   */
  sendMessage(messageInput: string): Observable<ChatbotResponse> {
    // Define the URL for the chatbot endpoint
    const url = this.appConfigService.get('apiEndPoint') + API_ENDPOINT.CHAT;

    // Create a new FormData object to send the file and message
    const formData = new FormData();
    formData.append('prompt', messageInput);

    return this.httpClient.post<ChatbotResponse>(url, formData);
  }

  /**
   * Upload file to the server and get the processed file
   * @param files : File
   * @param messageInput : string
   * @returns : Observable<Blob>
   */
  uploadFile(files: File[], messageInput: string): Observable<Blob> {
    // Define the URL for the file processing endpoint
    const url = this.appConfigService.get('apiEndPoint') + API_ENDPOINT.CHAT;

    // Create a new FormData object to send the file and message
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    formData.append('prompt', messageInput);

    return this.httpClient.post(url, formData, {
      responseType: 'blob'
    });
  }
}
