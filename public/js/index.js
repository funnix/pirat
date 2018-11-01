var socket = io();

socket.on('connect', () => {
    console.log("Connect to Server");
})
socket.on('disconnect', () => {
    console.log('Server is offline');
})
socket.on('grid', (data) => {

})
socket.on('makeLogin', () => {
    console.log("REDIRECT Login");
    socket.emit("HUHU");
    window.location.href = '/login';
})