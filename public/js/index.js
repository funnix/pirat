var socket = io();

socket.on('connect', () => {
    console.log("Connect to Server");
})
socket.on('disconnect', () => {
    console.log('Server is offline');
})
socket.on('grid', (data) => {

})