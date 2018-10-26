exports.init = function(app) {

    app.get("/", (req, res) => {

        return res.end("Klappt");
    })

    app.get("/main", (req, res) => {

        return res.render('landing', { Title: "RF Treff" });
    });

    app.get("/login", (req, res) => {
        console.log("REQUEST:", req.session);
        return res.render('login', { title: "RFTreff" });
    })

    app.get("/environment", (req, res) => {

        res.send(QW.App.config.env);

    })
    app.post("/login", (req, res) => {
        // console.log(QW.App.session);
        // console.log("###############################", req.session);
        // res.send('you viewed this page ' + req.session.views['/login'] + ' times')
        req.session.username = req.body.username;
        //console.log(req.body);
        return res.status(200);
    })
}