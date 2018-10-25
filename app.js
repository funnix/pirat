/**
 * Main App
 */

const path = require('path');
const http = require('http');

const express = require('express');
const socket = require('socket.io');


const publicPath = path.join(__dirname, './public');

const port = process.env.PORT || 3000;
var app = express();
var server = http.createServer(app);

var io = socket(server);

console.log(publicPath);
app.use(express.static(publicPath));

io.on('connection', (socket) => {
    console.log('New User Connected');

    socket.on('disconnct', () => {
        console.log("User ist Disconnected");
    })
})

server.listen(port, () => {
    console.log(`Server is up on ${port}`);
})