const express = require("express");
const router = express.Router();
const Specialist = require("../models/Specialist");
const specialistAuthMiddleware = require("../middleware/specialistAuthMiddleware");

// GET /api/specialist/me — get logged in specialist's own data
router.get("/me", specialistAuthMiddleware, async (req, res) => {
  try {
    const specialist = await Specialist.findById(req.specialistId).select("-password");

    if (!specialist) {
      return res.status(404).json({ message: "Specialist not found." });
    }

    res.json({ specialist });
  } catch (error) {
    console.error("Specialist GET /me error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// PATCH /api/specialist/toggle-availability
router.patch("/toggle-availability", specialistAuthMiddleware, async (req, res) => {
  try {
    const specialist = await Specialist.findById(req.specialistId);

    if (!specialist) {
      return res.status(404).json({ message: "Specialist not found." });
    }

    specialist.isAvailable = !specialist.isAvailable;
    await specialist.save();

    res.json({
      message: "Availability updated.",
      isAvailable: specialist.isAvailable,
    });
  } catch (error) {
    console.error("Toggle availability error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/specialist — list all specialists (for users browsing)
router.get("/", async (req, res) => {
  try {
    const specialists = await Specialist.find().select("-password");
    res.json({ specialists });
  } catch (error) {
    console.error("Specialist list error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;