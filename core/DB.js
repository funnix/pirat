const Sequelize = require('sequelize');
const fs = require("fs");
const async = require("async");

/**
 * Datenbank-Abstraktions-Schicht
 *  
 * Hiermit wird die Verbindung zur Datenbank aufgebaut und 
 * alle *Sequelize*-Modelle initialisiert.
 * 
 * 
 * @module QW/DB
 */
exports.DB = {

    /**
     * Initialisiert die Datenbank
     * 
     * @method
     * @param {function} callback Eine Callback-Funktion für das Erstellen der Datenbank-Verbindung
     */
    init: function(callback) {

        // Verbindung zur MySQL-DB aufbauen
        this.connect();
        // Initialisieren der Modelle
        this.initModels();
        // Hinzufügen der relationalen Beziehungen (ForeignKeys)
        require(process.cwd() + "/core/ForeignKeys");
        // Sync der Datenbank
        this.syncDB(callback);
    },


    /**
     * Datenbankverbindung aufbauen
     * 
     * @method 
     */
    connect: function() {

        // Zur DB verbinden
        this.database = new Sequelize(QW.App.config.database.name,
            QW.App.config.database.username, QW.App.config.database.password, {
                host: 'localhost',
                dialect: 'mysql',
                //logging: console.log,
                logging: true,
                pool: {
                    max: 5,
                    min: 0,
                    idle: 10000
                }
            });
    },
    initModels: function() {

        // Konfiguration der Modelle
        this.modelConfigs = {};

        // Alle Modelle anlegen
        var models = fs.readdirSync(process.cwd() + "/core/models");
        for (var x in models) {
            console.log(models[x]);
            this.createModel(models[x]);
        }


    },
    syncDB: function(callback) {
        // Anlegen der Datenbank
        this.database.sync({ force: forceDatabaseSync }).then(function() {
            callback();
        });
    }
}