using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace BlazorChatApp.Common
{
    public class AuthPage : LayoutComponentBase
    {
        [Inject] protected IJSRuntime JS { get; set; }
        [Inject] protected RequestInterceptor RequestInterceptor { get; set; }
        [Inject] protected NavigationManager Navigation { get; set; }
        public AuthPage() 
        { 
            
        }
        /// <summary>
        /// Define auth guard for home and chatbot page
        /// </summary>
        /// <returns></returns>
        protected override async Task OnInitializedAsync()
        {
            var accessToken = await JS.InvokeAsync<string>("localStorage.getItem", "access_token");
            var refreshToken = await JS.InvokeAsync<string>("localStorage.getItem", "refresh_token");
            var currentPath = Navigation.ToBaseRelativePath(Navigation.Uri).ToLower();

            // If access token is present, user is authenticated
            if (!string.IsNullOrEmpty(accessToken))
            {
                // If you are on Home page, do not redirect
                if (currentPath != "")
                {
                    Navigation.NavigateTo("/", forceLoad: true);
                }
                return;
            }
            else
            {
                // Get the URL path
                var uri = Navigation.ToAbsoluteUri(Navigation.Uri);
                var queryParams = System.Web.HttpUtility.ParseQueryString(uri.Query);
                // Extract the 'code' parameter from the query string
                var code = queryParams["code"];
                // If the 'code' parameter is present, attempt to get a token
                if (!string.IsNullOrEmpty(code))
                {
                    var result = await RequestInterceptor.GetTokenAsync(code, false);

                    // If the token is successfully retrieved, redirect to the home page
                    if (!result && currentPath != "login")
                    {
                        Navigation.NavigateTo("/login", forceLoad: true);
                    }
                }
                else
                {
                    // If you are on Login page, do not redirect
                    if (currentPath != "login")
                    {
                        Navigation.NavigateTo("/login", forceLoad: true);
                    }
                }
            }
        }
    }
}
