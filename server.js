require('dotenv').config(); // Load environment variables
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const crypto = require("crypto");
const bodyParser = require("body-parser");

const app = express();
app.use(express.static("public")); // Serve static files
app.set("view engine", "ejs"); // Set EJS as templating engine
app.use(bodyParser.urlencoded({ extended: true }));

const algorithm = "aes-256-cbc";
const key = crypto.scryptSync("mongodb-encrypt-decrypt", "salt", 32);
const mongoURL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017"; // MongoDB URL
const dbName = "encrypt_decrypt_string";
let db;

// MongoDB Connection
async function connectToMongoDB() {
    try {
        const client = await MongoClient.connect(mongoURL);
        console.log("✅ Connected to MongoDB");
        db = client.db(dbName);

        // Homepage: Show encrypted & decrypted data
        app.get("/", async (req, res) => {
            try {
                const data = await db.collection("strings").find({}).sort({ _id: -1 }).toArray();

                // Decrypt messages before rendering
                const decryptedData = data.map((item) => {
                    try {
                        const iv = Buffer.from(item.iv, "base64");
                        const decipher = crypto.createDecipheriv(algorithm, key, iv);
                        let decrypted = decipher.update(item.encrypted, "hex", "utf8");
                        decrypted += decipher.final("utf8");
                        return { ...item, decrypted };
                    } catch (error) {
                        return { ...item, decrypted: "Decryption Failed" };
                    }
                });

                res.render("index", { data: decryptedData });
            } catch (error) {
                console.error("❌ Error fetching data:", error);
                res.status(500).send("Error fetching data");
            }
        });

        // Encrypt and Store Data
        app.post("/encrypt", async (req, res) => {
            try {
                const message = req.body.message;
                const iv = crypto.randomBytes(16);
                const cipher = crypto.createCipheriv(algorithm, key, iv);
                let encrypted = cipher.update(message, "utf8", "hex");
                encrypted += cipher.final("hex");

                const base64IV = iv.toString("base64");
                await db.collection("strings").insertOne({ iv: base64IV, encrypted });

                res.redirect("/"); // Redirect to home after inserting
            } catch (error) {
                console.error("❌ Error encrypting message:", error);
                res.status(500).send("Encryption failed");
            }
        });

        // Start Server
        app.listen(3000, () => {
            console.log("🚀 Server running at http://localhost:3000");
        });
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    }
}

connectToMongoDB();
