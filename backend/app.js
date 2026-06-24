// This is for Express app setup
// Sets up middleware, session, passport, and routes.
require("dotenv").config();

// Check log unexpected async errors instead of letting them crash the server
process.on("unhandledRejection", function (reason) { console.error("Unhandled promise rejection:", reason); });
process.on("uncaughtException", function (error) { console.error("Uncaught exception:", error); });

var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session = require("express-session");
var passport = require("passport");
var helmet = require("helmet");   // Adding for safer HTTP security headers.

var MongoStore = require("connect-mongo");
MongoStore = MongoStore.default || MongoStore;

var { connectToDB } = require("./models/db");
var { configurePassport } = require("./config/passport");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var authRouter = require("./routes/auth");
var codeRouter = require("./routes/code");
var interviewsRouter = require("./routes/interviews");
var quizzesRouter = require("./routes/quizzes");
var sessionsRouter = require("./routes/sessions");

var app = express();

// Connect MongoDB first
(async function () {
  try {
    await connectToDB();
    console.log("Database initialized");
  } catch (error) {
    console.error("Failed to start database:", error);
  }
})();

// Passport strategies setup
configurePassport();

// view engine setup
app.set("views", path.join(__dirname, "../frontend/views"));
app.set("view engine", "ejs");
app.set("trust proxy", 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(logger("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../frontend/public")));

// Session setup
var sessionOptions = {
  secret: process.env.SESSION_SECRET || "knighttrace_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24
  }
};

if (process.env.MONGO_URI && !process.env.MONGO_URI.includes("your_")) {
  sessionOptions.store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    dbName: process.env.DB_NAME || "knighttrace",
    collectionName: "loginSessions"
  });
}

app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());

// make these variables available in every EJS page
app.use(function (req, res, next) {
  res.locals.currentUser = req.user || null;
  res.locals.isLoggedIn = req.isAuthenticated ? req.isAuthenticated() : false;
  res.locals.currentPath = req.path || "";
  next();
});

// Routers
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/auth", authRouter);
app.use("/code", codeRouter);
app.use("/interviews", interviewsRouter);
app.use("/quizzes", quizzesRouter);
app.use("/sessions", sessionsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.locals.currentUser = res.locals.currentUser || null;
  res.locals.isLoggedIn = res.locals.isLoggedIn || false;
  res.locals.currentPath = res.locals.currentPath || req.path || "";

  res.status(err.status || 500);
  res.render("error", { title: "Error" });
});

module.exports = app;
