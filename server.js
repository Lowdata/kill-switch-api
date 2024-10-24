const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors()); // Allow cross-origin requests

// Path to store the app status
const statusFilePath = path.join(__dirname, "appStatus.json");

// Function to get the app status from the file
const getAppStatus = () => {
  const rawData = fs.readFileSync(statusFilePath);
  const status = JSON.parse(rawData);
  return status.renderApp;
};

// Function to update the app status
const updateAppStatus = (newStatus) => {
  const status = { renderApp: newStatus };
  fs.writeFileSync(statusFilePath, JSON.stringify(status, null, 2));
};

// Route to check app status
app.get("/api/check-app-status", (req, res) => {
  try {
    const renderApp = getAppStatus();
    res.json({ renderApp });
  } catch (error) {
    res.status(500).json({ error: "Error reading app status" });
  }
});

// Route to toggle app status (secured with API key)
app.post("/api/toggle-app-status", (req, res) => {
  const apiKey = req.query.apiKey; // Pass your API key as a query param (e.g., ?apiKey=YOUR_KEY)

  // Secure the endpoint with a basic API key
  const expectedApiKey = "admin"; // Replace with your own secret API key

  if (apiKey !== expectedApiKey) {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  try {
    const currentStatus = getAppStatus();
    const newStatus = !currentStatus; // Toggle the status
    updateAppStatus(newStatus);

    res.json({ renderApp: newStatus, message: `App status updated to ${newStatus}` });
  } catch (error) {
    res.status(500).json({ error: "Error updating app status" });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
