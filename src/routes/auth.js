const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../utils/logger");
const { validateRequest, registerSchema, loginSchema } = require("../middleware/validation");

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post("/register", validateRequest(registerSchema), async (req, res) => {
  try {
    const { username, email, password } = req.validatedData;

    // Check if user exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn(`Registration failed: Email or username already exists`);
      return res.status(400).json({
        success: false,
        message: "Email or username already exists",
      });
    }

    // Create user
    user = await User.create({
      username,
      email,
      password,
    });

    const token = generateToken(user._id);

    logger.info(`New user registered: ${user._id}`);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error registering user",
      error: error.message,
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", validateRequest(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.validatedData;

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      logger.warn(`Login attempt with non-existent email: ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      logger.warn(`Failed login attempt for user: ${user._id}`);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user._id);

    logger.info(`User logged in: ${user._id}`);
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message,
    });
  }
});

module.exports = router;
