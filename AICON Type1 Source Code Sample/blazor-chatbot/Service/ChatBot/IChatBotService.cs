using BlazorChatApp.Models;
using Microsoft.AspNetCore.Components.Forms;

namespace BlazorChatApp.Service.ChatBot
{
    public interface IChatBotService
    {
        Task<TokenResponse> GetTokenAsync(string clientId, string clientSecret, string code, bool isRefresh);
        Task<(string, bool)> CallAiApiChatAsync(string messageText, List<IBrowserFile>? attachFiles = null);
    }
}
