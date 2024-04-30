import express from 'express';
import { createBareServer } from '@tomphttp/bare-server-node';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const bare = createBareServer("/saml2auth/");

app.use(express.static(path.join(__dirname, 'static')));

const routes = [
    { path: '/~', file: 'apps.html' },
    { path: '/0', file: 'tabs.html' },
    { path: '/1', file: 'go.html' },
    { path: '/', file: 'index.html' },
];

routes.forEach((route) => {
    app.get(route.path, (req, res) => {
        res.sendFile(path.join(__dirname, 'static', route.file));
    });
});

let server;

if (existsSync(path.join(__dirname, 'key.pem')) && existsSync(path.join(__dirname, 'cert.pem'))) {
    const options = {
        key: readFileSync(path.join(__dirname, 'key.pem')),
        cert: readFileSync(path.join(__dirname, 'cert.pem'))
    };
    server = createHttpsServer(options, app);
} else {
    server = app.listen(PORT, () => {
        const addr = server.address();
        console.log(`Server running on port ${addr.port}`);
        console.log('');
        console.log('You can now view it in your browser.');
        console.log(`Local: http://${addr.family === 'IPv6' ? `[${addr.address}]` : addr.address}:${addr.port}`);
        try { console.log(`On Your Network: http://${address.ip()}:${addr.port}`); } catch (err) { /* Can't find LAN interface */ }
        if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
            console.log(`Replit: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
        }
    });
}

app.use((req, res, next) => {
    if (bare.shouldRoute(req)) {
        bare.routeRequest(req, res);
    } else {
        res.status(500).send('Error');
    }
});

server.on('upgrade', (req, socket, head) => {
    if (bare.shouldRoute(req, socket, head)) {
        bare.routeUpgrade(req, socket, head);
    } else {
        socket.end();
    }
});
