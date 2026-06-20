var express = require("express");
var router = express.Router();
var { ObjectId } = require("mongodb");

var { getCollection } = require("../models/db");

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect("/users/signin");
}

router.get("/", ensureAuthenticated, async function (req, res) {
    var sessions = getCollection("sessions");

    var savedSessions = await sessions
        .find({ userId: req.user._id.toString() })
        .sort({ createdAt: -1 })
        .toArray();

    res.render("sessions/index", {
        title: "Saved Sessions",
        savedSessions: savedSessions
    });
});

router.get("/:id", ensureAuthenticated, async function (req, res) {
    var sessions = getCollection("sessions");

    var savedSession = await sessions.findOne({
        _id: new ObjectId(req.params.id),
        userId: req.user._id.toString()
    });

    if (!savedSession) {
        res.redirect("/sessions");
        return;
    }

    res.render("sessions/show", {
        title: savedSession.title,
        savedSession: savedSession
    });
});

router.get("/:id/edit", ensureAuthenticated, async function (req, res) {
    var sessions = getCollection("sessions");

    var savedSession = await sessions.findOne({
        _id: new ObjectId(req.params.id),
        userId: req.user._id.toString()
    });

    if (!savedSession) {
        res.redirect("/sessions");
        return;
    }

    res.render("sessions/edit", {
        title: "Edit Session",
        savedSession: savedSession
    });
});

router.post("/:id/update", ensureAuthenticated, async function (req, res) {
    var sessions = getCollection("sessions");

    await sessions.updateOne(
        {
            _id: new ObjectId(req.params.id),
            userId: req.user._id.toString()
        },
        {
            $set: {
                title: req.body.title,
                userNotes: req.body.userNotes,
                updatedAt: new Date()
            }
        }
    );

    res.redirect("/sessions/" + req.params.id);
});

router.post("/:id/delete", ensureAuthenticated, async function (req, res) {
    var sessions = getCollection("sessions");

    await sessions.deleteOne({
        _id: new ObjectId(req.params.id),
        userId: req.user._id.toString()
    });

    res.redirect("/sessions");
});

module.exports = router;