//This is the Prompt builders. Each function returns a Gemini prompt string for its feature.
// Instructed Gemini to return strict JSON in the shape each route expects through these prompts.

// Code Lab prompt: analyze code for bugs, improvements, complexity, and test cases
function buildCodePrompt(data) {
    return `
You are KnightTrace, an AI coding tutor.

Task: ${data.actionType}
Language: ${data.language}
Code:
${data.codeText}

Return only valid JSON in this exact shape:
{
  "title": "short title",
  "summary": "2-3 sentence short summary",
  "issues": ["bug, risk, or weakness"],
  "improvements": ["specific improvement"],
  "timeComplexity": "O(?) with short reason",
  "spaceComplexity": "O(?) with short reason",
  "testCases": [{"input": "sample input", "expectedOutput": "output", "reason": "why this test matters"}],
  "correctedCode": "corrected code"
}`;
}

// Interview prompt: generates practical coding questions with hints, answers, and rubric
function buildInterviewPrompt(data) {
    return `
You are KnightTrace, an AI technical interview coach.
Generate coding implementation interview questions, not memorization questions.
Questions should feel like LeetCode / HackerRank / real coding interview tasks.
Use the requested role and topics, but prefer practical coding problems.

Target role: ${data.role}
Experience level: ${data.level}
Topics: ${data.topics}
Difficulty: ${data.difficulty}
Number of questions: ${data.count}

Return only valid JSON in this exact shape:
{
  "title": "short interview set title",
  "questions": [
    {
      "category": "topic name",
      "question": "coding task with input/output examples and clear requirements",
      "hint": "short hint without giving full solution",
      "idealAnswer": "The COMPLETE, correct, runnable code solution in ${data.role.includes('Frontend') ? 'JavaScript' : 'the most fitting language'}, written with real newlines and indentation, followed by a clear step-by-step explanation of how it works and its time/space complexity. Always include the full code, never a partial snippet.",
      "followUp": "harder follow-up question",
      "rubric": "what a good interviewer would look for"
    }
  ]
}`;
}

// Quiz prompt: generates multiple-choice questions with correct answer and explanation
function buildQuizPrompt(data) {
    return `
You are KnightTrace, an AI quiz generator for coding students.

Topic: ${data.topic}
Difficulty: ${data.difficulty}
Number of questions: ${data.count}

Return only valid JSON in this exact shape:
{
  "title": "short quiz title",
  "questions": [
    {
      "question": "question",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "correct option text",
      "explanation": "short explanation",
      "weakTopic": "small topic name tested by this question"
    }
  ]
}`;
}

module.exports = { buildCodePrompt, buildInterviewPrompt, buildQuizPrompt };
