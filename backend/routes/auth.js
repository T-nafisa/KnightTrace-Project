var express = require("express");
var router = express.Router();
var passport = require("passport");

function isRealEnvValue(value) {
    return value && !value.includes("your_") && !value.includes("_here");
}

// For Google Login
router.get("/google", function (req, res, next) {
    if (
        !isRealEnvValue(process.env.GOOGLE_CLIENT_ID) ||
        !isRealEnvValue(process.env.GOOGLE_CLIENT_SECRET)
    ) {
        res.render("users/signin", {
            title: "Sign In",
            error: "Google login is not configured yet. Add Google OAuth keys in .env."
        });
        return;
    }
    passport.authenticate("google", {
        scope: ["profile", "email"]
    })(req, res, next);
});

// Google Callback
router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/users/signin"
    }),
    function (req, res) {
        res.redirect("/dashboard");
    }
);


// GitHub login
router.get("/github", function (req, res, next) {
    if (
        !isRealEnvValue(process.env.GITHUB_CLIENT_ID) ||
        !isRealEnvValue(process.env.GITHUB_CLIENT_SECRET)
    ) {
        res.render("users/signin", {
            title: "Sign In",
            error: "GitHub login is not configured yet. Add GitHub OAuth keys in .env."
        });
        return;
    }
    passport.authenticate("github", {
        scope: ["user:email"]
    })(req, res, next);
});

// GitHub callback
router.get(
    "/github/callback",
    passport.authenticate("github", {
        failureRedirect: "/users/signin"
    }),
    function (req, res) {
        res.redirect("/dashboard");
    }
);

module.exports = router;