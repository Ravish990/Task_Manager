# Google Authentication API

This is a Node.js API that implements Google OAuth 2.0 authentication.

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGO_URI=your_mongodb_connection_string
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   SESSION_SECRET=your_session_secret
   ```

## Getting Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application" as the application type
6. Add "http://localhost:8000/auth/google/callback" as an authorized redirect URI
7. Click "Create" and note your Client ID and Client Secret
8. Add these credentials to your `.env` file

## Running the Application

```
npm start
```

Or for development with auto-reload:

```
npm run dev
```

The server will run on port 8000.

## Authentication Endpoints

- `GET /auth/google`: Initiates Google OAuth authentication
- `GET /auth/google/callback`: Callback URL for Google OAuth
- `GET /auth/current_user`: Returns the currently authenticated user
- `GET /auth/logout`: Logs out the current user

## Testing

```
npm test
```