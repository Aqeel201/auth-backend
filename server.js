require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'your_secure_secret_key_here';

// MongoDB Connection URI
const uri = process.env.MONGO_URI || "mongodb+srv://teammediapp:Aqee201@mediapp.hbuyqtw.mongodb.net/mediApp?retryWrites=true&w=majority&appName=MediApp";

// Middleware Setup
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup with Cloudinary storage for profile image uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mediapp/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});
const upload = multer({ storage });

// Email Transporter Setup
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: true,
  debug: true,
});

// Verify Nodemailer configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Nodemailer configuration error:', error);
  } else {
    console.log('Nodemailer is ready to send emails');
  }
});

// MongoDB Connection
async function connectDB() {
  try {
    await mongoose.connect(uri, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      },
      connectTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
    });
    console.log('Successfully connected to MongoDB via Mongoose!');
    await mongoose.connection.db.command({ ping: 1 });
    console.log('Pinged MongoDB deployment successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message, error.stack);
    process.exit(1);
  }
}

// User Schema
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: uuidv4 },
  firstName: { type: String, required: true },
  lastName: { type: String, default: '' },
  CNICNo: { type: String, default: '' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: { type: String, default: null },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  dob: { type: String, default: '' },
  verified: { type: Boolean, default: false },
});
const User = mongoose.model('User', userSchema);

// Feedback Schema
const FeedbackSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userProfileImage: { type: String, default: '' }, // Store profile image URL
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const Feedback = mongoose.model('Feedback', FeedbackSchema);

// TempUser Schema
const tempUserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: uuidv4 },
  firstName: { type: String },
  lastName: { type: String, default: '' },
  CNICNo: { type: String, default: '' },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  profileImage: { type: String, default: null },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now },
  otp: { type: String, required: true },
  otpExpiry: { type: Date, required: true },
  otpAttempts: { type: Number, default: 0 },
  purpose: { type: String, required: true, enum: ['signup', 'password-reset'] },
});
const TempUser = mongoose.model('TempUser', tempUserSchema);

// Authentication Middleware
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Authorization required' });
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findOne({ email: decoded.email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token', error: err.message });
  }
};

