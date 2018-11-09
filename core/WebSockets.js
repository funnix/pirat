const sharedsession = require("express-socket.io-session");
const async = require("async");
const extend = require("extend");
const io = require("socket.io");
const socketioWildcard = require('socketio-wildcard')();
const Promise = require("bluebird");
const moment = require("moment");
const pmx = require('pmx');

/**
 * WebSocket-Klasse für die Kommunikation zwischen Frontend und Backend
 *
 * 
 * @class WebSockets
 * @memberOf QW
 */
var WebSockets = {

    // Alle socket-Verbindungen zu Users / Frontend
    connections: [],
    // Liste aller registrierten Kontroller 
    controllers: {},
    // Konfigurierte Rechte der Kontroller
    controllerRights: {},



    /**
     * Initialisiert den WebSocket-Server
     * 
     * @method
     * @param {object} server Server-Instanz eines Expressjs-Servers
     * @param {session} session Das Session-Objekt, welches für den Expressjs-Server initialisiert wurde
     */
    init: function(server, session) {

        // Der WebSocket-Server soll auf dem Server lauschen, auf dem auch der HTTP-Server sitzt
        this.io = io.listen(server);
        // Auth über socket


        // Es werden WILDCARDS unterstützt (damit kann man auf alles hören, was vom Backend über 
        // einen WebSocket gesendet wird)
        this.io.use(socketioWildcard);
        // Die HTTP-Session soll auch als Socket-Session genutzt werden können
        // Das package "sharedsession" verbindet die beiden "Welten"	
        this.io.use(sharedsession(session, {
            autoSave: true
        }));



        var that = this;

        // Registrieren von pmx-Funktionen:
        pmx.action('whoisonline', (reply) => { this.whoisonline(reply) });


        // Nun werden alle benötigten Kontroller für das Frontend registriert:
        this.registerEndpoints();

        // Eine Verbindung vom Browser möchte sich verbinden

        this.io.on('connection', function(socket) {


            console.log("Client Connected", socket.handshake.session, that.io.nsps);
            // require('socketio-auth')(that.io, {
            //     authenticate: this.authenticate,
            //     postAuthenticate: this.postAuthenticate,
            //     disconnect: this.disconnect,
            //     timeout: 1000
            // });
            if (!socket.handshake.session.username) {
                socket.emit("makeLogin");
            }
            socket.handshake.session.username = "carsten";
            // Aktualisieren der Session.
            socket.handshake.session.reload(function() {
                // Rechte des Nutzers aktualisieren
                // socket.handshake.session.username = "carsten";
                that.refreshRights(socket)
                    .then((rights) => {
                        //console.log("rightsLoaded after connection....."+socket.handshake.session.username);
                        setTimeout(function() {
                            // ... und dem Frontend mitteilen, dass die Rechte geladen wurden.
                            socket.emit("rightsLoaded", rights)
                        }, 100);
                    });
            });


            QW.Logging.WS.info("Connect:", socket.handshake.session.username);
            socket.emit("status", "Serverstatus ok");
            // broadcast online status....DEPRECATED....wird im Browser aus Datenschutzgründen nicht mehr angezeigt....
            that.whoisonline();

            // Was soll bei einem "disconnect" des Frontends passieren...?
            socket.on("disconnect", function() {

                // 5 Sekunden warten bevor die "whoisonline"-Method aufgerufen wird
                // um ein "Flackern" der Online-User-Funktion bei einem normalen Refresh iom Browser 
                // zu verhindern
                QW.Logging.WS.info("Disconnect:", socket.handshake.session.username);
                setTimeout(function() {
                    that.whoisonline(function() {});
                }, 5000);
                return;
            });

            // Wildcard listener: Immer zum Dispatcher weiterleiten
            socket.on('*', function(packet) {
                if (socket.handshake.session.username == undefined) {}

                console.log("VOR DISPATCH:", packet.data[2]);
                that.dispatch(socket, packet.data);
            });
        });

    },
    // authenticate: (data) => {
    //     var username = data.username;
    //     var password = data.password;
    //     console.log("Aus Authenticte:", username, password);
    // },

    // postAuthenticate: (err, callback) => {},
    // disconnect: (err, callback) => {},
    /**
     * Registriert alle fachlichen Funktionen des Backends
     * 
     * Alle fachlichen Funktionen des Backends müssen per WebSocket-Verbindung aufrufbar sein.
     * Dafür werden hier die einzelnen Kontroller registriert. Jeder Kontroller wirde über einen 
     * Endpunkt identizifert, der als Einstieg für das Frontend verwendet wird.
     * 
     * Bspw. registriert der folgende Aufruf:
     * ```this.register("sheet", process.cwd() + "/core/logic/base/virtualSheet/VirtualSheet");```
     * den Endpunkt "sheet" mit der dazugehörigen Klasse /core/logic/base/virtualSheet/VirtualSheet
     * Alle dort exportieren Funktionen lassen sich dann im Frontend per 
     * ```socket.emit("sheet/<funktionsName>", ...)```
     * aufrufen.
     * 
     * @method
     * 
     * 
     */
    registerEndpoints: function() {

        // Hauptklasse für ein Arbeitsblatt => die Virtuelle Schicht (!!!)
        // this.register("sheet", process.cwd() + "/core/logic/base/virtualSheet/VirtualSheet");
        // // Verwaltung von Nutzer-spezifische Filter auf Sheets  
        // this.register("user.Filters", process.cwd() + "/core/logic/base/user/Filter");
        // // Aufrufen von Logs
        this.register("user", process.cwd() + "/core/logic/base/user/Login");
        //this.register("main", process.cwd() + "/core/logic/base/user/Main");
        this.register("authentication", process.cwd() + "/core/logic/base/user/Auth");
        console.log("##################################################################", this);

        //this.register("user.State", process.cwd() + "/core/logic/base/user/State");




    },


    /**
     * Aktualisieren der Rechte eines Users
     * 
     * @param {socket} socket WebSocket-Objekt der Verbindung (des Users)
     * 
     */
    refreshRights: async(socket) => {

        // Prüfen, ob dieser User bereits existiert....wenn nicht -> Fehlermeldung...
        // console.log("SESSION:", socket.handshake);

        // console.log(await QW.Models.Users.findOne({ where: { username: socket.handshake.session.username } }));

        //console.log(QW);
        console.log("AUS Refresh RIGHTS:")
        socket.emit("err", { footer: "footer1", new: '-success', text: "User OK", arr: QW.App.config.bootstrap });
        setTimeout(() => {
                socket.emit("err", { footer: "footer1", new: '-danger', text: "User NOK", arr: QW.App.config.bootstrap });
            }, 5000)
            // return QW.Models.Users.findOne({ where: { username: socket.handshake.session.username } })

    },


    /**
     * Registrieren eines Controllers für das Backend
     * 
     * @param {string} controllerName Identifizierender Name des Controllers (unter diesem Namen ist der Controller vom Frontend per socket.emit erreichbar)
     * @param {string} path Pfad zu der Controller-Datei im Backend
     * 
     */
    register: function(controllerName, path) {

        try {
            // Einbinden des Controllers
            var controller = require(path);
            QW.Logging.WS.info("Inhalt:", controller)
                // Abspeichern des Controllers
            this.controllers[controllerName] = controller.endpoints || {};
            // Abspeichern der Rechte für den Controller
            this.controllerRights[controllerName] = controller.rights || {};

        } catch (e) {
            console.log(e)
            QW.Logging.WS.error(e);
        }
        // Loggen
        QW.Logging.WS.info("Kontroller registriert: ", controllerName);
    },



    /**
     * Dispatcher für WebSocket-Calls aus dem Frontend 
     * 
     * @param {socket} socket WebSocket-Objekt der Verbindung
     * @param {object} packetdata Daten des WebSocket-Calls
     * 
     */
    dispatch: function(socket, packetdata, callback) {

        // Die Aufrufe aus dem Frontend sollten IMMER der folgenden Struktur entsprechen
        // 1. Aufzurufende Route
        // 2. Daten 
        // 3. Callback-Funktion
        // Bspw. sieht ein Aufruf aus dem Frontend damit so aus:
        // 
        // socket.emit("sheet/getViews", {sheetId: 1}, function(err, data){ .... });
        //
        // Damit würde der Controller "sheet", dessen Funktion "getViews" mit den Daten {sheetId:1} aufgerufen werden.
        //
        var route = packetdata[0];
        var data = packetdata[1];
        var callback = packetdata[2];
        console.log("=xxxx=================================================>", route, socket.handshake.session);
        if (!socket.handshake.session.logedin) {
            console.log("User ist noch nicht angemeldet!!");
            socket.emit("user/loginFirst");
        }
        if (route == "user/login") {
            socket.handshake.session.username = data.username;
        }
        if (route === "authentication") {
            console.log("BEREITS ANGEMELDET?:", socket.auth);
            if (socket.auth === true) {
                return callback("Allready logged in");
            }
            console.log("AUTHENTICATIONS:", data)
            console.log("Session ", socket.handshake.session);

            socket.auth = true;

        }
        // Authentifizierung
        if (socket.handshake.session.username == undefined) {
            socket.handshake.session.reload(function(err) {});
            //     return callback("NOT LOGGED IN");
        }
        if (typeof callback !== "function") {
            QW.Logging.WS.error("No callback function in socket call!")
            return;
        }

        var now = new Date();
        // Session ist abgelaufen....Fehler melden...
        if (socket.handshake.session.cookie._expires <= now) {
            return callback("Session is expired!");
        }

        // Aufbau einer Route: "controller/action", data...
        // also bspw. "sheet/getViews" ....
        var routeParts = route.split("/");

        var controller = routeParts[0];
        var action = routeParts[1];
        // Prüfen, ob es diesen Controller und dessen Funktion so gibt.
        if (this.controllers[controller] !== undefined) {
            if (typeof this.controllers[controller][action] == "function") {

                // Rechte des Controllers prüfen....
                if (this.controllerRights[controller] && this.controllerRights[controller][action]) {
                    var rights = this.controllerRights[controller][action];
                    var rightsCount = (rights.rights) ? rights.rights.length : 0;

                    // Werden admin-Rechte benötigt (und es sind KEINE weiteren Rechte beschrieben....)
                    if (rights.admin === true && rightsCount == 0) {
                        // Wenn man kein Admin ist, Ende!!!                      
                        if (socket.handshake.session.admin !== true) return callback("You need admin rights for this action!");
                        // console.log("Only admin allowed...you are admin.....got through....")
                    }
                    // Wenn Admin Rechte notwendig sind und weitere Rechte, und man ist Admin...alles gut...
                    else if (rights.admin === true && socket.handshake.session.admin === true) {
                        // Keine weiteren Prüfungen
                        //console.log("Admin allowed (or rights...)...you are admin.....got through....")
                    } else if (rightsCount > 0) {

                        // Prüfen, ob der User alle geforderten Rechte besitzt!!                    
                        for (var x in rights.rights) {
                            // Eines der für diese Route geforderten Rechte nicht vorhanden..... abbrechen!
                            if (socket.handshake.session.rights.indexOf(rights.rights[x]) == -1) {

                                QW.Logging.WS.info("You need the rights: '" + rights.rights + "' to do '" + action + "' on '" + controller + "'");
                                return callback("You need the rights: '" + rights.rights + "' to do '" + action + "' on '" + controller + "'");
                            }
                        }
                    } else {
                        // console.log("NO RIGHTS CONFIGURE? ...",controller,action);
                    }
                }

                // Hieer angelangt, sind entweder alle benötigten Rechte vorhanden ODER man ist Admin :)
                // Controller ausführen
                this.controllers[controller][action](socket, data, callback);

            } else {
                QW.Logging.WS.error("No action '" + action + "' in controller '" + controller + '"');
                callback("No action '" + action + "' in controller '" + controller + '"');
            }
        } else {
            QW.Logging.WS.error("No controller '" + controller + '" ?!');
            callback("No controller '" + controller + '" ?!');
        }

        // Nach jeder Aktion die Session neu laden (das ist notwendig, falls sich etwas verändert hat....)
        socket.handshake.session.reload(function(err) {});



    },


    /**
     * Hilfsfunktion: Welche User sind gerade online
     * 
     * Diese Funktion ermittelt aus den bestehenden Socket-Verbindungen die angemeldeten User.
     * Die Funktion ist aus datenschutzrechtlichen Gründen NICHT ans Frontend angeschlossen, lässt sich aber 
     * im Backend ausführen.
     * 
     * @return {object} Liste mit Usernamen
     */
    whoisonline: function(reply) {

        // Ermitteln, welche User angemeldet sind
        var users = {};
        for (var x in this.io.sockets.sockets) {
            var socket = this.io.sockets.sockets[x];
            if (socket.handshake.session.fullname !== undefined) users[socket.handshake.session.username] = socket.handshake.session.fullname;
            else users[socket.handshake.session.username] = socket.handshake.session.username;
        }
        // Aussenden an ALLE Teilnehmer, wer online ist....    
        // this.broadcastToAll("whoisonline", users)
        if (typeof reply == "function") reply(users);


    },


    /**
     * Ein Event auslösen mit Daten für den angegebenen User
     * 
     * @param {string} username Name des Nutzers (LDAP-Kennung)
     * @param {string} type Name des Events
     * @param {object} data Daten des Events 
     * 
     */
    emitTo: function(username, type, data) {

        for (var x in this.io.sockets.sockets) {
            if (this.io.sockets.sockets[x].handshake.session.username == username) {
                this.io.sockets.sockets[x].emit(type, data);
                // Selbst wenn der Name gefunden wurde, nicht abbrechen, damit 
                // man mit dem selben User (also ich, als Entwickler)
                // in zwei Browsern testen kann!!!
            }
        }
    },

    /**
     * Ermittelt die Socket(s) eines Users (ggf. mehrere)
     * 
     * Diese Hilfsfunktion findet alle Sockets eines Users, um ggf. Nachrichten
     * per Socket zu versenden.
     * 
     * @param {string} username Name des Users (LDAP-Kennung)
     * @return {array} Alle Socket-Objekte des Users in einem Array
     */
    getSocketsOf: function(username) {

        var sockets = [];

        for (var x in this.io.sockets.sockets) {
            if (this.io.sockets.sockets[x].handshake.session.username == username) {
                sockets.push(this.io.sockets.sockets[x]);
            }
        }
        return sockets;

    },

    /**
     * Nachrichten an alle verbundenen Sockets im Frontend senden 
     *  
     * @param {string} type Name des "Events"
     * @param {object} data Daten-Objekt, welches gesendet werden soll
     * @param {function} filterFunction Optional: eine Filter-Funktion
     * 
     */
    broadcastToAll: function(type, data, filterFunction) {

        for (var x in this.io.sockets.sockets) {

            var socket = this.io.sockets.sockets[x];
            // Wenn eine Filter-Funktion angegeben wurde, so sollte diese "true" zurückgeben,
            // wenn ein "emit" stattfinden soll. 
            if (typeof filterFunction == "function") {
                if (filterFunction(socket, type, data) === true) {
                    socket.emit(type, data);
                } else {
                    QW.Logging.WS.error("NO EMIT OF TYPE ", type, "WITH DATA: ", data);
                }
            } else {
                socket.emit(type, data);
            }
        }
    }

};

// Modul-Export
exports.WebSockets = WebSockets;