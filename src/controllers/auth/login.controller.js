const User = require("../../models/user.model");
const Company = require("../../models/company.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// const { sendOtp } = require("../utils/sendOtp"); // Assume you have a function to send OTP
const Otp = require("../../models/otp.model"); // Temporary OTP store (create otp.model.js)

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
    //  Math.floor(100000 + Math.random() * 900000);
    // Generate OTP
    const otpCode = 200000; // 6-digit OTP

    // Save OTP in database with an expiration time (e.g., 5 minutes)
    const otp = new Otp({
      userId: user._id,
      otpCode,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes from now
    });
    await otp.save();

    // Send OTP to the user (via email/SMS)
    // await sendOtp(user.email, otpCode); // Assuming sendOtp function sends OTP

    res.status(200).json({
      message: "OTP sent successfully. Please verify.",
      data: otp,
      userId: user._id,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error during login", error: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { userId, otpCode } = req.body;

    // Validate inputs
    if (!userId || !otpCode) {
      return res.status(400).json({ message: "User ID and OTP are required" });
    }

    // Find the OTP record
    const otpRecord = await Otp.findOne({ userId, otpCode });
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // If OTP is valid, generate JWT token
    const user = await User.findById(userId, "-password");
    // const company = await Company.findById(user?.company?.id);
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    // Delete OTP after verification
    await Otp.findByIdAndDelete(otpRecord._id);

    res.status(200).json({
      message: "OTP verified successfully",
      data: { token, user },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error verifying OTP", error: error.message });
  }
};
