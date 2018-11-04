exports.endpoints = {

    loginStatus: async(socket, data, callback) => {

        var logdin = socket.handshake.session.logedin;
        var logOutTime = socket.handshake.session.cookie._expires;

        return callback(true, { logdin, logOutTime });

    },
    getRights: async(socket, data, callback) => {
        var uuid = socket.handshake.session.uuid;
        var User = await QW.Models.Users.findOne({ where: { id: uuid }, include: [{ model: QW.Models.Rights, as: 'rights' }] });
        // var rights = User.getRight();
        console.log(JSON.stringify(User, null, 4));
        //var right = await User.getRights();
        return callback(true, User.rights)

    }
}

exports.rights = {
    login: { rights: ['Admin'] }
}