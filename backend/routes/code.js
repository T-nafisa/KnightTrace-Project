var express = require("express");
var router = express.Router();
var axios = require("axios");

var { getCollection } = require("../models/db");

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/users/signin");
}

function cleanJson(text) {
    return text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
}

router.get("/", ensureAuthenticated, function (req, res) {
    res.render("code/lab", {
        title: "Knight Code Lab",
        result: null,
        error: null,
        formData: {}
    });
});

router.post("/analyze", ensureAuthenticated, async function (req, res) {
    try {
        var actionType = req.body.actionType;
        var language = req.body.language;

        var codeText = req.body.codeText;

        if (!actionType || !language || !codeText) {
            res.render("code/lab", {
                title: "Knight Code Lab",
                result: null,
                error: "Please fill out all fields.",
                formData: req.body
            });
            return;
        }

        // Gemini API key
        var apiKey = process.env.GEMINI_API_KEY;
        var model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

        if (!apiKey || apiKey.includes("your_") || apiKey.includes("_here")) {
            res.render("code/lab", {
                title: "Knight Code Lab",
                result: null,
                error: "Gemini API key is not configured yet.",
                formData: req.body
            });
            return;
        }
        var prompt = `
You are KnightTrace, an AI coding tutor and code reviewer.

Task: ${actionType}
Language: ${language}

Code:
${codeText}

Return only valid JSON in this exact format:
{
  "title": "short title",
  "summary": "short simple summary",
  "issues": ["issue 1", "issue 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "timeComplexity": "Big O time complexity",
  "spaceComplexity": "Big O space complexity",
  "testCases": [
    {
      "input": "sample input",
      "expectedOutput": "sample output"
    }
  ],
  "correctedCode": "corrected or improved code if needed"
}
`;

        var url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        var response = await axios.post(url, {
            contents: [
                {
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ]
        });

        var aiText = response.data.candidates[0].content.parts[0].text;
        var result = JSON.parse(cleanJson(aiText));

        var sessions = getCollection("sessions");

        await sessions.insertOne({
            userId: req.user._id.toString(),
            type: "code-lab",
            title: result.title || "Code Lab Session",
            actionType: actionType,
            language: language,
            userInput: codeText,
            aiResponse: result,
            userNotes: "",
            isFavorite: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.render("code/lab", {
            title: "Knight Code Lab",
            result: result,
            error: null,
            formData: req.body
        });
    } catch (error) {
        console.error(error);

        res.render("code/lab", {
            title: "Knight Code Lab",
            result: null,
            error: "AI response failed. Try again with shorter code.",
            formData: req.body
        });
    }
});

module.exports = router;