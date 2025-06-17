


const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


// MongoDB URI and client
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v23il5n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// const uri = "mongodb+srv://myAssignment11Server:MCeeaoqmyKjDyH54@cluster0.v23il5n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



async function run() {
  try {
    // await client.connect(); // Uncomment this in production if needed
    console.log(" MongoDB Connected");

    const foodCollection = client.db("foodTrackerDB").collection("foods");

    //  Add new food
    app.post('/foods', async (req, res) => {
      try {
        const food = req.body;
        if (!food || !food.title || !food.userEmail) {
          return res.status(400).send({ success: false, message: "Missing required food data or userEmail" });
        }

        if (food.expiryDate) {
          food.expiryDate = new Date(food.expiryDate);
        }

        const result = await foodCollection.insertOne(food);
        res.status(201).send({ success: true, message: "Food added", insertedId: result.insertedId });
      } catch (error) {
        console.error('Error adding food:', error);
        res.status(500).send({ success: false, message: "Failed to add food" });
      }
    });
