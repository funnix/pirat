const Sequelize = require("sequelize");

exports.attributes = {
    name: { type: Sequelize.STRING },
    key: { type: Sequelize.STRING },
    type: { type: Sequelize.STRING },
};

exports.config = {};