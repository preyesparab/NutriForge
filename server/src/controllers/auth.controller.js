const jwt  = require("jsonwebtoken");
const User = require("../models/User");

// ── Token helper ──────────────────────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  // Strip password from response
  user.password = undefined;
  res.status(statusCode).json({ success: true, token, user });
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
exports.register = async (req, res) => {
  const { name, email, password, fitnessGoal } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ success: false, message: "Email already in use" });
  }

  const user = await User.create({ name, email, password, fitnessGoal });
  sendToken(user, 201, res);
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Please provide email and password" });
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  sendToken(user, 200, res);
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
exports.me = async (req, res) => {
  // req.user is attached by the protect middleware
  res.json({ success: true, user: req.user });
};
