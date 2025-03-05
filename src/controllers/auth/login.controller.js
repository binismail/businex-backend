const User = require("../../models/user.model");
const Company = require("../../models/company.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Otp = require("../../models/otp.model");
const emailService = require("../../utils/email");

exports.accountLoginWEmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email }, "+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

    // Save OTP in database with an expiration time (5 minutes)
    const otp = new Otp({
      userId: user._id,
      email: user.email,
      otpCode,
      purpose: "email_verification",
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes from now
    });
    await otp.save();

    // Send OTP via email
    await emailService.sendOTPEmail(user.email, otpCode);

    res.status(200).json({
      message: "OTP sent successfully. Please verify.",
      data: {
        userId: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Error during login",
      error: error.message,
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { userId, email, otpCode } = req.body;

    // Validate inputs
    if ((!userId && !email) || !otpCode) {
      return res.status(400).json({ 
        message: "Either User ID or email, and OTP are required" 
      });
    }

    // Find the OTP record
    const query = {
      otpCode,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    };

    // Add either userId or email to query based on what's provided
    if (userId) {
      query.userId = userId;
      query.purpose = "email_verification";
    } else if (email) {
      query.email = email.toLowerCase();
      query.purpose = "password_reset";
    }

    const otpRecord = await Otp.findOne(query);
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Handle based on OTP purpose
    if (otpRecord.purpose === "email_verification") {
      // For login verification
      const user = await User.findById(userId, "-password");
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.status(200).json({
        message: "OTP verified successfully",
        data: { token, user },
      });
    } else {
      // For password reset verification
      return res.status(200).json({
        message: "OTP verified successfully",
        verified: true,
      });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ 
      message: "Error verifying OTP", 
      error: error.message 
    });
  }
};
