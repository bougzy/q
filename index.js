

const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const helmet = require('helmet');
const bcrypt = require('bcryptjs'); // Updated import statement
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

mongoose.connect('mongodb+srv://movi:movi@movi.muqtx3v.mongodb.net/movi', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

const depositSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    profitBalance: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

const Deposit = mongoose.model('Deposit', depositSchema);
const User = mongoose.model('User', userSchema);

app.use(express.json());
app.use(helmet());

const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true
};

app.use(cors(corsOptions)); // Configure CORS with options

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

app.use(
    session({
        secret: process.env.SESSION_SECRET || 'default_secret', // Use environment variable for session secret
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            maxAge: 1000 * 60 * 60 * 24 // 1 day
        }
    })
);

app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        req.session.userId = user._id;
        res.json({ message: 'Login successful' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logout successful' });
});

app.post('/api/request-password-reset', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();
        // Send token via email (skipped for brevity)
        res.json({ message: 'Password reset token sent' });
    } catch (error) {
        console.error('Error during password reset request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

app.get('/api/protected', requireAuth, (req, res) => {
    res.json({ message: 'Protected route accessed successfully' });
});

app.post('/api/deposit', requireAuth, async (req, res) => {
    const { amount } = req.body;
    try {
        const deposit = new Deposit({ userId: req.session.userId, amount });
        await deposit.save();
        
        // Fetch the latest deposit info
        const latestDeposit = await Deposit.findOne({ userId: req.session.userId }).sort({ timestamp: -1 });
        if (latestDeposit) {
            const secondsPassed = Math.floor((Date.now() - latestDeposit.timestamp) / 1000);
            const profitEarned = latestDeposit.amount * (Math.pow(1.3, secondsPassed / (24 * 60 * 60)) - 1);
            const profitBalance = latestDeposit.profitBalance + profitEarned;
            res.status(201).json({ message: 'Deposit saved successfully', amount: latestDeposit.amount, profitBalance });
        } else {
            res.status(201).json({ message: 'Deposit saved successfully', amount: 0, profitBalance: 0 });
        }
    } catch (error) {
        console.error('Error during deposit:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/deposit', requireAuth, async (req, res) => {
    try {
        const latestDeposit = await Deposit.findOne({ userId: req.session.userId }).sort({ timestamp: -1 });
        if (latestDeposit) {
            const secondsPassed = Math.floor((Date.now() - latestDeposit.timestamp) / 1000);
            const profitEarned = latestDeposit.amount * (Math.pow(1.3, secondsPassed / (24 * 60 * 60)) - 1);
            const profitBalance = latestDeposit.profitBalance + profitEarned;
            res.json({ amount: latestDeposit.amount, profitBalance });
        } else {
            res.json({ amount: 0, profitBalance: 0 });
        }
    } catch (error) {
        console.error('Error fetching deposit:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to get user information if authenticated
app.get('/api/user', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId, 'username email');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
