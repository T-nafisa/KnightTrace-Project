// Auth middleware uses ensureAuthenticated on any route that requires login.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/users/signin");
}

module.exports = { ensureAuthenticated };