using BlazorChatApp.Common;
using BlazorChatApp.Models;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;
using Microsoft.JSInterop;
using Newtonsoft.Json;
using System.Net;
using System.Text.Json;

namespace BlazorChatApp.Service.ChatBot
{
    public class ChatBotService : IChatBotService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly NavigationManager _navigationManager;
        private readonly IJSRuntime JS;

        public ChatBotService(HttpClient httpClient, IConfiguration configuration, NavigationManager navigationManager, IJSRuntime js)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _navigationManager = navigationManager;
            JS = js;
        }

        /// <summary>
        /// Get token from API using clientId, clientSecret, and code
        /// if isRefresh is true, it will use the refresh token grant_type
        /// </summary>
        /// <param name="clientId"></param>
        /// <param name="clientSecret"></param>
        /// <param name="code"></param>
        /// <param name="isRefresh"></param>
        /// <returns></returns>
        public async Task<TokenResponse> GetTokenAsync(string clientId, string clientSecret, string? code, bool isRefresh)
        {
            try
            {
                // Define the URL for the authentication endpoint
                var url = _configuration["DomainSettings:kABApiEndpoint"] + Constants.Auth;

                // Set the parameters for the request
                var parameters = new Dictionary<string, string>
                {
                    { "client_id", clientId },
                    { "client_secret", clientSecret },
                    { "grant_type", isRefresh ? _configuration["DomainSettings:refreshGrantType"] : _configuration["DomainSettings:authenGrantType"] },
                    { "code", string.IsNullOrEmpty(code) ? "" : code },
                    { "redirect_uri", new Uri(_navigationManager.Uri).GetLeftPart(UriPartial.Authority) }
                };
                var content = new FormUrlEncodedContent(parameters);
                var response = await _httpClient.PostAsync(url, content);

                response.EnsureSuccessStatusCode();

                var responseStream = await response.Content.ReadAsStreamAsync();
                var result = await System.Text.Json.JsonSerializer.DeserializeAsync<TokenResponse>(responseStream, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (result == null)
                {
                    throw new Exception("No data.");
                }

                return result;
            }
            catch (Exception ex)
            {
                // Handle the exception if necessary
                Console.WriteLine(ex.Message);
            }
            return null;
        }

        /// <summary>
        /// Call AI API chat endpoint with a message and optional file attachments
        /// </summary>
        /// <param name="messageText"></param>
        /// <param name="attachFiles"></param>
        /// <returns></returns>
        public async Task<(string, bool)> CallAiApiChatAsync(string messageText, List<IBrowserFile>? attachFiles = null)
        {
            // Get access token from local storage
            var accessToken = await JS.InvokeAsync<string>("localStorage.getItem", "access_token");
            // Build the API endpoint URL
            var _endPointApi = $"{_configuration["DomainSettings:apiEndPoint"]}{Constants.Chat}";
            try
            {
                // Ensure endpoint is configured
                if (string.IsNullOrEmpty(_endPointApi))
                    return ("Endpoint AI not found", false);

                // Prepare HTTP client and request
                var client = new HttpClient();
                var request = new HttpRequestMessage(HttpMethod.Post, _endPointApi);
                request.Headers.Add("Authorization", $"Bearer {accessToken}");

                request.Headers.Add("accept", "*/*");

                // Prepare multipart form data for files and prompt
                var requestContent = new MultipartFormDataContent();
                if (attachFiles != null && attachFiles.Any())
                {
                    foreach (var file in attachFiles)
                    {
                        // Read file stream and add to form data
                        var stream = file.OpenReadStream(maxAllowedSize: 50 * 1024 * 1024);
                        var fileContent = new StreamContent(stream);
                        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType);
                        requestContent.Add(fileContent, "files", file.Name);
                    }
                }
                // Add the user's message as the prompt
                requestContent.Add(new StringContent(messageText), "prompt");
                request.Content = requestContent;
                // Send the request to the API
                var response = await client.SendAsync(request);

                // Handle unauthorized response
                if (response.StatusCode == HttpStatusCode.Unauthorized)
                {
                    return (HttpStatusCode.Unauthorized.ToString(), false);
                }

                // Handle non-successful responses
                if (!response.IsSuccessStatusCode)
                {
                    return ($"Error: {response.StatusCode}", false);
                }
                // Try to parse a chat message response
                try
                {
                    var responseObj = JsonConvert.DeserializeObject<ChatResponse>(await response.Content.ReadAsStringAsync());
                    if (responseObj != null)
                    {
                        return (responseObj.Message, true);
                    }
                }
                catch
                {
                    // Ignore deserialization errors, try to handle as file
                }

                // If not a chat message, treat as file download (e.g., zip)
                var fileBytes = await response.Content.ReadAsByteArrayAsync();
                string base64 = Convert.ToBase64String(fileBytes);
                string content = $"<a style='cursor: pointer;' onclick='downloadFileFromBytes(\"{base64}\", \"application/zip\", \"file.zip\")'>file.zip</a>";
                return (content, true);
            }
            catch (Exception ex)
            {
                return (string.Empty, false);
            }
        }
    }
}
