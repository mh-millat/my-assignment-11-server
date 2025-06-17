


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

    


    app.get('/foods', async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res.status(400).send({ success: false, message: "Email query parameter required" });
        }

        const foods = await foodCollection.find({ userEmail: email }).toArray();
        res.send(foods);
      } catch (error) {
        console.error('Error fetching foods:', error);
        res.status(500).send({ success: false, message: "Failed to fetch foods" });
      }
    });


    app.get('/foods/expired-public', async (req, res) => {
      try {
        const now = new Date();

        const expiredItems = await foodCollection.find({
          expiryDate: { $lt: now }
        }).toArray();

        res.send(expiredItems);
      } catch (error) {
        console.error("Error fetching public expired foods:", error);
        res.status(500).send({ success: false, message: "Failed to fetch expired foods" });
      }
    });

    

    app.get('/foods/all', async (req, res) => {
      try {
        const now = new Date();
        const fiveDaysLater = new Date();
        fiveDaysLater.setDate(now.getDate() + 5);

        const filtered = await foodCollection.find({
          expiryDate: { $lte: fiveDaysLater }
        }).toArray();

        res.send(filtered);
      } catch (error) {
        console.error("Error fetching all foods:", error);
        res.status(500).send({ success: false, message: "Failed to fetch public expiring foods" });
      }
    });


    app.get('/foods/:id', async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ success: false, message: "Invalid food ID" });
        }

        const food = await foodCollection.findOne({ _id: new ObjectId(id) });
        if (!food) {
          return res.status(404).send({ success: false, message: "Food not found" });
        }

        res.send(food);
      } catch (error) {
        console.error('Error fetching food details:', error);
        res.status(500).send({ success: false, message: "Failed to fetch food details" });
      }
    });


    app.get('/fridge', async (req, res) => {
      try {
        const fridgeFoods = await foodCollection.find({ storage: "Fridge" }).toArray();
        res.send(fridgeFoods);
      } catch (error) {
        console.error('Error fetching fridge foods:', error);
        res.status(500).send({ success: false, message: "Failed to fetch fridge foods" });
      }
    });

    
    app.delete('/foods/:id', async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ success: false, message: "Invalid ID" });
        }

        const result = await foodCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount > 0) {
          res.send({ success: true, message: "Food deleted" });
        } else {
          res.status(404).send({ success: false, message: "Food not found" });
        }
      } catch (error) {
        console.error('Error deleting food:', error);
        res.status(500).send({ success: false, message: "Failed to delete food" });
      }
    });


    app.get('/top-foods', async (req, res) => {
      try {
        const topFoods = await foodCollection
          .find({})
          .sort({ quantity: -1 })
          .limit(10) 
          .toArray();

        res.json(topFoods);
      } catch (error) {
        console.error('Error fetching top foods:', error);
        res.status(500).json({ message: 'Failed to fetch top foods' });
      }
    });



    app.put('/foods/:id', async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ success: false, message: "Invalid ID" });
        }

        const updatedData = req.body;
        if (!updatedData || Object.keys(updatedData).length === 0) {
          return res.status(400).send({ success: false, message: "No data to update" });
        }

        if (updatedData.expiryDate) {
          updatedData.expiryDate = new Date(updatedData.expiryDate);
        }

        const updateFields = {};
        ['title', 'quantity', 'category', 'expiryDate', 'description', 'storage'].forEach(field => {
          if (updatedData[field] !== undefined) updateFields[field] = updatedData[field];
        });

        if (Object.keys(updateFields).length === 0) {
          return res.status(400).send({ success: false, message: "No valid fields to update" });
        }

        const updateDoc = { $set: updateFields };

        const result = await foodCollection.updateOne(
          { _id: new ObjectId(id) },
          updateDoc
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ success: false, message: "Food not found" });
        }

        res.send({ success: true, message: "Food updated", modifiedCount: result.modifiedCount });
      } catch (error) {
        console.error('Error updating food:', error);
        res.status(500).send({ success: false, message: "Failed to update food" });
      }
    });

  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

run().catch(console.dir);


app.get('/', (req, res) => {
  res.send(' Food Expiry Tracker Server is Running');
});


app.listen(port, () => {
  console.log(` Server running on port ${port}`);
});


process.on('SIGINT', async () => {
  await client.close();
  console.log(' MongoDB connection closed');
  process.exit(0);
});

