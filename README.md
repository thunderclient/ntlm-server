# NTLM Test Server

A simple Node.js server with NTLM authentication for testing NTLM clients.

## Features

- NTLM authentication with dummy credentials
- Multiple test endpoints
- Debug logging for authentication attempts
- CORS enabled for cross-origin requests
- Health check endpoint (no authentication required)

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

The server includes the following dummy credentials for testing:

| Username | Password    | Domain     |
|----------|-------------|------------|
| testuser | testpass    | TESTDOMAIN |
| admin    | password123 | TESTDOMAIN |
| john.doe | secret456   | TESTDOMAIN |
| alice    | alice123    | TESTDOMAIN |

## Endpoints

### Protected Endpoints (Require NTLM Authentication)

- `GET /` - Root endpoint, returns user info after successful authentication
- `GET /api/protected` - Protected API endpoint with server info
- `GET /api/userinfo` - Returns detailed NTLM user information and headers

### Public Endpoints (No Authentication Required)

- `GET /health` - Health check endpoint to verify server is running

## Testing with curl

You can test the NTLM authentication using curl with the `--ntlm` flag:

```bash
# Test health endpoint (no auth required)
curl http://localhost:3000/health

# Test with NTLM authentication
curl --ntlm -u testuser:testpass http://localhost:3000/

# Test protected API endpoint
curl --ntlm -u admin:password123 http://localhost:3000/api/protected
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
