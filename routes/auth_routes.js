const express = require('express');
const authRouter = express.Router();
const bcrypt = require('bcryptjs');
const authDB = require('../models/auth_schema');


// Register Route
authRouter.post('/register', async (req, res) => {
  try {
    const oldUser = await authDB.findOne({ username: req.body.username });
    if (oldUser) {
      return res.status(400).json({
        Success: false,
        Error: true,
        Message: 'Username already exist, Please Log In',
      });
    }
    const oldPhone = await authDB.findOne({ phone: req.body.phone });
    if (oldPhone) {
      return res.status(400).json({
        Success: false,
        Error: true,
        Message: 'Phone already exist',
      });
    }
    const oldEmail = await authDB.findOne({ email: req.body.email });
    if (oldEmail) {
      return res.status(400).json({
        Success: false,
        Error: true,
        Message: 'Email already exist',
      });
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    let reg = {
      username: req.body.username,
      password: hashedPassword,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      
    };

    const result = await authDB(reg).save();

    if (result) {
      return res.json({
        Success: true,
        Error: false,
        data: result,
        Message: 'Registration Successful',
      });
    } else {
      return res.json({
        Success: false,
        Error: true,
        Message: 'Registration Failed',
      });
    }
  } catch (error) {
    console.error('Error in register route:', error.message);
    return res.status(500).json({
      Success: false,
      Error: true,
      Message: 'Internal Server Error',
      ErrorMessage: error.message,
    });
  }
});

// Login Route
authRouter.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if ((username && password) || (email && password)) {
      // Check if the login is by username or email
      const query = username
        ? { username }
        : email
        ? { email }
        : null;

      if (!query) {
        return res.status(400).json({
          Success: false,
          Error: true,
          Message: 'Username or Email is required',
        });
      }

      const oldUser = await authDB.findOne(query);

      if (!oldUser) {
        return res.status(400).json({
          Success: false,
          Error: true,
          Message: 'User not found. Please register first.',
        });
      }

      // Verify password
      const isPasswordCorrect = await bcrypt.compare(password, oldUser.password);
      if (!isPasswordCorrect) {
        return res.status(401).json({
          Success: false,
          Error: true,
          Message: 'Password Incorrect',
        });
      }

      return res.status(200).json({
        Success: true,
        Error: false,
        Message: 'Login successful',
        loginid: oldUser._id,
      });
    } else {
      return res.status(400).json({
        Success: false,
        Error: true,
        Message: 'Username or Email and Password are required',
      });
    }
  } catch (error) {
    console.error('Error in login route:', error.message);
    return res.status(500).json({
      Success: false,
      Error: true,
      Message: 'Internal Server Error',
      ErrorMessage: error.message,
    });
  }
});


module.exports = authRouter;
