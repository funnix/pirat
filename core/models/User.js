var Sequelize = require('sequelize');

exports.attributes = {
    fullname: { type: Sequelize.TEXT, allowNull: true },
    username: { type: Sequelize.STRING },
    password: { type: Sequelize.STRING },
    admin: { type: Sequelize.BOOLEAN, defaultValue: false }
}


exports.config = {};