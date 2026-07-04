const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Specialist = require("../models/Specialist");
const authMiddleware = require("../middleware/authMiddleware");
const specialistAuthMiddleware = require("../middleware/specialistAuthMiddleware");

// POST /api/booking — user books a specialist
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { specialistId } = req.body;

    if (!specialistId) {
      return res.status(400).json({ message: "Specialist ID is required." });
    }

    const specialist = await Specialist.findById(specialistId);
    if (!specialist) {
      return res.status(404).json({ message: "Specialist not found." });
    }

    if (!specialist.isAvailable) {
      return res.status(400).json({ message: "Specialist is not available right now." });
    }

    // Check if booking already exists
    const existing = await Booking.findOne({
      userId: req.userId,
      specialistId,
      status: { $in: ["pending", "confirmed"] },
    });

    if (existing) {
      return res.status(400).json({
        message: "You already have an active booking with this specialist.",
        roomId: existing.roomId,
      });
    }

    const booking = new Booking({
      userId: req.userId,
      specialistId,
    });

    await booking.save();

    res.status(201).json({
      message: "Booking confirmed! 🎉",
      booking,
      roomId: booking.roomId,
    });
  } catch (error) {
    console.error("Booking POST error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/booking/my — get user's bookings
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.userId })
      .populate("specialistId", "name specialty initials isAvailable rating")
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error("Booking GET /my error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/booking/specialist — get specialist's bookings
router.get("/specialist", specialistAuthMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ specialistId: req.specialistId })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error("Booking GET /specialist error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;