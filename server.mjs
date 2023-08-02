import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import { config } from "dotenv";
config();

const app = express();
const PORT = process.env.PORT || 3000;

// app.use(cors());
const allowedOrigins = ['https://smitproducts.netlify.app', 'https://example.com'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));
app.use(express.json());

// URI
const mongodbURI = process.env.DB_URL;

let DB;

async function connectToDatabase() {
  try {
    const client = await MongoClient.connect(mongodbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    DB = client.db();
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.log("Failed to connect to MongoDB:", error);
    process.exit(1); // Exit the application if the connection fails
  }
}

// Call the connectToDatabase function to establish the MongoDB connection
connectToDatabase();

// handle errors
function handleError(res, status, message) {
  res.status(status).json({ error: message });
}

// Middleware to check if the database connection is established
// app.use((req, res, next) => {
//   if (!db) {
//     // If the database connection is not established, return an error response
//     return handleError(res, 500, "Database connection is not ready");
//   }
//   next();
// });

// Create a product
app.post("/postProduct", async (req, res) => {
  console.log("Product created function");
  try {
    const { name, description, price } = req.body;
    // console.log(req.body)
    // if else
    if (!name || name.trim() === "") {
      return handleError(res, 400, "Product name is required");
    }

    if (!price || price < 0) {
      return handleError(res, 400, "Product price must be a positive number");
    }

    const product = { name, description, price };
    console.log(product);

    const result = await DB.collection("test").insertOne(product);
    const savedProduct = result.insertedId;

    res.status(201).json(savedProduct);
  } catch (error) {
    console.error(error);
    handleError(res, 500, "Failed to create product");
  }
});

// Get all products
app.get("/check", async (req, res) => {
  console.log("Get all products");
  try {
    const products = await DB.collection("test").find({}).toArray();
    console.log(products);
    res.json(products);
  } catch (error) {
    console.log(error.message);
    handleError(res, 500, "Failed to get products");
  }
});

// Update product by ID
app.put("/api/products/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, description, price } = req.body;

    // Validation
    if (!name || name.trim() === "") {
      return handleError(res, 400, "Product name is required");
    }

    if (!price || price < 0) {
      return handleError(res, 400, "Product price must be a positive number");
    }

    const updatedProduct = { name, description, price };
    const result = await DB
      .collection("test")
      .updateOne({ _id: new ObjectId(productId) }, { $set: updatedProduct });

    if (result.modifiedCount === 0) {
      return handleError(res, 404, "Product not found");
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error(error);
    handleError(res, 500, "Failed to update product");
  }
});

// Delete a product by ID
app.delete("/api/products/:id", async (req, res) => {
  console.log("Delete Product function called");
  try {
    const productId = req.params.id;
    const result = await DB
      .collection("test")
      .deleteOne({ _id: new ObjectId(productId) });

    if (result.deletedCount === 0) {
      return handleError(res, 404, "Product not found");
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    handleError(res, 500, "Failed to delete product");
  }
});

app.get("/", async (req, res) => {
  res.send("Server is running");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});