/**
 * ChatbotRequest class
 */
export class ChatbotRequest {
    prompts: Message[] = [];
}

/**
 * Message class
 */
export class Message {
    role: string = '';
    content: string = '';
}