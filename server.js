const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const JWT_SECRET = '0Ra5DS9Yty3JG9UMC9h1GMCVvhcQVoBnWE9mv9BK';

// ── MONGODB CONNECTION ──
// Replace <db_password> with your actual password from MongoDB Atlas
const MONGO_URI = 'mongodb+srv://kartheekkala2_db_user:<db_password>@cluster0.vcclwow.mongodb.net/ZeroHunger?appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ── DATA MODELS ──

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['donor', 'volunteer', 'restaurant', 'public'], default: 'donor' },
  createdAt: { type: Date, default: Date.now }
});

const DonationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  donorName: String,
  foodType: String,
  quantity: Number,
  location: String,
  lat: Number,
  lng: Number,
  phone: String,
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const PickupRequestSchema = new mongoose.Schema({
  donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation' },
  status: { type: String, default: 'Requested' },
  pickupLocation: String,
  assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Donation = mongoose.model('Donation', DonationSchema);
const PickupRequest = mongoose.model('PickupRequest', PickupRequestSchema);

// ── AUTHENTICATION MIDDLEWARE ──
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ── API ENDPOINTS ──

// Register
app.post('/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const hash = bcrypt.hashSync(password, 10);
    const newUser = new User({ name, email, password: hash, role });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: newUser._id, name: newUser.name, role: newUser.role } });
  } catch (err) {
    res.status(500).json({ error: 'Error during registration' });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Error during login' });
  }
});

// Create Donation
app.post('/donation/create', authenticate, async (req, res) => {
  const { food_type, quantity, location, lat, lng, phone } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const newDonation = new Donation({
      userId: req.user.id,
      donorName: user.name,
      foodType: food_type,
      quantity: parseInt(quantity),
      location,
      lat,
      lng,
      phone
    });
    await newDonation.save();

    const newPickup = new PickupRequest({
      donationId: newDonation._id,
      pickupLocation: location
    });
    await newPickup.save();

    res.json({ message: 'Donation saved to MongoDB', id: newDonation._id });
  } catch (err) {
    res.status(500).json({ error: 'Error creating donation' });
  }
});

// Get User Donations
app.get('/donations', authenticate, async (req, res) => {
  try {
    const history = await Donation.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching history' });
  }
});

// Dashboard Stats
app.get('/dashboard/stats', async (req, res) => {
  try {
    const totalDonations = await Donation.aggregate([
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);
    const mealsDonated = totalDonations.length > 0 ? totalDonations[0].total : 0;
    
    const activeVolunteers = await User.countDocuments({ role: 'volunteer' });
    const runningPickups = await PickupRequest.countDocuments({ status: 'Accepted' });

    res.json({
      metrics: {
        mealsDonated: mealsDonated,
        activeVolunteers: activeVolunteers,
        runningPickups: runningPickups,
        savedToday: Math.round(mealsDonated / 10)
      },
      mapData: [
        { lat: 28.61, lng: 77.21, label: 'Cloud Hub', type: 'food' }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: 'Error generating stats' });
  }
});

// Volunteer Nearby Tasks
app.get('/volunteers/nearby', authenticate, async (req, res) => {
  try {
    const requests = await PickupRequest.find({ status: 'Requested' }).populate('donationId');
    const formatted = requests.map(r => ({
      request_id: r._id,
      donor_name: r.donationId.donorName,
      food_type: r.donationId.foodType,
      quantity: r.donationId.quantity,
      location: r.pickupLocation,
      distance: (Math.random() * 5).toFixed(1) // Placeholder distance logic
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching tasks' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Zero Hunger MongoDB Backend running on port ${PORT}`);
});
