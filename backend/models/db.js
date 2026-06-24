// MongoDB connection to call connectToDB() on startup, then use getCollection(name) anywhere when needed.

const { MongoClient } = require("mongodb");

let client;
let db;

async function connectToDB() {
    try {
        if (db) { return db; }

        const uri = process.env.MONGO_URI;
        const dbName = process.env.DB_NAME || "knighttrace";

        if (!uri) { throw new Error("MONGO_URI is missing from .env file"); }

        client = new MongoClient(uri);
        await client.connect();
        db = client.db(dbName);
        console.log(`Connected to MongoDB database: ${dbName}`);
        return db;
    } catch (error) {
        console.error("MongoDB connection error:", error);
        throw error;
    }
}

function getDB() {
    if (!db) { throw new Error("Database not connected yet"); }
    return db;
}

function getCollection(collectionName) {
    return getDB().collection(collectionName);
}

module.exports = {
    connectToDB,
    getDB,
    getCollection
};