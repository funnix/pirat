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
    },
    createModel: function(modelName) {

        // Einlesen der Model-Datei
        var model = require(process.cwd() + "/core/models/" + modelName);
        var name = modelName.split(".")[0];
        // Psuedo-Plural-Name verwenden...
        name = name + "s";
        // Konfiguration abspeichern
        this.modelConfigs[name] = model;

        // Soll das Modell versioniert abgespeichert werden?
        model.config.temporal = false;


        if (model.config.temporal == true) {

            // version (default: 1)
            model.attributes.__version = { type: Sequelize.INTEGER, defaultValue: 1, allowNull: false };
            // active
            model.attributes.__active = { type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false };
            // original id
            model.attributes.__originalId = { type: Sequelize.INTEGER, allowNull: true, defaultValue: null };
            // valid time
            model.attributes.__validFrom = { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW };
            model.attributes.__validTill = { type: Sequelize.DATE, allowNull: true, defaultValue: null };

            // sequelize ermöglicht die Konfiguration als "paranoid", damit wird NIE physikalisch gelöscht
            model.config.paranoid = true;
            model.config.createdAt = "__createdAt";
            model.config.updatedAt = "__updatedAt";
            model.config.deletedAt = "__deletedAt";

            // Hooks für die Versionierung hinzufügen
            model.config.hooks = {

                // Vor dem Erstellen eines Datensatzes
                beforeCreate: function(record, options, fn) {
                    // Aktiver Record? => dann das Datum "gültig ab" auf jetzt setzen.
                    if (record.__active == true) {
                        record.__validFrom = new Date();
                    }
                    fn();
                },

                // Vor dem Aktualisieren eines Datensatzes
                beforeUpdate: function(record, options, fn) {

                    // Wenn der Grund des Updates "INVALIDIERUNG" ist (__validTill wird auf ein Datum gesetzt)
                    // dann darf der Datensatz NICHT kopiert werden. Er wird NUR invalidiert.
                    // Das Datum "null" von __validTill wird in sequelize konvertiert und auf das "Null-Datum" (new Date(null)) gesetzt.
                    // daher auch damit abgleichen!
                    var nullDate = new Date(null);

                    // Prüfen: liegt eine Invalidierung vor?
                    if ((record._previousDataValues.__validTill == null || record._previousDataValues.__validTill.toString() == nullDate.toString()) &&
                        (record.dataValues.__validTill !== null && record.dataValues.__validTill.toString() !== nullDate.toString())) {

                        // Hier sind KEINE weiteren Änderungen außer Setzen des __validTill-Zeitstempels erlaubt.
                        // Daher merken des validTill...
                        var validTill = record.__validTill;
                        // ... setzen der dataValues des Records auf die _previousDataValues (die zuvor gesetzt waren)
                        record.dataDalues = record._previousDataValues;
                        // Dann wieder setzen des __validTill-Zeitstempels 
                        record.__validTill = validTill;
                        // .. Aktiv-Kennzeichen entfernen
                        record.__active = false;
                        // und weiter (speichern)
                        return fn();
                    }

                    // EIN NICHT AKTIVER RECORD WIRD NIEMALS ABGESPEICHERT!!!!!
                    // Daher MUSS der Wert _previousDataValues.__validTill auf NULL stehen
                    if (record._previousDataValues.__validTill !== null) {
                        // Mit Fehlermeldung beenden!
                        fn("Die Tabelle ist versioniert und erlaubt KEINE Updates an nicht aktiven Datensätzen!");
                        return;
                    }


                    var modelName = this.name;
                    var that = this;
                    // Aktiv setzen
                    record.__active = true;
                    // Neues Datum setzen
                    var date = new Date();
                    record.__validFrom = date;
                    record.__validTill = null;
                    // Version hochzählen
                    record.__version = record.__version + 1;

                    // Historische Kopie erzeugen: Datensatz kopieren (dann wird die Kopie ebenfalls abgespeichert)
                    this.findOne({ where: { id: record.id } }).then(function(copyOfRecord) {

                        if (copyOfRecord === null) {
                            console.log("Keine Kopie erstellt von " + modelName + " id: " + record.id);
                            return fn();
                        }
                        // Setzen von "isNewRecord" auf true, damit wird ein neuer Record erzeugt
                        copyOfRecord.isNewRecord = true;
                        // NICHT aktiv
                        copyOfRecord.dataValues.__active = false;
                        // zusätzlich Abspeichern der Original-ID
                        copyOfRecord.dataValues.__originalId = copyOfRecord.dataValues.id;
                        // wichtig: Gültig bis jetzt im Datensatz abspeichern
                        copyOfRecord.__validTill = date;
                        // Die ID de Datensatzes löschen....
                        delete copyOfRecord.dataValues.id;
                        // Kopie in der Datenbank als historischer Datensatz abspeichern.
                        copyOfRecord.save();
                        fn();
                    });
                }
            }
        }

        // Überschreiben von Methoden der Modell-Klasse von sequelize:
        model.config.classMethods = {

        };


        // Modell mittels sequelize "definieren"
        QW.Models[name] = this.database.define(name, model.attributes); //, model.config);


        // Ein Modell als verkette Liste erhält zusätzliche Logik (Hooks)
        if (model.config.linkedList == true) {

        }

    },
}