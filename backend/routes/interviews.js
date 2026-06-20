var express = require("express");
var router = express.Router();

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/users/signin");
}

router.get("/new", ensureAuthenticated, function (req, res) {
    res.render("interviews/new", {
        title: "Interview Practice"
    });
});

module.exports = router;