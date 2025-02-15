const express = require('express');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const authDB = require('../models/auth_schema');  // Ensure the correct path to your schema
const authRouter = express.Router();

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'irshadvp800@gmail.com',  // Replace with your email
    pass: 'gzjw sewi snah dfrf',   // Replace with your generated app-specific password
  },
});

// Generate a random verification token
function generateVerificationToken() {
  return Math.random().toString(36).substring(2); // Generates a random string token
}

// Send verification email
async function sendVerificationEmail(email, token) {
  const verificationUrl = `http://localhost:8080/verify.html?token=${token}`;  // Direct to your HTML page

  const mailOptions = {
    from: 'irshadvp800@gmail.com',  // Replace with your email
    to: email, 
    subject: 'Email Verification',
    text: `Please verify your email by clicking on the following link: ${verificationUrl}`,
  };
  
  await transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log('Error sending verification email:', err);
    } else {
      console.log('Verification email sent:', info.response);
    }
  });
}

// Register Route
authRouter.post('/register', async (req, res) => {
  try {
    const { username, password, name, email, phone } = req.body;

    // Check if the username, phone, or email already exists
    const oldUser = await authDB.findOne({ username });
    if (oldUser) {
      console.log('Registration failed: Username already exists.');
      return res.status(400).json({
        Success: false,
        Message: 'Username already exists. Please Log In',
      });
    }

    const oldPhone = await authDB.findOne({ phone });
    if (oldPhone) {
      console.log('Registration failed: Phone number already exists.');
      return res.status(400).json({
        Success: false,
        Message: 'Phone number already exists',
      });
    }

    const oldEmail = await authDB.findOne({ email });
    if (oldEmail) {
      console.log('Registration failed: Email already exists.');
      return res.status(400).json({
        Success: false,
        Message: 'Email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate a verification token
    const verificationToken = generateVerificationToken();

    // Save the user data to the database
    let reg = {
      username,
      password: hashedPassword,
      name,
      email,
      phone,
      verificationToken,
      verified: false,  // Initially the user is not verified
    };

    const result = await authDB(reg).save();

    if (result) {
      // Send verification email
      await sendVerificationEmail(email, verificationToken);

      console.log('Registration successful for:', username);
      return res.json({
        Success: true,
        Message: 'Registration Successful. Please check your email for verification link.',
      });
    } else {
      console.log('Registration failed: Database error');
      return res.json({
        Success: false,
        Message: 'Registration Failed. Please try again later.',
      });
    }
  } catch (error) {
    console.error('Error in register route:', error.message);
    return res.status(500).json({
      Success: false,
      Message: 'Internal Server Error',
      ErrorMessage: error.message,
    });
  }
});

// Email Verification Route
authRouter.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find the user by the verification token
    const user = await authDB.findOne({ verificationToken: token });

    if (!user) {
      console.log('Email verification failed: Invalid or expired token');
      return res.status(400).json({
        Success: false,
        Message: 'Invalid or expired token',
      });
    }

    // Update the user's verified status
    user.verified = true;
    user.verificationToken = '';  // Clear the token once verified

    // Save the updated user
    await user.save();

    console.log('Email verified successfully for user:', user.username);
    res.status(200).json({
      Success: true,
      Message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Error in verify-email route:', error.message);
    return res.status(500).json({
      Success: false,
      Message: 'Internal Server Error',
      ErrorMessage: error.message,
    });
  }
});

// Login Route
authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if the user exists
    const user = await authDB.findOne({ username });
    if (!user) {
      console.log('Login failed: User not found');
      return res.status(400).json({
        Success: false,
        Message: 'User not found. Please check your username.',
      });
    }

    // Check if the user's email is verified
    if (!user.verified) {
      console.log('Login failed: Email not verified');
      return res.status(400).json({
        Success: false,
        Message: 'Email not verified. Please check your inbox.',
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login failed: Invalid password');
      return res.status(400).json({
        Success: false,
        Message: 'Invalid password. Please try again.',
      });
    }

    // Generate a JWT token for the user
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      'your_jwt_secret',  // Replace with your secret key
      { expiresIn: '1h' }
    );

    console.log('Login successful for user:', username);
    res.json({
      Success: true,
      Message: 'Login successful',
      token,
    });
  } catch (error) {
    console.error('Error in login route:', error.message);
    return res.status(500).json({
      Success: false,
      Message: 'Internal Server Error',
      ErrorMessage: error.message,
    });
  }
});

module.exports = authRouter;
