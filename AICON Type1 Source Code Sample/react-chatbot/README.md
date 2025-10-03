# My React App

A React + TypeScript project.

---

## Table of Contents

- Project Setup
- Available Scripts
- Folder Structure
- Environment Variables
- Deployment
- Notes

---

## Project Setup

Install dependencies:

npm install

Build the project for local:

npm run dev

Build the project for server:

npm run build

---

## Available Scripts

- `npm run dev`  
  Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000).

- `npm run build`  
  Builds the app for production to the `build/`/`dist/` folder.

- `npm test`  
  Launches the test runner.

- `npm run eject`  
  **Warning**: This is a one-way operation. Exposes the config files.

---

## Folder Structure



my-react-app/
├─ node_modules/ # Dependencies (ignored in Git)
├─ public/ # Static files
├─ src/ # Source code
│ ├─ components/ # React components
│ ├─ services/ # API services
│ ├─ styles/ # CSS / SCSS files
│ ├─ App.tsx
│ └─ index.tsx
├─ .gitignore
├─ package.json
├─ tsconfig.json
└─ README.md


---

## Environment Variables

Create a `.env` file in the root folder:

# Provider's AI chatbot API
VITE_API_ENDPOINT=https://api.example.com

# API endpoint for AICON
VITE_AICON_API_ENDPOINT=https://api.example.com/api

# Client ID for authentication that provided when provider registers an AI model
VITE_CLIENT_ID=client_id

# Client secret for authentication that provided when registers an AI model
VITE_CLIENT_SECRET=client_secret

# Grant type for authentication
VITE_AUTHEN_GRANT_TYPE=authorization_code

# Grant type for refreshing the token
VITE_REFRESH_GRANT_TYPE=refresh_token

# Login page URL for AICON
VITE_AICON_LOGIN=https://api.example.com/auth/login


> Do **not commit** `.env` to Git. Add it to `.gitignore`.

---

## Deployment

### On IIS:

1. Run `npm run build` to create the `build/`/`dist/` folder.
2. Copy the `build/`/`dist/` folder to your IIS server site folder.
3. Add a `web.config` file inside `build/` to handle React Router:
### Example config file
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
