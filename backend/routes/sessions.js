// Session history routes to view, edit, favorite, and delete all saved sessions

var express = require("express");
var router = express.Router();
var { ObjectId } = require("mongodb");
var { getCollection } = require("../models/db");
var { ensureAuthenticated } = require("../utils/auth");

function getUserId(req) { return req.user._id.toString(); }

// Maps session type param to its MongoDB collection name
function getCollectionName(type) {
    if (type === "interview") return "interviews";
    if (type === "quiz") return "quizzes";
    return "sessions";
}

// Maps item type to its view URL prefix
function getTypeUrl(item) {
    if (item.type === "code-lab") return "code";
    return item.type;
}

// Fetches all user sessions across all three collections, sort by newest one first
async function getAllItems(req) {
    var uid = getUserId(req);
    var code = await getCollection("sessions").find({ userId: uid }).toArray();
    var interviews = await getCollection("interviews").find({ userId: uid }).toArray();
    var quizzes = await getCollection("quizzes").find({ userId: uid }).toArray();
    return code.concat(interviews, quizzes).sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
}

// Session list with optional filter (all, code, interview, quiz, favorite)
router.get("/", ensureAuthenticated, async function (req, res, next) {
    try {
        var filter = req.query.filter || "all";
        var search = String(req.query.search || "").trim().toLowerCase();
        var savedSessions = await getAllItems(req);

        var typeMap = { code: "code-lab", interview: "interview", quiz: "quiz" };
        if (typeMap[filter]) {
            savedSessions = savedSessions.filter(function (i) { return i.type === typeMap[filter]; });
        } else if (filter === "favorite") {
            savedSessions = savedSessions.filter(function (i) { return i.isFavorite; });
        }

        if (search) {
            savedSessions = savedSessions.filter(function (i) {
                var text = [i.title, i.type, i.topic, i.language, i.role].join(" ").toLowerCase();
                return text.includes(search);
            });
        }

        res.render("sessions/index", { title: "Saved Sessions", savedSessions, filter, search, getTypeUrl });
    } catch (error) {
        next(error);
    }
});

// View a single saved session
router.get("/:type/:id", ensureAuthenticated, async function (req, res, next) {
    try {
        var item = await getCollection(getCollectionName(req.params.type)).findOne({
            _id: new ObjectId(req.params.id),
            userId: getUserId(req)
        });
        if (!item) return res.redirect("/sessions");
        res.render("sessions/show", { title: item.title, item });
    } catch (error) {
        next(error);
    }
});

// Edit form for a session
router.get("/:type/:id/edit", ensureAuthenticated, async function (req, res, next) {
    try {
        var item = await getCollection(getCollectionName(req.params.type)).findOne({
            _id: new ObjectId(req.params.id),
            userId: getUserId(req)
        });
        if (!item) return res.redirect("/sessions");
        res.render("sessions/edit", { title: "Edit Session", item });
    } catch (error) {
        next(error);
    }
});

// Save title and notes edits
router.post("/:type/:id/update", ensureAuthenticated, async function (req, res, next) {
    try {
        await getCollection(getCollectionName(req.params.type)).updateOne(
            { _id: new ObjectId(req.params.id), userId: getUserId(req) },
            { $set: { title: String(req.body.title || "Untitled Session").trim(), userNotes: String(req.body.userNotes || "").trim(), updatedAt: new Date() } }
        );
        res.redirect("/sessions/" + req.params.type + "/" + req.params.id);
    } catch (error) {
        next(error);
    }
});

// Toggle favorite flag
router.post("/:type/:id/favorite", ensureAuthenticated, async function (req, res, next) {
    try {
        var collection = getCollection(getCollectionName(req.params.type));
        var item = await collection.findOne({ _id: new ObjectId(req.params.id), userId: getUserId(req) });
        if (item) {
            await collection.updateOne(
                { _id: item._id },
                { $set: { isFavorite: !item.isFavorite, updatedAt: new Date() } }
            );
        }
        res.redirect(req.get("referer") || "/sessions");
    } catch (error) {
        next(error);
    }
});

// Delete a session permanently
router.post("/:type/:id/delete", ensureAuthenticated, async function (req, res, next) {
    try {
        await getCollection(getCollectionName(req.params.type)).deleteOne({
            _id: new ObjectId(req.params.id),
            userId: getUserId(req)
        });
        res.redirect("/sessions");
    } catch (error) {
        next(error);
    }
});

module.exports = router;
