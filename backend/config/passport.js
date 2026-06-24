// Passport config to sets up Local, Google, and GitHub strategies.
// Google/GitHub only activate if real OAuth keys are present in .env.

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const crypto = require("crypto");
const {ObjectId} = require("mongodb");
const {getCollection} = require("../models/db");

// Create a secure hashed password using password and salt.
function createPasswordHash(password, salt) {
    return crypto.scryptSync(password, salt, 64).toString("hex");
}

function verifyPassword(password, user) {
    const hashedPassword = createPasswordHash(password, user.salt);
    return hashedPassword === user.passwordHash;
}

function isRealEnvValue(value) {
    return value && !value.includes("your_") && !value.includes("_here");
}

// local strategy for login with email, password
function configurePassport() {
    passport.use(
        new LocalStrategy(
            {
                usernameField: "email",
                passwordField: "password"
            },
            async function (email, password, done) {
                try {
                    const users = getCollection("users");

                    const user = await users.findOne({
                        email: email.toLowerCase()
                    });

                    if (!user) {
                        return done(null, false, {
                            message: "No account found with this email."
                        });
                    }

                    if (!user.passwordHash || !user.salt) {
                        return done(null, false, {
                            message: "This account uses Google or GitHub login."
                        });
                    }

                    const isMatch = verifyPassword(password, user);

                    if (!isMatch) {
                        return done(null, false, {
                            message: "Incorrect password."
                        });
                    }

                    return done(null, user);
                } catch (error) {
                    return done(error);
                }
            }
        )
    );

    // enable google login only if google key exists in .env
    if (
        isRealEnvValue(process.env.GOOGLE_CLIENT_ID) &&
        isRealEnvValue(process.env.GOOGLE_CLIENT_SECRET)
    ) { //google login
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: "/auth/google/callback"
                },
                async function (accessToken, refreshToken, profile, done) {
                    try {
                        const users = getCollection("users");

                        const email =
                            profile.emails && profile.emails[0]
                                ? profile.emails[0].value.toLowerCase()
                                : "";

                        let user = await users.findOne({
                            $or: [
                                {googleId: profile.id},
                                {email: email}
                            ]
                        });

                        if (user) {
                            await users.updateOne(
                                {_id: user._id},
                                {
                                    $set: {
                                        googleId: profile.id,
                                        updatedAt: new Date()
                                    }
                                }
                            );

                            user.googleId = profile.id;
                            return done(null, user);
                        }

                        const newUser = {
                            username: profile.displayName || "Google User",
                            email: email,
                            passwordHash: null,
                            salt: null,
                            googleId: profile.id,
                            githubId: null,
                            authProvider: "google",
                            createdAt: new Date(),
                            updatedAt: new Date()
                        };

                        const result = await users.insertOne(newUser);
                        newUser._id = result.insertedId;

                        return done(null, newUser);
                    } catch (error) {
                        return done(error);
                    }
                }
            )
        );
    }

    // enable github login only if github key exists in .env
    if (
        isRealEnvValue(process.env.GITHUB_CLIENT_ID) &&
        isRealEnvValue(process.env.GITHUB_CLIENT_SECRET)
    ) {  //github login
        passport.use(
            new GitHubStrategy(
                {
                    clientID: process.env.GITHUB_CLIENT_ID,
                    clientSecret: process.env.GITHUB_CLIENT_SECRET,
                    callbackURL: "/auth/github/callback",
                    scope: ["user:email"]
                },
                async function (accessToken, refreshToken, profile, done) {
                    try {
                        const users = getCollection("users");

                        const email =
                            profile.emails && profile.emails[0]
                                ? profile.emails[0].value.toLowerCase()
                                : "";

                        let user = await users.findOne({
                            $or: [
                                {githubId: profile.id},
                                {email: email}
                            ]
                        });

                        if (user) {
                            await users.updateOne(
                                {_id: user._id},
                                {
                                    $set: {
                                        githubId: profile.id,
                                        updatedAt: new Date()
                                    }
                                }
                            );

                            user.githubId = profile.id;
                            return done(null, user);
                        }

                        const newUser = {
                            username: profile.username || profile.displayName || "GitHub User",
                            email: email,
                            passwordHash: null,
                            salt: null,
                            googleId: null,
                            githubId: profile.id,
                            authProvider: "github",
                            createdAt: new Date(),
                            updatedAt: new Date()
                        };

                        const result = await users.insertOne(newUser);
                        newUser._id = result.insertedId;

                        return done(null, newUser);
                    } catch (error) {
                        return done(error);
                    }
                }
            )
        );
    }

    passport.serializeUser(function (user, done) {
        done(null, user._id.toString());
    });

    passport.deserializeUser(async function (id, done) {
        try {
            const users = getCollection("users");

            const user = await users.findOne({
                _id: new ObjectId(id)
            });

            done(null, user);
        } catch (error) {
            done(error);
        }
    });
}

module.exports = {
    configurePassport,
    createPasswordHash
};