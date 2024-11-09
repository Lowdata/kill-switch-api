const express = require('express');
const swaggerJsDoc = require('swagger-jsdoc');
const cors = require('cors'); 
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

let appStatus = false; // The initial state of the app

app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Kill Switch API',
      version: '1.0.0',
      description: 'API for controlling app availability remotely',
    },
    servers: [
      {
        url: process.env.BASE_URL || `http://localhost:${port}`,
      },
    ],
  },
  apis: ['./app.js'], // Location of API documentation
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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
app.get('/api/check-app-status', (req, res) => {
  res.json({ status: appStatus });
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
app.post('/api/toggle-app-status', (req, res) => {
  const { apiKey } = req.query;
  const correctApiKey = process.env.API_KEY;

  if (apiKey === correctApiKey) {
    appStatus = !appStatus;
    res.json({ newStatus: appStatus });
  } else {
    res.status(403).json({ error: 'Invalid API Key' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Kill Switch API is running on http://localhost:${port}`);
});
