const express = require('express');
const cors = require('cors');
const ntlm = require('express-ntlm');

// Load environment variables from .env file
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const NTLM_DOMAIN = process.env.NTLM_DOMAIN || 'TESTDOMAIN';

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

// Health check endpoint (no authentication required) - MUST come before NTLM middleware
app.get('/health', (req, res) => {
    console.log('💚 Health check accessed from:', req.ip || req.connection?.remoteAddress);
    
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
    domaincontroller: '', // Use default - this means no actual AD validation
}));

// Middleware to log server challenges and handshake steps
app.use((req, res, next) => {
    // Using res.writeHead to intercept outgoing status and headers.
    const origWriteHead = res.writeHead;
    res.writeHead = function (statusCode, reasonPhrase, headers) {
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
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'NTLM authentication required',
            hint: 'Use one of the test credentials from the README'
        });
    }
    
    // Custom validation since express-ntlm doesn't validate against our test users
    const username = req.ntlm.UserName?.toLowerCase();
    const user = TEST_USERS[username];
    
    console.log(`🔍 Validating user: ${username}`);
    
    if (!user) {
        console.log(`❌ User not found: ${username}`);
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid user credentials',
            hint: 'Use one of the test credentials: testuser, admin, john.doe, alice'
        });
    }
    
    console.log(`✅ User ${req.ntlm.UserName} authenticated successfully`);
    next();
});

// Main NTLM test endpoint
app.get('/', (req, res) => {
    console.log('🎉 NTLM Authentication successful!');
    console.log('📊 Authenticated User:', req.ntlm.UserName);
    
    res.json({
        message: 'NTLM Authentication successful!',
        user: req.ntlm.UserName,
        domain: req.ntlm.DomainName,
        workstation: req.ntlm.Workstation,
        authenticated: req.ntlm.Authenticated,
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
        available_endpoints: ['/', '/health'],
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
    console.log('   - GET / (protected) - Main NTLM test endpoint');
    console.log('   - GET /health (public) - Health check');
    console.log('🔧 Use ThunderClient, Postman, or curl for testing');
    console.log('💡 Enable NTLM authentication in your client');
    console.log('===============================================');
});
