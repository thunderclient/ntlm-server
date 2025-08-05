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
- `GET /user-info` - Detailed user information and headers
- `GET /secure-data` - Example endpoint with secure data
- `GET /api/status` - API status and available endpoints

## Testing with ThunderClient

### Quick Start with Pre-built Collection

1. Import the included ThunderClient collection:
   - Open ThunderClient in VS Code
   - Click "Collections" → "Import"
   - Select `thunder-collection_NTLM-Test-Server.json`
   - The collection includes pre-configured requests with different test credentials

2. **Start the server**: `npm start`
3. **Run the requests** from the imported collection

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
   GET http://localhost:3000/user-info   (Requires NTLM auth)
   GET http://localhost:3000/secure-data (Requires NTLM auth)
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

# Protected endpoints (with NTLM auth)  
curl --ntlm -u admin:password123 http://localhost:3000/user-info
curl --ntlm -u alice:alice123 http://localhost:3000/secure-data
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

## Debug Output

The server provides detailed logging of the NTLM handshake process:

```
-------------------------------
NTLM Debug: Step 1: No Authorization header – initial request
Request: GET /
User-Agent: curl/7.64.1
Remote IP: ::1
-------------------------------
Step 2: Server sends 401 with "WWW-Authenticate: NTLM" (initial challenge)
-------------------------------
NTLM Debug: Step 3: NTLM NEGOTIATE (Type 1) received from client
Request: GET /
User-Agent: curl/7.64.1
Remote IP: ::1
-------------------------------
Step 4: Server sends 401 with NTLM Type 2 Challenge: NTLM TlRMTVNTUAACA...
-------------------------------
NTLM Debug: Step 5: NTLM AUTHENTICATE (Type 3) received from client
Request: GET /
User-Agent: curl/7.64.1
Remote IP: ::1
-------------------------------
Validating user: testuser for domain: TESTDOMAIN
✅ Authentication successful for user: testuser
✅ User testuser authenticated successfully
🎉 Step 6: User successfully authenticated via NTLM!
```

## Troubleshooting

### Common Issues

1. **Authentication fails with valid credentials**:
   - Ensure the domain is set to `TESTDOMAIN`
   - Check that username/password match exactly (case-sensitive)
   - Verify NTLM is enabled in your client

2. **Server not starting**:
   - Check if port 3000 is already in use: `lsof -i :3000`
   - Try a different port: `PORT=3001 npm start`

3. **ThunderClient not sending NTLM headers**:
   - Make sure NTLM authentication is selected in the Auth tab
   - Try clearing and re-entering credentials
   - Check VS Code and ThunderClient extension versions

4. **curl not working with NTLM**:
   - Ensure curl was compiled with NTLM support: `curl --version`
   - On macOS, you might need: `brew install curl`

### Testing the Server

Run the included test suite:
```bash
npm test
```

This will verify:
- Health endpoint accessibility
- Proper authentication blocking
- Endpoint availability
- Error handling

## Files in this Project

- `server.js` - Main NTLM server implementation
- `test-client.js` - Automated test client
- `thunder-collection_NTLM-Test-Server.json` - ThunderClient collection
- `package.json` - Project dependencies and scripts
- `README.md` - This documentation
- `.gitignore` - Git ignore rules

## Security Notes

⚠️ **Important**: This is a test server with hardcoded credentials. **Never use this in production!**

- Credentials are stored in plain text
- No rate limiting or brute force protection
- No logging of authentication attempts
- No SSL/TLS encryption

You can test the NTLM authentication using curl with the `--ntlm` flag:

```bash

# Test with NTLM authentication
curl --ntlm -u testuser:testpass http://localhost:3000/
```

## Testing with Thunder Client / Postman

1. Set the request URL to `http://localhost:3000/`
2. Go to the Authorization tab
3. Select "NTLM" as the auth type
4. Enter one of the test credentials:
   - Username: `testuser`
   - Password: `testpass`
   - Domain: `TESTDOMAIN`

## Debug Information

The server logs all authentication attempts to the console, including:
- Username, domain, and workstation information
- Success/failure status
- Request details

## Notes

- This server is for testing purposes only and should not be used in production
- The NTLM implementation uses the `express-ntlm` package
- All credentials are hardcoded dummy values
- CORS is enabled to allow requests from different origins
