// Quiz routes to generate, take, and review multiple-choice quizzes via Gemini

var express = require("express");
var router = express.Router();
var { ObjectId } = require("mongodb");
var { getCollection } = require("../models/db");
var { ensureAuthenticated } = require("../utils/auth");
var { askGemini } = require("../utils/gemini");
var { buildQuizPrompt } = require("../utils/prompts");
var { topics, difficulties, counts } = require("../utils/options");

// Show quiz creation form
router.get("/new", ensureAuthenticated, function (req, res) {
    res.render("quizzes/new", {
        title: "Quiz Generator",
        topics, difficulties, counts,
        error: null, formData: {}
    });
});

// Generate quiz via Gemini and save to DB, then redirect to take page
router.post("/create", ensureAuthenticated, async function (req, res) {
    try {
        var topic = req.body.customTopic || req.body.topic;
        if (!topic || !req.body.difficulty || !req.body.count)
            throw new Error("Please fill out all fields.");

        console.time("Quiz Generator Gemini"); // checks how long Gemini takes
        var result = await askGemini(buildQuizPrompt({ topic, difficulty: req.body.difficulty, count: req.body.count }));
        result.questions = Array.isArray(result.questions) ? result.questions : [];

        var saved = await getCollection("quizzes").insertOne({
            userId: req.user._id.toString(),
            type: "quiz",
            title: result.title || "Quiz",
            topic: topic,
            difficulty: req.body.difficulty,
            questions: result.questions,
            userAnswers: [],
            score: null,
            userNotes: "",
            isFavorite: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.redirect("/quizzes/" + saved.insertedId + "/take");
    } catch (error) {
        res.render("quizzes/new", {
            title: "Quiz Generator",
            topics, difficulties, counts,
            error: error.message, formData: req.body
        });
    }
});

// Show quiz questions for the user to answer
router.get("/:id/take", ensureAuthenticated, async function (req, res, next) {
    try {
        var quiz = await getCollection("quizzes").findOne({
            _id: new ObjectId(req.params.id),
            userId: req.user._id.toString()
        });
        if (!quiz) return res.redirect("/quizzes/new");
        res.render("quizzes/take", { title: quiz.title, quiz });
    } catch (error) {
        next(error);
    }
});

// Score submitted answers and save results
router.post("/:id/submit", ensureAuthenticated, async function (req, res, next) {
    try {
        var quizzes = getCollection("quizzes");
        var quiz = await quizzes.findOne({
            _id: new ObjectId(req.params.id),
            userId: req.user._id.toString()
        });
        if (!quiz) return res.redirect("/quizzes/new");

        var score = 0;
        var answers = quiz.questions.map(function (q, i) {
            var answer = req.body["q" + i] || "";
            if (answer === q.correctAnswer) score++;
            return answer;
        });

        await quizzes.updateOne(
            { _id: quiz._id },
            { $set: { userAnswers: answers, score, updatedAt: new Date() } }
        );

        res.redirect("/quizzes/" + req.params.id + "/result");
    } catch (error) {
        next(error);
    }
});

// Show quiz result with score and correct answers
router.get("/:id/result", ensureAuthenticated, async function (req, res, next) {
    try {
        var quiz = await getCollection("quizzes").findOne({
            _id: new ObjectId(req.params.id),
            userId: req.user._id.toString()
        });
        if (!quiz) return res.redirect("/quizzes/new");
        res.render("quizzes/result", { title: "Quiz Result", quiz });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
