const express = require("express");
const router = express.Router();
const Mood = require("../models/Mood");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// POST /api/mood — log a mood
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { mood, note } = req.body;

    if (!mood) {
      return res.status(400).json({ message: "Mood is required." });
    }

    // Save mood
    const moodEntry = new Mood({
      userId: req.userId,
      mood,
      note: note || "",
    });
    await moodEntry.save();

    // Give user +10 XP and update streak
    const user = await User.findById(req.userId);
    user.xp += 10;
    user.level = Math.floor(user.xp / 50) + 1;

    // Update streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!user.lastActivityDate) {
      user.streak = 1;
      user.lastActivityDate = today;
    } else {
      const last = new Date(user.lastActivityDate);
      last.setHours(0, 0, 0, 0);
      const diff = Math.floor((today - last) / (1000 * 60 * 60 * 24));

      if (diff === 0) {
        // same day, no change
      } else if (diff === 1) {
        user.streak += 1;
        user.lastActivityDate = today;
      } else {
        user.streak = 1;
        user.lastActivityDate = today;
      }
    }

    await user.save();

    // Calculate badge
    let badge = { emoji: "🌿", name: "Seedling" };
    if (user.xp >= 200) badge = { emoji: "🏆", name: "Master" };
    else if (user.xp >= 100) badge = { emoji: "🔥", name: "Consistent" };
    else if (user.xp >= 50) badge = { emoji: "🌱", name: "Beginner" };

    res.status(201).json({
      message: "Mood logged! +10 XP 🎉",
      mood: moodEntry,
      stats: {
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        badge,
      },
    });
  } catch (error) {
    console.error("Mood POST error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/mood — get mood history
router.get("/", authMiddleware, async (req, res) => {
  try {
    const moods = await Mood.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(30);

    // Build frequency for analytics
    const frequency = {};
    moods.forEach((m) => {
      frequency[m.mood] = (frequency[m.mood] || 0) + 1;
    });

    res.json({ moods, frequency });
  } catch (error) {
    console.error("Mood GET error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;