// Made this seperate file because static dropdown options used across Code Lab, Interview, and Quiz forms.
var languages = [
    "JavaScript", "TypeScript", "Python", "Java", "C", "C++", "C#",
    "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin", "SQL", "Bash",
    "HTML/CSS", "Node.js", "Express.js", "MongoDB"
];

var roles = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Software Engineer Intern",
    "Data Analyst",
    "DevOps Engineer"
];

var topics = [
    "JavaScript", "TypeScript", "HTML", "CSS", "DOM", "REST APIs",
    "Node.js", "Express.js", "MongoDB", "Authentication", "Sessions",
    "SQL", "Algorithms", "Data Structures", "Git", "Deployment",
    "Docker", "CI/CD", "AWS", "System Design"
];

var difficulties = ["Easy", "Medium", "Hard"];
var counts = [3, 5, 10];

module.exports = {languages, roles, topics, difficulties, counts};