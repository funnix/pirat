/**
 * Main App
 */

const path = require('path');
const http = require('http');
const fs = require('fs');

const express = require('express');
const favicon = require('express-favicon');
const socket = require('socket.io');
var session = require("express-session");
var MySQLStore = require('express-mysql-session')(session);
var Sequelize = require("sequelize")
var bodyParser = require("body-parser");
const publicPath = path.join(__dirname, '..', './public');

const port = process.env.PORT || 3000;
//var app = express();

console.log(publicPath);

QW = {};
QW.Models = {};

QW.Logging = {};
require("./logger.js");

global.forceDatabaseSync = false;



QW.App = {
    init: function() {
        this.readConfigAndHelper();
        var that = this;

        this.initDatabase(() => {
            this.createApp();
            this.initAdditionalRoutes();
            this.startApp();
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

        this.app.use("/", express.static(publicPath));
        this.app.use(favicon(publicPath + '/image/de.ico'))
            // EJS einbinden
        this.app.set("view engine", 'ejs');
        this.app.set("views", __dirname + "/views")

        var sessionStore = new MySQLStore({
            host: "localhost",
            port: "3306",
            createDatabaseTable: true,
            database: QW.App.config.database.name,
            user: QW.App.config.database.username,
            password: QW.App.config.database.password
        });

        this.session = session({
                secret: 'jadask35#äaslr23ö5äfläö235',
                resave: true,
                saveUninitialized: true,
                cookie: {
                    path: "/",
                    httpOnly: true,
                    // Ablaufdatum: 1 Tag
                    maxAge: 1000 * 60 * 60 * 24,
                    page: "PiratBook"
                },
                store: sessionStore

            })
            // Verwenden des Session-Objektes
        this.app.use(this.session);
        require(process.cwd() + "/core/middleware/express/Auth.js").init(this.app);
        //console.log(this);
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
    initAdditionalRoutes: function() {
        // Login/Logout

        // Masin
        require(process.cwd() + "/core/routes/Main").init(this.app);


    },
    startApp: function(callback) {

        var that = this;

        // HTTP-Server starten 
        this.server = this.app.listen(this.config.port, function() {
            QW.Logging.APP.info('PiratBook (HTTP) gestartet auf Port ' + that.config.port);
            if (typeof callback == "function") callback();
        });

        //WebSockets initialisieren
        QW.WebSockets = require(process.cwd() + "/core/WebSockets.js").WebSockets;
        QW.WebSockets.init(this.server, this.session);
        // Feuern eines "Ich-bin-soweit"-Events

        //QW.Emitter.emit('core:ready');

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