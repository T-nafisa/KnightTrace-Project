// Interview practice routes to generate questions and manage pinned questions

var express = require("express");
var router = express.Router();
var { ObjectId } = require("mongodb");
var { getCollection } = require("../models/db");
var { ensureAuthenticated } = require("../utils/auth");
var { askGemini } = require("../utils/gemini");
var { buildInterviewPrompt } = require("../utils/prompts");
var { roles, topics, difficulties, counts } = require("../utils/options");

// Builds the data object passed to the interview view
function pageData(result, savedId, error, formData) {
    return {
        title: "Interview Practice",
        roles, topics, difficulties, counts,
        result, savedId, error,
        formData: formData || {}
    };
}

// Show interview generation form
router.get("/new", ensureAuthenticated, function (req, res) {
    res.render("interviews/new", pageData(null, null, null, {}));
});

// Generate interview questions via Gemini and save to DB
router.post("/create", ensureAuthenticated, async function (req, res) {
    try {
        var data = req.body;
        data.topics = Array.isArray(data.topics) ? data.topics.join(", ") : data.topics;
        if (!data.role || !data.level || !data.topics || !data.difficulty || !data.count)
            throw new Error("Please fill out all fields.");

        console.time("Interview Practice Gemini"); // checks how long Gemini takes
        var result = await askGemini(buildInterviewPrompt(data));
        result.questions = Array.isArray(result.questions) ? result.questions : [];

        var saved = await getCollection("interviews").insertOne({
            userId: req.user._id.toString(),
            type: "interview",
            title: result.title || "Interview Practice",
            role: data.role,
            level: data.level,
            topics: data.topics,
            difficulty: data.difficulty,
            aiResponse: result,
            pinnedQuestions: [],
            userNotes: "",
            isFavorite: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.render("interviews/new", pageData(result, saved.insertedId, null, req.body));
    } catch (error) {
        res.render("interviews/new", pageData(null, null, error.message, req.body));
    }
});

// Toggle a question as pinned/unpinned by its index in the questions array
router.post("/:id/pin/:index", ensureAuthenticated, async function (req, res, next) {
    try {
        var interviews = getCollection("interviews");
        var item = await interviews.findOne({
            _id: new ObjectId(req.params.id),
            userId: req.user._id.toString()
        });
        if (!item) return res.redirect("/sessions");

        var index = Number(req.params.index);
        var pins = item.pinnedQuestions || [];
        pins = pins.includes(index)
            ? pins.filter(function (x) { return x !== index; })
            : pins.concat(index);

        await interviews.updateOne(
            { _id: item._id },
            { $set: { pinnedQuestions: pins, updatedAt: new Date() } }
        );
        res.redirect("/sessions/interview/" + req.params.id);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
