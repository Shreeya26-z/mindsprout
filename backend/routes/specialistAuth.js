const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Specialist = require("../models/Specialist");

// POST /api/specialist-auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, specialty } = req.body;

    if (!name || !email || !password || !specialty) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existing = await Specialist.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Auto-generate initials from name, e.g. "Emily Chen" -> "EC"
    const initials = name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const specialist = new Specialist({
      name,
      email,
      password: hashedPassword,
      specialty,
      initials,
    });

    await specialist.save();

    const token = jwt.sign(
      { specialistId: specialist._id, role: "specialist" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Specialist account created!",
      token,
      specialist: {
        id: specialist._id,
        name: specialist.name,
        email: specialist.email,
        specialty: specialist.specialty,
        initials: specialist.initials,
      },
    });
  } catch (error) {
    console.error("Specialist signup error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// POST /api/specialist-auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const specialist = await Specialist.findOne({ email });
    if (!specialist) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, specialist.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { specialistId: specialist._id, role: "specialist" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful!",
      token,
      specialist: {
        id: specialist._id,
        name: specialist.name,
        email: specialist.email,
        specialty: specialist.specialty,
        initials: specialist.initials,
      },
    });
  } catch (error) {
    console.error("Specialist login error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

module.exports = router;