// Landing page and dashboard routes

var express = require("express");
var router = express.Router();
var { getCollection } = require("../models/db");
var { ensureAuthenticated } = require("../utils/auth");

// Landing page redirects to dashboard if already logged in
router.get("/", function (req, res) {
    if (req.isAuthenticated()) return res.redirect("/dashboard");
    res.render("index", { title: "KnightTrace" });
});

// Dashboard loads stats and 5 most recent sessions across all types
router.get("/dashboard", ensureAuthenticated, async function (req, res, next) {
    try {
        var userId = req.user._id.toString();
        var code = await getCollection("sessions").find({ userId }).toArray();
        var interviews = await getCollection("interviews").find({ userId }).toArray();
        var quizzes = await getCollection("quizzes").find({ userId }).toArray();

        var recent = code.concat(interviews, quizzes)
            .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
            .slice(0, 5);

        res.render("dashboard", {
            title: "Dashboard",
            stats: {
                sessions: code.length + interviews.length + quizzes.length,
                favorites: code.concat(interviews, quizzes).filter(function (x) { return x.isFavorite; }).length,
                quizzes: quizzes.filter(function (x) { return x.score !== null; }).length
            },
            recent
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
