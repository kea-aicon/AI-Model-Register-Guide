

const config = {
  apiEndpoint: import.meta.env.VITE_API_ENDPOINT,
  AICONApiEndpoint: import.meta.env.VITE_AICON_API_ENDPOINT,
  clientID: import.meta.env.VITE_CLIENT_ID || "",
  clientSecret: import.meta.env.VITE_CLIENT_SECRET,
  authenGrantType: import.meta.env.VITE_AUTHEN_GRANT_TYPE,
  refreshGrantType: import.meta.env.VITE_REFRESH_GRANT_TYPE,
  AICONLogin: import.meta.env.VITE_AICON_LOGIN || "",
  
};

export default config;
