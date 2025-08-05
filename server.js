const express = require('express');
const cors = require('cors');
const ntlm = require('express-ntlm');

// Load environment variables from .env file
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const NTLM_DOMAIN = process.env.NTLM_DOMAIN || 'TESTDOMAIN';
const NTLM_DEBUG = process.env.NTLM_DEBUG === 'true' || process.env.NODE_ENV === 'development';

// Test credentials - in production, these would come from a database or AD
const TEST_USERS = process.env.TEST_USERS ? 
    JSON.parse(process.env.TEST_USERS) : {
        'testuser': { password: 'testpass', domain: NTLM_DOMAIN },
        'admin': { password: 'password123', domain: NTLM_DOMAIN },
        'john.doe': { password: 'secret456', domain: NTLM_DOMAIN },
        'alice': { password: 'alice123', domain: NTLM_DOMAIN }
    };

app.use(cors());
app.use(express.json());

// Helper to describe what step we're on, based on headers
function printNtlmDebug(req, res, next) {
    const authHeader = req.headers['authorization'] || '';
    const stepInfo = { step: undefined, details: '' };

    if (!authHeader) {
        stepInfo.step = 1;
        stepInfo.details = 'Step 1: No Authorization header – initial request';
    } else if (authHeader.startsWith('NTLM ')) {
        try {
            const ntlmMsg = Buffer.from(authHeader.split(' ')[1], 'base64');
            if (ntlmMsg.length >= 9) {
                // NTLM message type is at byte 8 (zero-based)
                const msgType = ntlmMsg[8];
                if (msgType === 1) {
                    stepInfo.step = 3;
                    stepInfo.details = 'Step 3: NTLM NEGOTIATE (Type 1) received from client';
                } else if (msgType === 3) {
                    stepInfo.step = 5;
                    stepInfo.details = 'Step 5: NTLM AUTHENTICATE (Type 3) received from client';
                } else {
                    stepInfo.details = `Unknown NTLM message type: ${msgType}`;
                }
            } else {
                stepInfo.details = 'Invalid NTLM message - too short';
            }
        } catch (error) {
            stepInfo.details = `Error parsing NTLM message: ${error.message}`;
        }
    } else if (authHeader.startsWith('Basic ')) {
        stepInfo.details = 'Basic Auth header received';
    } else {
        stepInfo.details = 'Other Authorization header received: ' + authHeader.substring(0, 50);
    }

    // Print all
    console.log('-------------------------------');
    console.log(`NTLM Debug: ${stepInfo.details}`);
    console.log(`Request: ${req.method} ${req.url}`);
    console.log(`User-Agent: ${req.headers['user-agent'] || 'Unknown'}`);
    console.log(`Remote IP: ${req.ip || req.connection.remoteAddress}`);
    if (NTLM_DEBUG) {
        console.log('All Headers:', JSON.stringify(req.headers, null, 2));
    }
    console.log('-------------------------------');
    next();
}
app.use(printNtlmDebug);

// Health check endpoint (no authentication required) - MUST come before NTLM middleware
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: 'NTLM Test Server',
        version: '1.0.0'
    });
});

// Use express-ntlm middleware with enhanced configuration
app.use(ntlm({
    debug: function() {
        // Custom debug function - we handle our own logging
    },
    domain: NTLM_DOMAIN,
    domaincontroller: '', // Use default
    tlsOptions: {
        secureProtocol: 'TLSv1_2_method',
        ciphers: 'ECDHE-RSA-AES128-GCM-SHA256'
    },
    // Custom validation function
    validate: function(username, password, req, callback) {
        console.log(`Validating user: ${username} for domain: ${req.ntlm.DomainName || NTLM_DOMAIN}`);
        
        const user = TEST_USERS[username.toLowerCase()];
        if (user && user.password === password) {
            console.log(`✅ Authentication successful for user: ${username}`);
            callback(null, true);
        } else {
            console.log(`❌ Authentication failed for user: ${username}`);
            callback(null, false);
        }
    }
}));