// Admin Middleware
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Email Template for OTP
const generateOTPEmail = (otp, purpose, email) => {
  const isPasswordReset = purpose === 'password-reset';
  const subject = isPasswordReset ? 'Password Reset OTP for MediApp' : 'Verify Your Email for MediApp';
  const text = `
Dear User,

Thank you for choosing MediApp! ${isPasswordReset ? 'You have requested to reset your password.' : 'You are one step away from completing your registration with MediApp.'} Please use the following One-Time Password (OTP) to ${isPasswordReset ? 'reset your password' : 'verify your email address'}:

Your OTP Code: ${otp}

This OTP is valid for 5 minutes only. For your security, please do not share this code with anyone.

Instructions:
1. Return to the MediApp ${isPasswordReset ? 'password reset' : 'signup'} screen.
2. Enter the OTP code provided above.
3. ${isPasswordReset ? 'Set your new password and confirm it.' : 'Complete the verification process to activate your account.'}

If you did not request this OTP, please ignore this email or contact our support team at support@mediapp.com.

Thank you for being a part of MediApp. We’re excited to have you on board!

Best regards,
The MediApp Team
support@mediapp.com
`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background-color: #0d6efd; padding: 20px; text-align: center; }
    .header img { max-width: 120px; height: auto; }
    .header h1 { color: #ffffff; font-size: 24px; margin: 10px 0 0; }
    .content { padding: 20px; color: #333333; }
    .content h2 { font-size: 20px; color: #0d6efd; }
    .otp-box { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; color: #0d6efd; border-radius: 5px; margin: 20px 0; }
    .instructions { margin: 20px 0; }
    .instructions li { margin-bottom: 10px; }
    .warning { color: #d9534f; font-weight: bold; margin: 15px 0; }
    .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 14px; color: #666666; }
    .footer a { color: #0d6efd; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .container { margin: 10px; }
      .header h1 { font-size: 20px; }
      .otp-box { font-size: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dl02sjido/image/upload/v1753366984/Logo_shim8v.png?text=MediApp+Logo" alt="MediApp Logo" style="max-width: 120px; height: auto;" />
      <h1>${isPasswordReset ? 'Password Reset Request' : 'Welcome to MediApp'}</h1>
    </div>
    <div class="content">
      <h2>Hello,</h2>
      <p>
        Thank you for choosing MediApp! ${isPasswordReset ? 'You have requested to reset your password.' : 'You are one step away from completing your registration.'} 
        Please use the following One-Time Password (OTP) to ${isPasswordReset ? 'reset your password' : 'verify your email address'}:
      </p>
      <div class="otp-box">${otp}</div>
      <p>This OTP is valid for <strong>5 minutes</strong>. For your security, please do not share this code with anyone.</p>
      <div class="instructions">
        <h3>Instructions:</h3>
        <ul>
          <li>Return to the MediApp ${isPasswordReset ? 'password reset' : 'signup'} screen.</li>
          <li>Enter the OTP code provided above.</li>
          <li>${isPasswordReset ? 'Set your new password and confirm it.' : 'Complete the verification process to activate your account.'}</li>
        </ul>
      </div>
      <p class="warning">
        If you did not request this OTP, please ignore this email or contact our support team at <a href="mailto:support@mediapp.com">support@mediapp.com</a>.
      </p>
    </div>
    <div class="footer">
      <p>Thank you for being a part of MediApp. We’re excited to have you on board!</p>
      <p>Best regards,<br>The MediApp Team<br><a href="mailto:support@mediapp.com">support@mediapp.com</a></p>
    </div>
  </div>
</body>
</html>
`;

  return { subject, text, html };
};

// Cleanup expired temporary users
setInterval(async () => {
  try {
    const deleted = await TempUser.deleteMany({ otpExpiry: { $lt: Date.now() } });
    if (deleted.deletedCount > 0) {
      console.log(`Cleaned up ${deleted.deletedCount} expired temporary users`);
    }
  } catch (err) {
    console.error('Error cleaning up temporary users:', err.message);
  }
}, 10 * 60 * 1000);

// Routes
app.get('/api/test-email', async (req, res) => {
  try {
    await transporter.sendMail({
      from: `"MediApp" <${process.env.EMAIL_USER}>`,
      to: 'aqeelah3076@gmail.com',
      subject: 'Test Email from MediApp',
      text: 'This is a test email to verify Nodemailer configuration.',
    });
    res.json({ message: 'Test email sent' });
  } catch (err) {
    console.error('Test email error:', err);
    res.status(500).json({ message: 'Failed to send test email', error: err.message });
  }
});

app.post('/api/auth/request-password-reset', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    let tempUser = await TempUser.findOne({ email: email.toLowerCase(), purpose: 'password-reset' });
    if (tempUser && tempUser.otpAttempts >= 3) {
      return res.status(429).json({ message: 'Max OTP attempts reached' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    tempUser = await TempUser.findOneAndUpdate(
      { email: email.toLowerCase(), purpose: 'password-reset' },
      { email: email.toLowerCase(), otp: hashedOtp, otpExpiry, purpose: 'password-reset', $inc: { otpAttempts: 1 } },
      { upsert: true, new: true }
    );

    console.log('Sending password reset OTP to:', email, 'OTP:', otp);
    const { subject, text, html } = generateOTPEmail(otp, 'password-reset', email);
    await transporter.sendMail({
      from: `"MediApp" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text,
      html,
    });

    res.json({ message: 'Password reset OTP sent' });
  } catch (err) {
    console.error('Failed to send password reset OTP:', err);
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'Email, OTP, and new password are required' });
  }

  try {
    const tempUser = await TempUser.findOne({ email: email.toLowerCase(), purpose: 'password-reset' });
    if (!tempUser) return res.status(400).json({ message: 'No password reset request found' });
    if (tempUser.otpExpiry < Date.now()) {
      await TempUser.deleteOne({ email: email.toLowerCase(), purpose: 'password-reset' });
      return res.status(400).json({ message: 'OTP expired' });
    }

    const isValidOtp = await bcrypt.compare(otp, tempUser.otp);
    if (!isValidOtp) return res.status(400).json({ message: 'Invalid OTP' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    console.log('Updating password for:', email);
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    await TempUser.deleteOne({ email: email.toLowerCase(), purpose: 'password-reset' });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ message: 'Password reset failed', error: err.message });
  }
});

app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    let tempUser = await TempUser.findOne({ email: email.toLowerCase(), purpose: 'signup' });
    if (tempUser && tempUser.otpAttempts >= 3) {
      return res.status(429).json({ message: 'Max OTP attempts reached' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    tempUser = await TempUser.findOneAndUpdate(
      { email: email.toLowerCase(), purpose: 'signup' },
      { email: email.toLowerCase(), otp: hashedOtp, otpExpiry, purpose: 'signup', $inc: { otpAttempts: 1 } },
      { upsert: true, new: true }
    );

    console.log('Sending signup OTP to:', email, 'OTP:', otp);
    const { subject, text, html } = generateOTPEmail(otp, 'signup', email);
    await transporter.sendMail({
      from: `"MediApp" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text,
      html,
    });

    res.json({ message: 'OTP sent' });
  } catch (err) {
    console.error('Failed to send OTP:', err);
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

  try {
    const tempUser = await TempUser.findOne({ email: email.toLowerCase(), purpose: 'signup' });
    if (!tempUser) return res.status(400).json({ message: 'Email not found' });
    if (tempUser.otpExpiry < Date.now()) {
      await TempUser.deleteOne({ email: email.toLowerCase(), purpose: 'signup' });
      return res.status(400).json({ message: 'OTP expired' });
    }

    const isValidOtp = await bcrypt.compare(otp, tempUser.otp);
    if (!isValidOtp) return res.status(400).json({ message: 'Invalid OTP' });

    console.log('Moving user from TempUser to User:', tempUser.email);
    const newUser = new User({
      id: tempUser.id,
      firstName: tempUser.firstName,
      lastName: tempUser.lastName,
      CNICNo: tempUser.CNICNo,
      email: tempUser.email,
      password: tempUser.password,
      profileImage: tempUser.profileImage,
      role: tempUser.role,
      createdAt: tempUser.createdAt,
      verified: true,
    });

    await newUser.save();
    await TempUser.deleteOne({ email: email.toLowerCase(), purpose: 'signup' });

    const token = jwt.sign({ email: newUser.email, role: newUser.role }, SECRET_KEY, { expiresIn: '1h' });
    const { password, ...userWithoutPassword } = newUser.toObject();
    res.json({ message: 'OTP verified, user created', token, user: userWithoutPassword });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ message: 'OTP verification failed', error: err.message });
  }
});

app.post('/api/auth/signup', upload.single('profileImage'), async (req, res) => {
  let { firstName, lastName, CNICNo, email, password } = req.body;
  // Use Cloudinary URL (req.file.path) instead of local filename
  const profileImage = req.file ? req.file.path : null;

  if (!firstName || !email || !password) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  email = email.toLowerCase();

  try {
    const existingUser = await User.findOne({ email });
    const existingTempUser = await TempUser.findOne({ email, purpose: 'signup' });
    if (existingUser || existingTempUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (req.file) {
      console.log('Profile image uploaded to Cloudinary:', req.file.path);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    const tempUser = new TempUser({
      id: uuidv4(),
      firstName,
      lastName: lastName || '',
      CNICNo: CNICNo || '',
      email,
      password: hashedPassword,
      profileImage,
      role: 'user',
      createdAt: new Date(),
      otp: hashedOtp,
      otpExpiry,
      otpAttempts: 1,
      purpose: 'signup',
    });

    await tempUser.save();
    console.log('TempUser saved:', tempUser.email, 'OTP:', otp);

    const { subject, text, html } = generateOTPEmail(otp, 'signup', email);
    await transporter.sendMail({
      from: `"MediApp" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text,
      html,
    });

    const token = jwt.sign({ email, role: 'user' }, SECRET_KEY, { expiresIn: '1h' });
    const { password: _, otp: __, otpExpiry: expiryTime, otpAttempts, ...userWithoutSensitive } = tempUser.toObject();
    res.status(201).json({ message: 'User registered, OTP sent to email', token, user: userWithoutSensitive });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({
      message: 'Signup server error',
      error: err.message,
      details: err.stack
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  let { email, password } = req.body;
  email = email.toLowerCase();

  try {
    const user = await User.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.verified) {
      return res.status(403).json({ message: 'Email not verified. Please verify OTP.' });
    }

    const token = jwt.sign({ email, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    const { password: pwd, ...userWithoutPassword } = user.toObject();
    res.json({ message: 'Login successful', token, role: user.role, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/api/usercount', async (req, res) => {
  try {
    const count = await User.countDocuments({});
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.put('/api/users/:id/password', authMiddleware, adminMiddleware, async (req, res) => {
  const { newPassword, adminPassword } = req.body;
  const userId = req.params.id;

  try {
    if (!bcrypt.compareSync(adminPassword, req.user.password)) {
      return res.status(401).json({ message: 'Invalid admin password' });
    }

    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = bcrypt.hashSync(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.put('/api/auth/update', authMiddleware, upload.single('profileImage'), async (req, res) => {
  try {
    const user = req.user;
    const { firstName, lastName, CNICNo, phone, address, dob } = req.body;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (CNICNo) user.CNICNo = CNICNo;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (dob) user.dob = dob;
    if (req.file) {
      console.log('Profile image uploaded to Cloudinary:', req.file.path);
      // Use Cloudinary URL instead of local filename
      user.profileImage = req.file.path;
    }
    await user.save();
    const { password, ...userWithoutPassword } = user.toObject();
    res.json({ message: 'Profile updated successfully', user: userWithoutPassword });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({
      message: 'Update server error',
      error: err.message,
      details: err.stack
    });
  }
});

app.put('/api/auth/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required.' });
    }

    const user = req.user;
    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    user.password = bcrypt.hashSync(newPassword, 10);
    await user.save();
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Feedback Routes
app.post('/api/feedback', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating (1-5) and comment are required' });
    }
    const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email.split('@')[0];
    const feedback = new Feedback({
      userId: req.user.id,
      userName,
      userProfileImage: req.user.profileImage || '',
      rating,
      comment,
      createdAt: new Date(),
    });
    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ error: 'Failed to submit feedback', details: err.message });
  }
});

app.get('/api/feedback', authMiddleware, async (req, res) => {
  try {
    const feedbackList = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbackList);
  } catch (err) {
    console.error('Error fetching feedback:', err);
    res.status(500).json({ error: 'Failed to fetch feedback', details: err.message });
  }
});

// Debug Endpoint to List Users
app.get('/api/debug/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users', details: err.message });
  }
});

// Start the Server (Only if not running on Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment variables:', {
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS ? '****' : undefined,
      PORT: process.env.PORT,
      MONGO_URI: process.env.MONGO_URI ? '****' : undefined,
    });

    // Connect to MongoDB
    await connectDB();

    // Admin User Setup
    try {
      const adminEmail = 'admin@mediapp.com';
      const defaultPassword = 'admin123';
      const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
      console.log('Attempting to set up admin user:', adminEmail);

      let adminUser = await User.findOne({ email: adminEmail });
      if (adminUser) {
        console.log('Existing admin user found:', adminUser.email);
        adminUser.password = hashedPassword;
        adminUser.role = 'admin';
        adminUser.firstName = adminUser.firstName || 'Admin';
        adminUser.lastName = adminUser.lastName || 'User';
        adminUser.createdAt = adminUser.createdAt || new Date().toISOString();
        await adminUser.save();
        console.log('Admin user updated successfully:', adminEmail);
      } else {
        console.log('No existing admin user found. Creating new admin user.');
        adminUser = new User({
          id: uuidv4(),
          firstName: 'Admin',
          lastName: 'User',
          email: adminEmail,
          password: hashedPassword,
          role: 'admin',
          createdAt: new Date().toISOString(),
          verified: true,
        });
        await adminUser.save();
        console.log('New admin user created successfully:', adminEmail);
      }
    } catch (err) {
      console.error('Error setting up admin user:', err.message, err.stack);
    }
  });
} else {
  // On Vercel, just connect to DB on first request or at top level
  connectDB().catch(err => console.error("Initial Vercel DB connect error:", err));
}

// Export for Vercel
module.exports = app;
