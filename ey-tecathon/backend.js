// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Schema Definitions
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  location: String,
  income: Number,
  familySize: Number
});

const schemeSchema = new mongoose.Schema({
  name: String,
  description: String,
  eligibilityCriteria: {
    maxIncome: Number,
    minAge: Number,
    maxAge: Number,
    location: [String]
  },
  requiredDocuments: [String],
  benefits: String
});

const applicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  schemeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scheme' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  documents: [{
    name: String,
    url: String,
    verified: { type: Boolean, default: false }
  }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Scheme = mongoose.model('Scheme', schemeSchema);
const Application = mongoose.model('Application', applicationSchema);

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, location, income, familySize } = req.body;
    const user = new User({ name, email, password, location, income, familySize });
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, 'your-secret-key');
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id }, 'your-secret-key');
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/schemes', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const schemes = await Scheme.find({
      'eligibilityCriteria.maxIncome': { $gte: user.income },
      'eligibilityCriteria.location': user.location
    });
    res.json(schemes);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/applications', authenticateToken, async (req, res) => {
  try {
    const { schemeId, documents } = req.body;
    const application = new Application({
      userId: req.user.userId,
      schemeId,
      documents
    });
    await application.save();
    res.json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/applications', authenticateToken, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.userId })
      .populate('schemeId');
    res.json(applications);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});