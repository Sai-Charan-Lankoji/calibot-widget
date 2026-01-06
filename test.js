const http = require('http');

const PORT = 8080;

// Create the server
const server = http.createServer((req, res) => {
    // Handle different routes
    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <html>
                <head><title>Node Server</title></head>
                <body>
                    <h1>Welcome to Node.js Server!</h1>
                    <p>Server is running on port ${PORT}</p>
                    <p>Try visiting:</p>
                    <ul>
                        <li><a href="/about">/about</a></li>
                        <li><a href="/api">/api</a></li>
                    </ul>
                </body>
            </html>
        `);
    } else if (req.url === '/about') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>About Page</h1><p>This is a simple HTTP server.</p>');
    } else if (req.url === '/api') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            message: 'API endpoint',
            timestamp: new Date().toISOString(),
            port: PORT
        }));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - Page Not Found</h1>');
    }
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
});

// Handle graceful shutdown



process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    process.exit(0);
});