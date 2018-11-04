"use strict";
/* Namespace für QW */
var QW = QW || {};

/**
 * Basisklasse für das Frontend
 * 
 * Dieses Singleton regelt die grundlegenden Dinge im Frontend,
 * initialisiert Parameter, holt die ersten Rechte, etc.
 * 
 */
QW.Base = {

    // Ist dies der erste, initiale Ladevorgang des Frontedns
    initialLoad: null,

    msgTimeout: null,

    noActivityTimeout: null,
    // GET-Parameter des Browser-Aufrufs
    urlParams: null,
    // Server-Status (steht dieser NICHT auf online, werden Zellen-Änderungen auf den Arbeitsblättern verhindert!! )
    serverStatus: null,
    // Interner Cache (canJS)
    appState: null,
    // Debug-Modus
    debug: false,
    // Rechte geladen?
    rightsReady: false,

    /**
     * Initialisierung des Frontends
     *
     */
    init: function() {

        var that = this;
        // Initial bereits einmal geladen?
        this.initialLoad = true;
        // Deutsches "Locale" für die Moment-Library einstellen 
        moment.locale('de');
        // Setzen der Umgebung in den Browser-Titel
        // $.ajax({
        //     url: "/environment",
        //     success: function(data) {
        //         // DATA ist ENTW, INTE oder PROD
        //         if (data !== "PROD") $(document).find("head title").html("RFTreff (" + data + ")");
        //     }
        // });

        // URL-Parameter des initialen Aufrufs
        this.urlParams = {};

        // Globaler AppState wird hier initialisiert
        // this.appState = new can.Map({
        //     // Rechte des Users
        //     rights: [],
        //     // Verwendung von Arbeitsblättern (nur für einen Admin interessant und befüllt)
        //     sheetUsage: {},
        //     activeSheets: []
        // });

        // Globaler Fehler-Handler für Ajax-Errors
        //  this.initSocketEvents();
        // $(document).ajaxError(function(event, jqxhr, settings, thrownError) {
        //     // Global validation like this one:
        //     if (jqxhr.status == 403) {
        //         console.log(jqxhr.status);
        //         console.log(jqxhr.responseJSON);
        //         window.location.href = "login.html";
        //         return;
        //     }
        // });

        // Setzen ds globalen Debug-Modus (aus dem localeStorage)
        if (localStorage.getItem("debug") !== null) {
            QW.Base.debug = (localStorage.getItem("debug") == "true") ? true : false;
        }

        // Layout initalisieren
        // this.initLayout();
        // Parsen der GET-Parameter der URL
        this.parseGetParams();
        // Login des Users prüfen
        this.checkLogin();


        this.initSocketEvents();
    },

    /**
     * Prüft den Browser des Users
     * 
     * Im IE funktionieren die neueren JavaScript-Libraries nicht: Daher ist nur ein Firefox oder
     * ggf. ein Chrome erlaubt! 
     * 
     */
    checkBrowser: function() {
        // Prüfen, ob der Browser ein Firefox ODER Chrome Browser ist!
        if (navigator.userAgent.indexOf("Firefox") == -1 && navigator.userAgent.indexOf("Chrome") == -1) {
            $("body").css("padding", "100px").html('<div style="color:red;border:1px solid red;padding:20px;border-radius:5px;">Bitte verwenden Sie einen aktuellen Firefox-Browser! Vielen Dank.</div>').show();
        }
    },

    /**
     * Setzt den Debug-Modus
     * 
     * Debugging äußert sich darin, dass alle WebSocket-Calls (Aufruf und Antwort) komplett in der console
     * ausgegeben werden.
     *  
     * @param {boolean} boolean True|false für Debug-Modus an oder aus
     */
    setDebug: function(boolean) {

        // Sicher gehen, dass es ein boolean ist
        boolean = !!boolean;
        // Setzen des Debug-Modus im localStorage des Browsers
        localStorage.setItem("debug", boolean);
        QW.Base.debug = boolean;

    },

    /**
     * Initialisierung des Basis-Layouts
     * 
     * 
     */
    initLayout: function() {


        // Grundlegender Stil
        var pstyle = 'border: 1px solid #dfdfdf; padding: 5px; background:white; ';
        var pstyle2 = 'border: 1px solid #dfdfdf; padding: 5px; background:#EDF1F6';

        // W2UI-Layout initialisieren
        $('#myLayout').w2layout({
            name: 'myLayout',
            panels: [
                { type: 'top', size: 30, style: "background:#D0DFF1;border:0px;padding:0;", content: can.view("templates/topmenu.html") },
                { type: 'left', size: 200, style: pstyle, resizable: true, content: '<div id="sidebar" style="position:absolute;top:0;left:0;right:0;bottom:0;"></div>' },
                { type: 'right', title: "<strong>Legende</strong>", size: 200, resizable: true, hidden: true },
                {
                    type: 'main',
                    style: pstyle,
                    resizable: true,
                    content: '<div id="tabs" style="position:absolute;top:0;left:0;right:0;height:30px;"></div>' +
                        '<div id="tabContent" style="position:absolute; top:30px; left:0; right:0; bottom: 0;"></div>'
                },
            ]
        });
        // Layout anzeigen
        w2ui.myLayout.show("main")

        // Semantic-UI Dropdown(s) initialisieren
        $('.ui.dropdown').dropdown();


        // LeftSidebar layout....
        // W2UI-Siedbar-Komponenten initialisieren (Der Inhalt wird durch QW.Menu initialisiert)
        $('#sidebar').w2layout({
            name: 'mySidebarLeftLayout',
            panels: [
                { type: 'main', title: '<strong>Menü</strong>', style: pstyle, content: '<div id="sidebarTop" style="position:absolute;top:0;left:0;right:0;bottom:0;"></div>' },
                {
                    type: 'bottom',
                    size: 200,
                    title: "<strong>Ansicht</strong>",
                    style: pstyle2,
                    resizable: true,
                    content: '<div><strong>Ansichten:</strong><br><div id="viewsMenu"></div><div style="position:absolute;bottom:0;"><span id="errors"></span><!--<br>Benutzer online: <span id="usersOnline">0</span>--></div>'
                },
            ]
        });

        // Haupt-Menü initialisieren
        QW.Menu.init();
        // Tab.Reiter-Steuerung initialisieren
        QW.Modules.Tab.init();
    },


    /**
     * Erster Seitenaufbau nach dem Login wird hiermit vorgenommen
     * 
     * @param {object} loginData Login-Daten des Users
     */
    initPage: function(loginData) {

        // Anzeigen des HTML-Bodys
        $("body").show();

        // User-Daten ablegen
        this.user = loginData;

        // Initialisieren der WebSocket-Verbindung mit dem Backend
        // Hier ist KEINE weitere Authentifizierung notwendig, da 
        // das Backend die HTTP-Session-Daten übernimmt und damit den 
        // User "kennt"
        window.socket = io.connect();
        this.initSocketEvents();

        // Welche Seite steht als AKTIV in der url
        this.parseGetParams();

        // Basis ist fertig geladen :)
        QW.Base.dispatch("ready");
        // Bildschirmschoner initialisieren
        //QW.Base.initEasterEgg();

        // "Willkommen"-Seite/Startseite anzeigen (immer)
        var tab = new QW.Modules.Tab({ id: 'welcome', name: 'Willkommen!', closable: false, initial: true });
        QW.Modules.Tabs["welcome"].setContent(can.view("templates/welcome.html")(QW.Base.appState));

        // Potentielle Fehler des Banken-Import anzeigen!
        QW.Modules.Config.Cronjobs.getCockpitLog(function(err, data) {
            try {
                var data = JSON.parse(data.description);
                if (data.missingIdInImport !== undefined && data.missingIdInImport.length > 0) {
                    var er = $("#errors");
                    er.html("<span style='color:red;' title='Folgende Inst-Nr. sind in BART (Bank-Serien) vorhanden, aber NICHT mehr im Cockpit-Import:\r\n" + data.missingIdInImport.join(", ") + "'><i class='fa fa-warning'></i> Cockpit-Import-Fehler</span>");
                }
            } catch (e) {}
        });

        // Nun die Rechte holen....
        this.refreshSession();

    },

    /**
     * Initalisieren der Events der WebSocket-Verbindung
     * 
     */
    initSocketEvents: function() {

        var that = this;

        var origEmit = socket.emit;
        // Einen Wrapper um das normale "emit" schreiben, 
        // um die Callback-Funktion abzufangen.
        // Damit lässt sich zum einen immer Prüfen, ob die Session abgelaufen ist
        // zum anderen kann im Debug-Modus ALLES auf der Konsole ausgegeben werden.
        socket.emit = function() {
            // Wenn ein Callback dabei ist, dann Wrapper drum herum...
            if (typeof arguments[2] == "function") {
                var origCallback = arguments[2];
                var origArguments = arguments;
                arguments[2] = function(err, result) {
                    // Wenn die Fehlermeldung lautet: "Session is expired!" dann Browser neu laden!
                    if (err == "Session is expired!") { window.location = window.location; }
                    // Debug-Modus an
                    if (QW.Base.debug) {
                        if (err !== null) console.error("Antwort auf ", origArguments[0], origArguments[1], err);
                        else console.log("Antwort auf ", origArguments[0], origArguments[1], err, result);
                    }
                    // Original-Callback ausführen
                    return origCallback(err, result);
                }
            }
            // original "emit"-Funktion mit den Parameter ausführen
            origEmit.apply(this, arguments);

        }

        // Bei erfolgreichem Verbindungsaufbau....
        window.socket.on("connect", function(msg) {
            // Server-Status setzen
            that.serverStatus = "online";

            $('#serverStatus').removeClass("bg-light");
            $('#serverStatus').removeClass("bg-danger");
            $('#serverStatus').addClass("bg-success");

            $('#serverStatus').removeClass("border-light");
            $('#serverStatus').removeClass("border-danger");
            $('#serverStatus').addClass("border-success");
            $('#serverStatus').html("online");
            // Bekannt geben, dass man verbunden ist.
            that.dispatch("connected");
        });

        // Bei einem Neuladen der Rechte
        window.socket.on("rightsLoaded", function(rights) {
            // Server-Status setzen
            that.serverStatus = "online";
            // Setzen der Rechte im AppState
            //  QW.Base.appState.attr("rights", rights);

            // Rechte sind geladen-Event feuern
            QW.Base.dispatch("rightsReady");
            QW.Base.rightsReady = true;

            // Wenn wir aktuell noch im initialen Ladevorgang sind ...
            if (QW.Base.initialLoad) {
                // ... dann das Menu auch initial laden :)
                //   QW.Menu.initialLoad();
            }

        });

        // Bei einem "disconnect"-Event aus dem Backend (wenn der Server "down" ist bzw. neu gestartet wird)
        window.socket.on("disconnect", function(msg) {
            //alert("DISCONNECT");			
            that.serverStatus = "offline";
            //
            // Ggf. initiiert durch den Browser! => dann nichts anzeigen....
            // if (msg == "transport close") return;
            // Server-Status (in rot) anzeigen
            $('#serverStatus').addClass("bg-danger");
            $('#serverStatus').removeClass("bg-light");
            $('#serverStatus').removeClass("bg-success");
            $('#serverStatus').addClass("border-danger");
            $('#serverStatus').removeClass("border-light");
            $('#serverStatus').removeClass("border-success");

            $('#serverStatus').html("offline");
        });

        // Die Rechte sollen bitte NEU angefordert werden....(sagt das Backend)
        window.socket.on("refreshRights", function(data) {
            //console.log("Backend bittet um Refresh der Rechte....")
            that.refreshSession();
        });

        // Für die Anzeige in der Ansicht der Virtuellen DB-Schichten!!!
        window.socket.on("sheetUsage", function(data) {
            QW.Base.appState.attr("sheetUsage", data);
        });
        window.socket.on("activeSheets", function(data) {
            QW.Base.appState.attr("activeSheets", data);
        });
        window.socket.on("userLogedIn", function(data) {
            var sessionData = data;
            console.log("BEKOMME DATEN:", data);
            $('#userLogedIn').text(data.username);
        });
        window.socket.on("main/AppView", function(data) {
            var sessionData = data;
            console.log("BEKOMME DATEN DATA;-):", data);
            $('#userLogedIn').text(data.username);
        });
    },

    /**
     * Aktualisiert die Session (die Rechte des Users)
     * 
     * 
     */
    refreshSession: function() {

        var that = this;
        socket.emit("helper/refreshSessionRights", {}, function(err, data) {
            // Setzen der Rechte
            QW.Base.appState.attr("rights", data);
            // Menü neu aufbauen....
            //    QW.Menu.refreshMenu();
        });

    },

    /**
     * Überprüfen des Login des Users
     * 
     * Durch den globalen Error-Handler (s.o.) des AjaxHandlers werden Antworten mit Status 403
     * (also fehlerhafter Login) direkt auf die Login-Seite verwiesen.
     * 
     */
    checkLogin: function() {


        socket.emit("user/loginStatus", "loginCheck",
            function(data) {
                console.log("loginStaus:", data);
                return data;
            });




        // var that = this;
        // // LoginStatus abfragen
        // $.ajax({
        //     method: "GET",
        //     url: "/loginStatus",
        //     success: function(result) {
        //         // Initialisieren der Haupt-Seite
        //         that.initPage(result);
        //     },
        //     error: function(xhr, type, err) {
        //         // Jeder andere Fehler verweist auf die Login-Seite
        //         // window.location.href = "login.html?" + that.getGetParamsString();
        //         window.location.href = "main" + that.getGetParamsString();
        //     }
        // })
    },

    /**
     * Login-Funktion
     * 
     * @param {string} username LDAP-Kennung des Users
     * @param {string} pwd Passwort des Users
     * @param {function} callback Eine Callback-Funktion
     * 
     */
    login: function(username, password, callback) {
        socket.emit('authentication/login', { username, password }, function(err, data) {
            if (err.logedin !== true) {
                console.log("ERRROR");
                $('#error').html("Fehler: " + data).show();
                callback(err);
            } else {
                callback();
                // window.location.href = "/main"+QW.Base.getGetParamsString();
            }
        });
        // socket.emit("ANMELDUNG");
        // // Login-Methode des Backends aufrufen
        // $.ajax({
        //     method: "POST",
        //     data: { username: username, pwd: pwd },
        //     url: "/login",
        //     success: function(result) {
        //         // Erfolgreich
        //         callback();
        //     },
        //     error: function(xhr, type, err) {
        //         // Fehler zurückgeben
        //         callback(xhr.responseJSON);
        //     }
        // });
    },

    /**
     * Zurücksetzen der GET-Parameter der URL
     * 
     */
    clearGetParams: function() {
        window.history.pushState("", "", "?");
    },

    /**
     * Parsen der GET-Parameter in der URL
     * 
     */
    parseGetParams: function() {

        var that = this;
        // Sobald sich ein Parameter in der URL ändert,
        // wird diese Funktion ausgeführt.
        (window.onpopstate = function() {
            var match,
                pl = /\+/g, // Regex for replacing addition symbol with a space
                search = /([^&=]+)=?([^&]*)/g,
                decode = function(s) { return decodeURIComponent(s.replace(pl, " ")); },
                query = window.location.search.substring(1);

            that.urlParams = {};
            while (match = search.exec(query))
                that.urlParams[decode(match[1])] = decode(match[2]);
        })();

    },

    /**
     * Erzeugen eines aktuelle GET-URL-Strings (inkl. der bestehenden Parameter)
     * 
     * @param {object} data JSON-Objekt mit zu setzenden Daten
     * 
     * @return {string} URL-String mit allen GET-Parametern (bestehende und übergebene)
     * 
     */
    getGetParamsString: function(data) {

        // Aktuelle Parameter auslesen (aktiv antriggern)
        this.parseGetParams();
        var params = this.urlParams;
        // 
        for (var x in data) {
            params[x] = data[x];
        }
        var parts = [];
        for (var x in params) {
            parts.push(x + "=" + params[x]);
        }

        return parts.join("&");
    },


    /**
     * Dem Backend mitteilen, welches Modul vom User aktuell verwendet wird
     * 
     * Damit lässt sich für den Admin im Konfigurations-Frontend nachvollziehen, wie viele 
     * User gerade aktiv ein Arbeitsblatt geöffnet haben.
     * 
     */
    setActive: function(module, id) {
        socket.emit("user.State/active", { module: module, id: id }, function(err) { if (err) console.log(err) });
    },

    /**
     * Setzen einer MenuID in der URL
     * 
     * @param {string} menuId MenuID (ein String), der das aktive Tab in der URL kennzeichnet
     */
    setMenuId: function(menuId) {
        this.setGetParams({}, true, menuId);
    },

    /**
     * Setzen von Parametern in der URL
     * 
     * @param {object} data JSON-Objekt mit Daten, die in die URL gesetzt werden sollen
     * @param {boolean} clear True|false, um alle bestehenden GET-Parameter zuerst zu entfernen
     * @param {string} menuId MenuId, die gesetzt werden soll
     * 
     */
    setGetParams: function(data, clear, menuId) {

        // Die MenuId wird nur geändert, wenn dies explizit gefordert ist (per drittem Parameter...)
        this.parseGetParams();
        var menuId = menuId || this.urlParams["menuId"];

        if (clear === true) {
            var params = {};
            params.menuId = menuId;
        } else {
            // Übernehmen der aktuellen Parameter der URL
            this.parseGetParams();
            var params = this.urlParams;
        }
        // Überschreiben mit den übergebenen	
        for (var x in data) {
            params[x] = data[x];
        }

        var parts = [];
        for (var x in params) {
            parts.push(x + "=" + params[x]);
        }
        // URL nun per Javascript setzen!
        window.history.pushState("", "", "?" + parts.join("&"));

    },


    /**
     * Funktion, um auf ein input element vom type "file" einen Upload-Handler zu setzen
     * 
     * Die Funktionalität ermöglicht ein sehr einfaches Hochladen von Dateien im Roh-Format
     * unter Angabe des HTML-Elements und des socket-Endpunktes.
     * Auf Server-Seite kommt dann ein RAW-Format (ByteArray) an, welches direkt per fs-Modules
     * weggeschrieben werden kann.
     * 
     * 
     * @param {string} querySelector Ein Query-Selector, um das HTML-Element mit einem Handler zu versehen
     * @param {string} socketEndpoint Der Endpunkt, der als WebSocket aufgerufen werden soll.
     * @param {function} fetchAdditionalDataCallback Eine Funktion, die die Daten, die gesendet werden, erweitern kann
     * @param {function} callback Eine Callback-Funktion, die nach dem Upload ausgeführt wird.
     */
    setUploadHandler: function(querySelector, socketEndpoint, fetchAdditionalDataCallback, callback) {

        $(querySelector).on("change", function(evt) {

            var file = evt.target.files[0];
            var reader = new FileReader();

            reader.onload = (function(theFile) {
                return function(e) {
                    // Aufruf des WebSockets
                    // Daten, die gesendet werden sollen:
                    var data = {
                        filename: file.name,
                        mimetype: theFile.type,
                        raw: e.target.result,
                        lastModified: theFile.lastModified
                    }
                    if (typeof fetchAdditionalDataCallback == "function") {
                        var success = fetchAdditionalDataCallback(data);
                    }

                    if (success === false) return callback("Error in additionalDataCallback");

                    socket.emit(socketEndpoint, data, function(err, data) {
                        if (typeof callback == "function") callback(err, data);
                        else console.log(err, data);

                    })
                };
            })(file);
            // Einlesen der Datei als Array Buffer
            reader.readAsArrayBuffer(file);
        });
    },


    /** 
     * Initialisieren des EasterEggs
     * 
     */
    initEasterEgg: function() {

        // Nicht alle User sehen das Easter Egg!!!
        if (["xgadfas", "xgxttsg", "xgxtbrp", "xgxtsvb", "xgadjev", "xgadsge", "xgadcne", "xgadbbk", "xgadclj"].indexOf(QW.Base.user.username) == -1) return;

        var seconds = 30 * 60; // Nach 30 Minuten Inaktivität....
        window.easterEgg = function(action) {

            if (action == "start") {

                var degree = 0;
                var left = 0;
                window.ee1 = setInterval(function() {
                    degree = degree + 10;
                    $('#myLayout').css("filter", "hue-rotate(" + degree + "deg)");
                    if (degree == 360) degree = 0;
                }, 250);
                var maxWidth = $('body').width();


                // und nur weibliche User das Einhorn....
                if (["xgadfas", "xgxgbrp", "xgadclj", "xgadsge", "xgadbbk"].indexOf(QW.Base.user.username) !== -1) {
                    $("body").append('<img src="img/einhorn01.gif" id="einhorn" style="position:absolute;bottom:0;left:-100;bottom:0;right:0;z-index:1111111112;"/>')
                    window.ee2 = setInterval(function() {
                        left = left + 30;
                        $('#einhorn').css("left", left)
                        if (left > maxWidth) left = -100;
                    }, 100);

                } else {
                    $("body").append('<img src="img/car.gif" id="einhorn" style="width:150px;position:absolute;bottom:0;left:-100;bottom:0;right:0;z-index:1111111112;"/>')

                    window.ee2 = setInterval(function() {
                        left = left + 1;
                        $('#einhorn').css("left", left)
                        if (left > maxWidth) left = -100;
                    }, 20);
                }



            } else if (action == "stop") {
                clearInterval(window.ee1);
                clearInterval(window.ee2);
                delete window.ee1;
                delete window.ee2;
                $('#myLayout').css("filter", "hue-rotate(0deg)");
                $('#einhorn').remove();
            }
        }

        var lastMouseMove = Date.now();
        $(document).on("mousemove", function() {
            if (window.ee1 !== undefined) easterEgg("stop");
            lastMouseMove = Date.now();
        })

        // Check mouse move...
        var easterEggInterval = setInterval(function() {
            if (window.ee1 !== undefined) return; //Easteregg läuft schon
            if (lastMouseMove + seconds * 1000 < Date.now()) easterEgg("start");
        }, 1000)

    }
}

// Das Singleton QW.Base noch um "can.event" erweitern,
// damit kann man per "dispatch" beliebige Events feuern :)
can.extend(QW.Base, can.event);