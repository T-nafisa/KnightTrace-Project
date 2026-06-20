var express = require('express');
var router = express.Router();

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect("/users/signin");
}

/* GET home page. */
router.get('/', function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect("/dashboard");
        return;
    }
    res.render("index", {
        title: "KnightTrace"
    });
});

/* GET dashboard page */
router.get("/dashboard", ensureAuthenticated, function (req, res) {
    res.render("dashboard", {
        title: "Dashboard"
    });
});

module.exports = router;
