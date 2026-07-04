const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    specialistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Specialist",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    roomId: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

// Auto-generate a unique roomId before saving
bookingSchema.pre("save", function (next) {
  if (!this.roomId) {
    this.roomId = `room_${this._id}`;
  }
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);