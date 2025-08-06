const express = require('express');
const cors = require('cors');
const ntlm = require('express-ntlm');
const app = express();
const PORT = 3000;
const NTLM_DOMAIN = 'TESTDOMAIN';

// Test credentials - in production, these would come from a database or AD
const TEST_USERS =  
    {
        'testuser': { password: 'testpass', domain: NTLM_DOMAIN },
        'admin': { password: 'password123', domain: NTLM_DOMAIN },
        'john.doe': { password: 'secret456', domain: NTLM_DOMAIN },
        'alice': { password: 'alice123', domain: NTLM_DOMAIN }
    };

app.use(cors());
app.use(express.json());

// Enhanced request debugging middleware - MUST come before NTLM
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const clientIP = req.ip || req.connection?.remoteAddress || 'unknown';
    
    console.log('\n══════════════════════════════════════════════════════════════════════════════════════════════');
    console.log(`🔍 [${timestamp}] NEW REQUEST RECEIVED`);
    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════');
    console.log(`📍 Method: ${req.method}`);
    console.log(`🌐 URL: ${req.url}`);
    console.log(`📡 Client IP: ${clientIP}`);
    console.log(`🖥️ User-Agent: ${req.get('User-Agent') || 'Not provided'}`);
    console.log(`   Headers: ${JSON.stringify(req.headers, null, 2)}`);
    console.log('═══════════════════════════════════════════════\n');
    
    next();
});

// Health check endpoint (no authentication required) - MUST come before NTLM middleware
app.get('/health', (req, res) => {
    console.log('💚 Health check endpoint accessed - no auth required');
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

// Middleware to log NTLM authentication details
app.use((req, res, next) => {
    console.log(' NTLM AUTHENTICATION STATUS:');
    console.log('═══════════════════════════════════');
    
    if (req.ntlm) {
        console.log(`✅ NTLM object present: YES`);
        console.log(`🔒 Authenticated: ${req.ntlm.Authenticated || false}`);
        console.log(`👤 UserName: ${req.ntlm.UserName || 'N/A'}`);
        console.log(`🏢 DomainName: ${req.ntlm.DomainName || 'N/A'}`);
        console.log(`💻 Workstation: ${req.ntlm.Workstation || 'N/A'}`);
        
        // Log raw NTLM object for debugging
        console.log('\n📊 Raw NTLM Object:');
        console.log(JSON.stringify(req.ntlm, null, 2));
    } else {
        console.log(`❌ NTLM object present: NO`);
    }
    
    console.log('═══════════════════════════════════\n');
    next();
});

// Middleware to intercept response headers for debugging
app.use((req, res, next) => {
    const originalWriteHead = res.writeHead;
    const originalSetHeader = res.setHeader;
    
    // Intercept writeHead to log response headers
    res.writeHead = function(statusCode, statusMessage, headers) {        
        // Log existing headers
        const currentHeaders = res.getHeaders();
        Object.entries(currentHeaders).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`);
        });
        
        // Log new headers if provided
        if (headers) {
            Object.entries(headers).forEach(([key, value]) => {
                console.log(`   ${key}: ${value}`);
            });
        }
        console.log('═══════════════════════════════════\n');
        
        return originalWriteHead.call(this, statusCode, statusMessage, headers);
    };
    
    // Intercept setHeader to log when NTLM challenge is set
    res.setHeader = function(name, value) {
        if (name.toLowerCase() === 'www-authenticate') {
            console.log(`🔑 Setting WWW-Authenticate header: ${value}`);
        }
        return originalSetHeader.call(this, name, value);
    };
    
    next();
});

// Middleware to block unauthenticated users (skip health endpoint)
app.use((req, res, next) => {
    // Skip authentication for health endpoint
    if (req.path === '/health') {
        console.log('⏭️  Skipping auth for health endpoint');
        return next();
    }
    
    console.log('\n🛡️  AUTHENTICATION CHECK:');
    console.log('═════════════════════════');
    
    if (!req.ntlm || !req.ntlm.Authenticated) {
        console.log('🚫 Authentication FAILED - User not authenticated');
        console.log('💡 Sending 401 Unauthorized response');
        console.log('═════════════════════════\n');
        
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
        console.log(`❌ User validation FAILED - User not found: ${username}`);
        console.log('🎯 Available users:', Object.keys(TEST_USERS).join(', '));
        console.log('═════════════════════════\n');
        
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid user credentials',
            hint: 'Use one of the test credentials: testuser, admin, john.doe, alice'
        });
    }
    
    console.log(`✅ User validation PASSED - ${req.ntlm.UserName} authenticated successfully`);
    console.log('═════════════════════════\n');
    next();
});

// Main NTLM test endpoint
app.get('/', (req, res) => {
    console.log('\n🎉 SUCCESSFUL AUTHENTICATION - Main endpoint accessed');
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
    console.error('\n💥 ERROR OCCURRED:');
    console.error('═══════════════════');
    console.error('Error:', err);
    console.error('Stack:', err.stack);
    console.error('═══════════════════\n');
    
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    console.log(`\n🔍 404 - Endpoint not found: ${req.method} ${req.path}`);
    console.log('📍 Available endpoints: [/, /health]\n');
    
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
});