// Code Lab routes to show the lab page and submit code to Gemini for analysis

var express = require("express");
var router = express.Router();

var { getCollection } = require("../models/db");
var { ensureAuthenticated } = require("../utils/auth");
var { askGemini } = require("../utils/gemini");
var { buildCodePrompt } = require("../utils/prompts");
var { languages } = require("../utils/options");

function pageData(result, savedId, error, formData) {
    return { title: "Knight Code Lab", languages, result, savedId, error, formData: formData || {} };
}

function cleanResult(result) {
    result = result || {};
    result.issues = Array.isArray(result.issues) ? result.issues : [];
    result.improvements = Array.isArray(result.improvements) ? result.improvements : [];
    result.testCases = Array.isArray(result.testCases) ? result.testCases : [];
    return result;
}

router.get("/", ensureAuthenticated, function (req, res) {
    res.render("code/lab", pageData(null, null, null, {}));
});

router.post("/analyze", ensureAuthenticated, async function (req, res) {
    try {
        var data = req.body;

        if (!data.actionType || !data.language || !data.codeText)
            throw new Error("Please fill out all fields.");

        var result = cleanResult(await askGemini(buildCodePrompt(data)));

        console.time("Code Lab Mongo Save"); // checks how long database save takes
        var saved = await getCollection("sessions").insertOne({
            userId: req.user._id.toString(),
            type: "code-lab",
            title: result.title || "Code Lab Session",
            language: data.language,
            actionType: data.actionType,
            userInput: data.codeText,
            aiResponse: result,
            userNotes: "",
            isFavorite: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.render("code/lab", {
            title: "Knight Code Lab",
            languages: languages,
            result: result,
            savedId: saved.insertedId,
            error: null,
            formData: data
        });
    } catch (error) {
        res.render("code/lab", {
            title: "Knight Code Lab",
            languages: languages,
            result: null,
            savedId: null,
            error: error.message,
            formData: req.body
        });
    }
});

module.exports = router;