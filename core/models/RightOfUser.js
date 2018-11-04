const Sequelize = require('sequelize');

exports.attributes = {
    RightsId: { type: Sequelize.INTEGER },
    UsersId: { type: Sequelize.INTEGER }
}

exports.config = {};