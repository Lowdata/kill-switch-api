const express = require("express");
const swaggerJsDoc = require("swagger-jsdoc");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Define the schema and model for app status
const appStatusSchema = new mongoose.Schema({
  status: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
});
appStatusSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const AppStatus = mongoose.model("AppStatus", appStatusSchema);



// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Kill Switch API",
      version: "1.0.0",
      description: "API for controlling app availability remotely",
    },
    servers: [
      {
        url: process.env.BASE_URL || `http://localhost:${port}`,
      },
    ],
  },
  apis: ["./app.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /api/check-app-status:
 *   get:
 *     summary: Get the current status of the app
 *     description: Returns whether the app is active or disabled.
 *     responses:
 *       200:
 *         description: App status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 */
app.get("/api/check-app-status", async (req, res) => {
  try {
    const appStatusDoc = await AppStatus.findOne();
    const status = appStatusDoc ? appStatusDoc.status : false;
    res.json({ status });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch app status" });
  }
});

/**
 * @swagger
 * /api/toggle-app-status:
 *   post:
 *     summary: Toggle the app status
 *     description: Switches the app between active and disabled state.
 *     parameters:
 *       - name: apiKey
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: App status changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 newStatus:
 *                   type: boolean
 *       403:
 *         description: Forbidden. Invalid API key.
 */
app.post("/api/toggle-app-status", async (req, res) => {
  const { apiKey } = req.query;
  const correctApiKey = process.env.API_KEY;

  if (apiKey === process.env.API_KEY) {
    try {
      let appStatusDoc = await AppStatus.findOne();
      if (!appStatusDoc) {
        appStatusDoc = new AppStatus();
      }

      // Toggle the status
      appStatusDoc.status = !appStatusDoc.status;

      // Save and log the result for debugging
      const result = await appStatusDoc.save();
      console.log("Document saved successfully:", result); // Log the result

      // Send the new status in the response
      res.json({ newStatus: appStatusDoc.status });
    } catch (error) {
      console.error("Error saving document:", error.message); // Log the error message
      console.error("Full error details:", error); // Log the full error object for more details
      res
        .status(500)
        .json({ error: "Failed to toggle app status", details: error.message });
    }
  } else {
    res.status(403).json({ error: "Invalid API Key" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Kill Switch API is running on http://localhost:${port}`);
});
