const express = require("express");
const router = express.Router();
const Mood = require("../models/Mood");
const Habit = require("../models/Habit");
const Journal = require("../models/Journal");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// GET /api/stress — full stress analysis
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Get last 7 days of data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch all data in parallel
    const [user, moods, habits, journals] = await Promise.all([
      User.findById(userId).select("-password"),
      Mood.find({ userId, date: { $gte: sevenDaysAgo } }).sort({ date: -1 }),
      Habit.find({ userId }),
      Journal.find({ userId, date: { $gte: sevenDaysAgo } }).sort({ date: -1 }),
    ]);

    // ── Mood Analysis ──
    const moodScores = {
      Happy: 100,
      Excited: 95,
      Neutral: 60,
      Anxious: 35,
      Sad: 25,
      Angry: 20,
    };

    let moodScore = 60; // default neutral
    if (moods.length > 0) {
      const total = moods.reduce((sum, m) => sum + (moodScores[m.mood] || 60), 0);
      moodScore = Math.round(total / moods.length);
    }

    // ── Habit Analysis ──
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let habitScore = 0;
    let completedToday = 0;
    if (habits.length > 0) {
      const completed = habits.filter(h =>
        h.completedDates.some(d => {
          const date = new Date(d);
          date.setHours(0, 0, 0, 0);
          return date.getTime() === today.getTime();
        })
      ).length;
      completedToday = completed;
      habitScore = Math.round((completed / habits.length) * 100);
    }

    // ── Journal Analysis ──
    const journalEmotions = {
      happy: 100,
      hopeful: 90,
      grateful: 95,
      neutral: 60,
      tired: 40,
      anxious: 30,
      sad: 25,
      angry: 20,
    };

    let journalScore = 60;
    if (journals.length > 0) {
      const total = journals.reduce((sum, j) =>
        sum + (journalEmotions[j.mood] || 60), 0);
      journalScore = Math.round(total / journals.length);
    }

    // ── Streak Score ──
    const streakScore = Math.min(100, user.streak * 10);

    // ── Overall Stress Score ──
    const overallScore = Math.round(
      (moodScore * 0.35) +
      (habitScore * 0.25) +
      (journalScore * 0.25) +
      (streakScore * 0.15)
    );

    // ── Stress Level ──
    let stressLevel, stressEmoji, stressColor;
    if (overallScore >= 75) {
      stressLevel = "Low Stress";
      stressEmoji = "😊";
      stressColor = "green";
    } else if (overallScore >= 50) {
      stressLevel = "Moderate";
      stressEmoji = "😐";
      stressColor = "yellow";
    } else if (overallScore >= 30) {
      stressLevel = "High Stress";
      stressEmoji = "😰";
      stressColor = "orange";
    } else {
      stressLevel = "Critical";
      stressEmoji = "😢";
      stressColor = "red";
    }

    // ── Recommendations ──
    const recommendations = [];

    if (moodScore < 50) {
      recommendations.push({
        icon: "😊",
        title: "Log your mood daily",
        desc: "Tracking emotions helps you understand patterns and triggers.",
        action: "mood.html",
        actionLabel: "Log Mood",
      });
    }

    if (habitScore < 50) {
      recommendations.push({
        icon: "📅",
        title: "Complete your daily habits",
        desc: "Consistent habits reduce stress by creating structure.",
        action: "habit.html",
        actionLabel: "View Habits",
      });
    }

    if (journals.length === 0) {
      recommendations.push({
        icon: "📓",
        title: "Start journaling",
        desc: "Writing your thoughts helps process emotions and reduce anxiety.",
        action: "journal.html",
        actionLabel: "Write Journal",
      });
    }

    if (user.streak < 3) {
      recommendations.push({
        icon: "🔥",
        title: "Build your streak",
        desc: "Daily activity for 3+ days significantly reduces stress levels.",
        action: "dashboard.html",
        actionLabel: "Go to Dashboard",
      });
    }

    recommendations.push({
      icon: "🧘",
      title: "Try a meditation session",
      desc: "Even 5 minutes of meditation can lower cortisol levels.",
      action: "meditation.html",
      actionLabel: "Meditate Now",
    });

    res.json({
      overallScore,
      stressLevel,
      stressEmoji,
      stressColor,
      breakdown: {
        mood: { score: moodScore, label: "Mood Score", count: moods.length },
        habits: { score: habitScore, label: "Habit Completion", count: completedToday },
        journal: { score: journalScore, label: "Journal Wellbeing", count: journals.length },
        streak: { score: streakScore, label: "Streak Score", days: user.streak },
      },
      recommendations,
      recentMoods: moods.slice(0, 5),
    });

  } catch (error) {
    console.error("Stress analysis error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;