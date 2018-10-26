/**
 * Main App
 */

const path = require('path');
const http = require('http');
const fs = require('fs');

const express = require('express');
const socket = require('socket.io');
var session = require("express-session");
var MySQLStore = require('express-mysql-session')(session);
var Sequelize = require("sequelize")
var bodyParser = require("body-parser");
const publicPath = path.join(__dirname, './public');

const port = process.env.PORT || 3000;
//var app = express();

console.log(publicPath);

QW = {};
QW.Models = {};
global.forceDatabaseSync = false;



QW.App = {
    init: function() {
        this.readConfigAndHelper();
        var that = this;

        this.initDatabase(() => {
            this.createApp();

        })

    },


    createApp: function() {
        this.app = express();
        this.app.use(bodyParser.json({ limit: '50mb' }));
        this.app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));

        // Upload von SRM-Daten per API (Rino Meier) => HTML-Encoded....text/plain
        this.app.use(bodyParser.text({ type: "text/plain" }));

        this.server = http.createServer(this.app);

        this.io = socket(this.server);

        this.app.use(express.static(publicPath));

        console.log(this);
    },
    readConfigAndHelper: function() {

        var configFile = process.cwd() + "/modul/config.json";

        // Einlesen der Config-Json-Datei
        try {
            this.config = JSON.parse(fs.readFileSync(configFile));

        } catch (e) {
            QW.Logging.APP.error("Config file not readable");
            QW.Logging.APP.error(e);
        }
        // Helper-Funktionen einlesen
        this.Helper = require(process.cwd() + "/core/Helper").Helper;

    },
    initDatabase: function(callback) {


        // Zur MySql-Datenbank verbinden
        QW.DB = require(process.cwd() + "/core/DB.js").DB;
        QW.DB.init(callback);


    },


}

// QW.App.io.on('connection', (socket) => {
//     console.log('New User Connected');

//     QW.App.socket.on('disconnct', () => {
//         console.log("User ist Disconnected");
//     })
// })

// QW.App.server.listen(port, () => {
//     console.log(`Server is up on ${port}`);
// })