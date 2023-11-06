import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));




io.on('connection', (socket) => {
    socket.on('join-room', (roomName) => {
        socket.join(roomName);
    });

    socket.on('offer', (data, roomName) => {
        socket.to(roomName).emit('offer', data);
    });

    socket.on('answer', (data, roomName) => {
        socket.to(roomName).emit('answer', data);
    });

    socket.on('ice-candidate', (data, roomName) => {
        socket.to(roomName).emit('ice-candidate', data);
    });
});

server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
