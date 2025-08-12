using BlazorChatApp.Models;
using BlazorChatApp.Service.ChatBot;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.JSInterop;
using System.Net;

namespace BlazorChatApp.Components.Pages
{
    public partial class ChatBot
    {
        [Inject] public IChatBotService ChatBotService { get; set; }
        private ElementReference ChatContainerRef;
        private ElementReference fileInputRef;

        private string MessageInput { get; set; } = "";
        private bool IsLoading { get; set; } = false;

        private List<ChatMessage> _messages = new List<ChatMessage>();

        private List<IBrowserFile> SelectedFilesList { get; set; } = new();

        /// <summary>
        /// Call api AI
        /// </summary>
        /// <param name="messageText"></param>
        /// <param name="attachFiles"></param>
        /// <returns></returns>
        private async Task<(string, bool)> HandleCallAiApiChatAsync(string messageText, List<IBrowserFile>? attachFiles = null)
        {
            // Check if the user is authenticated
            var result = await _requestInterceptor.CheckTokenLocalStorage();
            if (result)
            {
                // Call the AI API with the provided message and optional files
                var response = await ChatBotService.CallAiApiChatAsync(messageText, attachFiles);

                // If the response is unauthorized, remove the token and redirect to login
                if (!response.Item2 && response.Equals(HttpStatusCode.Unauthorized.ToString()))
                {
                    await _requestInterceptor.RemoveTokenAsync();
                    NavigationManager.NavigateTo("/login");
                }
                else
                {
                    return response;
                }
            }
            return (string.Empty, false);
        }

        /// <summary>
        /// function to handle chat message submission
        /// </summary>
        /// <returns></returns>
        private async Task CallChatbot()
        {
            IsLoading = true;
            if (string.IsNullOrWhiteSpace(MessageInput) && SelectedFilesList.Count == 0)
                return;

            var messageInput = MessageInput;
            var selectedFilesList = SelectedFilesList.ToList();
            //clear input
            SelectedFilesList.Clear();
            MessageInput = string.Empty;

            // Add user's message to chat
            _messages.Add(new ChatMessage
            {
                IsFile = false,
                IsUser = true,
                Text = messageInput
            });

            // If files are attached, send with files
            if (selectedFilesList.Count > 0)
            {
                var reply = await HandleCallAiApiChatAsync(messageInput, selectedFilesList);
                if (reply.Item2 && !string.IsNullOrEmpty(reply.Item1))
                {
                    // Add message with files from response to chat
                    _messages.Add(new ChatMessage
                    {
                        IsFile = true,
                        IsUser = false,
                        Text = reply.Item1
                    });
                }
            }
            // Otherwise, send just the message
            else
            {
                var reply = await HandleCallAiApiChatAsync(messageInput);
                if (reply.Item2 && !string.IsNullOrEmpty(reply.Item1))
                {
                    // Add message from response to chat
                    _messages.Add(new ChatMessage
                    {
                        IsFile = false,
                        IsUser = false,
                        Text = reply.Item1
                    });
                }
            }
            await ScrollToBottomAsync();
            IsLoading = false;
            StateHasChanged();
        }

        /// <summary>
        /// Handles file selection from the input.
        /// Adds selected files to the list for upload.
        /// </summary>
        /// <param name="e"></param>
        private void OnFileSelected(InputFileChangeEventArgs e)
        {
            var newFiles = e.GetMultipleFiles();
            SelectedFilesList.AddRange(newFiles);
        }

        /// <summary>
        /// Handles pressing the Enter key in the message input.
        /// Triggers sending the message.
        /// </summary>
        /// <param name="e">Keyboard event args</param>
        private async Task HandleEnterKey(KeyboardEventArgs e)
        {
            if (e.Key == "Enter")
            {
                await CallChatbot();
            }
        }
        /// <summary>
        /// Auto scroll when reply is typing
        /// </summary>
        /// <returns></returns>
        private async Task ScrollToBottomAsync()
        {
            try
            {
                await JS.InvokeVoidAsync("scrollToBottom", ChatContainerRef);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"JS interop error: {ex.Message}");
            }
        }
    }
}
