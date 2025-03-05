const User = require("../../models/user.model");
const Otp = require("../../models/otp.model");
const emailService = require("../../utils/email");
const bcrypt = require("bcryptjs");

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request password reset
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        message:
          "If a user with this email exists, they will receive a password reset OTP.",
      });
    }

    // Generate OTP
    const otpCode = generateOTP();

    // Save OTP to database
    await Otp.create({
      email: user.email,
      otpCode,
      purpose: "password_reset",
    });

    // Send OTP via email
    try {
      await emailService.sendEmail({
        to: user.email,
        subject: "Password Reset OTP",
        text: `Your OTP for password reset is: ${otpCode}. This code will expire in 10 minutes.`,
        html: `
          <h2>Password Reset Request</h2>
          <p>Your OTP for password reset is: <strong>${otpCode}</strong></p>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      // Continue with success response even if email fails
    }

    // Always return success to prevent email enumeration
    res.status(200).json({
      message:
        "If a user with this email exists, they will receive a password reset OTP.",
    });
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    res.status(500).json({
      message: "Error processing password reset request",
      error: error.message,
    });
  }
};

// Verify OTP and reset password
exports.resetPassword = async (req, res) => {
  console.log("hello wodl");
  try {
    const { email, otpCode, newPassword } = req.body;
    console.log(req.body);

    // Validate input
    if (!email || !otpCode || !newPassword) {
      return res.status(400).json({
        message: "Email, OTP, and new password are required",
      });
    }

    // Find valid OTP
    const otp = await Otp.findOne({
      email: email.toLowerCase(),
      otpCode,
      purpose: "password_reset",
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otp) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    // Find user and explicitly include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    console.log(user);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Mark OTP as used
    otp.isUsed = true;
    await otp.save();

    // Send confirmation email
    try {
      await emailService.sendEmail({
        to: user.email,
        subject: "Password Reset Successful",
        text: "Your password has been successfully reset.",
        html: `
          <h2>Password Reset Successful</h2>
          <p>Your password has been successfully reset.</p>
          <p>If you didn't make this change, please contact support immediately.</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
    }

    res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({
      message: "Error resetting password",
      error: error.message,
    });
  }
};
