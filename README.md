# NTLM Test Server

A comprehensive Node.js server with NTLM authentication for testing NTLM clients like ThunderClient, Postman, and curl.

## Features

- ✅ NTLM authentication with predefined test credentials
- 🔍 Detailed step-by-step authentication logging
- 🛡️ Credential validation with test users
- 🌐 Multiple test endpoints (protected and public)
- 🏥 Health check endpoint (no authentication required)
- 🔧 Enhanced error handling and debugging
- 🌍 CORS enabled for cross-origin requests
- 📊 Comprehensive API responses with user information

## Installation

```bash
npm install
```

## Usage

### Start the server
```bash
npm start
```

### Start with auto-reload (development)
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Test Credentials

The server includes the following test credentials for authentication:

| Username | Password    | Domain     | Status |
|----------|-------------|------------|---------|
| testuser | testpass    | TESTDOMAIN | ✅ Active |
| admin    | password123 | TESTDOMAIN | ✅ Active |
| john.doe | secret456   | TESTDOMAIN | ✅ Active |
| alice    | alice123    | TESTDOMAIN | ✅ Active |

> **Note**: These are test credentials only. The server validates these credentials during NTLM authentication.

## Endpoints

### Public Endpoints (No Authentication Required)

- `GET /health` - Health check endpoint, returns server status

### Protected Endpoints (Require NTLM Authentication)

- `GET /` - Root endpoint, returns user info after successful authentication


### Manual Setup

1. **Set up NTLM Authentication**:
   - Open ThunderClient in VS Code
   - Create a new request
   - Set URL to `http://localhost:3000`
   - Go to "Auth" tab
   - Select "NTLM" as authentication type
   - Enter credentials (e.g., `testuser` / `testpass`)
   - Set domain to `TESTDOMAIN`

2. **Test the endpoints**:
   ```
   GET http://localhost:3000/health      (No auth required)
   GET http://localhost:3000/            (Requires NTLM auth)
   ```

## Testing with curl

### Basic NTLM Test
```bash
# This will show the NTLM handshake steps
curl -v --ntlm -u testuser:testpass http://localhost:3000/
```

### Test different endpoints
```bash
# Health check (no auth)
curl http://localhost:3000/health
```

## Testing with Postman

1. Create a new request
2. Set the URL to `http://localhost:3000`
3. Go to Authorization tab
4. Select "NTLM Authentication"
5. Enter:
   - Username: `testuser`
   - Password: `testpass`  
   - Domain: `TESTDOMAIN`
6. Send the request
