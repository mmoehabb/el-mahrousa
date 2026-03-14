import { PeerServer } from 'peer';

const port = process.env.PORT || 9000;

const peerServer = PeerServer({
  port: Number(port),
  path: '/myapp',
});

peerServer.on('connection', (client) => {
  console.log(`Client connected: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
  console.log(`Client disconnected: ${client.getId()}`);
});

console.log(`PeerJS Signaling Server running on port ${port} at path /myapp`);
