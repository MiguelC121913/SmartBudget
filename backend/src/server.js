require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to database
connectDB();

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'SmartBudget API is running' });
});

// Routes (will be added later)
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/transactions', require('./routes/transactions'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});