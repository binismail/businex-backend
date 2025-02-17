// const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer"); // Ensure you have nodemailer installed
const Invitation = require("../../../models/invitation.models");
const User = require("../../../models/user.model");

exports.addTeamMember = async (req, res) => {
  try {
    const { name, email, phone, role, companyId } = req.body;

    // Validate role
    const validRoles = ["admin", "reviewer", "operations"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Allowed roles are admin, reviewer, operations.",
      });
    }

    // Check if email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email is already in use by another user." });
    }

    // Create a temporary user without a password
    const tempUser = new User({
      name,
      email,
      phone,
      role,
      company: companyId,
      isTemporary: true, // Add this field to indicate the user is temporary
      password: null, // Ensure password is null
      resetToken: crypto.randomBytes(32).toString("hex"), // Generate a reset token
      resetTokenExpiry: Date.now() + 3600000, // Token valid for 1 hour
    });

    // Save the temporary user
    await tempUser.save();

    // Send email with password reset link
    // const transporter = nodemailer.createTransport({
    //   service: "Gmail", // You can use your own email service
    //   auth: {
    //     user: process.env.EMAIL_USER, // Your email
    //     pass: process.env.EMAIL_PASS, // Your email password
    //   },
    // });

    // const resetUrl = `http://yourdomain.com/reset-password/${tempUser.resetToken}`; // Link to reset password

    // await transporter.sendMail({
    //   to: email,
    //   subject: "Complete Your Registration",
    //   html: `<p>Hello ${name},</p>
    //          <p>Welcome! Please click the link below to set your password:</p>
    //          <a href="${resetUrl}">Set Password</a>
    //          <p>This link will expire in 1 hour.</p>`,
    // });

    res.status(201).json({
      message:
        "Team member added successfully. Please check your email to set your password.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding team member", error: error.message });
  }
};

exports.removeTeamMember = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find and remove user
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Team member removed successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error removing team member", error: error.message });
  }
};

// Edit team member permissions
exports.editTeamMemberPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ["admin", "reviewer", "operations"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Allowed roles are admin, reviewer, operations.",
      });
    }

    // Update role and permissions based on role
    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Permissions updated successfully", user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating permissions", error: error.message });
  }
};

exports.sendTeamMemberInvitation = async (req, res) => {
  try {
    const { email, role, companyId } = req.body;

    // Validate role
    const validRoles = ["admin", "reviewer", "operations"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Allowed roles are admin, reviewer, operations.",
      });
    }

    // Generate a random token for the invitation link
    const token = crypto.randomBytes(32).toString("hex");

    // Set expiration time for the invitation (e.g., 48 hours)
    const expiresAt = Date.now() + 48 * 60 * 60 * 1000;

    // Save the invitation to the database
    const invitation = new Invitation({
      email,
      token,
      expiresAt,
      role,
      companyId,
    });

    await invitation.save();

    // Send the invitation email with the token
    const invitationLink = `${process.env.FRONTEND_URL}/invite/${token}`;
    // await sendInvitationEmail(email, invitationLink);

    res.status(200).json({ message: "Invitation sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error sending invitation", error: error.message });
  }
};

exports.processInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const { name, password } = req.body;

    // Find the invitation by token
    const invitation = await Invitation.findOne({ token });
    if (!invitation) {
      return res.status(400).json({ message: "Invalid or expired invitation" });
    }

    // Check if the invitation has expired
    if (invitation.expiresAt < Date.now()) {
      return res.status(400).json({ message: "Invitation has expired" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const newUser = new User({
      name,
      email: invitation.email,
      password: hashedPassword,
      role: invitation.role,
      company: invitation.companyId,
    });

    await newUser.save();

    // Delete the invitation after successful registration
    await Invitation.findByIdAndDelete(invitation._id);

    res
      .status(201)
      .json({ message: "Account created successfully, kindly login" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error processing invitation", error: error.message });
  }
};