// Middleware to log server challenges and handshake steps
app.use((req, res, next) => {
    // Using res.writeHead to intercept outgoing status and headers.
    const origWriteHead = res.writeHead;
    res.writeHead = function (statusCode, reasonPhrase, headers) {
        if (statusCode === 401) {
            const wwwAuth = res.getHeader('www-authenticate') || (headers && headers['www-authenticate']);
            if (wwwAuth) {
                if (wwwAuth === 'NTLM') {
                    console.log('Step 2: Server sends 401 with "WWW-Authenticate: NTLM" (initial challenge)');
                } else if (wwwAuth.startsWith('NTLM ')) {
                    console.log('Step 4: Server sends 401 with NTLM Type 2 Challenge:', wwwAuth);
                }
            }
        }
        return origWriteHead.apply(this, arguments);
    };
    next();
});

// Middleware to block unauthenticated users (skip health endpoint)
app.use((req, res, next) => {
    // Skip authentication for health endpoint
    if (req.path === '/health') {
        return next();
    }
    
    if (!req.ntlm || !req.ntlm.Authenticated) {
        console.log('🚫 Unauthorized access attempt');
        res.status(401).json({
            error: 'Unauthorized',
            message: 'NTLM authentication required',
            hint: 'Use one of the test credentials from the README'
        });
    } else {
        console.log(`✅ User ${req.ntlm.UserName} authenticated successfully`);
        next();
    }
});

// Main endpoint
app.get('/', (req, res) => {
    console.log('🎉 Step 6: User successfully authenticated via NTLM!');
    console.log('User Info:', req.ntlm);
    res.json({
        message: 'NTLM Authentication successful!',
        user: req.ntlm.UserName,
        domain: req.ntlm.DomainName,
        workstation: req.ntlm.Workstation,
        authenticated: req.ntlm.Authenticated,
        timestamp: new Date().toISOString()
    });
});

// Additional test endpoints
app.get('/user-info', (req, res) => {
    res.json({
        message: 'User information endpoint',
        ntlm: req.ntlm,
        headers: {
            'user-agent': req.headers['user-agent'],
            'accept': req.headers['accept']
        },
        timestamp: new Date().toISOString()
    });
});

app.get('/secure-data', (req, res) => {
    res.json({
        message: 'This is secure data that requires NTLM authentication',
        user: req.ntlm.UserName,
        data: [
            { id: 1, item: 'Confidential Document 1' },
            { id: 2, item: 'Confidential Document 2' },
            { id: 3, item: 'Confidential Document 3' }
        ],
        timestamp: new Date().toISOString()
    });
});

// API status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        api: 'NTLM Test Server API',
        version: '1.0.0',
        authenticated_user: req.ntlm.UserName,
        domain: req.ntlm.DomainName,
        endpoints: [
            'GET / - Main endpoint',
            'GET /health - Health check (no auth)',
            'GET /user-info - User information',
            'GET /secure-data - Secure data example',
            'GET /api/status - This endpoint'
        ],
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Endpoint ${req.method} ${req.path} not found`,
        available_endpoints: ['/', '/health', '/user-info', '/secure-data', '/api/status'],
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log('🚀 NTLM Test Server started successfully!');
    console.log(`📍 Server URL: http://localhost:${PORT}`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log('🏢 Test Domain: TESTDOMAIN');
    console.log('👥 Available Test Users:');
    Object.keys(TEST_USERS).forEach(username => {
        console.log(`   - ${username} / ${TEST_USERS[username].password}`);
    });
    console.log('🌐 Available Endpoints:');
    console.log('   - GET / (protected) - Main endpoint');
    console.log('   - GET /health (public) - Health check');
    console.log('   - GET /user-info (protected) - User information');
    console.log('   - GET /secure-data (protected) - Secure data example');
    console.log('   - GET /api/status (protected) - API status');
    console.log('🔧 Use ThunderClient, Postman, or curl for testing');
    console.log('💡 Enable NTLM authentication in your client');
    console.log('===============================================');
});
