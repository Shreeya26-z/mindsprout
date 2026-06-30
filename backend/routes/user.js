const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// GET /api/user — get logged in user stats
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Calculate badge
    let badge = { emoji: "🌿", name: "Seedling" };
    if (user.xp >= 200) badge = { emoji: "🏆", name: "Master" };
    else if (user.xp >= 100) badge = { emoji: "🔥", name: "Consistent" };
    else if (user.xp >= 50) badge = { emoji: "🌱", name: "Beginner" };

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        badge,
      },
    });
  } catch (error) {
    console.error("User GET error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;