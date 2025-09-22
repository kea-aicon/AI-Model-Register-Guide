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
   * @param messageInput : string, that message content user chat
   * @returns : Observable<ChatbotResponse>
   */
  sendMessage(messageInput: string): Observable<ChatbotResponse> {
    // Define the URL for the chatbot endpoint
    // Get domain chatbot from config (configs.json), Example: https://api.provider-chatbot.or.kr
    const url = this.appConfigService.get('apiEndPoint') 
    //Get endpoint api chatbot from constant, Example: /chat
    + API_ENDPOINT.CHAT;

    // Create a new FormData object to send the file and message
    const formData = new FormData();
    formData.append('prompt', messageInput);

    //Call api and return response data
    return this.httpClient.post<ChatbotResponse>(url, formData);
  }

  /**
   * Upload file to the server and get the processed file
   * @param files : Attach file user upload
   * @param messageInput : string, that message content user chat
   * @returns : Observable<Blob>
   */
  uploadFile(files: File[], messageInput: string): Observable<Blob> {
    // Define the URL for the file processing endpoint
    // Get domain chatbot from config (configs.json), Example: https://api.provider-chatbot.or.kr
    const url = this.appConfigService.get('apiEndPoint') 
    //Get endpoint api chatbot from constant, Example: /chat
    + API_ENDPOINT.CHAT;

    // Create a new FormData object to send the file and message
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    formData.append('prompt', messageInput);

    //Call api and return response data, data is file content
    return this.httpClient.post(url, formData, {
      responseType: 'blob'
    });
  }
}
