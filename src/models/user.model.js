const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["admin", "reviewer", "operations", "employee"],
      default: "employee", // Default to 'employee', but can be 'admin' or 'super-admin'
    },
    permissions: {
      type: [String], // Array of permissions
      default: [], // Default empty, but can be customized per user
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company", // Associates the user with a company
      default: null,
    },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
      country: { type: String },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profilePicture: {
      type: String, // Path to the user's profile picture if needed
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps automatically
  }
);

userSchema.pre("save", function (next) {
  const user = this;
  const permissionsByRole = {
    admin: [
      "manage-users",
      "manage-reviews",
      "manage-operations",
      "view-dashboard",
    ],
    reviewer: ["manage-reviews", "view-dashboard"],
    operations: ["manage-operations", "view-dashboard"],
  };

  // Set permissions based on role
  user.permissions = permissionsByRole[user.role] || [];

  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
