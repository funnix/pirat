/**
 * Middleware für ExpressJS für die Authentifizierung bei http-Requests
 * 
 * @param {object} app Das app-Objekt des Express-Frameworks
 *  
 */
exports.init = function(app) {

    // Ohne gültige Session, sind nur die folgenden URLs erlaubt
    var publicUrls = ['/login', '/loginStatus', '/logout', '/environment', '/api/upload',
        '/api/rawDataView', '/socket.io'
    ];

    // Authentifizierungs-Middleware
    app.use(function(req, res, next) {

        // Wenn kein Username vorhanden (also KEINE bestehende Session mit einem vorangegenagnen Login) 
        // und die angefragte Ressource ist KEINE öffentliche URL --> abbrechen
        // console.log("WAS PASSIERT HIER?", req)
        // if (req.session.username == undefined && publicUrls.indexOf(req.path) == -1) {
        //     res.status(403).send("Not logged in");
        //     return;
        // }

        // Weiter gehts.
        // Es besteht eine Session: Alle weiteren Rechte-Prüfungen passieren an der
        // jeweiligen Route bzw. im bei WebSockets im Dispatcher (siehe WebSocket.js).
        QW.Logging.AUTH.info("User: ", req.session.username, " / URL: ", req.path);
        next();

    });

};