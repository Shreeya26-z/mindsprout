const express = require("express");
const router = express.Router();
const Habit = require("../models/Habit");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// POST /api/habit — create a new habit
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Habit name is required." });
    }

    const habit = new Habit({
      userId: req.userId,
      name: name.trim(),
    });

    await habit.save();
    res.status(201).json({ message: "Habit created!", habit });

  } catch (error) {
    console.error("Habit POST error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/habit — get all habits
router.get("/", authMiddleware, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.userId }).sort({ createdAt: -1 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const habitsWithStatus = habits.map((h) => {
      const completedToday = h.completedDates.some((d) => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        return date.getTime() === today.getTime();
      });
      return { ...h.toObject(), completedToday };
    });

    res.json({ habits: habitsWithStatus });

  } catch (error) {
    console.error("Habit GET error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// PATCH /api/habit/:id/complete — mark habit done today
router.patch("/:id/complete", authMiddleware, async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found." });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alreadyDone = habit.completedDates.some((d) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date.getTime() === today.getTime();
    });

    if (alreadyDone) {
      return res.status(400).json({ message: "Already completed today!" });
    }

    habit.completedDates.push(today);

    // Update habit streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const doneYesterday = habit.completedDates.some((d) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date.getTime() === yesterday.getTime();
    });

    habit.streak = doneYesterday ? habit.streak + 1 : 1;
    await habit.save();

    // Give user +5 XP
    const user = await User.findById(req.userId);
    user.xp += 5;
    user.level = Math.floor(user.xp / 50) + 1;

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    if (!user.lastActivityDate) {
      user.streak = 1;
      user.lastActivityDate = todayDate;
    } else {
      const last = new Date(user.lastActivityDate);
      last.setHours(0, 0, 0, 0);
      const diff = Math.floor((todayDate - last) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        user.streak += 1;
        user.lastActivityDate = todayDate;
      } else if (diff > 1) {
        user.streak = 1;
        user.lastActivityDate = todayDate;
      }
    }

    await user.save();

    let badge = { emoji: "🌿", name: "Seedling" };
    if (user.xp >= 200) badge = { emoji: "🏆", name: "Master" };
    else if (user.xp >= 100) badge = { emoji: "🔥", name: "Consistent" };
    else if (user.xp >= 50) badge = { emoji: "🌱", name: "Beginner" };

    res.json({
      message: "Habit completed! +5 XP 🎉",
      habit,
      stats: { xp: user.xp, level: user.level, streak: user.streak, badge },
    });

  } catch (error) {
    console.error("Habit complete error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// DELETE /api/habit/:id — delete a habit
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await Habit.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: "Habit deleted." });
  } catch (error) {
    console.error("Habit DELETE error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;