const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const otpSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function() {
        return this.purpose === "email_verification";
      },
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
    },
    otpCode: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ["password_reset", "email_verification"],
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for quick lookups and automatic expiration
otpSchema.index({ userId: 1, purpose: 1 });
otpSchema.index({ email: 1, purpose: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

const Otp = mongoose.model("Otp", otpSchema);

module.exports = Otp;
