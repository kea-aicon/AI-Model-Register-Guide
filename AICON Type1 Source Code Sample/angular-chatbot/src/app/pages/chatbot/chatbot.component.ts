import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ChatbotService } from '../../services/chatbot.service';
import { FormsModule, } from '@angular/forms';
import { ChatbotResponse } from '../../dto/chatbot-response';
import { CommonModule } from '@angular/common';
import { MarkdownComponent } from 'ngx-markdown';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-chatbot',
  imports: [FormsModule, CommonModule, MarkdownComponent],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss'
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  // Reference to the chat content container for scrolling
  @ViewChild('chatContentContainer') private readonly chatContentContainer: ElementRef | undefined;

  // Message from user
  messageInput: string = '';

  // Messages list from user
  messageInputList: string[] = [];

  // Messages list from chatbot
  messageOutputList: string[] = [];

  // All messages list from user and chatbot
  messageOutputAll: string[] = [];

  // Heart rate from URL parameter
  heartRate: string | null;

  // Loading state
  isLoading: boolean = false;

  // Files list selected to upload
  selectedFilesList: File[] = [];

  // File processed and ready to download
  processedFiles: { name: string, blob: Blob, url: SafeUrl }[] = [];

  // Scroll to bottom state
  shouldScroll = true;

  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly route: ActivatedRoute,
    private readonly sanitizer: DomSanitizer) {
    this.heartRate = this.route.snapshot.queryParamMap.get('heartRate');
  }

  ngOnInit(): void {
    if (this.heartRate) {
      const messageInput = `My heart rate is ${this.heartRate} bpm, advise me.`;
      this.sendMessage(messageInput);
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
    }
  }

  ngOnDestroy() {
    this.processedFiles.forEach(fileInfo => {
      window.URL.revokeObjectURL(fileInfo.url.toString());
    });
  }

  /**
   * Send message to chatbot or upload file
   * @returns : void
   */
  callChatbot(): void {
    // Check if the message input is empty and no file is selected
    if (this.messageInput.trim().length === 0 && this.selectedFilesList.length === 0) {
      return;
    }

    if (this.selectedFilesList.length) {
      // If a file is selected, upload the file with the message input
      this.uploadFile(this.messageInput);

      // Reset the selected file to allow re-uploading the same file
      this.selectedFilesList = [];
    } else {
      // If no file is selected, send the message input to the chatbot
      this.sendMessage(this.messageInput);
    }

    // Reset the message input field
    this.messageInput = '';

    // Set the scroll to bottom state to true
    this.shouldScroll = true;
  }

  /**
   * Send message to chatbot
   * @param messageInput : string
   */
  sendMessage(messageInput: string) {
    // Set loading state to true
    this.isLoading = true;

    // Add message to chat
    this.messageInputList.push(messageInput);
    this.messageOutputAll.push(messageInput);

    // Call the chatbot service to send the message
    this.chatbotService.sendMessage(messageInput).subscribe({
      next: (chatbotResponse: ChatbotResponse) => {
        // Add the chatbot response to the chat
        this.messageOutputList.push(chatbotResponse.message);
        this.messageOutputAll.push(chatbotResponse.message);

        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error sending message: ', error);

        const errorMessage = 'There is an error occured. Please try again.';
        // Add error message to chat
        this.messageOutputList.push(errorMessage);
        this.messageOutputAll.push(errorMessage);

        this.isLoading = false;
      }
    });
  }

  /**
   * Select file to upload
   * @param event : any
   */
  onFileSelected(event: any): void {
    const selectedFile = event.target.files[0] as File;

    this.selectedFilesList.push(selectedFile);

    // Reset the file input value to allow re-uploading the same file
    event.target.value = '';
  }

  uploadFile(messageInput: string) {
    // Set loading state to true
    this.isLoading = true;

    // Add file message to chat
    this.messageInputList.push(messageInput);
    this.messageOutputAll.push(messageInput);

    this.chatbotService.uploadFile(this.selectedFilesList, messageInput).subscribe({
      next: (response: Blob) => {
        // Create a blob URL for the processed file and add it to the processed files list
        // const fileName = this.getProcessedFileName(selectedFile?.name ?? 'processed');

        const fileName = 'file_processed';

        // Create a blob URL for the response
        const url = window.URL.createObjectURL(response);

        // Sanitize the URL to avoid security issues
        const safeUrl = this.sanitizer.bypassSecurityTrustUrl(url);

        const fileIndex = this.processedFiles.length;

        // Create a download link for the processed files
        this.processedFiles.push({ name: fileName, blob: response, url: safeUrl });

        const responseMessage = `Your file processed successful. Download [${fileName}](#download-${fileIndex})`;

        this.messageOutputList.push(responseMessage);
        this.messageOutputAll.push(responseMessage);

        // Set up the download link for the processed files
        setTimeout(() => this.setupDownloadLinks(fileIndex, fileName), 100);

        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error uploading file:', error);

        const errorMessage = 'There is an error occured. Please try again.';
        // Add error message to chat
        this.messageOutputList.push(errorMessage);
        this.messageOutputAll.push(errorMessage);

        this.isLoading = false;
      }
    });
  }

  /**
   * Get the processed file name
   * @param originalName : string
   * @returns : string
   */
  getProcessedFileName(originalName: string): string {
    // Get the last dot index in the file name
    const lastDot = originalName.lastIndexOf('.');
    if (lastDot === -1) {
      return `${originalName}_processed`;
    }

    // Split the file name into base name and extension
    const baseName = originalName.substring(0, lastDot);
    const extension = originalName.substring(lastDot);

    // Return the processed file name with "_processed" suffix
    return `${baseName}_processed${extension}`;
  }

  /**
   * Set up download links for processed files
   * @param fileIndex : number
   * @param fileName : string
   */
  setupDownloadLinks(fileIndex: number, fileName: string): void {
    // Get all links with the href attribute matching the download link format
    const links = document.querySelectorAll(`a[href="#download-${fileIndex}"]`);

    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.downloadFile(fileIndex, fileName);
      });
    });
  }

  /**
   * Download the processed file
   * @param fileIndex : number
   * @param fileName : string
   */
  downloadFile(fileIndex: number, fileName: string): void {
    const fileInfo = this.processedFiles[fileIndex];

    if (!fileInfo) {
      return
    };

    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(fileInfo.blob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Scroll to the bottom of the chat content container
   */
  scrollToBottom(): void {
    try {
      if (this.chatContentContainer) {
        this.chatContentContainer.nativeElement.scrollTop = this.chatContentContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom: ', err);
    }
  }
}
