// Gemini AI client, askGemini(prompt) sends a prompt and returns parsed JSON.
// Retries transient errors (overload/rate limit) and gives clear messages on failure.

var axios = require("axios");

// Strip markdown code fences so we can JSON.parse the model's reply
function cleanJson(text) {
    return String(text || "").replace(/```json/gi, "").replace(/```/g, "").trim();
}

function parseGeminiJson(text) {
    try {
        return JSON.parse(cleanJson(text));
    } catch (error) {
        throw new Error("Gemini returned a response, but it was not valid JSON. Please try again.");
    }
}

function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

/* Send a prompt to Gemini and return parsed JSON. Retries up to 3 times on
 transient errors (429 rate limit, 500/503 overload, or network drop). */
async function askGemini(prompt) {
    var apiKey = process.env.GEMINI_API_KEY;
    var model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!apiKey || apiKey.includes("your_")) {
        throw new Error("Gemini API key is missing. Add GEMINI_API_KEY to your .env file.");
    }

    var url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;
    var body = {
        contents: [{ parts: [{ text: prompt }] }],
        // maxOutputTokens keeps large answers from being cut off or breaking JSON)
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8192 }
    };

    var lastError;
    for (var attempt = 1; attempt <= 3; attempt++) {
        try {
            var response = await axios.post(url, body, { timeout: 40000 });

            var candidate = response.data.candidates && response.data.candidates[0];
            var parts = candidate && candidate.content && candidate.content.parts;
            if (!parts || !parts[0] || !parts[0].text) {
                throw new Error("Gemini returned an empty response. Please try again.");
            }
            return parseGeminiJson(parts[0].text);
        } catch (error) {
            lastError = error;
            var status = error.response && error.response.status;

            // Retry transient errors with a short backoff, then give up
            var isTransient = !error.response || status === 429 || status === 500 || status === 503;
            if (isTransient && attempt < 3) {
                await wait(1500 * attempt);
                continue;
            }

            // If final attempt failed, throw a clear message
            if (status === 429) throw new Error("Gemini is busy (free-tier limit reached). Please wait a minute and try again.");
            if (status === 503 || status === 500) throw new Error("Gemini is temporarily overloaded. Please try again in a moment.");
            if (status === 400) throw new Error("Gemini rejected the request. Try shorter input or a different prompt.");
            if (status === 403) throw new Error("Gemini API key is invalid or not authorized.");
            if (error.message) throw error;
            throw new Error("Gemini request failed. Please try again.");
        }
    }
    throw lastError || new Error("Gemini request failed. Please try again.");
}

module.exports = { askGemini };
