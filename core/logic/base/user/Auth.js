const Sequelize = require('sequelize');
const async = require('async');
const fs = require('fs');


exports.endpoints = {
    login: async(socket, data, callback) => {
        console.log("DATA AUS AUTH", data, users);
        var users = await QW.Models.Users.find({ where: { username: data.username, password: data.password } });
        if (!users) {
            return callback({ logedin: false, msg: "Username or Password wrong" });
        } else {
            if (users.admin === true) {

                socket.handshake.session.cookie.admin = true;
                socket.handshake.session.cookie.logedin = true;
                socket.handshake.session.cookie.username = users.username;
                socket.handshake.session.cookie.uid = users.id;
                socket.handshake.session.save();
                return callback({ logedin: true }, { msg: `Admin ${users.username} with ${users.id} logged in ` });
            }
            return callback({ logedin: true }, { msg: "User logged in" });
            socket.handshake.session.logedin = true;
            socket.handshake.session.admin = false;
            socket.handshake.session.username = users.username;
            socket.handshake.session.Uid = users.id;
            socket.handshake.session.save();
        }


    }

};
exports.rights = {
    login: { rights: [] }
}