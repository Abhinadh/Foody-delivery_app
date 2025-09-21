const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Database Connection
// mongoose.connect('mongodb://127.0.0.1:27017/foody', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// });
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Import Routes

app.use('/api/auth', require('./routes/authRoutes'));
// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
