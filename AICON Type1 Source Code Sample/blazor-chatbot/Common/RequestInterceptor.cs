using BlazorChatApp.Service.ChatBot;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace BlazorChatApp.Common
{
    public class RequestInterceptor
    {
        private readonly IJSRuntime JS;
        private readonly IChatBotService ChatBotService;
        private readonly IConfiguration Configuration;
        private readonly NavigationManager NavigationManager;

        // constructor
        public RequestInterceptor(IJSRuntime js,
        IChatBotService chatBotService,
        IConfiguration configuration,
        NavigationManager navigationManager)
        {
            JS = js;
            ChatBotService = chatBotService;
            Configuration = configuration;
            NavigationManager = navigationManager;
        }

        // This function gets a new access token using the get token or refresh token
        public async Task<bool> GetTokenAsync(string? code, bool isRefresh = false)
        {
            try
            {
                // Get clientId and clientSecret from configuration
                var clientId = Configuration["DomainSettings:clientID"];
                var clientSecret = Configuration["DomainSettings:clientSecret"];

                // If it is not isrefresh and code on parameter null, you will return to the login page
                if (!isRefresh && string.IsNullOrEmpty(code))
                {
                    NavigationManager.NavigateTo("/login");
                }
                //Call Api to get token or refresh token using clientId, clientSecret, code and isRefresh
                var responseApi = await ChatBotService.GetTokenAsync(clientId, clientSecret, code, isRefresh);

                if (responseApi == null)
                {
                    return false;
                }

                // Remove old tokens and save new tokens in local storage
                await RemoveTokenAsync();
                // Save the access new token and refresh token in local storage
                await SaveTokenAsync(responseApi.AccessToken, responseApi.RefreshToken);

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return false;
            }
        }
        // Check token in local storage and refresh it
        public async Task<bool> CheckTokenLocalStorage()
        {
            // Get access token from local storage
            var accessToken = await JS.InvokeAsync<string>("localStorage.getItem", "access_token");

            // If access token is null or expired, try to refresh it
            if (TokenExpired(accessToken))
            {
                // Get refresh token from local storage
                var refreshToken = await JS.InvokeAsync<string>("localStorage.getItem", "refresh_token");
                if (!TokenExpired(refreshToken))
                {
                    // If refresh token is valid, get a new access token using the refresh token
                    await GetTokenAsync(refreshToken, true);
                    return true;
                }
                else
                {
                    // If both access token and refresh token are invalid, remove tokens in local storage and redirect to login
                    await RemoveTokenAsync();
                    NavigationManager.NavigateTo("/login");
                    return false;

                }
            }
            return true;
        }

        /// <summary>
        /// Check token expiry date
        /// </summary>
        /// <param name="token"></param>
        /// <returns></returns>
        public bool TokenExpired(string token)
        {
            // If token is null or empty, consider it expired
            if (string.IsNullOrEmpty(token))
            {
                return true;
            }
            // Split the token into parts (header, payload, signature)
            var tokenParts = token.Split('.');
            // If the token does not have exactly 3 parts, consider it invalid
            if (tokenParts.Length != 3)
            {
                return true;
            }

            try
            {
                var payload = tokenParts[1];
                // Base64Url decode
                var paddedPayload = PadBase64(payload);
                var jsonBytes = Convert.FromBase64String(paddedPayload);
                var json = Encoding.UTF8.GetString(jsonBytes);

                using var doc = JsonDocument.Parse(json);
                if (!doc.RootElement.TryGetProperty("exp", out var expElement))
                {
                    return true;
                }

                var exp = expElement.GetInt64(); // exp in seconds
                var expirationTime = DateTimeOffset.FromUnixTimeSeconds(exp).UtcDateTime;
                // Check if the current time is greater than the expiration time
                return DateTime.UtcNow > expirationTime;
            }
            catch
            {
                return true; // If anything fails, assume token is invalid/expired
            }
        }

        /// <summary>
        /// // Decode the payload part of the token (base64url decode)
        /// </summary>
        /// <param name="base64"></param>
        /// <returns></returns>
        private string PadBase64(string base64)
        {
            // Add padding if needed (base64url to base64)
            int padding = 4 - (base64.Length % 4);
            if (padding < 4)
            {
                base64 += new string('=', padding);
            }

            // Replace base64url characters
            return base64.Replace('-', '+').Replace('_', '/');
        }

        /// <summary>
        /// Save the access token and refresh token in local storage
        /// </summary>
        /// <param name="accessToken"></param>
        /// <param name="refreshToken"></param>
        /// <returns></returns>
        public async Task SaveTokenAsync(string accessToken, string refreshToken)
        {
            await JS.InvokeVoidAsync("localStorage.setItem", "access_token", $"{accessToken}");
            await JS.InvokeVoidAsync("localStorage.setItem", "refresh_token", $"{refreshToken}");
        }

        /// <summary>
        /// Remove the access token and refresh token from local storage
        /// </summary>
        /// <returns></returns>
        public async Task RemoveTokenAsync()
        {
            await JS.InvokeVoidAsync("localStorage.removeItem", "access_token");
            await JS.InvokeVoidAsync("localStorage.removeItem", "refresh_token");
        }

        /// <summary>
        /// Get user id from token
        /// </summary>
        /// <param name="token"></param>
        /// <returns></returns>
        public async Task<string?> GetUserIdFromToken(string token)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwtToken = handler.ReadJwtToken(token);
                return jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.UserData)?.Value;
            }
            catch
            {
                return null;
            }
        }
    }
}
