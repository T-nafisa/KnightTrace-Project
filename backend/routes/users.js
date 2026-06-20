var express = require('express');
var router = express.Router();
var passport = require("passport");
var crypto = require("crypto");

var {getCollection} = require("../models/db");
var {createPasswordHash} = require("../config/passport");

/* GET signup page */
router.get("/signup", function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect("/dashboard");
        return;
    }

    res.render("users/signup", {
        title: "Sign Up", error: null
    });
});

/* POST signup form */
router.post("/signup/submit", async function (req, res) {
    try {
        var users = getCollection("users");
        var username = req.body.username;
        var email = req.body.email;
        var password = req.body.password;

        if (!username || !email || !password) {
            res.render("users/signup", {
                title: "Sign Up", error: "Please fill out all fields."
            });
            return;
        }

        email = email.toLowerCase();
        var existingUser = await users.findOne({
            email: email
        });
        if (existingUser) {
            res.render("users/signup", {
                title: "Sign Up", error: "An account with this email already exists."
            });
            return;
        }

        var salt = crypto.randomBytes(16).toString("hex");
        var passwordHash = createPasswordHash(password, salt);

        var newUser = {
            username: username,
            email: email,
            passwordHash: passwordHash,
            salt: salt,
            googleId: null,
            githubId: null,
            authProvider: "local",
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await users.insertOne(newUser);
        res.redirect("/users/signin");
    } catch (error) {
        console.error(error);
        res.render("users/signup", {
            title: "Sign Up", error: "Signup failed. Make sure MongoDB is connected."
        });
    }
});

/* GET signin page */
router.get("/signin", function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect("/dashboard");
        return;
    }
    res.render("users/signin", {
        title: "Sign In", error: null
    });
});

/* POST signin form */
router.post("/signin/submit", function (req, res, next) {
    passport.authenticate("local", function (error, user, info) {
        if (error) {
            return next(error);
        }
        if (!user) {
            res.render("users/signin", {
                title: "Sign In", error: info ? info.message : "Login failed."
            });
            return;
        }
        req.logIn(user, function (error) {
            if (error) {
                return next(error);
            }
            res.redirect("/dashboard");
        });
    })(req, res, next);
});

/* GET logout */
router.get("/logout", function (req, res, next) {
    req.logout(function (error) {
        if (error) {
            return next(error);
        }
        res.redirect("/");
    });
});

module.exports = router;
