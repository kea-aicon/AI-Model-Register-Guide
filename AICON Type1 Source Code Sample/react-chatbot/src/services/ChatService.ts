
import axios from "axios";
import authService from "./AuthService";

//data type by response chat
export interface ChatbotResponse {
  message: string;
}

const API_BASE = import.meta.env.VITE_API_ENDPOINT || "";

const ChatService = {
  async sendMessage(message: string): Promise<string> {
    //Check token expired?
    var accessToken = localStorage.getItem("access_token");
    if (authService.tokenExpired(accessToken)) {
      //Call api AICON for get access token
      var token = await authService.authenticate("", true);
      //Save to local stograge
      localStorage.setItem("access_token", token.access_token);
      accessToken = token.access_token;
    }

    //Endpoint AI chat
    const url = `${API_BASE}/chat`;

    //Call api
    const formData = new FormData();
    formData.append('prompt', message);
    const response = await axios.post<ChatbotResponse>(
      url,
      formData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      }
    );

    return response.data.message;
  },

  async uploadFilesAndSendMessage(message: string, files: FileList) {
    //Check token expired?
    var accessToken = localStorage.getItem("access_token");
    if (authService.tokenExpired(accessToken)) {
      //Call api AICON for get access token
      var token = await authService.authenticate("", true);
      //Save to local stograge
      localStorage.setItem("access_token", token.access_token);
      accessToken = token.access_token;
    }

    //Endpoint AI chat
    const url = `${API_BASE}/chat`;

    //Call api
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    formData.append("prompt", message);

    //Handler response
    const resp = await axios.post(
      url,
      formData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      }
    );

    return resp.data;
  }
};

export default ChatService;
