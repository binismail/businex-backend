const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Role name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    department: {
      type: ObjectId,
      ref: "Department",
      // Making it optional by not setting required: true
    },
    company: {
      type: ObjectId,
      ref: "Company",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    permissions: [{
      type: String,
      enum: [
        "view_employees",
        "manage_employees",
        "view_payroll",
        "manage_payroll",
        "view_deductions",
        "manage_deductions",
        "view_departments",
        "manage_departments",
        // Add more permissions as needed
      ]
    }],
    level: {
      type: Number,
      min: 1,
      default: 1,
    },
    reportingTo: {
      id: {
        type: ObjectId,
        ref: "Role"
      },
      name: {
        type: String,
        trim: true
      }
    }
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to convert name to proper case
roleSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    // Convert to title case (first letter of each word capitalized)
    this.name = this.name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  next();
});

// Indexes for better query performance
roleSchema.index({ company: 1, status: 1 });
roleSchema.index({ department: 1, status: 1 });

// Case-insensitive unique index for name within company
roleSchema.index(
  { 
    name: 1,
    company: 1 
  },
  { 
    unique: true,
    collation: { locale: 'en', strength: 2 } // Case-insensitive
  }
);

const Role = mongoose.model("Role", roleSchema);
module.exports = Role;
